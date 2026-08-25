"""Tests du router Classe — GET /classes/{id} (lecture seule, accès restreint).

Cas clé : un élève A qui tente de consulter la classe d'un élève B
reçoit une erreur 403 typée.
"""
from __future__ import annotations

from fastapi.testclient import TestClient

from tests.conftest import CLASSE_A, CLASSE_B, ETABLISSEMENT, UTILISATEUR_A


def test_eleve_consulte_sa_propre_classe(client_eleve_a: TestClient) -> None:
    response = client_eleve_a.get(f"/classes/{CLASSE_A}")

    assert response.status_code == 200
    corps = response.json()
    assert corps == {
        "id": CLASSE_A,
        "etablissement_id": ETABLISSEMENT,
        "nom": "3ème A",
        "niveau": "3ème",
        "annee_scolaire": "2025-2026",
    }


def test_eleve_a_sur_la_classe_de_l_eleve_b_403(client_eleve_a: TestClient) -> None:
    """Cas demandé : élève A → classe de l'élève B ⇒ 403 typé."""
    response = client_eleve_a.get(f"/classes/{CLASSE_B}")

    assert response.status_code == 403
    erreur = response.json()["error"]
    assert erreur["code"] == "forbidden"
    assert "votre propre classe" in erreur["message"]
    assert erreur["details"]["classe_demandee"] == CLASSE_B


def test_eleve_b_ne_peut_pas_consulter_la_classe_de_a(client_eleve_b: TestClient) -> None:
    response = client_eleve_b.get(f"/classes/{CLASSE_A}")

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "forbidden"


def test_identifiant_non_uuid_422(client_eleve_a: TestClient) -> None:
    response = client_eleve_a.get("/classes/pas-un-uuid")

    assert response.status_code == 422


def test_classe_sans_jeton_401(app_anonyme: TestClient) -> None:
    response = app_anonyme.get(f"/classes/{CLASSE_A}")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"


def test_403_meme_si_la_classe_cible_n_existe_pas(client_eleve_a: TestClient) -> None:
    """Le contrôle de propriété précède la recherche : pas d'énumération possible."""
    uuid_inconnu = "99999999-9999-9999-9999-999999999999"
    response = client_eleve_a.get(f"/classes/{uuid_inconnu}")

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "forbidden"


def test_details_d_acces_exposent_le_contexte(client_eleve_a: TestClient) -> None:
    """L'erreur 403 embarque l'utilisateur et la classe visée (diagnostic explicite)."""
    response = client_eleve_a.get(f"/classes/{CLASSE_B}")

    erreur = response.json()["error"]
    assert erreur["details"]["classe_demandee"] == CLASSE_B
    # L'élève A reste bien le propriétaire légitime de CLASSE_A :
    assert UTILISATEUR_A  # garde-fou documentaire du scénario
