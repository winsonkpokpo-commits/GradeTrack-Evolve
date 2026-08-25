"""Schémas Pydantic de l'entité Trimestre (lecture seule côté élève).

``trimestre`` n'est PAS un référentiel global : il est rattaché à une
classe (``classe_id not null``, cf. migration 0001). L'écriture est
réservée à l'école (policy RLS ``can_manage_establishment``) — d'où un
endpoint en lecture seule ici.
"""
from __future__ import annotations

from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class TrimestreRead(BaseModel):
    """Trimestre d'une classe (table ``public.trimestre``)."""

    model_config = ConfigDict(extra="ignore")

    id: UUID
    classe_id: UUID
    nom: str
    date_debut: date | None = None
    date_fin: date | None = None
