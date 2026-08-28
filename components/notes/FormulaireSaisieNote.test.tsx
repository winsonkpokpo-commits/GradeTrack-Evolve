import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FormulaireSaisieNote } from "@/components/notes/FormulaireSaisieNote";

const mocks = vi.hoisted(() => ({
  creerNote: vi.fn(),
  emettreMiseAJourNotes: vi.fn(),
  fetchMatieres: vi.fn(),
  fetchTrimestres: vi.fn(),
}));

vi.mock("@/lib/api/notes", () => ({
  creerNote: mocks.creerNote,
  emettreMiseAJourNotes: mocks.emettreMiseAJourNotes,
  fetchMatieres: mocks.fetchMatieres,
  fetchTrimestres: mocks.fetchTrimestres,
}));

const NOTE_CREE = {
  id: "n1",
  valeur: 15,
  coefficient: 1,
  typeEvaluation: "examen",
  dateEvaluation: "2025-02-11",
  commentaire: null,
  matiereId: "m1",
  trimestreId: null,
};

async function rendreFormulaire() {
  render(<FormulaireSaisieNote />);
  await screen.findByLabelText("Matière");
  await screen.findByLabelText("Valeur");
}

function soumettreFormulaire() {
  const formulaire = screen
    .getByLabelText("Matière")
    .closest("form") as HTMLFormElement;
  fireEvent.submit(formulaire);
}

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.fetchMatieres.mockResolvedValue([{ id: "m1", nom: "Maths", code: "MAT" }]);
  mocks.fetchTrimestres.mockResolvedValue([
    { id: "t1", nom: "T1", dateDebut: null, dateFin: null },
  ]);
  mocks.creerNote.mockResolvedValue({ ...NOTE_CREE });
  mocks.emettreMiseAJourNotes.mockImplementation(() => {});
});

describe("FormulaireSaisieNote", () => {
  it("bloque la soumission si la matière ou la valeur manquent", async () => {
    await rendreFormulaire();

    soumettreFormulaire();

    expect(
      screen.getByText("Sélectionnez une matière et saisissez une valeur."),
    ).toBeInTheDocument();
    expect(mocks.creerNote).not.toHaveBeenCalled();
  });

  it("soumet la note et notifie la liste (basic/crédit)", async () => {
    await rendreFormulaire();

    fireEvent.change(screen.getByLabelText("Matière"), {
      target: { value: "m1" },
    });
    fireEvent.change(screen.getByLabelText("Valeur"), {
      target: { value: "15" },
    });
    soumettreFormulaire();

    await waitFor(() => expect(mocks.creerNote).toHaveBeenCalledTimes(1));
    expect(mocks.creerNote).toHaveBeenCalledWith({
      matiereId: "m1",
      trimestreId: null,
      valeur: 15,
      typeEvaluation: "devoir",
      coefficient: 1,
      commentaire: null,
    });
    expect(mocks.emettreMiseAJourNotes).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText(
        "Note enregistrée : elle apparaît dans la liste ci-dessous.",
      ),
    ).toBeInTheDocument();
  });

  it("affiche l'erreur renvoyée par l'API au lieu du succès", async () => {
    mocks.creerNote.mockRejectedValue(new Error("Valeur hors échelle"));
    await rendreFormulaire();

    fireEvent.change(screen.getByLabelText("Matière"), {
      target: { value: "m1" },
    });
    fireEvent.change(screen.getByLabelText("Valeur"), {
      target: { value: "30" },
    });
    soumettreFormulaire();

    expect(await screen.findByText("Valeur hors échelle")).toBeInTheDocument();
    expect(mocks.emettreMiseAJourNotes).not.toHaveBeenCalled();
  });
});