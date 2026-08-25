"""Schémas Pydantic de l'entité Note (propriété de l'élève — CRUD complet)."""
from __future__ import annotations

from datetime import date
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

# ---------------------------------------------------------------- Constantes
# Plage de validité d'une note — alignée sur la contrainte PostgreSQL
# ``note_valeur_dans_echelle check (valeur >= 0 and valeur <= 20)``.
NOTE_VALEUR_MIN = 0.0
NOTE_VALEUR_MAX = 20.0

TypeEvaluation = Literal["devoir", "controle", "examen", "tp", "oral", "autre"]
# Aligné sur la contrainte DB ``note_type_valide``.


class NoteBase(BaseModel):
    """Champs communs à la création et à la lecture d'une note."""

    model_config = ConfigDict(extra="ignore")

    matiere_id: UUID
    trimestre_id: UUID | None = None  # nullable côté DB : note hors trimestre permise
    valeur: float = Field(..., ge=NOTE_VALEUR_MIN, le=NOTE_VALEUR_MAX)
    coefficient: float = Field(default=1.0, gt=0)
    date_evaluation: date = Field(default_factory=date.today)
    type_evaluation: TypeEvaluation = "devoir"
    commentaire: str | None = None


class NoteCreate(NoteBase):
    """Corps attendu pour POST /notes (l'élève est imposé côté serveur)."""


class NoteUpdate(BaseModel):
    """Corps attendu pour PATCH /notes/{id} — tous les champs optionnels.

    Utilisé avec ``model_dump(exclude_unset=True)`` : un champ absent
    n'est pas modifié ; ``trimestre_id: null`` explicite détache la note
    de tout trimestre.
    """

    model_config = ConfigDict(extra="ignore")

    matiere_id: UUID | None = None
    trimestre_id: UUID | None = None
    valeur: float | None = Field(default=None, ge=NOTE_VALEUR_MIN, le=NOTE_VALEUR_MAX)
    coefficient: float | None = Field(default=None, gt=0)
    date_evaluation: date | None = None
    type_evaluation: TypeEvaluation | None = None
    commentaire: str | None = None


class NoteRead(NoteBase):
    """Note telle que renvoyée par l'API (table ``public.note``)."""

    id: UUID
    eleve_id: UUID
    saisie_par_utilisateur_id: UUID | None = None
