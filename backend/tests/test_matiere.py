"""Tests du router Matiere — GET /matieres (référentiel en lecture seule)."""
from __future__ import annotations

from fastapi.testclient import TestClient

from tests.conftest import MATIERES


def test_liste_complete_du_referentiel(client_eleve_a: TestClient) -> None:
    response = client_eleve_a.get("/matieres")

    assert response.status_code == 200
    corps = response.json()
    assert isinstance(corps, list)
    assert len(corps) == len(MATIERES)

    noms = [m["nom"] for m in corps]
    assert "Mathématiques" in noms
    assert "Français" in noms
    # Tri par nom attendu (order=nom.asc côté router).
    assert noms == sorted(noms)


def test_structure_des_champs_de_matiere(client_eleve_a: TestClient) -> None:
    response = client_eleve_a.get("/matieres")

    matiere = next(m for m in response.json() if m["code"] == "MATH")
    assert set(matiere.keys()) == {"id", "nom", "code", "description"}
    assert matiere["nom"] == "Mathématiques"
    assert matiere["description"] is None


def test_le_referentiel_est_identique_pour_tout_utilisateur_authentifie(
    client_eleve_b: TestClient,
) -> None:
    response = client_eleve_b.get("/matieres")

    assert response.status_code == 200
    assert len(response.json()) == len(MATIERES)


def test_liste_matieres_sans_jeton_401(app_anonyme: TestClient) -> None:
    """Lecture publique côté RLS, mais l'API exige un utilisateur authentifié."""
    response = app_anonyme.get("/matieres")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"
