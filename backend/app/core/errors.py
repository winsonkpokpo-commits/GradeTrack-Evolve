"""Erreurs applicatives typées — jamais d'``except Exception`` générique."""
from __future__ import annotations

from typing import Any


class AppError(Exception):
    """Erreur métier/application de base, sérialisée en réponse JSON."""

    status_code: int = 500
    code: str = "internal_error"

    def __init__(self, message: str, *, details: dict[str, Any] | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.details: dict[str, Any] | None = details

    def to_payload(self) -> dict[str, Any]:
        """Corps JSON normalisé de l'erreur."""
        return {
            "error": {
                "code": self.code,
                "message": self.message,
                **({"details": self.details} if self.details else {}),
            }
        }


class ConfigurationError(AppError):
    """Variable d'environnement ou configuration manquante/invalide."""

    status_code = 500
    code = "configuration_error"


class UnauthorizedError(AppError):
    """Jeton absent ou invalide (HTTP 401)."""

    status_code = 401
    code = "unauthorized"


class ForbiddenError(AppError):
    """Accès refusé à une ressource qui n'appartient pas à l'utilisateur (HTTP 403)."""

    status_code = 403
    code = "forbidden"


class NotFoundError(AppError):
    """Ressource introuvable (HTTP 404)."""

    status_code = 404
    code = "not_found"


class UpstreamError(AppError):
    """Erreur renvoyée par Supabase (PostgREST / Auth), propagée explicitement."""

    status_code = 502
    code = "upstream_error"
