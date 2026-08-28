"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error: string | null;
  success?: string | null;
};

const initialState: AuthState = { error: null };

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

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Identifiants invalides. Veuillez réessayer." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Inscription : crée UNIQUEMENT des comptes « élève » (B2C autonome).
 * Les rôles professeur / parent / admin_etablissement / admin_systeme ne
 * sont jamais créés via ce formulaire public — ils seront provisionnés par
 * des flux dédiés et contrôlés (Phase 7 / Phase 8). Le profil applicatif
 * (utilisateur + eleve) est désormais créé automatiquement par le trigger
 * SQL handle_new_user (migration 0002) : plus d'insert manuel ici.
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

  if (!email || !password || !nom || !prenom) {
    return { error: "Tous les champs sont obligatoires." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nom, prenom, role: "eleve" } },
  });

  if (error) {
    return { error: "Impossible de créer le compte. Réessayez ou contactez le support." };
  }

  revalidatePath("/", "layout");

  if (data.session) {
    redirect("/");
  }

  return {
    ...initialState,
    success:
      "Compte créé. Un e-mail de confirmation vous a été envoyé ; connectez-vous après validation.",
  };
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}