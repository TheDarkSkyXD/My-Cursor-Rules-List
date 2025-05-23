import { NextRequest, NextResponse } from 'next/server';
import { ReadonlyRequestCookies, RequestCookies } from 'next/dist/server/web/spec-extension/cookies';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { createRouteHandlerCookieStore } from '@/lib/supabase/cookie-store';
import { createServerClient } from '@supabase/ssr';
import prisma from '@/lib/prisma';

// Response Types
interface HouseholdMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: Date;
}

interface Household {
  id: string;
  name: string;
  owner_id: string;
  created_at: Date;
  updated_at: Date;
  members: HouseholdMember[];
}

// Error Messages
const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized',
  HOUSEHOLD_NAME_REQUIRED: 'Household name is required',
  HOUSEHOLD_NOT_FOUND: 'Household not found',
  INVALID_REQUEST: 'Invalid request',
  SERVER_ERROR: 'Internal server error',
  USER_NOT_FOUND: 'User not found',
} as const;

// Log Runtime
console.log('[/api/households] Runtime:', process.env.NEXT_RUNTIME);

// Helper function to create Supabase client in API routes
async function createSupabaseRouteClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: await createRouteHandlerCookieStore()
    }
  );
}

// GET /api/households - Get all households for the user
export async function GET(request: NextRequest) {
  console.log("\n--- [GET /api/households] Start ---");

  try {
    // Get authenticated user using getUser() for security
    const supabase = await createSupabaseRouteClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[GET /api/households] Authorization Error:', authError?.message);
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const authUserId = user.id;
    console.log(`[GET /api/households] Authenticated User ID: ${authUserId}`);

    // Fetch households the user is a member of using Prisma profile ID
    const userWithHouseholds = await prisma.profiles.findUnique({
      where: {
        id: authUserId
      },
      select: {
        household_members: {
          select: {
            household: {
              include: {
                household_members: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        full_name: true,
                        email: true,
                      }
                    }
                  }
                }
              }
            },
            role: true,
          },
        },
      },
    });

    if (!userWithHouseholds) {
      console.warn(`[GET /api/households] Prisma profile not found for auth ID: ${authUserId}`);
      return NextResponse.json([]); // No profile means no households
    }
    
    const households = userWithHouseholds.household_members.map(member => {
      const household = member.household;
      
      // Find the owner info from members list
      const ownerMember = household.household_members.find(m => m.user.id === household.owner_id);
      
      return {
        ...household,
        // Add owner property mapped from owner_id
        owner: ownerMember ? {
          id: ownerMember.user.id,
          name: ownerMember.user.full_name,
          email: ownerMember.user.email
        } : undefined,
        members: household.household_members.map(m => ({
          id: m.id,
          userId: m.user.id,
          name: m.user.full_name,
          email: m.user.email,
          role: m.role,
          joinedAt: m.created_at
        }))
      };
    });

    console.log(`[GET /api/households] Found ${households.length} households for user ${authUserId}`);
    return NextResponse.json(households);

  } catch (error) {
    console.error('[GET /api/households] Error:', error);
    
    // Check for specific Prisma errors
    if (error.code === 'P2021') {
      return NextResponse.json({ error: 'Tabela não encontrada. Verifique se as migrações foram aplicadas.' }, { status: 500 });
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Conflito de dados.' }, { status: 409 });
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Registro não encontrado.' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Erro ao buscar domicílios' }, { status: 500 });
  }
}

// Validation Schemas
const createHouseholdSchema = z.object({
  name: z.string().min(1, ERROR_MESSAGES.HOUSEHOLD_NAME_REQUIRED),
});

type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;

// POST /api/households - Create a new household
export async function POST(request: NextRequest) {
  console.log("\n--- [POST /api/households] Start ---");

  try {
    // Ensure database connection
    await prisma.$connect();

    // Get authenticated user using getUser() for security
    const supabase = await createSupabaseRouteClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('[POST /api/households] Authorization Error:', userError?.message);
      return NextResponse.json({ error: ERROR_MESSAGES.UNAUTHORIZED }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = createHouseholdSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('[POST /api/households] Validation Error:', validationResult.error.errors);
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name } = validationResult.data;

    // Create household and add current user as admin
    const household = await prisma.$transaction(async (tx) => {
      const newHousehold = await tx.households.create({
        data: {
          name,
          owner_id: user.id,
          household_members: {
            create: {
              user_id: user.id,
              role: 'ADMIN',
            },
          },
        },
        include: {
          household_members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  full_name: true,
                },
              },
            },
          },
        },
      });

      // Find the owner info from the members list
      const ownerMember = newHousehold.household_members.find(
        m => m.user_id === newHousehold.owner_id
      );
      
      return {
        id: newHousehold.id,
        name: newHousehold.name,
        created_at: newHousehold.created_at,
        updated_at: newHousehold.updated_at,
        owner_id: newHousehold.owner_id,
        // Add owner property for frontend consistency
        owner: ownerMember ? {
          id: ownerMember.user_id,
          name: ownerMember.user.full_name || '',
          email: ownerMember.user.email || ''
        } : undefined,
        members: newHousehold.household_members.map((member) => ({
          id: member.id,
          userId: member.user_id,
          name: member.user.full_name || '',
          email: member.user.email || '',
          role: member.role,
          joinedAt: member.created_at,
        })),
      };
    });

    console.log('[POST /api/households] Success: Created household', household.id);
    revalidateTag('households');
    
    return NextResponse.json(household, { status: 201 });
  } catch (error) {
    console.error('[POST /api/households] Server Error:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}