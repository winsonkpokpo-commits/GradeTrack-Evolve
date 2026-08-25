"""Fixtures pytest : application de test, faux client Supabase, données de scénario.

Aucun appel réseau : le client PostgREST est remplacé par un double
en mémoire, la dépendance d'authentification est surchargée.
"""
from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

# Rend le paquet ``app`` importable quand pytest est lancé depuis la racine.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.dependencies.auth import get_current_user_id, get_data_client  # noqa: E402
from app.main import create_app  # noqa: E402

# --------------------------------------------------------------------- Données

UTILISATEUR_A = "11111111-1111-1111-1111-111111111111"  # élève A
UTILISATEUR_B = "22222222-2222-2222-2222-222222222222"  # élève B

ETABLISSEMENT = "33333333-3333-3333-3333-333333333333"
CLASSE_A = "44444444-4444-4444-4444-444444444444"  # classe de l'élève A
CLASSE_B = "55555555-5555-5555-5555-555555555555"  # classe de l'élève B

MATIERES = [
    {
        "id": "66666666-6666-6666-6666-000000000001",
        "nom": "Français",
        "code": "FRA",
        "description": "Lettres et langue française.",
    },
    {
        "id": "66666666-6666-6666-6666-000000000002",
        "nom": "Mathématiques",
        "code": "MATH",
        "description": None,
    },
]

CLASSES = [
    {
        "id": CLASSE_A,
        "etablissement_id": ETABLISSEMENT,
        "nom": "3ème A",
        "niveau": "3ème",
        "annee_scolaire": "2025-2026",
    },
    {
        "id": CLASSE_B,
        "etablissement_id": ETABLISSEMENT,
        "nom": "4ème B",
        "niveau": "4ème",
        "annee_scolaire": "2025-2026",
    },
]

ELEVE_A_ID = "77777777-7777-7777-7777-00000000000a"
ELEVE_B_ID = "77777777-7777-7777-7777-00000000000b"
UTILISATEUR_C = "99999999-9999-9999-9999-99999999999c"  # élève sans classe

MATIERE_MATHS_ID = MATIERES[1]["id"]
MATIERE_FRA_ID = MATIERES[0]["id"]

TRIMESTRE_A1_ID = "88888888-8888-8888-8888-000000000001"
TRIMESTRE_A2_ID = "88888888-8888-8888-8888-000000000002"
TRIMESTRE_B1_ID = "88888888-8888-8888-8888-000000000003"

TRIMESTRES = [
    {
        "id": TRIMESTRE_A1_ID,
        "classe_id": CLASSE_A,
        "nom": "Trimestre 1",
        "date_debut": "2025-09-01",
        "date_fin": "2025-11-30",
    },
    {
        "id": TRIMESTRE_A2_ID,
        "classe_id": CLASSE_A,
        "nom": "Trimestre 2",
        "date_debut": "2025-12-01",
        "date_fin": "2026-02-28",
    },
    {
        "id": TRIMESTRE_B1_ID,
        "classe_id": CLASSE_B,
        "nom": "Trimestre 1",
        "date_debut": "2025-09-01",
        "date_fin": "2025-11-30",
    },
]

NOTE_A1_ID = "aaaaaaaa-aaaa-aaaa-aaaa-000000000001"
NOTE_B1_ID = "bbbbbbbb-bbbb-bbbb-bbbb-000000000001"

NOTES = [
    {
        "id": NOTE_A1_ID,
        "eleve_id": ELEVE_A_ID,
        "matiere_id": MATIERE_MATHS_ID,
        "trimestre_id": TRIMESTRE_A1_ID,
        "valeur": 14.5,
        "coefficient": 2.0,
        "date_evaluation": "2025-10-10",
        "type_evaluation": "controle",
        "commentaire": None,
        "saisie_par_utilisateur_id": UTILISATEUR_A,
    },
    {
        "id": NOTE_B1_ID,
        "eleve_id": ELEVE_B_ID,
        "matiere_id": MATIERE_FRA_ID,
        "trimestre_id": TRIMESTRE_B1_ID,
        "valeur": 12.0,
        "coefficient": 1.0,
        "date_evaluation": "2025-09-20",
        "type_evaluation": "devoir",
        "commentaire": "Peut mieux faire.",
        "saisie_par_utilisateur_id": UTILISATEUR_B,
    },
]

