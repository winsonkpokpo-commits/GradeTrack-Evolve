"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import {
  creerNote,
  emettreMiseAJourNotes,
  fetchMatieres,
  fetchTrimestres,
  type MatiereOption,
  type TrimestreOption,
  type TypeEvaluation,
} from "@/lib/api/notes";

/**
 * Formulaire de saisie d'une note élève.
 *
 * Les menus matière et trimestre sont alimentés par les endpoints des
 * étapes 3.1 / 3.2 (GET /matieres, GET /trimestres). Aucune validation
 * métier côté client : les règles (échelle 0-20, droits, cohérence de
 * classe) sont appliquées par le backend et leurs erreurs affichées.
 */
export function FormulaireSaisieNote() {
  const [matieres, setMatieres] = useState<MatiereOption[]>([]);
  const [trimestres, setTrimestres] = useState<TrimestreOption[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreurMenus, setErreurMenus] = useState<string | null>(null);

  const [matiereId, setMatiereId] = useState("");
  const [trimestreId, setTrimestreId] = useState("");
  const [valeur, setValeur] = useState("");
  const [typeEvaluation, setTypeEvaluation] =
    useState<TypeEvaluation>("devoir");
  const [coefficient, setCoefficient] = useState("1");
  const [commentaire, setCommentaire] = useState("");

  const [envoi, setEnvoi] = useState(false);
  const [erreurEnvoi, setErreurEnvoi] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);

  const chargerMenus = useCallback(async () => {
    setChargement(true);
    setErreurMenus(null);
    try {
      const [matieresChargees, trimestresCharges] = await Promise.all([
        fetchMatieres(),
        fetchTrimestres(),
      ]);
      setMatieres(matieresChargees);
      setTrimestres(trimestresCharges);
    } catch (erreur) {
      setErreurMenus(
        erreur instanceof Error ? erreur.message : "Erreur inconnue.",
      );
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void chargerMenus();
  }, [chargerMenus]);

  async function gererSoumission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreurEnvoi(null);
    setSucces(false);

    if (!matiereId || valeur.trim() === "") {
      setErreurEnvoi("Sélectionnez une matière et saisissez une valeur.");
      return;
    }

    setEnvoi(true);
    try {
      await creerNote({
        matiereId,
        trimestreId: trimestreId === "" ? null : trimestreId,
        valeur: Number(valeur),
        typeEvaluation,
        coefficient: Number(coefficient),
        commentaire: commentaire.trim() === "" ? null : commentaire,
      });
      setValeur("");
      setSucces(true);
      emettreMiseAJourNotes();
    } catch (erreur) {
      setErreurEnvoi(
        erreur instanceof Error ? erreur.message : "Erreur inconnue.",
      );
    } finally {
      setEnvoi(false);
    }
  }

  if (chargement) {
    return <p className="text-sm text-slate-500">Chargement des menus…</p>;
  }

  if (erreurMenus) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">{erreurMenus}</p>
        <button
          type="button"
          onClick={() => void chargerMenus()}
          className="mt-2 text-sm font-medium text-red-700 underline hover:text-red-900"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={gererSoumission} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="note-matiere"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Matière
          </label>
          <select
            id="note-matiere"
            value={matiereId}
            onChange={(event) => setMatiereId(event.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">— Choisir une matière —</option>
            {matieres.map((matiere) => (
              <option key={matiere.id} value={matiere.id}>
                {matiere.nom}
                {matiere.code ? ` (${matiere.code})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="note-trimestre"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Trimestre{" "}
            <span className="font-normal text-slate-400">(optionnel)</span>
          </label>
          <select
            id="note-trimestre"
            value={trimestreId}
            onChange={(event) => setTrimestreId(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">— Aucun trimestre —</option>
            {trimestres.map((trimestre) => (
              <option key={trimestre.id} value={trimestre.id}>
                {trimestre.nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="sm:w-1/2">
        <label
          htmlFor="note-valeur"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Valeur
        </label>
        <input
          id="note-valeur"
          type="number"
          inputMode="decimal"
          step="0.01"
          value={valeur}
          onChange={(event) => setValeur(event.target.value)}
          placeholder="ex. 14.5"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <p className="mt-1 text-xs text-slate-400">
          Les contrôles métier (échelle, droits) sont appliqués par le serveur.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="note-type-evaluation"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Type d'évaluation
          </label>
          <select
            id="note-type-evaluation"
            value={typeEvaluation}
            onChange={(event) =>
              setTypeEvaluation(event.target.value as TypeEvaluation)
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {(
              [
                "devoir",
                "controle",
                "examen",
                "tp",
                "oral",
                "autre",
              ] as const
            ).map((valeurType) => (
              <option key={valeurType} value={valeurType}>
                {valeurType}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="note-coefficient"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Coefficient
          </label>
          <input
            id="note-coefficient"
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0.5"
            value={coefficient}
            onChange={(event) => setCoefficient(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="note-commentaire"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Commentaire{" "}
          <span className="font-normal text-slate-400">(optionnel)</span>
        </label>
        <textarea
          id="note-commentaire"
          value={commentaire}
          onChange={(event) => setCommentaire(event.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {erreurEnvoi ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {erreurEnvoi}
        </p>
      ) : null}
      {succes ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          Note enregistrée : elle apparaît dans la liste ci-dessous.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={envoi}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {envoi ? "Enregistrement…" : "Enregistrer la note"}
      </button>
    </form>
  );
}

