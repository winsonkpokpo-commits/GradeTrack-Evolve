"""Configuration typée du backend GradeTrack-Evolve.

Réutilise les variables d'environnement déjà définies côté projet
(``NEXT_PUBLIC_SUPABASE_URL`` / ``NEXT_PUBLIC_SUPABASE_ANON_KEY``, cf.
``.env.example``) : même projet Supabase que le frontend Next.js.
"""
from __future__ import annotations

import os
from dataclasses import dataclass

from app.core.errors import ConfigurationError


@dataclass(frozen=True, slots=True)
class Settings:
    """Paramètres applicatifs (immuables, typés)."""

    supabase_url: str
    supabase_anon_key: str


def get_settings() -> Settings:
    """Construit les paramètres depuis l'environnement.

    Erreur explicite et typée si une variable requise est absente
    (jamais de ``except Exception`` générique, cf. règles du projet).
    """
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    missing = [
        name
        for name, value in (
            ("NEXT_PUBLIC_SUPABASE_URL", url),
            ("NEXT_PUBLIC_SUPABASE_ANON_KEY", key),
        )
        if not value
    ]
    if missing:
        raise ConfigurationError(
            "Variables d'environnement manquantes : " + ", ".join(missing)
        )
    return Settings(supabase_url=url.rstrip("/"), supabase_anon_key=key)
