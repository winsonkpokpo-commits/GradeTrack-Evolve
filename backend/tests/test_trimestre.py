"""Tests du router Trimestre — lecture seule, limité à sa classe (Phase 3.2).

Rappel du choix validé : ``trimestre`` est rattaché à une classe (pas
un référentiel global) → GET /trimestres renvoie uniquement les
trimestres de la classe de l'élève connecté.
"""
from __future__ import annotations

from fastapi.testclient import TestClient

from tests.conftest import CLASSE_A, TRIMESTRE_A1_ID, TRIMESTRE_A2_ID, TRIMESTRE_B1_ID


def test_liste_des_trimestres_de_sa_classe(client_eleve_a: TestClient) -> None:
    response = client_eleve_a.get("/trimestres")

    assert response.status_code == 200
    corps = response.json()
    ids = [t["id"] for t in corps]
    assert set(ids) == {TRIMESTRE_A1_ID, TRIMESTRE_A2_ID}
    # Le trimestre d'une autre classe n'apparaît JAMAIS :
    assert TRIMESTRE_B1_ID not in ids


def test_structure_des_champs(client_eleve_a: TestClient) -> None:
    response = client_eleve_a.get("/trimestres")

    trimestre = response.json()[0]
    assert set(trimestre.keys()) == {"id", "classe_id", "nom", "date_debut", "date_fin"}
    assert trimestre["classe_id"] == CLASSE_A


def test_tri_chronologique(client_eleve_a: TestClient) -> None:
    response = client_eleve_a.get("/trimestres")

    dates = [t["date_debut"] for t in response.json()]
    assert dates == sorted(dates)


def test_eleve_b_ne_voit_que_sa_classe(client_eleve_b: TestClient) -> None:
    response = client_eleve_b.get("/trimestres")

    assert response.status_code == 200
    ids = [t["id"] for t in response.json()]
    assert ids == [TRIMESTRE_B1_ID]


def test_eleve_sans_classe_liste_vide(client_eleve_c: TestClient) -> None:
    """Un élève sans classe n'a aucun trimestre (pas d'erreur)."""
    response = client_eleve_c.get("/trimestres")

    assert response.status_code == 200
    assert response.json() == []


def test_trimestres_sans_jeton_401(app_anonyme: TestClient) -> None:
    response = app_anonyme.get("/trimestres")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"


def test_ecriture_non_exposee(client_eleve_a: TestClient) -> None:
    """Lecture seule : aucune route d'écriture n'est exposée côté élève."""
    # Le chemin /trimestres existe mais uniquement en GET :
    assert (
        client_eleve_a.post(
            "/trimestres", json={"nom": "T3", "classe_id": CLASSE_A}
        ).status_code
        == 405
    )
    # Aucune route /trimestres/{id} n'existe du tout :
    assert client_eleve_a.delete(f"/trimestres/{TRIMESTRE_A1_ID}").status_code == 404
