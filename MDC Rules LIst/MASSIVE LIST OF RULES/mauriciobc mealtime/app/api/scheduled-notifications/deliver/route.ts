/**
 * @netlify/functions
 * schedule: '* * * * *'
 */
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// TODO: Restrict access to Netlify scheduled function or internal secret
export async function POST(req: NextRequest) {
  try {
    const now = new Date();
    // 1. Fetch all due, undelivered notifications (outside transaction)
    const due = await prisma.scheduledNotification.findMany({
      where: {
        delivered: false,
        deliverAt: { lte: now },
      },
    });
    if (due.length === 0) {
      return NextResponse.json({ delivered: 0, notifications: [] });
    }

    // 2. Prepare batch for reminders
    const reminderPairs = due
      .filter((n) => n.type === 'reminder' && n.catId && n.deliverAt)
      .map((n) => ({ catId: n.catId!, deliverAt: n.deliverAt! }));

    // 3. Batch fetch all relevant feeding logs
    let fedMap = new Map<string, Date>();
    if (reminderPairs.length > 0) {
      const fedLogs = await prisma.feeding_logs.findMany({
        where: {
          OR: reminderPairs.map(({ catId, deliverAt }) => ({
            cat_id: catId,
            fed_at: { gte: deliverAt },
          })),
        },
        select: { cat_id: true, fed_at: true },
      });
      // For each log, mark that this cat has been fed after deliverAt
      for (const log of fedLogs) {
        fedMap.set(log.cat_id, log.fed_at);
      }
    }

    // 4. Filter deliverable notifications
    const deliverable = due.filter((n) => {
      if (n.type === 'reminder' && n.catId && n.deliverAt) {
        // If any feeding log exists for this cat after deliverAt, skip
        return !fedMap.has(n.catId);
      }
      return true;
    });

    // 5. In a transaction, mark as delivered
    await prisma.$transaction([
      prisma.scheduledNotification.updateMany({
        where: { id: { in: deliverable.map((n) => n.id) } },
        data: { delivered: true, deliveredAt: now },
      }),
    ]);

    // --- Missed Feeding Warning Logic ---
    const twentyMinutesMs = 20 * 60 * 1000;
    // Get all cats with feeding_interval set
    const cats = await prisma.cats.findMany({
      where: { feeding_interval: { not: null, gt: 0 } },
      select: { id: true, name: true, household_id: true, feeding_interval: true }
    });
    if (cats.length > 0) {
      // Batch fetch last feeding logs for all cats
      const lastFeedings = await prisma.feeding_logs.findMany({
        where: { cat_id: { in: cats.map(c => c.id) } },
        orderBy: [{ cat_id: 'asc' }, { fed_at: 'desc' }],
        select: { cat_id: true, fed_at: true, fed_by: true },
      });
      // Map cat_id to last feeding
      const lastFeedingMap = new Map();
      for (const log of lastFeedings) {
        if (!lastFeedingMap.has(log.cat_id)) {
          lastFeedingMap.set(log.cat_id, log);
        }
      }
      // Prepare warnings to check
      const warningsToCheck = [];
      const nowMs = now.getTime();
      for (const cat of cats) {
        const lastFeeding = lastFeedingMap.get(cat.id);
        if (!lastFeeding) continue;
        const expectedTime = new Date(new Date(lastFeeding.fed_at).getTime() + cat.feeding_interval * 60 * 60 * 1000);
        const warningTime = new Date(expectedTime.getTime() + twentyMinutesMs);
        if (nowMs > warningTime.getTime()) {
          warningsToCheck.push({
            cat,
            lastFeeding,
            expectedTime,
            warningTime
          });
        }
      }
      // Batch fetch all feeding logs after expectedTime for all cats
      const fedAfterLogs = await prisma.feeding_logs.findMany({
        where: {
          OR: warningsToCheck.map(({ cat, expectedTime }) => ({
            cat_id: cat.id,
            fed_at: { gt: expectedTime },
          }))
        },
        select: { cat_id: true, fed_at: true },
      });
      const fedAfterMap = new Map();
      for (const log of fedAfterLogs) {
        fedAfterMap.set(log.cat_id, log.fed_at);
      }
      // Prepare notifications to create
      let notifications = [];
      let notificationKeys = [];
      for (const { cat, lastFeeding, expectedTime } of warningsToCheck) {
        if (fedAfterMap.has(cat.id)) continue; // Cat was fed after expectedTime
        // Prepare unique key for this warning
        const key = `${cat.id}|${expectedTime.toISOString()}`;
        notificationKeys.push(key);
      }
      // Batch fetch existing warnings for these (catId, expectedTime)
      const existingWarnings = await prisma.notifications.findMany({
        where: {
          type: 'warning',
          OR: notificationKeys.map(k => {
            const [catId, expectedTime] = k.split('|');
            return {
              metadata: {
                path: ['catId'], equals: catId
              },
              // created_at >= expectedTime is not enough, must check metadata.expectedTime
              // We'll filter by metadata.expectedTime below
            };
          })
        },
        select: { metadata: true, type: true },
      });
      const existingSet = new Set(
        existingWarnings
          .filter(w => typeof w.metadata === 'object' && w.metadata !== null && 'catId' in w.metadata && 'expectedTime' in w.metadata)
          .map(w => `${(w.metadata as any).catId}|${(w.metadata as any).expectedTime}`)
      );
      // Batch fetch all household members for all cats
      const householdIds = Array.from(new Set(cats.map(c => c.household_id)));
      const allMembers = await prisma.household_members.findMany({
        where: { household_id: { in: householdIds } },
        select: { household_id: true, user_id: true },
      });
      // For each warning, create notifications for all household members except last feeder
      for (const { cat, lastFeeding, expectedTime } of warningsToCheck) {
        const key = `${cat.id}|${expectedTime.toISOString()}`;
        if (existingSet.has(key)) continue;
        const members = allMembers.filter(m => m.household_id === cat.household_id && m.user_id !== lastFeeding.fed_by);
        for (const member of members) {
          notifications.push({
            id: crypto.randomUUID(),
            user_id: member.user_id,
            title: "Alimentação não realizada",
            message: `O gato ${cat.name} não foi alimentado no horário previsto.`,
            type: "warning",
            metadata: { catId: cat.id, expectedTime: expectedTime.toISOString() },
            created_at: now,
            updated_at: now
          });
        }
      }
      // Insert notifications in a transaction, ignore duplicates
      if (notifications.length > 0) {
        try {
          await prisma.$transaction([
            prisma.notifications.createMany({ data: notifications, skipDuplicates: true })
          ]);
        } catch (e) {
          // Ignore unique constraint errors (duplicates)
        }
      }
    }

    return NextResponse.json({ delivered: deliverable.length, notifications: deliverable });
  } catch (err: any) {
    console.error('Error delivering scheduled notifications:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 