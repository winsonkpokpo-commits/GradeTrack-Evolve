"""Application FastAPI — GradeTrack-Evolve backend."""
from __future__ import annotations

import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.errors import AppError
from app.routers import classe, matiere, note, trimestre


def create_app() -> FastAPI:
    """Fabrique de l'application (facilite les tests)."""
    application = FastAPI(
        title="GradeTrack-Evolve API",
        version="0.1.0",
        description="Backend FastAPI — Phase 3 : Classe, Matière, Note, Trimestre.",
    )

    # CORS : le frontend Next.js (localhost:3000) appelle cette API depuis le
    # navigateur avec un en-tête Authorization — les origines sont explicites.
    origines_autorisees = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINES", "http://localhost:3000,http://127.0.0.1:3000"
        ).split(",")
        if origin.strip()
    ]
    application.add_middleware(
        CORSMiddleware,
        allow_origins=origines_autorisees,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )

    @application.exception_handler(AppError)
    async def handle_app_error(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content=exc.to_payload())

    application.include_router(matiere.router)
    application.include_router(classe.router)
    application.include_router(trimestre.router)
    application.include_router(note.router)

    @application.get("/health", tags=["systeme"], summary="Sonde de disponibilité")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return application


app = create_app()
