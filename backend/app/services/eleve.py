"""Service métier : profil élève de l'utilisateur connecté.

Logique partagée par les routers ``classe``, ``note`` et ``trimestre`` :
résoudre le profil ``public.eleve`` à partir de l'id utilisateur du JWT
Supabase. Erreur 403 typée si aucun profil n'existe.
"""
from __future__ import annotations

from typing import Any

from app.core.errors import ForbiddenError
from app.db.rest_client import SupabaseRestClient


def get_profil_eleve(client: SupabaseRestClient, utilisateur_id: str) -> dict[str, Any]:
    """Renvoie la ligne ``eleve`` de l'utilisateur (``id``, ``classe_id``).

    :raises ForbiddenError: si l'utilisateur authentifié n'a pas de
        profil élève dans ``public.eleve``.
    """
    eleve = client.select_one(
        "eleve",
        columns="id,classe_id",
        filters={"utilisateur_id": utilisateur_id},
    )
    if eleve is None:
        raise ForbiddenError(
            "Aucun profil élève associé à l'utilisateur authentifié.",
            details={"utilisateur_id": utilisateur_id},
        )
    return eleve
