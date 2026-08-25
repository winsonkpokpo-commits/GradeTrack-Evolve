"""Schémas Pydantic de l'entité Matiere (référentiel global, lecture seule)."""
from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, ConfigDict


class MatiereRead(BaseModel):
    """Matière du référentiel public (table ``public.matiere``)."""

    model_config = ConfigDict(extra="ignore")

    id: UUID
    nom: str
    code: str | None = None
    description: str | None = None
