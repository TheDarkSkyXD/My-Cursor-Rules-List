import { z } from "zod";
import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { withError } from "@/lib/utils/api-middleware";
import { User } from "@/lib/types";

// Define the expected request body structure and validation
const updateUserPreferencesBody = z.object({
  language: z.string().min(1, "Language is required"),
  timezone: z.string().min(1, "Timezone is required"),
});
export type UpdateUserPreferencesBody = z.infer<typeof updateUserPreferencesBody>;

// Define the expected response structure
export type UpdateUserPreferencesResponse = {
  user: User;
};

// Helper function to create Supabase client in API routes using async cookie store
function createSupabaseRouteClient() {
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

// Business logic function to update preferences
async function updateUserPreferences(
  userId: string,
  body: UpdateUserPreferencesBody
): Promise<User> {
  // Find the existing user to get their current preferences
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { preferences: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Update the user's preferences
  const updatedUser = await prisma.user.update({
    where: {
      id: Number(userId),
    },
    data: {
      preferences: {
        ...(user.preferences as Record<string, any>),
        language: body.language,
        timezone: body.timezone,
      },
    },
  });

  return updatedUser as User;
}

// PUT route handler
export const PUT = withError(
  async (
    request: Request,
    { params }: { params: Promise<{ id: string; userId: string }> }
  ) => {
    const supabase = createSupabaseRouteClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { userId } = await params;

    // Get the Prisma user ID from the auth ID
    const prismaUser = await prisma.user.findUnique({
      where: { authId: user.id }
    });

    if (!prismaUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Security Check: Ensure the logged-in user matches the userId param
    if (String(prismaUser.id) !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log('[API PREFERENCES PUT] Request bodyUsed before json():', request.bodyUsed);
    
    const json = await request.json();
    const body = updateUserPreferencesBody.parse(json);

    const updatedUser = await updateUserPreferences(userId, body);

    const result: UpdateUserPreferencesResponse = { user: updatedUser };
    return NextResponse.json(result);
  }
); 