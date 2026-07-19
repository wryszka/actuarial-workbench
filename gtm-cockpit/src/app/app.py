"""UKI Insurance GTM Cockpit — Databricks App.

A data-backed cockpit that turns the actuarial-workbench demo portfolio into a
territory operating system: it reads a governed Unity Catalog model of the UKI
insurance GTM book (accounts, opps, UCO funnel, SA coverage, demo-fit),
surfaces the persona views (coverage gaps, accelerator queue, demo-fit,
replicability), lets leads record decisions with audited writeback, and answers
questions in natural language via a Genie space.

Reached from the actuarial-workbench hub's GTM page. All money is LIST $ — a
trailing consumption PROXY, not billed revenue.
"""
import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from server.config import app_config
from server.routes import data, writeback, genie, agent

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

FRONTEND_DIR = Path(__file__).parent / "frontend" / "dist"

app = FastAPI(title="UKI Insurance GTM Cockpit", version="1.0.0")


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/config")
async def config():
    return app_config()


app.include_router(data.router)
app.include_router(writeback.router)
app.include_router(genie.router)
app.include_router(agent.router)


if FRONTEND_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = FRONTEND_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIR / "index.html")