ELEVES = [
    {"id": ELEVE_A_ID, "utilisateur_id": UTILISATEUR_A, "classe_id": CLASSE_A},
    {"id": ELEVE_B_ID, "utilisateur_id": UTILISATEUR_B, "classe_id": CLASSE_B},
    {"id": "77777777-7777-7777-7777-00000000000c", "utilisateur_id": UTILISATEUR_C, "classe_id": None},
]


# ------------------------------------------------------------------ Double DB

class FakeSupabaseClient:
    """Double en mémoire de ``SupabaseRestClient`` (mêmes signatures)."""

    def __init__(self, tables: dict[str, list[dict[str, Any]]]) -> None:
        self._tables = tables

    def select_many(
        self,
        table: str,
        *,
        columns: str = "*",
        order: str | None = None,
        filters: dict[str, str] | None = None,
    ) -> list[dict[str, Any]]:
        lignes = self._tables.get(table, [])
        for colonne, valeur in (filters or {}).items():
            lignes = [l for l in lignes if str(l.get(colonne)) == str(valeur)]
        if order:
            colonne_ordre = order.split(".")[0]
            lignes = sorted(lignes, key=lambda l: str(l.get(colonne_ordre, "")))
        return [dict(ligne) for ligne in lignes]

    def select_one(
        self,
        table: str,
        *,
        columns: str = "*",
        filters: dict[str, str],
    ) -> dict[str, Any] | None:
        lignes = self.select_many(table, columns=columns, filters=filters)
        return lignes[0] if lignes else None

    # ------------------------------------------------------------ ÉCRITURE

    def insert_one(self, table: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Insère une ligne (id généré si absent) et la renvoie."""
        import uuid

        ligne = dict(payload)
        ligne.setdefault("id", str(uuid.uuid4()))
        self._tables.setdefault(table, []).append(ligne)
        return dict(ligne)

    def update_rows(
        self,
        table: str,
        payload: dict[str, Any],
        *,
        filters: dict[str, str],
    ) -> list[dict[str, Any]]:
        """Met à jour les lignes correspondant aux filtres et les renvoie."""
        mises_a_jour: list[dict[str, Any]] = []
        for ligne in self._tables.get(table, []):
            if all(str(ligne.get(c)) == str(v) for c, v in filters.items()):
                ligne.update(payload)
                mises_a_jour.append(dict(ligne))
        return mises_a_jour

    def delete_rows(self, table: str, *, filters: dict[str, str]) -> None:
        """Supprime les lignes correspondant aux filtres."""
        restantes = [
            ligne
            for ligne in self._tables.get(table, [])
            if not all(str(ligne.get(c)) == str(v) for c, v in filters.items())
        ]
        self._tables[table] = restantes


# -------------------------------------------------------------------- Fixtures


def _construire_app(pour_utilisateur: str) -> TestClient:
    """App de test connectée en tant que ``pour_utilisateur``, sans réseau."""
    application = create_app()
    fake_db = FakeSupabaseClient(
        {
            "matiere": MATIERES,
            "classe": CLASSES,
            "eleve": ELEVES,
            "trimestre": TRIMESTRES,
            "note": NOTES,
        }
    )
    application.dependency_overrides[get_current_user_id] = lambda: pour_utilisateur
    application.dependency_overrides[get_data_client] = lambda: fake_db
    return TestClient(application)


@pytest.fixture()
def client_eleve_a() -> TestClient:
    """HTTP client authentifié comme l'élève A."""
    return _construire_app(UTILISATEUR_A)


@pytest.fixture()
def client_eleve_b() -> TestClient:
    """HTTP client authentifié comme l'élève B."""
    return _construire_app(UTILISATEUR_B)


@pytest.fixture()
def client_eleve_c() -> TestClient:
    """HTTP client authentifié comme l'élève C (profil sans classe)."""
    return _construire_app(UTILISATEUR_C)


@pytest.fixture()
def client_anonyme(app_anonyme: TestClient) -> TestClient:
    return app_anonyme


@pytest.fixture()
def app_anonyme(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    """HTTP client sans jeton (dépendance d'auth active → 401 attendu)."""
    monkeypatch.setenv("NEXT_PUBLIC_SUPABASE_URL", "https://fake.supabase.co")
    monkeypatch.setenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "cle-anon-de-test")
    application = create_app()  # aucune override : la dépendance réelle renvoie 401
    return TestClient(application)
