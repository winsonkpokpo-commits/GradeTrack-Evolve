"use client";

import Link from "next/link";
import { useActionState } from "react";

import { ROLE_LABELS, USER_ROLES } from "@/lib/auth";
import { signup, type AuthState } from "@/lib/actions/auth";

export function SignupForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signup,
    { error: null },
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
      )}

      <div>
        <label htmlFor="nom" className="mb-1 block text-sm font-medium text-slate-700">
          Nom
        </label>
        <input
          id="nom"
          name="nom"
          type="text"
          autoComplete="family-name"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="prenom" className="mb-1 block text-sm font-medium text-slate-700">
          Prénom
        </label>
        <input
          id="prenom"
          name="prenom"
          type="text"
          autoComplete="given-name"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
          Adresse e-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="role" className="mb-1 block text-sm font-medium text-slate-700">
          Rôle
        </label>
        <select
          id="role"
          name="role"
          defaultValue="eleve"
          required
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {USER_ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Création du compte…" : "Créer mon compte"}
      </button>

      <p className="text-center text-sm text-slate-500">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}