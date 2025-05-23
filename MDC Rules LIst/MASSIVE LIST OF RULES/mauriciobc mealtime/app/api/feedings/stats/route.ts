import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Validation schema for query parameters
const statsQuerySchema = z.object({
  catId: z.string().uuid({ message: "Invalid cat ID format" }).optional(),
  days: z.string().regex(/^\d+$/).transform(Number).pipe(
    z.number().int().positive().max(90)
  ).optional().default("7"),
});

export async function GET(request: NextRequest) {
  try {
    // Get the X-User-ID header
    const userId = request.headers.get("X-User-ID");
    
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required", details: "User ID is missing" },
        { status: 401 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const validationResult = statsQuerySchema.safeParse({
      catId: searchParams.get("catId"),
      days: searchParams.get("days") || "7",
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid query parameters", 
          details: validationResult.error.format() 
        },
        { status: 400 }
      );
    }

    const { catId, days } = validationResult.data;

    // Calculate the date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build the base where clause
    const where: any = {
      fed_at: {
        gte: startDate,
        lte: endDate,
      }
    };
    
    if (catId) {
      where.cat_id = catId;
    }

    // Get feeding data for the period
    const feedings = await prisma.feeding_logs.findMany({
      where,
      select: {
        id: true,
        meal_type: true,
        amount: true,
        fed_at: true,
        cat_id: true,
        cat: {
          select: {
            name: true,
          }
        }
      },
      orderBy: {
        fed_at: "asc",
      },
    });

    // Group by day and meal type
    const dailyStats: Record<string, any> = {};
    const catStats: Record<string, any> = {};
    
    feedings.forEach(feeding => {
      const date = feeding.fed_at.toISOString().split('T')[0];
      const catId = feeding.cat_id;
      const mealType = feeding.meal_type;
      const amount = feeding.amount || 1;
      
      // Initialize daily stats for this date if needed
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          total: 0,
          byType: {},
        };
      }
      
      // Initialize cat stats if needed
      if (!catStats[catId]) {
        catStats[catId] = {
          id: catId,
          name: feeding.cat?.name || "Unknown Cat",
          totalFeedings: 0,
          byType: {},
          dailyAverage: 0,
        };
      }
      
      // Update daily stats
      dailyStats[date].total += 1;
      if (!dailyStats[date].byType[mealType]) {
        dailyStats[date].byType[mealType] = 0;
      }
      dailyStats[date].byType[mealType] += 1;
      
      // Update cat stats
      catStats[catId].totalFeedings += 1;
      if (!catStats[catId].byType[mealType]) {
        catStats[catId].byType[mealType] = 0;
      }
      catStats[catId].byType[mealType] += 1;
    });
    
    // Calculate daily averages for each cat
    Object.keys(catStats).forEach(catId => {
      catStats[catId].dailyAverage = parseFloat((catStats[catId].totalFeedings / days).toFixed(2));
    });

    // Fill in missing dates in the range
    const allDates: string[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      allDates.push(dateStr);
      
      if (!dailyStats[dateStr]) {
        dailyStats[dateStr] = {
          date: dateStr,
          total: 0,
          byType: {},
        };
      }
    }

    // Format the response
    const response = {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days,
      },
      totals: {
        feedings: feedings.length,
        byType: {} as Record<string, number>,
        dailyAverage: parseFloat((feedings.length / days).toFixed(2)),
      },
      dailyStats: Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date)),
      catStats: Object.values(catStats),
    };
    
    // Calculate totals by meal type
    feedings.forEach(feeding => {
      const mealType = feeding.meal_type;
      if (!response.totals.byType[mealType]) {
        response.totals.byType[mealType] = 0;
      }
      response.totals.byType[mealType] += 1;
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching feeding statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch feeding statistics", details: (error as Error).message },
      { status: 500 }
    );
  }
} 