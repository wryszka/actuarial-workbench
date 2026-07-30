"""Bricksurance Agent — the hub concierge chatbot.

Answers questions about the Bricksurance estate (which demo fits a client ask,
what a workbench does, where the docs are) from a small CURATED knowledge table
(no RAG — the corpus is ~20 rows, refreshed weekly by a job). Every question +
answer + classified intent is logged to a Delta table so we see what's asked and
what's missing. All via Databricks SQL warehouse + Foundation Model API (Claude).

Enabled only when AGENT_WAREHOUSE_ID + AGENT_CATALOG are set (empty = disabled,
so the hub still runs anywhere without this).
"""
import json
import logging
import os

logger = logging.getLogger(__name__)

FM_ENDPOINT = os.getenv("AGENT_FM_ENDPOINT", "databricks-claude-sonnet-4-5")
WAREHOUSE_ID = os.getenv("AGENT_WAREHOUSE_ID", "")
CATALOG = os.getenv("AGENT_CATALOG", "")
SCHEMA = os.getenv("AGENT_SCHEMA", "bricksurance_agent")

SYSTEM = """You are the Bricksurance Agent — the concierge for the Bricksurance insurance
demo hub built on Databricks. Bricksurance is a synthetic insurance group (SE = composite/P&C,
Re = reinsurer, Life) used to show what Databricks makes possible for insurers.

You help Databricks field teams (AEs/SAs) navigate the estate. Given a question, use ONLY the
KNOWLEDGE below to answer. Speak in insurance terms. Be concise and concrete.

Rules:
- If a client need maps to a demo, name the demo(s) and point to where it lives (the `links`).
  Prefer the single best fit first. E.g. a reserving ask → the Reserving workbench.
- If the need is NOT covered by anything in KNOWLEDGE, say so plainly: we can't do that yet, and
  that the request has been recorded for the backlog. Do not invent demos or capabilities.
- If the user is reporting a gap or feature request ("you're missing X"), acknowledge it warmly and
  say it's been added to the backlog.
- Never overclaim. If unsure, say what IS available and flag the gap.
Keep answers to a few sentences plus, where useful, a short bullet list of pointers."""


def enabled() -> bool:
    return bool(WAREHOUSE_ID and CATALOG)


def _w():
    from databricks.sdk import WorkspaceClient
    return WorkspaceClient()


def _sql(stmt: str):
    resp = _w().statement_execution.execute_statement(
        warehouse_id=WAREHOUSE_ID, statement=stmt, wait_timeout="30s"
    )
    return resp.result.data_array if resp.result and resp.result.data_array else []


def _knowledge_block() -> str:
    rows = _sql(
        f"SELECT title, kind, summary, when_to_use, links "
        f"FROM {CATALOG}.{SCHEMA}.knowledge ORDER BY kind, title"
    )
    parts = []
    for title, kind, summary, when, links in rows:
        parts.append(
            f"### {title} [{kind}]\n{summary}\nWHEN TO USE: {when}\nWHERE: {links}"
        )
    return "\n\n".join(parts)


def _classify(question: str) -> str:
    q = (question or "").lower()
    if any(w in q for w in ("missing", "should add", "you don't", "gap", "backlog", "feature", "wish", "could you add")):
        return "gap-report"
    if any(w in q for w in ("bug", "broken", "error", "500", "not working")):
        return "bug"
    if any(w in q for w in ("which demo", "what can i use", "client asked", "do we have", "is there a", "show", "reserving", "pricing", "claims")):
        return "demo-lookup"
    return "question"


def _esc(s: str) -> str:
    return (s or "").replace("'", "''")


def _log(user: str, question: str, answer: str, intent: str):
    try:
        _sql(
            f"INSERT INTO {CATALOG}.{SCHEMA}.requests "
            "(event_ts, user_email, question, answer, intent, matched_items) VALUES "
            f"(current_timestamp(), '{_esc(user)}', '{_esc(question)[:2000]}', "
            f"'{_esc(answer)[:4000]}', '{_esc(intent)}', '')"
        )
    except Exception as exc:
        logger.warning("agent: failed to log request: %s", exc)


def ask(user: str, question: str) -> dict:
    """Answer a question from the curated corpus, via Claude, and log it."""
    if not enabled():
        return {"answer": "The Bricksurance Agent isn't configured in this workspace yet.", "intent": "disabled"}
    intent = _classify(question)
    try:
        knowledge = _knowledge_block()
        messages = [
            {"role": "system", "content": SYSTEM + "\n\n--- KNOWLEDGE ---\n" + knowledge},
            {"role": "user", "content": question},
        ]
        resp = _w().serving_endpoints.query(name=FM_ENDPOINT, messages=messages, max_tokens=600)
        answer = resp.choices[0].message.content if resp.choices else "Sorry, no answer."
    except Exception as exc:
        logger.warning("agent: model call failed: %s", exc)
        answer = ("Something went wrong reaching the assistant — but your question has been "
                  "recorded and the team will see it.")
    _log(user, question, answer, intent)
    return {"answer": answer, "intent": intent}
