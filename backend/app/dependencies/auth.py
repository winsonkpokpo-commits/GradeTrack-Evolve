"""Dépendances FastAPI : authentification Supabase et accès données.

Principe : le JWT porté par l'en-tête ``Authorization: Bearer ...`` est
validé auprès de Supabase Auth, puis transmis tel quel à PostgREST afin
que les policies RLS s'appliquent sur chaque requête.
"""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import Settings, get_settings
from app.core.errors import UnauthorizedError
from app.db.rest_client import SupabaseRestClient

_bearer_scheme = HTTPBearer(auto_error=False)


def get_access_token(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
) -> str:
    """Extrait le jeton brut de l'en-tête Bearer (401 typé si absent)."""
    if credentials is None:
        raise UnauthorizedError("Jeton d'authentification manquant (Authorization: Bearer).")
    return credentials.credentials


def get_current_user_id(
    access_token: Annotated[str, Depends(get_access_token)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> str:
    """Valide le JWT auprès de Supabase Auth et renvoie l'``id`` utilisateur."""
    client = SupabaseRestClient(settings.supabase_url, settings.supabase_anon_key, access_token)
    user = client.get_authenticated_user()
    return str(user["id"])


def get_data_client(
    access_token: Annotated[str, Depends(get_access_token)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> SupabaseRestClient:
    """Client PostgREST portant le JWT de l'utilisateur (RLS active)."""
    return SupabaseRestClient(settings.supabase_url, settings.supabase_anon_key, access_token)


CurrentUserId = Annotated[str, Depends(get_current_user_id)]
DataClient = Annotated[SupabaseRestClient, Depends(get_data_client)]
