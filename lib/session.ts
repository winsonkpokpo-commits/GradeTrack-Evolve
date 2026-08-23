import { toUserRole, type UserRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Helpers côté serveur pour lire la session depuis les Server Components.
 */

export type SessionUser = {
  id: string;
  email: string | undefined;
  role: UserRole;
};

/** Renvoie l'utilisateur connecté, ou null si aucun. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return {
    id: user.id,
    email: user.email ?? undefined,
    role: toUserRole(user.user_metadata?.role),
  };
}