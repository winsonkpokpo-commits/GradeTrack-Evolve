"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isUserRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

/**
 * État renvoyé par une action d'authentification (connexion / inscription).
 */
export type AuthState = {
  error: string | null;
  success?: string | null;
};

const initialState: AuthState = { error: null };

/** Connexion : crée la session, puis redirige (le middleware route selon le rôle). */
export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email et mot de passe sont obligatoires." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Identifiants invalides. Veuillez réessayer." };
  }

  revalidatePath("/", "layout");
  // La redirection de rôle est gérée par le middleware à partir de « / ».
  redirect("/");
}

/**
 * Inscription : crée le compte Supabase Auth avec le rôle choisi,
 * insère le profil `utilisateur`, puis route selon le rôle.
 */
export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nom = String(formData.get("nom") ?? "").trim();
  const prenom = String(formData.get("prenom") ?? "").trim();
  const role = String(formData.get("role") ?? "");

  if (!email || !password || !nom || !prenom) {
    return { error: "Tous les champs sont obligatoires." };
  }
  if (!isUserRole(role)) {
    return { error: "Rôle invalide." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role } },
  });

  if (error) {
    return { error: error.message };
  }

  // Si une session est immédiatement disponible (confirmation e-mail désactivée),
  // on crée le profil applicatif `public.utilisateur` (même `id` que auth.users).
  if (data.user && data.session) {
    const { error: profileError } = await supabase.from("utilisateur").insert({
      id: data.user.id,
      email,
      nom,
      prenom,
      role,
    });

    if (profileError) {
      return {
        error:
          "Compte créé mais le profil applicatif n'a pas pu être initialisé : " +
          profileError.message,
      };
    }
  }

  revalidatePath("/", "layout");

  if (data.session) {
    redirect("/");
  }

  // Confirmation e-mail activée : on prévient l'utilisateur (pas de session immédiate).
  return {
    ...initialState,
    success:
      "Compte créé. Un e-mail de confirmation vous a été envoyé ; connectez-vous après validation.",
  };
}

/** Déconnexion : détruit la session puis retourne sur la page de connexion. */
export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}