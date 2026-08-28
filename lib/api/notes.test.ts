import { beforeEach, describe, expect, it, vi } from "vitest";

import { creerNote, fetchNotes } from "@/lib/api/notes";

const API_BASE_HTTP = "http://localhost:8000";

function reponseFetch(options: { ok: boolean; status: number; corps: unknown }) {
  return Promise.resolve({
    ok: options.ok,
    status: options.status,
    json: async () => options.corps,
  });
}

beforeEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("fetchNotes", () => {
  it("mappe la réponse API en NoteDetail et joint le jeton Supabase", async () => {
    const fetchMock = vi.fn().mockReturnValue(
      reponseFetch({
        ok: true,
        status: 200,
        corps: [
          {
            id: "n1",
            eleve_id: "e1",
            matiere_id: "m1",
            trimestre_id: "t1",
            valeur: 14,
            coefficient: 1,
            date_evaluation: "2025-01-10",
            type_evaluation: "controle",
            commentaire: null,
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const note = await fetchNotes();

    expect(note).toEqual([
      {
        id: "n1",
        valeur: 14,
        coefficient: 1,
        dateEvaluation: "2025-01-10",
        typeEvaluation: "controle",
        commentaire: null,
        matiereId: "m1",
        trimestreId: "t1",
      },
    ]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE_HTTP}/notes`);
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: "Bearer jeton-test",
      "Content-Type": "application/json",
    });
  });

  it("ajoute les filtres matière et trimestre à la requête", async () => {
    const fetchMock = vi
      .fn()
      .mockReturnValue(reponseFetch({ ok: true, status: 200, corps: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchNotes({ matiereId: "m1", trimestreId: "t2" });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE_HTTP}/notes?matiere_id=m1&trimestre_id=t2`);
  });

  it("lève une erreur typée au format {error:{code,message}}", async () => {
    const fetchMock = vi.fn().mockReturnValue(
      reponseFetch({
        ok: false,
        status: 400,
        corps: { error: { code: "validation", message: "Valeur invalide" } },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchNotes()).rejects.toThrow("Valeur invalide (validation)");
  });
});

describe("creerNote", () => {
  it("envoie un POST avec le corps attendu et mappe la réponse", async () => {
    const fetchMock = vi.fn().mockReturnValue(
      reponseFetch({
        ok: true,
        status: 200,
        corps: {
          id: "n1",
          eleve_id: "e1",
          matiere_id: "m1",
          trimestre_id: null,
          valeur: 15,
          coefficient: 1,
          date_evaluation: "2025-02-11",
          type_evaluation: "examen",
          commentaire: "bien",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const note = await creerNote({
      matiereId: "m1",
      trimestreId: null,
      valeur: 15,
      typeEvaluation: "examen",
      coefficient: 1,
      commentaire: "bien",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE_HTTP}/notes`);
    expect((init as RequestInit).method).toBe("POST");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      matiere_id: "m1",
      trimestre_id: null,
      valeur: 15,
      coefficient: 1,
      type_evaluation: "examen",
      commentaire: "bien",
    });
    expect(note.id).toBe("n1");
  });

  it("lève une erreur typée du backend à l'échec", async () => {
    const fetchMock = vi.fn().mockReturnValue(
      reponseFetch({
        ok: false,
        status: 422,
        corps: { error: { code: "contrainte", message: "Hors échelle" } },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      creerNote({
        matiereId: "m1",
        trimestreId: null,
        valeur: 30,
        typeEvaluation: "devoir",
        coefficient: 1,
        commentaire: null,
      }),
    ).rejects.toThrow("Hors échelle (contrainte)");
  });
});