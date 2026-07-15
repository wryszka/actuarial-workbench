"""Usage tracking for the hub — who opens it and which demos they launch.

Databricks Apps run behind an OAuth proxy that stamps every request with the
signed-in user (X-Forwarded-Email). We record one row per page visit and per
tile-open click into a Delta table, via a SQL warehouse, using the app's own
service principal (the Databricks SDK picks up the app's credentials from the
runtime automatically).

Design rules:
  - Tracking must NEVER break the hub. Every write is best-effort on a
    background thread; any failure is logged and swallowed.
  - Disabled cleanly when USAGE_WAREHOUSE_ID / USAGE_TABLE are unset (local dev,
    or a workspace where the table hasn't been provisioned) — the app just
    doesn't record.
"""
import logging
import re
from concurrent.futures import ThreadPoolExecutor

from server.config import get_usage_table, get_usage_warehouse_id, usage_tracking_enabled

logger = logging.getLogger(__name__)

# Single background worker — writes are infrequent and order doesn't matter.
_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="usage")

# Only allow a sane fully-qualified table name; guards the f-string INSERT.
_TABLE_RE = re.compile(r"^[A-Za-z0-9_]+\.[A-Za-z0-9_]+\.[A-Za-z0-9_]+$")


def _sql_literal(value: str | None) -> str:
    """Escape a value as a SQL string literal (or NULL)."""
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def _write(user_email: str, event_type: str, path: str, target: str, user_agent: str) -> None:
    table = get_usage_table()
    warehouse_id = get_usage_warehouse_id()
    if not _TABLE_RE.match(table):
        logger.warning("usage: refusing to write to malformed table name %r", table)
        return
    try:
        from databricks.sdk import WorkspaceClient

        cols = ", ".join(
            _sql_literal(v)
            for v in (user_email, event_type, path or None, target or None, user_agent or None)
        )
        stmt = (
            f"INSERT INTO {table} "
            "(event_ts, user_email, event_type, path, target, user_agent) "
            f"VALUES (current_timestamp(), {cols})"
        )
        WorkspaceClient().statement_execution.execute_statement(
            warehouse_id=warehouse_id, statement=stmt, wait_timeout="30s"
        )
    except Exception as exc:  # never let tracking break a request
        logger.warning("usage: write failed (%s): %s", event_type, exc)


def record(user_email: str, event_type: str, path: str = "", target: str = "", user_agent: str = "") -> None:
    """Fire-and-forget a usage event. No-op when tracking is disabled."""
    if not usage_tracking_enabled():
        return
    try:
        _executor.submit(_write, user_email, event_type, path, target, user_agent)
    except Exception as exc:
        logger.warning("usage: could not enqueue event: %s", exc)
