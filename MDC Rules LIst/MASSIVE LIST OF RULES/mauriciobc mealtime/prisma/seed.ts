import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
// import { hash } from 'bcryptjs'; // Password hashing is handled by Supabase Auth
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing public schema data...');
  // Clear in order respecting relations
  await prisma.weight_goal_milestones.deleteMany();
  await prisma.weight_goals.deleteMany();
  await prisma.cat_weight_logs.deleteMany();
  await prisma.feeding_logs.deleteMany();
  await prisma.schedules.deleteMany();
  await prisma.cats.deleteMany();
  await prisma.household_members.deleteMany();
  await prisma.households.deleteMany();
  await prisma.notifications.deleteMany();
  await prisma.profiles.deleteMany();

  console.log('Creating placeholder admin profile...');
  // In a real scenario, Supabase Auth handles user creation.
  // We create a profile linked via a placeholder UUID.
  const adminUserId = uuidv4(); // Placeholder Supabase Auth User ID
  const adminProfile = await prisma.profiles.create({
    data: {
      id: adminUserId, // Link to placeholder Supabase Auth ID
      full_name: 'Admin User',
      username: 'admin_user',
      // email is managed by Supabase Auth, not stored here by default
    },
  });
  console.log(`Created admin profile with ID: ${adminProfile.id}`);


  console.log('Creating household...');
  const household = await prisma.households.create({ // Correct model name
    data: {
      name: 'Casa Principal',
      description: 'Our main household',
      owner_id: adminProfile.id, // Use profile ID
      // users/members are linked via household_members table
    } // Removed incorrect type assertion
  });
  console.log(`Created household with ID: ${household.id}`);

  console.log('Creating admin household membership...');
   await prisma.household_members.create({
      data: {
        user_id: adminProfile.id,
        household_id: household.id,
        role: 'admin', // Assign role here
      }
   });


  console.log('Creating placeholder member profile...');
  const memberUserId = uuidv4(); // Placeholder Supabase Auth User ID
  const memberProfile = await prisma.profiles.create({
    data: {
      id: memberUserId,
      full_name: 'Member User',
      username: 'member_user',
    },
  });
  console.log(`Created member profile with ID: ${memberProfile.id}`);

  console.log('Creating member household membership...');
   await prisma.household_members.create({
      data: {
        user_id: memberProfile.id,
        household_id: household.id,
        role: 'member', // Assign role here
      }
   });


  console.log('Creating cats...');
  const catMilo = await prisma.cats.create({ // Correct model name
    data: {
      name: 'Milo',
      household_id: household.id,
      owner_id: adminProfile.id, // Use profile ID for owner
      birth_date: new Date('2020-01-15'),
      weight: 4.5,
      // Removed non-existent fields: userId, feedingInterval, portion_size
      // Add birth_date, weight if needed
    },
  });
  console.log(`Created cat Milo with ID: ${catMilo.id}`);

  const catLuna = await prisma.cats.create({ // Correct model name
    data: {
      name: 'Luna',
      household_id: household.id,
      owner_id: adminProfile.id, // Use profile ID for owner
      birth_date: new Date('2021-03-20'),
      weight: 3.8,
      // Removed non-existent fields: userId, feedingInterval, portion_size
    },
  });
  console.log(`Created cat Luna with ID: ${catLuna.id}`);

  console.log('Creating sample schedules...');
  await prisma.schedules.create({
    data: {
      cat_id: catMilo.id,
      type: 'interval',
      interval: 8, // Every 8 hours
      enabled: true,
    }
  });
  await prisma.schedules.create({
    data: {
      cat_id: catLuna.id,
      type: 'fixed',
      times: ["09:00", "19:00"], // At 9 AM and 7 PM
      enabled: true,
    }
  });
  console.log('Created sample schedules.');

  console.log('Creating sample feeding logs...');
  await prisma.feeding_logs.create({
    data: {
      cat_id: catMilo.id,
      household_id: household.id,
      fed_by: adminProfile.id,
      fed_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // ~2 hours ago
      meal_type: 'Breakfast',
      amount: 50,
      unit: 'g',
      notes: 'Ate quickly'
    }
  });
  console.log('Created sample feeding logs.');

  console.log('Creating sample weight logs...');
  // Create historical weight logs for Milo
  const miloWeightLogs = [
    { weight: 4.2, date: new Date('2023-12-01') },
    { weight: 4.3, date: new Date('2023-12-15') },
    { weight: 4.4, date: new Date('2024-01-01') },
    { weight: 4.5, date: new Date() }, // Current weight
  ];

  for (const log of miloWeightLogs) {
    await prisma.cat_weight_logs.create({
      data: {
        cat_id: catMilo.id,
        weight: log.weight,
        date: log.date,
        measured_by: adminProfile.id,
        notes: 'Regular weigh-in',
      }
    });
  }

  // Create weight goal for Milo
  const miloWeightGoal = await prisma.weight_goals.create({
    data: {
      cat_id: catMilo.id,
      goal_name: 'Milo Weight Loss',
      target_weight: 4.2,
      target_date: new Date('2024-06-01'),
      start_weight: 4.5,
      unit: 'kg',
      status: 'active',
      notes: 'Gradual weight reduction plan',
      created_by: adminProfile.id,
    }
  });

  // Create milestones for Milo's weight goal
  const miloMilestones = [
    { weight: 4.4, date: new Date('2024-03-01') },
    { weight: 4.3, date: new Date('2024-04-15') },
    { weight: 4.2, date: new Date('2024-06-01') },
  ];

  for (const milestone of miloMilestones) {
    await prisma.weight_goal_milestones.create({
      data: {
        goal_id: miloWeightGoal.id,
        weight: milestone.weight,
        date: milestone.date,
        notes: 'Planned milestone',
      }
    });
  }
  console.log('Created sample weight tracking data.');

  console.log('Creating sample notification...');
  await prisma.notifications.create({
    data: {
      user_id: adminProfile.id,
      title: 'Welcome to Mealtime!',
      message: 'Get started by setting up feeding schedules for your cats.',
      type: 'welcome',
      is_read: false,
      metadata: { actionRequired: false }
    }
  });
  console.log('Created sample notification.');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 