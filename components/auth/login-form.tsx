"use client";

import Link from "next/link";
import { useActionState } from "react";

import { login, type AuthState } from "@/lib/actions/auth";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    login,
    { error: null },
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
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
        <label
          htmlFor="password"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Connexion…" : "Se connecter"}
      </button>

      <p className="text-center text-sm text-slate-500">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-medium text-blue-600 hover:underline">
          Créer un compte
        </Link>
      </p>
    </form>
  );
}