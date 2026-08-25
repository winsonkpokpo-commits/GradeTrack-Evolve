import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";
import { FormulaireSaisieNote } from "@/components/notes/FormulaireSaisieNote";
import { ListeNotes } from "@/components/notes/ListeNotes";
import { getRoleHomePath } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";

type SectionCarteProps = {
  titre: string;
  children: ReactNode;
};

/** Carte blanche réutilisant le style de DashboardShell. */
function SectionCarte({ titre, children }: SectionCarteProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">{titre}</h2>
      {children}
    </section>
  );
}

/**
 * Saisie et consultation des notes — réservé au rôle « élève ».
 * La visualisation synthétique (tableau de bord) sera construite plus tard.
 */
export default async function NotesPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }
  if (user.role !== "eleve") {
    redirect(getRoleHomePath(user.role));
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Mes notes</h1>
          <p className="mt-1 text-sm uppercase tracking-wide text-slate-500">
            Élève
          </p>
        </div>
        <LogoutButton />
      </div>

      <div className="space-y-8">
        <SectionCarte titre="Saisir une note">
          <FormulaireSaisieNote />
        </SectionCarte>

        <SectionCarte titre="Consulter mes notes">
          <ListeNotes />
        </SectionCarte>
      </div>

      <p className="mt-8 text-sm text-slate-500">
        Connecté en tant que{" "}
        <span className="font-medium text-slate-700">{user.email ?? "—"}</span>
      </p>
    </main>
  );
}
