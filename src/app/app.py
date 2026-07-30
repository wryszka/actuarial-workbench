"""Actuarial Workbench — hub / launcher app.

A deliberately tiny FastAPI app whose only job is to serve the tile landing
page and tell the frontend which URL each live tile should open. No SQL, no
MLflow, no AI — every live workflow (Solvency II, Pricing, …) is its own
deployed Databricks App, and this hub is the one place you launch them from.

Configuration is entirely env-driven (see server/config.py) so the same code
deploys to any workspace by overriding the URL variables in databricks.yml.
"""
import logging
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from server import agent
from server.config import hub_config

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

FRONTEND_DIR = Path(__file__).parent / "frontend" / "dist"

app = FastAPI(title="Actuarial Workbench Hub", version="1.0.0")


@app.get("/api/health")
async def health():
    return {"status": "ok"}


def _request_user(request: Request) -> str:
    for header in (
        "X-Forwarded-Email",
        "X-Forwarded-Preferred-Username",
        "X-Forwarded-User",
    ):
        value = request.headers.get(header)
        if value:
            return value
    import os

    return os.getenv("USER", "local-dev")


@app.get("/api/me")
async def me(request: Request):
    return {"user": _request_user(request)}


@app.get("/api/agent/enabled")
async def agent_enabled():
    return {"enabled": agent.enabled()}


@app.post("/api/agent/ask")
async def agent_ask(request: Request):
    """Bricksurance Agent — answer a question from the curated corpus and log it."""
    try:
        body = await request.json()
    except Exception:
        body = {}
    question = str(body.get("question", "")).strip()
    if not question:
        return {"answer": "Ask me anything about the Bricksurance demos.", "intent": "empty"}
    return agent.ask(user=_request_user(request), question=question[:2000])


@app.get("/api/config")
async def config():
    """Per-workspace launcher config — the URL each live tile opens, plus the
    workspace pointers used to deep-link the accelerator tiles.

    Empty strings mean "not configured"; the frontend falls back to a static
    default (live-tile URLs) or hides the link (accelerator deep links).
    """
    return hub_config()


if FRONTEND_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = FRONTEND_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIR / "index.html")
