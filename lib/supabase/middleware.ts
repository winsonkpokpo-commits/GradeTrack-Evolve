import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";
import {
  getRoleHomePath,
  isProtectedPath,
  PUBLIC_PATHS,
  toUserRole,
} from "@/lib/auth";

/**
 * Rafraîchit la session Supabase et applique la protection des routes :
 *  - non connecté + route protégée (ou racine)  -> redirection /login
 *  - connecté + /login|/inscription|/          -> redirection vers la page du rôle
 *  - connecté + page d'un autre rôle           -> redirection vers sa propre page
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT : ne pas insérer de logique entre createServerClient et getUser()
  // (recommandation @supabase/ssr pour éviter des déconnexions aléatoires).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicPath = (PUBLIC_PATHS as readonly string[]).includes(pathname);

  const redirect = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    return NextResponse.redirect(url);
  };

  // 1. Utilisateur non connecté -> /login (sauf pages publiques).
  if (!user) {
    if (isPublicPath) return supabaseResponse;
    return redirect("/login");
  }

  // 2. Utilisateur connecté : résolution du rôle.
  const home = getRoleHomePath(toUserRole(user.user_metadata?.role));

  // 2a. Racine ou page d'auth -> page d'accueil du rôle.
  if (pathname === "/" || isPublicPath) {
    return redirect(home);
  }

  // 2b. Tentative d'accès à la zone d'un autre rôle -> sa propre page.
  if (isProtectedPath(pathname) && !pathname.startsWith(home)) {
    return redirect(home);
  }

  return supabaseResponse;
}
