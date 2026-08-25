"""Router Trimestre — lecture seule, limité à la classe de l'élève (Phase 3.2).

``trimestre`` est rattaché à une classe (pas un référentiel global) :
l'écriture est réservée à l'école via la RLS
(``can_manage_establishment``). L'élève ne peut donc que CONSULTER les
trimestres de SA propre classe.
"""
from __future__ import annotations

from fastapi import APIRouter

from app.dependencies.auth import CurrentUserId, DataClient
from app.schemas.trimestre import TrimestreRead
from app.services.eleve import get_profil_eleve

router = APIRouter(prefix="/trimestres", tags=["trimestres"])

_TRIMESTRE_COLUMNS = "id,classe_id,nom,date_debut,date_fin"


@router.get("", response_model=list[TrimestreRead], summary="Lister les trimestres de sa classe")
def list_trimestres(client: DataClient, current_user_id: CurrentUserId) -> list[TrimestreRead]:
    """Trimestres de la classe de l'élève connecté (liste vide s'il n'a pas de classe)."""
    eleve = get_profil_eleve(client, current_user_id)
    ma_classe_id = eleve.get("classe_id")
    if ma_classe_id is None:
        return []

    lignes = client.select_many(
        "trimestre",
        columns=_TRIMESTRE_COLUMNS,
        order="date_debut.asc",
        filters={"classe_id": str(ma_classe_id)},
    )
    return [TrimestreRead.model_validate(ligne) for ligne in lignes]
