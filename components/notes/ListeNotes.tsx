"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchMatieres,
  fetchNotes,
  fetchTrimestres,
  souscrireAuxMisesAJourNotes,
  type FiltresNotes,
  type MatiereOption,
  type NoteDetail,
  type TrimestreOption,
} from "@/lib/api/notes";

const formatDate = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/**
 * Liste des notes de l'élève connecté, filtrable par matière et trimestre.
 * Se rafraîchit automatiquement quand une note vient d'être saisie via le
 * FormulaireSaisieNote (bus d'événements de lib/api/notes.ts).
 */
export function ListeNotes() {
  const [matieres, setMatieres] = useState<MatiereOption[]>([]);
  const [trimestres, setTrimestres] = useState<TrimestreOption[]>([]);
  const [notes, setNotes] = useState<NoteDetail[]>([]);

  const [filtreMatiereId, setFiltreMatiereId] = useState("");
  const [filtreTrimestreId, setFiltreTrimestreId] = useState("");

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const chargerMenus = useCallback(async () => {
    try {
      const [matieresChargees, trimestresCharges] = await Promise.all([
        fetchMatieres(),
        fetchTrimestres(),
      ]);
      setMatieres(matieresChargees);
      setTrimestres(trimestresCharges);
    } catch (erreurMenus) {
      // Les menus de filtre sont secondaires : la liste reste utilisable.
      console.error("Menus de filtre indisponibles :", erreurMenus);
    }
  }, []);

  const chargerNotes = useCallback(
    async (filtres: FiltresNotes) => {
      setChargement(true);
      setErreur(null);
      try {
        setNotes(await fetchNotes(filtres));
      } catch (erreurChargement) {
        setErreur(
          erreurChargement instanceof Error
            ? erreurChargement.message
            : "Erreur inconnue.",
        );
      } finally {
        setChargement(false);
      }
    },
    [],
  );

  useEffect(() => {
    void chargerMenus();
  }, [chargerMenus]);

  useEffect(() => {
    void chargerNotes({
      matiereId: filtreMatiereId || undefined,
      trimestreId: filtreTrimestreId || undefined,
    });
  }, [chargerNotes, filtreMatiereId, filtreTrimestreId]);

  // Rafraîchissement quand une note vient d'être saisie dans le formulaire.
  useEffect(() => {
    return souscrireAuxMisesAJourNotes(() => {
      void chargerNotes({
        matiereId: filtreMatiereId || undefined,
        trimestreId: filtreTrimestreId || undefined,
      });
    });
  }, [chargerNotes, filtreMatiereId, filtreTrimestreId]);

  const nomMatiere = useCallback(
    (id: string) => matieres.find((m) => m.id === id)?.nom ?? "—",
    [matieres],
  );

  const nomTrimestre = useCallback(
    (id: string | null) =>
      id === null
        ? null
        : (trimestres.find((t) => t.id === id)?.nom ?? "—"),
    [trimestres],
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <h2 className="text-lg font-semibold text-slate-900">Mes notes</h2>

        <div className="ml-auto flex flex-wrap gap-3">
          <div>
            <label
              htmlFor="filtre-matiere"
              className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500"
            >
              Matière
            </label>
            <select
              id="filtre-matiere"
              value={filtreMatiereId}
              onChange={(event) => setFiltreMatiereId(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Toutes</option>
              {matieres.map((matiere) => (
                <option key={matiere.id} value={matiere.id}>
                  {matiere.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filtre-trimestre"
              className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500"
            >
              Trimestre
            </label>
            <select
              id="filtre-trimestre"
              value={filtreTrimestreId}
              onChange={(event) => setFiltreTrimestreId(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Tous</option>
              {trimestres.map((trimestre) => (
                <option key={trimestre.id} value={trimestre.id}>
                  {trimestre.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {erreur ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {erreur}
        </p>
      ) : null}

      {chargement ? (
        <p className="text-sm text-slate-500">Chargement des notes…</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-slate-500">
          Aucune note pour le moment{erreur === null ? " avec ces filtres." : "."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Matière</th>
                <th className="px-4 py-2 font-medium">Trimestre</th>
                <th className="px-4 py-2 font-medium">Valeur</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {notes.map((note) => (
                <tr key={note.id}>
                  <td className="px-4 py-2 font-medium text-slate-900">
                    {nomMatiere(note.matiereId)}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {nomTrimestre(note.trimestreId) ?? "—"}
                  </td>
                  <td className="px-4 py-2 font-semibold text-indigo-700">
                    {note.valeur.toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                    })}
                    <span className="font-normal text-slate-400"> / 20</span>
                  </td>
                  <td className="px-4 py-2 capitalize text-slate-600">
                    {note.typeEvaluation}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {formatDate.format(new Date(note.dateEvaluation))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

