/**
 * Couche d'accès aux notes côté navigateur.
 *
 * Toutes les requêtes passent par l'API FastAPI (étapes 3.1 / 3.2 :
 * GET /matieres, GET /trimestres, GET /notes, POST /notes). Le jeton
 * Supabase de la session est transmis en « Authorization: Bearer » : le
 * backend le valide puis le transmet à PostgREST, où les policies RLS
 * s'appliquent (un élève ne lit et n'écrit QUE ses propres notes).
 *
 * Aucune validation métier ici : elle reste côté backend.
 */

import { createClient } from "@/lib/supabase/client";

// ------------------------------------------------------------------ Paramètres

/** URL de l'API FastAPI (voir .env.example). */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ---------------------------------------------------------------- Types publics

/** Option du menu « matière » (référentiel global). */
export type MatiereOption = {
  id: string;
  nom: string;
  code: string | null;
};

/** Option du menu « trimestre » (rattaché à la classe de l'élève). */
export type TrimestreOption = {
  id: string;
  nom: string;
  dateDebut: string | null;
  dateFin: string | null;
};

/** Note telle qu'affichée dans l'interface. */
export type NoteDetail = {
  id: string;
  valeur: number;
  coefficient: number;
  typeEvaluation: string;
  dateEvaluation: string;
  commentaire: string | null;
  matiereId: string;
  trimestreId: string | null;
};

/** Filtres applicables à la liste de notes. */
export type FiltresNotes = {
  matiereId?: string;
  trimestreId?: string;
};

/** Données d'une nouvelle note saisies par l'utilisateur. */
export type TypeEvaluation =
  | "devoir"
  | "controle"
  | "examen"
  | "tp"
  | "oral"
  | "autre";

export type PayloadNouvelleNote = {
  matiereId: string;
  trimestreId: string | null;
  valeur: number;
  typeEvaluation: TypeEvaluation;
  coefficient: number;
  commentaire: string | null;
};



// ------------------------------------------------------------ Bus de mise à jour

/**
 * Mini bus d'événements interne : permet à la liste de notes de se
 * rafraîchir quand le formulaire vient de créer une note, sans couplage
 * direct entre les deux composants clients.
 */
const auditeurs = new Set<() => void>();

/** Notifie les abonnés qu'une note vient d'être créée. */
export function emettreMiseAJourNotes(): void {
  for (const auditeur of auditeurs) {
    auditeur();
  }
}

/** Abonne un composant aux mises à jour ; renvoie la fonction de désabonnement. */
export function souscrireAuxMisesAJourNotes(auditeur: () => void): () => void {
  auditeurs.add(auditeur);
  return () => {
    auditeurs.delete(auditeur);
  };
}

// ------------------------------------------------------------------- Requêtes

/** Récupère le jeton d'accès Supabase de la session courante. */
async function recupererJeton(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Session expirée ou absente : reconnectez-vous.");
  }
  return session.access_token;
}

/** Appel générique de l'API FastAPI avec gestion d'erreur typée du backend. */
async function appelApi<T>(chemin: string, init?: RequestInit): Promise<T> {
  const jeton = await recupererJeton();

  const response = await fetch(`${API_BASE_URL}${chemin}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jeton}`,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    // Format d'erreur normalisé du backend : {"error": {code, message}}.
    let message = `Erreur ${response.status}`;
    try {
      const corps = (await response.json()) as {
        error?: { code?: string; message?: string };
      };
      if (corps.error?.message) {
        message = `${corps.error.message} (${corps.error.code ?? "erreur"})`;
      }
    } catch {
      // Corps non JSON : garder le message générique.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

type MatiereApi = { id: string; nom: string; code: string | null };

/** Charge le référentiel des matières — GET /matieres (étape 3.1). */
export async function fetchMatieres(): Promise<MatiereOption[]> {
  return appelApi<MatiereApi[]>("/matieres");
}

type TrimestreApi = {
  id: string;
  classe_id: string;
  nom: string;
  date_debut: string | null;
  date_fin: string | null;
};

/** Charge les trimestres de la classe de l'élève — GET /trimestres (étape 3.2). */
export async function fetchTrimestres(): Promise<TrimestreOption[]> {
  const lignes = await appelApi<TrimestreApi[]>("/trimestres");
  return lignes.map((ligne) => ({
    id: ligne.id,
    nom: ligne.nom,
    dateDebut: ligne.date_debut,
    dateFin: ligne.date_fin,
  }));
}

type NoteApi = {
  id: string;
  eleve_id: string;
  matiere_id: string;
  trimestre_id: string | null;
  valeur: number;
  coefficient: number;
  date_evaluation: string;
  type_evaluation: string;
  commentaire: string | null;
};

function versNoteDetail(ligne: NoteApi): NoteDetail {
  return {
    id: ligne.id,
    valeur: Number(ligne.valeur),
    coefficient: Number(ligne.coefficient),
    typeEvaluation: ligne.type_evaluation,
    dateEvaluation: ligne.date_evaluation,
    commentaire: ligne.commentaire,
    matiereId: ligne.matiere_id,
    trimestreId: ligne.trimestre_id,
  };
}

/**
 * Charge les notes de l'élève connecté, filtrables par matière et/ou
 * trimestre — GET /notes (étape 3.2).
 */
export async function fetchNotes(
  filtres: FiltresNotes = {},
): Promise<NoteDetail[]> {
  const parametres = new URLSearchParams();
  if (filtres.matiereId) parametres.set("matiere_id", filtres.matiereId);
  if (filtres.trimestreId) parametres.set("trimestre_id", filtres.trimestreId);

  const suffixe = parametres.size > 0 ? `?${parametres.toString()}` : "";
  const lignes = await appelApi<NoteApi[]>(`/notes${suffixe}`);
  return lignes.map(versNoteDetail);
}

/**
 * Crée une note pour l'élève connecté et renvoie sa représentation
 * détaillée — POST /notes (étape 3.2). Aucune validation métier ici :
 * l'échelle 0-20, la matière/trimestre valides et les droits sont
 * appliqués par le backend, dont les erreurs sont affichées telles quelles.
 */
export async function creerNote(
  payload: PayloadNouvelleNote,
): Promise<NoteDetail> {
  const ligne = await appelApi<NoteApi>("/notes", {
    method: "POST",
    body: JSON.stringify({
      matiere_id: payload.matiereId,
      trimestre_id: payload.trimestreId,
      valeur: payload.valeur,
      coefficient: payload.coefficient,
      type_evaluation: payload.typeEvaluation,
      commentaire: payload.commentaire,
    }),
  });
  return versNoteDetail(ligne);
}


