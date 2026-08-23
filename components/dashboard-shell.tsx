import type { ReactNode } from "react";

import { LogoutButton } from "@/components/logout-button";
import { getSessionUser } from "@/lib/session";

type DashboardShellProps = {
  title: string;
  roleLabel: string;
  description?: string | ReactNode;
};

/**
 * Coquille commune des pages protégées (placeholders métier).
 * Affiche le titre, le rôle, l'utilisateur connecté et le bouton de déconnexion.
 */
export async function DashboardShell({
  title,
  roleLabel,
  description,
}: DashboardShellProps) {
  const user = await getSessionUser();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm uppercase tracking-wide text-slate-500">
            {roleLabel}
          </p>
        </div>
        <LogoutButton />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">
          {description ?? "Espace en construction — aucune fonctionnalité métier pour l'instant."}
        </p>
        <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-500">
          Connecté en tant que{" "}
          <span className="font-medium text-slate-700">{user?.email ?? "—"}</span>
        </p>
      </div>
    </main>
  );
}