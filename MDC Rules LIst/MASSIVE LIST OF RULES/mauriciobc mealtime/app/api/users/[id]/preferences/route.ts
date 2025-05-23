import { z } from "zod";
import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { withError } from "@/lib/utils/api-middleware";
import { User } from "@/lib/types";

const updateUserPreferencesBody = z.object({
  language: z.string().min(1, "Language is required"),
  timezone: z.string().min(1, "Timezone is required"),
});
export type UpdateUserPreferencesBody = z.infer<typeof updateUserPreferencesBody>;

export type UpdateUserPreferencesResponse = {
  user: User;
};

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

// Business logic function to update preferences
async function updateUserPreferences(
  userId: string,
  body: UpdateUserPreferencesBody
): Promise<User> {
  // Update the user's preferences in their profile
  const updatedProfile = await prisma.profiles.update({
    where: {
      id: userId,
    },
    data: {
      preferences: {
        language: body.language,
        timezone: body.timezone,
      },
    },
  });

  // Cast to User type for frontend compatibility
  return updatedProfile as unknown as User;
}

// PUT route handler
export const PUT = withError(
  async (
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const supabase = await createSupabaseRouteClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    // Get the Prisma user ID from the auth ID
    const prismaUser = await prisma.user.findUnique({
      where: { authId: user.id }
    });

    if (!prismaUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Compare Prisma user ID with route param ID
    if (String(prismaUser.id) !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // This log might be less useful now, but keep for one more test
    console.log('[API PREFERENCES PUT] Request bodyUsed before json():', request.bodyUsed);
    
    const json = await request.json();
    const body = updateUserPreferencesBody.parse(json);

    const updatedUser = await updateUserPreferences(id, body);

    const result: UpdateUserPreferencesResponse = { user: updatedUser }; // `updatedUser` might not fully match User type here
    return NextResponse.json(result);
  }
); 