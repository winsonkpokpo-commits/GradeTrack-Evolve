import { logout } from "@/lib/actions/auth";

/**
 * Bouton de déconnexion (appel d'une Server Action via un formulaire).
 */
export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
      >
        Se déconnecter
      </button>
    </form>
  );
}