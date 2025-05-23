import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Update createClient to handle async cookies properly
export const createClient = async () => {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: async (name: string) => {
          try {
            const cookie = await cookieStore.get(name);
            return cookie?.value;
          } catch (error) {
            console.error(`Error getting cookie ${name}:`, error);
            return undefined;
          }
        },
        set: async (name: string, value: string, options: any) => {
          try {
            await cookieStore.set(name, value, options);
          } catch (error) {
            console.error(`Error setting cookie ${name}:`, error);
          }
        },
        remove: async (name: string, options: any) => {
          try {
            await cookieStore.delete(name, options);
          } catch (error) {
            console.error(`Error removing cookie ${name}:`, error);
          }
        },
      },
    }
  );
}; 