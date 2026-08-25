"""Tests du router Note — CRUD complet, propriété de l'élève (Phase 3.2).

Cas exigés par l'étape :
- note avec matière inexistante → 404 typé ;
- note avec trimestre inexistant → 404 typé (et trimestre d'une autre
  classe → 403 typé) ;
- 403 quand l'élève A touche à une note de l'élève B.
"""
from __future__ import annotations

from fastapi.testclient import TestClient

from tests.conftest import (
    MATIERE_FRA_ID,
    MATIERE_MATHS_ID,
    NOTE_A1_ID,
    NOTE_B1_ID,
    TRIMESTRE_A2_ID,
    TRIMESTRE_B1_ID,
    UTILISATEUR_A,
)


# --------------------------------------------------------------------- Lecture


def test_liste_ses_propres_notes(client_eleve_a: TestClient) -> None:
    response = client_eleve_a.get("/notes")

    assert response.status_code == 200
    corps = response.json()
    assert len(corps) == 1
    assert corps[0]["id"] == NOTE_A1_ID
    assert corps[0]["valeur"] == 14.5


def test_detail_d_une_note(client_eleve_a: TestClient) -> None:
    response = client_eleve_a.get(f"/notes/{NOTE_A1_ID}")

    assert response.status_code == 200
    corps = response.json()
    assert set(corps.keys()) == {
        "id",
        "eleve_id",
        "matiere_id",
        "trimestre_id",
        "valeur",
        "coefficient",
        "date_evaluation",
        "type_evaluation",
        "commentaire",
        "saisie_par_utilisateur_id",
    }
    assert corps["type_evaluation"] == "controle"


def test_note_de_l_eleve_b_consultee_par_a_403(client_eleve_a: TestClient) -> None:
    """Cas demandé : élève A → note de l'élève B ⇒ 403 typé."""
    response = client_eleve_a.get(f"/notes/{NOTE_B1_ID}")

    assert response.status_code == 403
    erreur = response.json()["error"]
    assert erreur["code"] == "forbidden"
    assert "vos propres notes" in erreur["message"]


def test_note_inexistante_404(client_eleve_a: TestClient) -> None:
    response = client_eleve_a.get("/notes/cccccccc-cccc-cccc-cccc-000000000009")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


# -------------------------------------------------------------------- Création


def test_creation_avec_trimestre_de_sa_classe(client_eleve_a: TestClient) -> None:
    payload = {
        "matiere_id": MATIERE_MATHS_ID,
        "trimestre_id": TRIMESTRE_A2_ID,
        "valeur": 16,
        "coefficient": 1.5,
        "type_evaluation": "oral",
    }
    response = client_eleve_a.post("/notes", json=payload)

    assert response.status_code == 201
    corps = response.json()
    assert corps["valeur"] == 16.0
    assert corps["type_evaluation"] == "oral"
    # L'élève et le saisisseur sont imposés côté serveur :
    assert corps["saisie_par_utilisateur_id"] == UTILISATEUR_A

    ids = [n["id"] for n in client_eleve_a.get("/notes").json()]
    assert corps["id"] in ids


def test_creation_sans_trimestre_autorisee(client_eleve_a: TestClient) -> None:
    """``trimestre_id`` est nullable côté schéma : une note hors trimestre est valide."""
    payload = {"matiere_id": MATIERE_FRA_ID, "valeur": 8}
    response = client_eleve_a.post("/notes", json=payload)

    assert response.status_code == 201
    assert response.json()["trimestre_id"] is None


def test_creation_matiere_inexistante_404(client_eleve_a: TestClient) -> None:
    payload = {
        "matiere_id": "dddddddd-dddd-dddd-dddd-000000000009",
        "valeur": 10,
    }
    response = client_eleve_a.post("/notes", json=payload)

    assert response.status_code == 404
    erreur = response.json()["error"]
    assert erreur["code"] == "not_found"
    assert "Matière" in erreur["message"]


def test_creation_trimestre_inexistant_404(client_eleve_a: TestClient) -> None:
    payload = {
        "matiere_id": MATIERE_MATHS_ID,
        "trimestre_id": "eeeeeeee-eeee-eeee-eeee-000000000009",
        "valeur": 10,
    }
    response = client_eleve_a.post("/notes", json=payload)

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


def test_creation_trimestre_d_une_autre_classe_403(client_eleve_a: TestClient) -> None:
    payload = {
        "matiere_id": MATIERE_MATHS_ID,
        "trimestre_id": TRIMESTRE_B1_ID,  # trimestre de la classe B
        "valeur": 10,
    }
    response = client_eleve_a.post("/notes", json=payload)

    assert response.status_code == 403
    erreur = response.json()["error"]
    assert erreur["code"] == "forbidden"
    assert "n'appartient pas à votre classe" in erreur["message"]


# ------------------------------------------------------------------ Validation


def test_valeur_hors_plage_422(client_eleve_a: TestClient) -> None:
    for valeur in (-1, 20.01):
        payload = {"matiere_id": MATIERE_MATHS_ID, "valeur": valeur}
        assert client_eleve_a.post("/notes", json=payload).status_code == 422


def test_type_evaluation_invalide_422(client_eleve_a: TestClient) -> None:
    payload = {
        "matiere_id": MATIERE_MATHS_ID,
        "valeur": 10,
        "type_evaluation": "interro-surprise",
    }
    assert client_eleve_a.post("/notes", json=payload).status_code == 422


def test_coefficient_negatif_422(client_eleve_a: TestClient) -> None:
    payload = {"matiere_id": MATIERE_MATHS_ID, "valeur": 10, "coefficient": -2}
    assert client_eleve_a.post("/notes", json=payload).status_code == 422


# ---------------------------------------------------------------- Modification


def test_modification_partielle(client_eleve_a: TestClient) -> None:
    response = client_eleve_a.patch(f"/notes/{NOTE_A1_ID}", json={"valeur": 17.25})

    assert response.status_code == 200
    corps = response.json()
    assert corps["valeur"] == 17.25
    assert corps["type_evaluation"] == "controle"  # champ non touché : inchangé


def test_detacher_le_trimestre_via_null_explicite(client_eleve_a: TestClient) -> None:
    response = client_eleve_a.patch(f"/notes/{NOTE_A1_ID}", json={"trimestre_id": None})

    assert response.status_code == 200
    assert response.json()["trimestre_id"] is None


def test_modifier_la_note_de_b_par_a_403(client_eleve_a: TestClient) -> None:
    assert client_eleve_a.patch(f"/notes/{NOTE_B1_ID}", json={"valeur": 0}).status_code == 403


# ---------------------------------------------------------------- Suppression


def test_suppression_de_sa_note(client_eleve_a: TestClient) -> None:
    response = client_eleve_a.delete(f"/notes/{NOTE_A1_ID}")

    assert response.status_code == 204
    assert client_eleve_a.get(f"/notes/{NOTE_A1_ID}").status_code == 404


def test_supprimer_la_note_de_b_par_a_403(
    client_eleve_a: TestClient, client_eleve_b: TestClient
) -> None:
    assert client_eleve_a.delete(f"/notes/{NOTE_B1_ID}").status_code == 403
    # La note de B existe toujours :
    assert client_eleve_b.get(f"/notes/{NOTE_B1_ID}").status_code == 200


# -------------------------------------------------------------------- Sécurité


def test_notes_sans_jeton_401(app_anonyme: TestClient) -> None:
    assert app_anonyme.get("/notes").status_code == 401
    payload = {"matiere_id": MATIERE_MATHS_ID, "valeur": 10}
    assert app_anonyme.post("/notes", json=payload).status_code == 401
