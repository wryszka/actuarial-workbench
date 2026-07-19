"""SQL execution against the warehouse via the Statement Execution API.

INLINE disposition only — Databricks Apps' egress is firewalled away from the
cloud-storage hosts EXTERNAL_LINKS point at, so results are aggregated
server-side. Handles multi-chunk inline results.
"""
import asyncio
import logging
from typing import Any

from databricks.sdk.service.sql import StatementState

from server.config import get_workspace_client, get_warehouse_id, get_catalog, get_schema

logger = logging.getLogger(__name__)


def _execute_sync(sql: str) -> list[dict[str, Any]]:
    client = get_workspace_client()
    logger.debug("SQL: %s", sql[:200])
    response = client.statement_execution.execute_statement(
        statement=sql,
        warehouse_id=get_warehouse_id(),
        catalog=get_catalog(),
        schema=get_schema(),
        wait_timeout="50s",
    )
    if response.status and response.status.state == StatementState.FAILED:
        error_msg = response.status.error.message if response.status.error else "Unknown"
        raise RuntimeError(f"SQL failed: {error_msg}")
    if not response.manifest or not response.manifest.schema or not response.manifest.schema.columns:
        return []

    columns = [col.name for col in response.manifest.schema.columns]
    rows: list[dict[str, Any]] = []
    if response.result and response.result.data_array:
        for row_data in response.result.data_array:
            rows.append(dict(zip(columns, row_data)))

    manifest = response.manifest
    if manifest and getattr(manifest, "chunks", None):
        first_chunk = response.result.chunk_index if response.result else 0
        for chunk_info in manifest.chunks:
            idx = chunk_info.chunk_index
            if idx is None or idx == first_chunk:
                continue
            chunk = client.statement_execution.get_statement_result_chunk_n(
                statement_id=response.statement_id, chunk_index=idx)
            if chunk.data_array:
                for row_data in chunk.data_array:
                    rows.append(dict(zip(columns, row_data)))
    return rows


async def execute_query(sql: str) -> list[dict[str, Any]]:
    return await asyncio.to_thread(_execute_sync, sql)


def esc(val: str) -> str:
    """Escape a string for inlining into SQL."""
    return str(val).replace("\\", "\\\\").replace("'", "''")
