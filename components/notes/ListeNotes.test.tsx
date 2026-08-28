import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ListeNotes } from "@/components/notes/ListeNotes";

const mocks = vi.hoisted(() => {
  let auditeurActif: (() => void) | null = null;
  return {
    fetchMatieres: vi.fn(),
    fetchTrimestres: vi.fn(),
    fetchNotes: vi.fn(),
    souscrireAuxMisesAJourNotes: vi.fn((auditeur: () => void) => {
      auditeurActif = auditeur;
      return () => {
        auditeurActif = null;
      };
    }),
    notifier: () => {
      auditeurActif?.();
    },
  };
});

vi.mock("@/lib/api/notes", () => ({
  fetchMatieres: mocks.fetchMatieres,
  fetchNotes: mocks.fetchNotes,
  fetchTrimestres: mocks.fetchTrimestres,
  souscrireAuxMisesAJourNotes: mocks.souscrireAuxMisesAJourNotes,
}));

const NOTE_1 = {
  id: "n1",
  valeur: 14,
  coefficient: 1,
  typeEvaluation: "controle",
  dateEvaluation: "2025-01-10",
  commentaire: null,
  matiereId: "m1",
  trimestreId: "t1",
};

const NOTE_2 = {
  id: "n2",
  valeur: 16,
  coefficient: 2,
  typeEvaluation: "examen",
  dateEvaluation: "2025-02-11",
  commentaire: null,
  matiereId: "m2",
  trimestreId: "t2",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.fetchMatieres.mockResolvedValue([
    { id: "m1", nom: "Maths", code: null },
    { id: "m2", nom: "Physique", code: null },
  ]);
  mocks.fetchTrimestres.mockResolvedValue([
    { id: "t1", nom: "T1", dateDebut: null, dateFin: null },
    { id: "t2", nom: "T2", dateDebut: null, dateFin: null },
  ]);
});

afterEach(cleanup);

describe("ListeNotes", () => {
  it("affiche la liste des notes chargées", async () => {
    mocks.fetchNotes.mockResolvedValue([NOTE_1, NOTE_2]);
    render(<ListeNotes />);

    expect(await screen.findByText("controle")).toBeInTheDocument();
    expect(screen.getByText("examen")).toBeInTheDocument();

    expect(mocks.fetchNotes).toHaveBeenCalledTimes(1);
  });

  it("filtre par matière", async () => {
    mocks.fetchNotes.mockResolvedValue([NOTE_1]);
    render(<ListeNotes />);
    await screen.findByText("controle");

    fireEvent.change(screen.getByLabelText("Matière"), {
      target: { value: "m1" },
    });

    await waitFor(() =>
      expect(mocks.fetchNotes).toHaveBeenLastCalledWith({
        matiereId: "m1",
        trimestreId: undefined,
      }),
    );
  });

  it("filtre par trimestre", async () => {
    mocks.fetchNotes.mockResolvedValue([NOTE_1]);
    render(<ListeNotes />);
    await screen.findByText("controle");

    fireEvent.change(screen.getByLabelText("Trimestre"), {
      target: { value: "t2" },
    });

    await waitFor(() =>
      expect(mocks.fetchNotes).toHaveBeenLastCalledWith({
        matiereId: undefined,
        trimestreId: "t2",
      }),
    );
  });

  it("se rafraîchit via souscrireAuxMisesAJourNotes", async () => {
    mocks.fetchNotes
      .mockResolvedValueOnce([NOTE_1])
      .mockResolvedValue([NOTE_1, NOTE_2]);

    render(<ListeNotes />);
    await screen.findByText("controle");
    expect(screen.queryByText("examen")).not.toBeInTheDocument();
    expect(mocks.fetchNotes).toHaveBeenCalledTimes(1);
    expect(mocks.souscrireAuxMisesAJourNotes).toHaveBeenCalled();

    mocks.notifier();

    expect(await screen.findByText("examen")).toBeInTheDocument();
    expect(mocks.fetchNotes).toHaveBeenCalledTimes(2);
  });
});