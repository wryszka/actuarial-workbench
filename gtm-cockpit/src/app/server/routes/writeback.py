"""Decision writeback — governed, attributed, audited.

Every lead decision (assign SA, set priority, log next step, flag renewal risk,
claim whitespace, DQ flag, endorse play, designate strategic) is written to the
`decisions` Delta table and mirrored to `decisions_audit`. The actor is resolved
from the app's forwarded-identity headers (X-Forwarded-Email), matching the hub
and delta-row-editor pattern, so the writeback carries a real audit trail.
"""
import logging
import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from server.config import fqn
from server.sql import execute_query, esc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["writeback"])

DEC = fqn("decisions")
AUD = fqn("decisions_audit")

# The decision actions the cockpit records (persona-driven).
ACTIONS = {
    "assign_sa": "Assign / nominate an SA",
    "set_priority": "Set territory priority",
    "next_step": "Log next step",
    "assign_demo": "Assign a demo to run",
    "flag_risk": "Flag renewal / account risk",
    "claim_whitespace": "Claim a whitespace target",
    "dq_flag": "Flag a data-quality issue",
    "endorse_play": "Endorse a play for scale",
    "designate_strategic": "Designate strategic account",
    "engagement_status": "Set engagement status",
    "persona_reached": "Log persona reached",
    "note": "Note",
}


def _user(request: Request) -> str:
    for h in ("X-Forwarded-Email", "X-Forwarded-Preferred-Username", "X-Forwarded-User"):
        v = request.headers.get(h)
        if v:
            return v
    return os.getenv("USER", "local-dev")


@router.get("/me")
async def me(request: Request):
    return {"user": _user(request)}


class Decision(BaseModel):
    account: str
    action: str
    value: str = ""
    detail: str = ""
    owner: str = ""
    due_date: str = ""
    status: str = "open"


@router.post("/decisions")
async def record_decision(req: Request, body: Decision):
    if body.action not in ACTIONS:
        raise HTTPException(400, f"unknown action '{body.action}'")
    user = _user(req)
    did = str(uuid.uuid4())
    eid = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    vals = (f"'{did}', '{esc(body.account)}', '{esc(body.action)}', "
            f"'{esc(body.value)}', '{esc(body.detail)}', '{esc(body.owner)}', "
            f"'{esc(body.due_date)}', '{esc(body.status)}', '{esc(user)}', "
            f"TIMESTAMP '{now}'")
    try:
        await execute_query(f"INSERT INTO {DEC} VALUES ({vals})")
        await execute_query(
            f"INSERT INTO {AUD} VALUES ('{eid}', '{did}', '{esc(body.account)}', "
            f"'{esc(body.action)}', '{esc(body.value)}', '{esc(user)}', TIMESTAMP '{now}')")
        logger.info("decision %s %s/%s by %s", body.action, body.account, body.value, user)
        return {"ok": True, "decision_id": did, "changed_by": user, "changed_at": now}
    except Exception as e:
        logger.exception("record_decision failed")
        raise HTTPException(500, str(e)[:300])


@router.get("/actions")
async def actions():
    return {"actions": [{"key": k, "label": v} for k, v in ACTIONS.items()]}
