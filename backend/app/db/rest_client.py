"""Couche d'accès données : client REST Supabase (PostgREST) minimal et typé.

Le jeton porté par la requête est transmis tel quel à PostgREST : les
policies RLS s'appliquent donc systématiquement (aucune requête ne
contourne la sécurité, cf. règles non négociables du projet).
"""
from __future__ import annotations

from typing import Any

import httpx

from app.core.errors import UnauthorizedError, UpstreamError

_TIMEOUT_SECONDS = 10.0


class SupabaseRestClient:
    """Client HTTP PostgREST authentifié par le JWT de l'utilisateur courant."""

    def __init__(self, base_url: str, anon_key: str, access_token: str) -> None:
        self._base_url = base_url.rstrip("/")
        self._headers: dict[str, str] = {
            "apikey": anon_key,
            "Authorization": f"Bearer {access_token}",
        }

    # ------------------------------------------------------------------ SELECT

    def select_many(
        self,
        table: str,
        *,
        columns: str = "*",
        order: str | None = None,
        filters: dict[str, str] | None = None,
    ) -> list[dict[str, Any]]:
        """Liste des lignes de ``table`` après filtres PostgREST (``col=eq.valeur``)."""
        params: dict[str, str] = {"select": columns}
        if order:
            params["order"] = order
        for column, value in (filters or {}).items():
            params[column] = f"eq.{value}"

        response = httpx.get(
            f"{self._base_url}/rest/v1/{table}",
            params=params,
            headers=self._headers,
            timeout=_TIMEOUT_SECONDS,
        )
        _raise_for_status(response, table)
        return response.json()

    def select_one(
        self,
        table: str,
        *,
        columns: str = "*",
        filters: dict[str, str],
    ) -> dict[str, Any] | None:
        """Première ligne correspondant aux filtres, ou ``None`` si aucune."""
        rows = self.select_many(table, columns=columns, filters=filters)
        return rows[0] if rows else None

    # ------------------------------------------------------------------ WRITE

    _REPRESENTATION_HEADERS = {"Prefer": "return=representation"}

    def insert_one(self, table: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Insère une ligne et renvoie la ligne créée telle qu'enregistrée."""
        response = httpx.post(
            f"{self._base_url}/rest/v1/{table}",
            json=payload,
            params={"select": "*"},
            headers={**self._headers, **self._REPRESENTATION_HEADERS},
            timeout=_TIMEOUT_SECONDS,
        )
        _raise_for_status(response, table)
        return response.json()[0]

    def update_rows(
        self,
        table: str,
        payload: dict[str, Any],
        *,
        filters: dict[str, str],
    ) -> list[dict[str, Any]]:
        """Met à jour (PATCH) les lignes correspondant aux filtres, les renvoie."""
        params: dict[str, str] = {"select": "*"}
        for column, value in filters.items():
            params[column] = f"eq.{value}"
        response = httpx.patch(
            f"{self._base_url}/rest/v1/{table}",
            json=payload,
            params=params,
            headers={**self._headers, **self._REPRESENTATION_HEADERS},
            timeout=_TIMEOUT_SECONDS,
        )
        _raise_for_status(response, table)
        return response.json()

    def delete_rows(self, table: str, *, filters: dict[str, str]) -> None:
        """Supprime les lignes correspondant aux filtres."""
        params: dict[str, str] = {}
        for column, value in filters.items():
            params[column] = f"eq.{value}"
        response = httpx.delete(
            f"{self._base_url}/rest/v1/{table}",
            params=params,
            headers=self._headers,
            timeout=_TIMEOUT_SECONDS,
        )
        _raise_for_status(response, table)

    # ------------------------------------------------------------------ AUTH

    def get_authenticated_user(self) -> dict[str, Any]:
        """Valide le JWT auprès de Supabase Auth et renvoie le profil utilisateur."""
        response = httpx.get(
            f"{self._base_url}/auth/v1/user",
            headers=self._headers,
            timeout=_TIMEOUT_SECONDS,
        )
        if response.status_code == 401:
            raise UnauthorizedError("Jeton Supabase invalide ou expiré.")
        _raise_for_status(response, "auth.users")
        return response.json()


def _raise_for_status(response: httpx.Response, resource: str) -> None:
    """Traduit une erreur HTTP Supabase en erreur applicative typée."""
    if response.is_success:
        return
    raise UpstreamError(
        f"Supabase a répondu {response.status_code} pour la ressource « {resource} ».",
        details={"body": response.text[:500]},
    )
