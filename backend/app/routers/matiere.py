"""Router Matiere — lecture seule du référentiel global (Phase 3.1).

``matiere`` est un référentiel partagé (policy RLS ``matiere_select``
en lecture publique) : tout utilisateur authentifié peut lister les
matières. Aucune écriture ici — le CRUD complet appartient à la
Phase 7 (admin système).
"""
from __future__ import annotations

from fastapi import APIRouter

from app.dependencies.auth import DataClient
from app.schemas.matiere import MatiereRead

router = APIRouter(prefix="/matieres", tags=["matieres"])


@router.get("", response_model=list[MatiereRead], summary="Lister le référentiel des matières")
def list_matieres(client: DataClient) -> list[MatiereRead]:
    """Renvoie l'intégralité du référentiel des matières, triée par nom."""
    lignes = client.select_many(
        "matiere",
        columns="id,nom,code,description",
        order="nom.asc",
    )
    return [MatiereRead.model_validate(ligne) for ligne in lignes]
