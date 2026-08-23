import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/types/database";

/**
 * Client Supabase côté serveur (Server Components, Route Handlers, Actions).
 * Synchronise la session via les cookies de la requête (pattern @supabase/ssr).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Appelé depuis un Server Component (lecture seule des cookies) :
            // la session est rafraîchie par le middleware, ignorer est sûr.
          }
        },
      },
    },
  );
}
