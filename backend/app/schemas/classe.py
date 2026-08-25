"""Schémas Pydantic de l'entité Classe (lecture seule côté élève)."""
from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ClasseRead(BaseModel):
    """Classe d'un établissement (table ``public.classe``)."""

    model_config = ConfigDict(extra="ignore")

    id: UUID
    etablissement_id: UUID
    nom: str
    niveau: str
    annee_scolaire: str | None = None
