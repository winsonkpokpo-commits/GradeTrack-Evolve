"""Router Note — CRUD complet, l'élève est propriétaire (Phase 3.2).

Une note appartient à l'élève connecté (``note.eleve_id``, résolu via
``eleve.utilisateur_id = auth.uid()``). Toute note d'un autre élève
renvoie une erreur 403 typée.

Validations applicatives (en complément des contraintes PostgreSQL) :
- ``valeur`` dans la plage [NOTE_VALEUR_MIN, NOTE_VALEUR_MAX] (0-20) ;
- ``matiere_id`` doit exister dans le référentiel (404 typé sinon) ;
- ``trimestre_id``, s'il est fourni, doit exister ET appartenir à la
  classe de l'élève (404 / 403 typés).
"""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter

from app.core.errors import ForbiddenError, NotFoundError
from app.dependencies.auth import CurrentUserId, DataClient
from app.schemas.note import NoteCreate, NoteRead, NoteUpdate
from app.services.eleve import get_profil_eleve

router = APIRouter(prefix="/notes", tags=["notes"])

_NOTE_COLUMNS = (
    "id,eleve_id,matiere_id,trimestre_id,valeur,coefficient,"
    "date_evaluation,type_evaluation,commentaire,saisie_par_utilisateur_id"
)


# --------------------------------------------------------------------- Helpers


def _valider_matiere(client: DataClient, matiere_id: UUID) -> None:
    """La matière doit exister dans le référentiel global (404 typé sinon)."""
    if client.select_one("matiere", columns="id", filters={"id": str(matiere_id)}) is None:
        raise NotFoundError(f"Matière {matiere_id} introuvable.")


def _valider_trimestre(client: DataClient, trimestre_id: UUID, eleve: dict) -> None:
    """Le trimestre doit exister et appartenir à la classe de l'élève."""
    trimestre = client.select_one(
        "trimestre",
        columns="id,classe_id",
        filters={"id": str(trimestre_id)},
    )
    if trimestre is None:
        raise NotFoundError(f"Trimestre {trimestre_id} introuvable.")
    ma_classe_id = eleve.get("classe_id")
    if ma_classe_id is None or str(trimestre["classe_id"]) != str(ma_classe_id):
        raise ForbiddenError(
            "Ce trimestre n'appartient pas à votre classe.",
            details={
                "trimestre_id": str(trimestre_id),
                "classe_attendue": str(ma_classe_id),
            },
        )


def _note_ou_erreur(client: DataClient, eleve: dict, note_id: UUID) -> dict:
    """Charge une note ; 404 si inexistante, 403 typé si elle appartient à un autre élève."""
    note = client.select_one("note", columns=_NOTE_COLUMNS, filters={"id": str(note_id)})
    if note is None:
        raise NotFoundError(f"Note {note_id} introuvable.")
    if str(note["eleve_id"]) != str(eleve["id"]):
        raise ForbiddenError(
            "Vous ne pouvez accéder qu'à vos propres notes.",
            details={"note_id": str(note_id)},
        )
    return note


# ---------------------------------------------------------------------- Routes


@router.get("", response_model=list[NoteRead], summary="Lister ses notes")
def list_notes(
    client: DataClient,
    current_user_id: CurrentUserId,
    matiere_id: UUID | None = None,
    trimestre_id: UUID | None = None,
) -> list[NoteRead]:
    """Notes de l'élève connecté, triées par date décroissante, filtres optionnels."""
    eleve = get_profil_eleve(client, current_user_id)
    filters = {"eleve_id": str(eleve["id"])}
    if matiere_id is not None:
        filters["matiere_id"] = str(matiere_id)
    if trimestre_id is not None:
        filters["trimestre_id"] = str(trimestre_id)

    lignes = client.select_many(
        "note",
        columns=_NOTE_COLUMNS,
        order="date_evaluation.desc",
        filters=filters,
    )
    return [NoteRead.model_validate(ligne) for ligne in lignes]


@router.get("/{note_id}", response_model=NoteRead, summary="Consulter sa note")
def get_note(note_id: UUID, client: DataClient, current_user_id: CurrentUserId) -> NoteRead:
    eleve = get_profil_eleve(client, current_user_id)
    note = _note_ou_erreur(client, eleve, note_id)
    return NoteRead.model_validate(note)


@router.post("", response_model=NoteRead, status_code=201, summary="Créer une note")
def create_note(
    donnees: NoteCreate,
    client: DataClient,
    current_user_id: CurrentUserId,
) -> NoteRead:
    eleve = get_profil_eleve(client, current_user_id)
    _valider_matiere(client, donnees.matiere_id)
    if donnees.trimestre_id is not None:
        _valider_trimestre(client, donnees.trimestre_id, eleve)

    payload = donnees.model_dump(mode="json") | {
        "eleve_id": str(eleve["id"]),
        "saisie_par_utilisateur_id": current_user_id,
    }
    ligne = client.insert_one("note", payload)
    return NoteRead.model_validate(ligne)


@router.patch("/{note_id}", response_model=NoteRead, summary="Modifier sa note (partiel)")
def update_note(
    note_id: UUID,
    donnees: NoteUpdate,
    client: DataClient,
    current_user_id: CurrentUserId,
) -> NoteRead:
    eleve = get_profil_eleve(client, current_user_id)
    _note_ou_erreur(client, eleve, note_id)

    champs = donnees.model_dump(exclude_unset=True, mode="json")
    if champs.get("matiere_id") is not None:
        _valider_matiere(client, champs["matiere_id"])
    if champs.get("trimestre_id") is not None:
        _valider_trimestre(client, champs["trimestre_id"], eleve)
    if not champs:
        # Rien à modifier : renvoyer l'état actuel sans requête d'écriture.
        note = client.select_one("note", columns=_NOTE_COLUMNS, filters={"id": str(note_id)})
        return NoteRead.model_validate(note)  # type: ignore[arg-type]

    updated = client.update_rows("note", champs, filters={"id": str(note_id)})
    return NoteRead.model_validate(updated[0])


@router.delete("/{note_id}", status_code=204, summary="Supprimer sa note")
def delete_note(note_id: UUID, client: DataClient, current_user_id: CurrentUserId) -> None:
    eleve = get_profil_eleve(client, current_user_id)
    _note_ou_erreur(client, eleve, note_id)
    client.delete_rows("note", filters={"id": str(note_id)})
