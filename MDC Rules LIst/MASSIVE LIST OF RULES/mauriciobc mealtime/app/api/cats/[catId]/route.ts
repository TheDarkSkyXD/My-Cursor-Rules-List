import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withError } from "@/lib/utils/api-middleware";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Helper function to create Supabase client in API routes using async cookie store
async function createSupabaseRouteClient() {
  const cookieStore = cookies();

  // Define the async cookie store based on utils/supabase/server.ts pattern
  const asyncCookieStore = {
    async get(name: string) {
      // Always use await with cookies()
      return (await cookieStore).get(name)?.value;
    },
    async set(name: string, value: string, options: CookieOptions) {
      try {
        // Always use await with cookies()
        (await cookieStore).set({ name, value, ...options });
      } catch (error) {
        // Handle potential errors during cookie setting in API routes
        console.error(`[Supabase Route Client] Error setting cookie ${name}:`, error);
      }
    },
    async remove(name: string, options: CookieOptions) {
      try {
        // Always use await with cookies()
        (await cookieStore).set({ name, value: '', ...options });
      } catch (error) {
        // Handle potential errors during cookie removal in API routes
        console.error(`[Supabase Route Client] Error removing cookie ${name}:`, error);
      }
    },
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: asyncCookieStore, // Use the async store
    }
  );
}

// GET /api/cats/[catId] - Get cat by ID
export const GET = withError(async (request: Request, { params }: { params: Promise<{ catId: string }> }) => {
  const supabase = await createSupabaseRouteClient();
  const { catId } = await params;
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error(`[GET /api/cats/${catId}] Auth error:`, authError);
      return new NextResponse("Authentication failed", { status: 401 });
    }

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log(`[GET /api/cats/${catId}] Fetching cat for user ${user.id}`);

    // Get the cat and verify the user has access through their household
    const cat = await prisma.cats.findFirst({
      where: {
        id: catId,
        household: {
          household_members: {
            some: {
              user_id: user.id
            }
          }
        }
      },
      include: {
        household: true,
        owner: true,
        schedules: true
      }
    });

    if (!cat) {
      console.log(`[GET /api/cats/${catId}] Cat not found or access denied for user ${user.id}`);
      return new NextResponse("Cat not found or access denied", { status: 404 });
    }

    console.log(`[GET /api/cats/${catId}] Successfully fetched cat for user ${user.id}`);
    return NextResponse.json(cat);
  } catch (error) {
    console.error(`[GET /api/cats/${catId}] Error:`, error);
    return new NextResponse(
      "Internal Server Error", 
      { status: 500 }
    );
  }
});

// PUT /api/cats/[catId] - Update a cat
export const PUT = withError(async (request: Request, { params }: { params: Promise<{ catId: string }> }) => {
  const supabase = await createSupabaseRouteClient();
  const { catId } = await params;
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await request.json();

  // Get the cat and verify the user has access through their household
  const cat = await prisma.cats.findFirst({
    where: {
      id: catId,
      household: {
        household_members: {
          some: {
            user_id: user.id
          }
        }
      }
    }
  });

  if (!cat) {
    return new NextResponse("Cat not found or access denied", { status: 404 });
  }

  // Update the cat
  const updatedCat = await prisma.cats.update({
    where: {
      id: catId
    },
    data: {
      name: body.name,
      birth_date: body.birthDate ? new Date(body.birthDate) : undefined,
      weight: body.weight ? parseFloat(String(body.weight)) : undefined,
      photo_url: body.photoUrl
    },
    include: {
      household: true,
      owner: true,
      schedules: true
    }
  });

  return NextResponse.json(updatedCat);
});

// DELETE /api/cats/[catId] - Delete a cat
export const DELETE = withError(async (request: NextRequest, { params }: { params: Promise<{ catId: string }> }) => {
  const supabase = await createSupabaseRouteClient();
  const { catId } = await params;
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.log(`[DELETE /api/cats/${catId}] Failed: Authentication error`);
    return new NextResponse("Unauthorized", { status: 401 });
  }

  console.log(`[DELETE /api/cats/${catId}] Attempting delete by user ${user.id}`);

  try {
    // 1. Find the cat and its household ID
    const cat = await prisma.cats.findUnique({
      where: { id: catId },
      select: { household_id: true }
    });

    if (!cat) {
      console.log(`[DELETE /api/cats/${catId}] Failed: Cat not found`);
      return NextResponse.json({ error: 'Cat not found' }, { status: 404 });
    }
    
    const householdId = cat.household_id;
    if (!householdId) {
      console.error(`[DELETE /api/cats/${catId}] Failed: Cat ${catId} is not associated with any household.`);
      return NextResponse.json({ error: 'Cat has no associated household' }, { status: 500 });
    }

    // 2. Verify user membership in that household
    console.log(`[DELETE /api/cats/${catId}] Verifying user ${user.id} membership in household ${householdId}`);
    const userAccess = await prisma.household_members.findFirst({
      where: {
        user_id: user.id,
        household_id: householdId
      }
    });

    if (!userAccess) {
      console.log(`[DELETE /api/cats/${catId}] Failed: User ${user.id} not member of household ${householdId}`);
      return NextResponse.json({ error: 'Access denied: User does not belong to this household' }, { status: 403 });
    }
    console.log(`[DELETE /api/cats/${catId}] User ${user.id} authorized for household ${householdId}`);

    // 3. Perform Deletion (within a transaction for atomicity)
    console.log(`[DELETE /api/cats/${catId}] Starting transaction to delete meals and cat`);
    await prisma.$transaction(async (tx) => {
      // Delete associated meals
      await tx.feeding_logs.deleteMany({
        where: { cat_id: catId }
      });
      console.log(`[DELETE /api/cats/${catId}] Associated meals deleted`);

      // Delete the cat
      await tx.cats.delete({
        where: { id: catId }
      });
      console.log(`[DELETE /api/cats/${catId}] Cat deleted successfully`);
    });
    console.log(`[DELETE /api/cats/${catId}] Transaction completed`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[DELETE /api/cats/${catId}] Error during delete process:`, error);
    return NextResponse.json(
      { error: 'An error occurred while deleting the cat', details: (error instanceof Error) ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}); 