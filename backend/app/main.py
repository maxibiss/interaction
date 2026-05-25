from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.routers import interactions, medications, patients, pdf_import


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Pharma Profile PoC", version="0.1.0")
    public_dir = Path(__file__).resolve().parents[2] / "public"
    assets_dir = public_dir / "assets"
    index_file = public_dir / "index.html"

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(patients.router)
    app.include_router(medications.router)
    app.include_router(pdf_import.router)
    app.include_router(interactions.router)

    @app.get("/api/health")
    def health() -> dict:
        return {"status": "ok"}

    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    if index_file.exists():
        @app.get("/", include_in_schema=False)
        def frontend_index() -> FileResponse:
            return FileResponse(index_file)

        @app.get("/{full_path:path}", include_in_schema=False)
        def frontend_fallback(full_path: str) -> FileResponse:
            candidate = public_dir / full_path
            if candidate.exists() and candidate.is_file():
                return FileResponse(candidate)
            return FileResponse(index_file)

    return app


app = create_app()
