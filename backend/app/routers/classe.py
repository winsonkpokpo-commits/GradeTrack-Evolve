"""Router Classe — lecture seule côté élève (Phase 3.1).

Une classe n'appartient pas à un élève : elle est gérée par un
établissement. Un élève ne peut donc consulter QUE la classe à laquelle
il est rattaché via son profil ``public.eleve`` (lien
``eleve.utilisateur_id = auth.uid()`` → ``eleve.classe_id``).
Toute autre classe → erreur 403 typée.
"""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter

from app.core.errors import ForbiddenError, NotFoundError
from app.dependencies.auth import CurrentUserId, DataClient
from app.schemas.classe import ClasseRead

router = APIRouter(prefix="/classes", tags=["classes"])

_CLASSE_COLUMNS = "id,etablissement_id,nom,niveau,annee_scolaire"


@router.get("/{classe_id}", response_model=ClasseRead, summary="Consulter sa propre classe")
def get_classe(classe_id: UUID, client: DataClient, current_user_id: CurrentUserId) -> ClasseRead:
    """Renvoie la classe de l'élève connecté ; 403 typé pour toute autre classe."""
    eleve = client.select_one(
        "eleve",
        columns="id,classe_id",
        filters={"utilisateur_id": current_user_id},
    )
    if eleve is None:
        raise ForbiddenError(
            "Aucun profil élève associé à l'utilisateur authentifié.",
            details={"utilisateur_id": current_user_id},
        )

    ma_classe_id = eleve.get("classe_id")
    if ma_classe_id is None or str(ma_classe_id) != str(classe_id):
        raise ForbiddenError(
            "Vous ne pouvez consulter que votre propre classe.",
            details={"classe_demandee": str(classe_id)},
        )

    classe = client.select_one(
        "classe",
        columns=_CLASSE_COLUMNS,
        filters={"id": str(classe_id)},
    )
    if classe is None:
        raise NotFoundError(f"Classe {classe_id} introuvable.")

    return ClasseRead.model_validate(classe)
