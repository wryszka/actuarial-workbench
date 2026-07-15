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

from server import usage
from server.config import (
    get_usage_table,
    get_usage_warehouse_id,
    hub_config,
    usage_tracking_enabled,
)

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


@app.post("/api/track")
async def track(request: Request):
    """Record a client-side event (a tile-open click) before the browser
    navigates away. Best-effort; always returns ok."""
    try:
        body = await request.json()
    except Exception:
        body = {}
    usage.record(
        user_email=_request_user(request),
        event_type=str(body.get("event", "click"))[:64],
        path=str(body.get("path", ""))[:512],
        target=str(body.get("target", ""))[:512],
        user_agent=request.headers.get("user-agent", "")[:512],
    )
    return {"status": "ok"}


@app.get("/api/usage/summary")
async def usage_summary(request: Request):
    """Aggregates for the in-app Usage page. Returns enabled=false when tracking
    isn't provisioned in this workspace, so the page degrades gracefully."""
    if not usage_tracking_enabled():
        return {"enabled": False}
    try:
        from databricks.sdk import WorkspaceClient

        table = get_usage_table()
        wid = get_usage_warehouse_id()
        w = WorkspaceClient()

        def rows(sql: str):
            resp = w.statement_execution.execute_statement(
                warehouse_id=wid, statement=sql, wait_timeout="30s"
            )
            return (resp.result.data_array if resp.result and resp.result.data_array else [])

        totals = rows(
            f"SELECT count(*) AS events, count(DISTINCT user_email) AS users FROM {table}"
        )
        top_demos = rows(
            "SELECT coalesce(nullif(target,''), path) AS item, count(*) AS opens "
            f"FROM {table} WHERE event_type = 'open_demo' GROUP BY 1 ORDER BY opens DESC LIMIT 15"
        )
        top_users = rows(
            f"SELECT user_email, count(*) AS events, max(event_ts) AS last_seen FROM {table} "
            "GROUP BY 1 ORDER BY events DESC LIMIT 15"
        )
        recent = rows(
            "SELECT event_ts, user_email, event_type, coalesce(nullif(target,''), path) AS item "
            f"FROM {table} ORDER BY event_ts DESC LIMIT 30"
        )
        return {
            "enabled": True,
            "totals": totals[0] if totals else ["0", "0"],
            "top_demos": top_demos,
            "top_users": top_users,
            "recent": recent,
        }
    except Exception as exc:
        logger.warning("usage summary failed: %s", exc)
        return {"enabled": True, "error": "unavailable"}


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
    async def serve_spa(full_path: str, request: Request):
        file_path = FRONTEND_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        # A page navigation (any non-asset route falls through to index.html) —
        # record it as a visit. Static assets are served above and not tracked.
        usage.record(
            user_email=_request_user(request),
            event_type="visit",
            path="/" + full_path,
            user_agent=request.headers.get("user-agent", "")[:512],
        )
        return FileResponse(FRONTEND_DIR / "index.html")
