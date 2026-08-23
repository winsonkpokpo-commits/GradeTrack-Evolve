/**
 * Utilitaires d'authentification / de rôles.
 *
 * Les 5 rôles correspondent à l'enum PostgreSQL `role_utilisateur`
 * défini dans supabase/migrations/0001_schema_initial.sql.
 * Le rôle d'un utilisateur est porté par `user.user_metadata.role`
 * (renseigné à l'inscription).
 */

export const USER_ROLES = [
  "eleve",
  "professeur",
  "parent",
  "admin_etablissement",
  "admin_systeme",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Libellés français affichables pour chaque rôle. */
export const ROLE_LABELS: Record<UserRole, string> = {
  eleve: "Élève",
  professeur: "Professeur",
  parent: "Parent",
  admin_etablissement: "Admin établissement",
  admin_systeme: "Admin système",
};

/** Page d'accueil de chaque rôle après connexion. */
export const ROLE_HOME_PATHS: Record<UserRole, string> = {
  eleve: "/dashboard",
  professeur: "/classe",
  parent: "/suivi",
  admin_etablissement: "/administration",
  admin_systeme: "/admin",
};

/** Préfixes de routes protégées (réservées à un rôle précis). */
export const PROTECTED_PATH_PREFIXES = [
  "/dashboard",
  "/classe",
  "/suivi",
  "/administration",
  "/admin",
] as const;

/** Chemins publics accessibles sans session. */
export const PUBLIC_PATHS = ["/login", "/inscription"] as const;

/** Type guard : une valeur inconnue est-elle un rôle valide ? */
export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

/**
 * Extrait le rôle depuis les métadonnées Supabase.
 * Repli sur "eleve" si absent/invalide (ne devrait pas arriver après inscription).
 */
export function toUserRole(value: unknown): UserRole {
  return isUserRole(value) ? value : "eleve";
}

/** Page d'accueil associée à un rôle. */
export function getRoleHomePath(role: UserRole): string {
  return ROLE_HOME_PATHS[role];
}

/** Vrai si le chemin est une zone protégée (nécessite une session). */
export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}
