"""server/group — the Bricksurance Group Control Tower.

THE BOUNDARY. This package is the ONLY place in the hub that imports the
Databricks SDK or touches a warehouse, an MCP server, or a model-serving
endpoint. Everything else (app.py, config.py) stays FastAPI+uvicorn-pure — a
static scan (scripts/scan_boundary.py) enforces it.

Design law (structural): the group tower AGGREGATES and ROUTES; it never
recomputes. The only SQL emitted here is (a) the audit-union view and (b)
verbatim SELECT-passthroughs against manifest-listed published views. Every tile
metric is read from a view the owning workbench publishes; cross-workbench
questions go through MCP servers. Roadmap nodes / absent views / planned edges
render honestly, never faked.
"""
from __future__ import annotations

import json
import logging
import os
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

import yaml
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from server.config import (
    get_group_warehouse_id, get_group_model_endpoint, get_group_catalog,
    get_group_identity_mode, group_enabled,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["group"])

# ── Manifest ────────────────────────────────────────────────────────────────
_MANIFEST: dict | None = None


def _manifest_path() -> Path | None:
    env = os.getenv("GROUP_MANIFEST_PATH")
    here = Path(__file__).resolve()
    for p in ([Path(env)] if env else []) + [
        here.parents[2] / "ESTATE_MANIFEST.yaml",   # src/app/ESTATE_MANIFEST.yaml (shipped copy)
        here.parents[4] / "ESTATE_MANIFEST.yaml",   # repo-root canonical (local dev)
    ]:
        if p and p.is_file():
            return p
    return None


def manifest() -> dict:
    global _MANIFEST
    if _MANIFEST is None:
        p = _manifest_path()
        if not p:
            logger.warning("group: ESTATE_MANIFEST.yaml not found — tower runs empty")
            _MANIFEST = {"group": {}, "nodes": [], "edges": []}
        else:
            _MANIFEST = yaml.safe_load(p.read_text()) or {}
    return _MANIFEST


def _nodes() -> list[dict]:
    return manifest().get("nodes", []) or []


def _live_nodes() -> list[dict]:
    return [n for n in _nodes() if n.get("status") == "live"]


def _node(nid: str) -> dict | None:
    return next((n for n in _nodes() if n.get("id") == nid), None)


def _is_todo(v) -> bool:
    return not v or (isinstance(v, str) and v.strip().upper() == "TODO")


# ── Warehouse (the only SQL: passthrough SELECTs + the audit-union view) ─────
_W = None


def _w():
    global _W
    if _W is None:
        from databricks.sdk import WorkspaceClient
        _W = WorkspaceClient()
    return _W


def _sql(stmt: str, wait: str = "30s") -> dict:
    """Run a statement on the group warehouse. Returns {cols, rows} or raises."""
    r = _w().statement_execution.execute_statement(
        warehouse_id=get_group_warehouse_id(), statement=stmt, wait_timeout=wait)
    if r.status and r.status.state and r.status.state.value not in ("SUCCEEDED",):
        msg = (r.status.error.message if r.status.error else "query failed")
        raise RuntimeError(msg)
    cols = [c.name for c in r.manifest.schema.columns] if r.manifest and r.manifest.schema else []
    rows = r.result.data_array if r.result and r.result.data_array else []
    return {"cols": cols, "rows": rows}


def _columns(fqn: str) -> list[str]:
    """Discover a table/view's columns via information_schema (for audit normalisation)."""
    try:
        cat, sch, tbl = [x.strip("`") for x in fqn.split(".")]
    except ValueError:
        return []
    q = (f"SELECT column_name FROM {cat}.information_schema.columns "
         f"WHERE table_schema='{sch}' AND table_name='{tbl}' ORDER BY ordinal_position")
    try:
        return [r[0] for r in _sql(q).get("rows", [])]
    except Exception as e:
        logger.warning("group: column introspection failed for %s: %s", fqn, str(e)[:150])
        return []


# ── Tiles: verbatim passthrough of a manifest-listed published view ──────────
def _tile_sql(view_fqn: str, limit: int = 200) -> str:
    return f"SELECT * FROM {view_fqn} LIMIT {int(limit)}"


def _watermark(view_fqn: str, cols: list[str]) -> str | None:
    """As-of watermark from whatever freshness column the view exposes; else None."""
    for c in ("_loaded_at", "event_ts", "ts", "created_at", "as_of", "updated_at", "called_at"):
        if c in cols:
            try:
                r = _sql(f"SELECT CAST(max(`{c}`) AS string) FROM {view_fqn}")
                return (r["rows"][0][0] if r["rows"] else None)
            except Exception:
                return None
    return None


# ── Audit union: the ONE piece of non-passthrough SQL. Built dynamically from
#    each live node's audit_source (columns discovered, mapped by synonym) so it
#    stays manifest-driven and resilient to heterogeneous schemas. ─────────────
_SYN = {
    "ts":            ["ts", "event_ts", "created_at", "called_at", "request_time", "request_date", "occurred_at"],
    "server":        ["server", "served_entity_id", "agent", "endpoint", "path"],
    "tool_or_action":["tool_or_action", "tool", "activity", "event_type", "method", "action"],
    "principal":     ["principal", "actor", "user_email", "requester", "requested_by", "decided_by"],
    "entity_ref":    ["entity_ref", "entity_id", "group_id", "call_id", "databricks_request_id", "id"],
    "outcome":       ["outcome", "status", "signal", "status_code", "result"],
    "refusal_reason":["refusal_reason", "refusal_code", "error", "logging_error_codes"],
    "detail":        ["detail", "reasoning", "response", "request", "tools", "note"],
}
_FIELDS = ["ts", "node", "server", "tool_or_action", "principal", "entity_ref", "outcome", "refusal_reason", "detail"]


def _member_select(node_id: str, fqn: str) -> str | None:
    cols = _columns(fqn)
    if not cols:
        return None
    low = {c.lower(): c for c in cols}
    parts = []
    for f in _FIELDS:
        if f == "node":
            parts.append(f"'{node_id}' AS node")
            continue
        pick = next((low[s] for s in _SYN[f] if s in low), None)
        if f == "ts":
            parts.append(f"CAST(`{pick}` AS timestamp) AS ts" if pick else "CAST(NULL AS timestamp) AS ts")
        else:
            parts.append(f"CAST(`{pick}` AS string) AS {f}" if pick else f"CAST(NULL AS string) AS {f}")
    return f"SELECT {', '.join(parts)} FROM {fqn}"


def _group_activity_fqn() -> str:
    g = manifest().get("group", {}) or {}
    return g.get("activity_log") or f"{get_group_catalog()}.bricksurance_agent.group_activity"


def _ensure_group_activity() -> None:
    fqn = _group_activity_fqn()
    _sql(f"""CREATE TABLE IF NOT EXISTS {fqn} (
        ts TIMESTAMP, node STRING, server STRING, tool_or_action STRING, principal STRING,
        entity_ref STRING, outcome STRING, refusal_reason STRING, detail STRING
      ) USING DELTA COMMENT 'Group Control Tower operational log — chat tool-calls + refusals; a member of the audit union.'""")


def _audit_union_sql() -> str:
    members = []
    for n in _live_nodes():
        src = n.get("audit_source")
        if _is_todo(src):
            continue
        sel = _member_select(n["id"], src)
        if sel:
            members.append(sel)
    # the group's own activity log is always a member (native normalised shape)
    ga = _group_activity_fqn()
    members.append(f"SELECT ts, node, server, tool_or_action, principal, entity_ref, outcome, refusal_reason, detail FROM {ga}")
    return "\nUNION ALL\n".join(members)


# ── MCP client (JSON-RPC transport). FastMCP endpoints are listed, not called. ─
def _host_token() -> tuple[str, dict]:
    w = _w()
    return w.config.host.rstrip("/"), w.config._header_factory()


def _mcp_post(endpoint: str, method: str, params: dict | None = None, timeout: int = 60) -> dict:
    _, token = _host_token()
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params or {}}).encode()
    req = urllib.request.Request(endpoint, data=body,
                                 headers={**token, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def _mcp_tools(node: dict) -> list[dict]:
    """tools/list for a node's jsonrpc MCP servers (skips fastmcp — listed via contracts)."""
    out = []
    for srv in node.get("mcp", []) or []:
        if _is_todo(srv.get("endpoint")) or srv.get("transport") == "fastmcp":
            continue
        try:
            res = _mcp_post(srv["endpoint"], "tools/list")
            for t in (res.get("result", {}).get("tools", []) or []):
                out.append({"node": node["id"], "server": srv["name"], "endpoint": srv["endpoint"],
                            "name": t["name"], "description": t.get("description", "")})
        except Exception as e:
            logger.info("group: tools/list unreachable for %s/%s: %s",
                        node["id"], srv.get("name"), str(e)[:120])
    return out


def _mcp_call(endpoint: str, name: str, args: dict, timeout: int = 120) -> dict:
    res = _mcp_post(endpoint, "tools/call", {"name": name, "arguments": args}, timeout=timeout)
    if "error" in res:
        return {"ok": False, "error": res["error"].get("message", "tool error")}
    r = res.get("result", {})
    return {"ok": not r.get("isError"), "content": r.get("structuredContent") or r.get("content")}


# ── Folded Ask-Bricksurance concierge (moved from server/agent.py so ALL data
#    access lives in this package) ──────────────────────────────────────────────
_AGENT_WH = os.getenv("AGENT_WAREHOUSE_ID", "")
_AGENT_CAT = os.getenv("AGENT_CATALOG", "")
_AGENT_SCHEMA = os.getenv("AGENT_SCHEMA", "bricksurance_agent")
_AGENT_FM = os.getenv("AGENT_FM_ENDPOINT", "databricks-claude-sonnet-4-5")
_AGENT_SYS = (
    "You are the Bricksurance Agent — the concierge for the Bricksurance insurance demo hub. "
    "Answer ONLY from the KNOWLEDGE below; name the best-fit demo and where it lives. If a need "
    "isn't covered, say so plainly (recorded for the backlog); never invent demos. Be concise.")


def agent_enabled() -> bool:
    return bool(_AGENT_WH and _AGENT_CAT)


def _agent_sql(stmt: str):
    r = _w().statement_execution.execute_statement(warehouse_id=_AGENT_WH, statement=stmt, wait_timeout="30s")
    return r.result.data_array if r.result and r.result.data_array else []


def agent_ask(user: str, question: str) -> dict:
    if not agent_enabled():
        return {"answer": "The Bricksurance Agent isn't configured in this workspace yet.", "intent": "disabled"}
    try:
        rows = _agent_sql(f"SELECT title, kind, summary, when_to_use, links FROM {_AGENT_CAT}.{_AGENT_SCHEMA}.knowledge ORDER BY kind, title")
        knowledge = "\n\n".join(f"### {t} [{k}]\n{s}\nWHEN: {w}\nWHERE: {l}" for t, k, s, w, l in rows)
        from databricks.sdk.service.serving import ChatMessage, ChatMessageRole
        resp = _w().serving_endpoints.query(name=_AGENT_FM, max_tokens=600, messages=[
            ChatMessage(role=ChatMessageRole.SYSTEM, content=_AGENT_SYS + "\n\n--- KNOWLEDGE ---\n" + knowledge),
            ChatMessage(role=ChatMessageRole.USER, content=question)])
        answer = resp.choices[0].message.content if resp.choices else "Sorry, no answer."
    except Exception as exc:
        logger.warning("group agent: model call failed: %s", exc)
        answer = "Something went wrong reaching the assistant — your question has been recorded."
    try:
        e = lambda s: (s or "").replace("'", "''")
        _agent_sql(f"INSERT INTO {_AGENT_CAT}.{_AGENT_SCHEMA}.requests (event_ts,user_email,question,answer,intent,matched_items) "
                   f"VALUES (current_timestamp(),'{e(user)}','{e(question)[:2000]}','{e(answer)[:4000]}','concierge','')")
    except Exception:
        pass
    return {"answer": answer, "intent": "concierge"}


# ── Chat: model serving + estate MCP tools + bounded tool loop + trace ───────
GROUP_IDENTITIES = ["group-analyst", "underwriter", "compliance-readonly", "broker-external"]


def _resolve_identity(profile: str) -> dict:
    """Identity mode. secret-scope → a per-profile SP token (not provisioned on this
    workspace); app-principal (fallback) → the hub app SP for every profile. The
    fallback is documented in GROUP_ARCHITECTURE.md; refusals are NEVER simulated —
    under the fallback the two-identity-refusal beat is honestly 'not realised'."""
    mode = get_group_identity_mode()
    return {"profile": profile if profile in GROUP_IDENTITIES else "group-analyst",
            "mode": mode, "principal": "app-service-principal" if mode != "secret-scope" else profile}


def _log_activity(node, server, action, principal, entity, outcome, refusal, detail):
    try:
        _ensure_group_activity()
        e = lambda s: ("" if s is None else str(s)).replace("'", "''")[:800]
        _sql(f"INSERT INTO {_group_activity_fqn()} VALUES (current_timestamp(),'{e(node)}','{e(server)}',"
             f"'{e(action)}','{e(principal)}','{e(entity)}','{e(outcome)}','{e(refusal)}','{e(detail)}')", wait="5s")
    except Exception as exc:
        logger.info("group: activity log write skipped: %s", str(exc)[:120])


def _fm_tools(estate_tools: list[dict]) -> list[dict]:
    seen, out = set(), []
    for t in estate_tools:
        fq = f"{t['node']}__{t['name']}"[:64]
        if fq in seen:
            continue
        seen.add(fq)
        out.append({"type": "function", "function": {
            "name": fq, "description": f"[{t['node']}] {t['description']}"[:1024],
            "parameters": {"type": "object", "properties": {}, "additionalProperties": True}}})
    return out, {f"{t['node']}__{t['name']}"[:64]: t for t in estate_tools}


def group_chat(question: str, profile: str, max_hops: int = 4) -> dict:
    ident = _resolve_identity(profile)
    trace: list[dict] = []
    if not group_enabled():
        return {"answer": "The Control Tower's live data plane isn't configured in this workspace.",
                "identity": ident, "trace": trace, "ok": False}
    estate_tools = [t for n in _live_nodes() for t in _mcp_tools(n)]
    fm_tools, tool_index = _fm_tools(estate_tools)
    ep = get_group_model_endpoint()
    sys = ("You are the Bricksurance Group Control Tower analyst. You AGGREGATE and ROUTE across the "
           "estate's workbenches via their MCP tools — you never compute a figure yourself. Every number "
           "in your answer MUST come from a tool result; if a tool wasn't called, don't state the number. "
           "If a question needs data across workbenches that aren't joinable (no live spine edge), say so. "
           f"Acting under identity profile: {ident['profile']}.")
    messages = [{"role": "system", "content": sys}, {"role": "user", "content": question}]
    answer = ""
    for _ in range(max_hops):
        try:
            resp = _w().api_client.do("POST", f"/serving-endpoints/{ep}/invocations",
                                      body={"messages": messages, "tools": fm_tools, "max_tokens": 900})
        except Exception as e:
            answer = f"The analyst model is unavailable right now ({str(e)[:120]})."
            break
        msg = ((resp.get("choices") or [{}])[0]).get("message", {}) or {}
        calls = msg.get("tool_calls") or []
        messages.append({"role": "assistant", "content": msg.get("content") or "", **({"tool_calls": calls} if calls else {})})
        if not calls:
            c = msg.get("content")
            answer = c if isinstance(c, str) else "".join(b.get("text", "") for b in (c or []) if isinstance(b, dict))
            break
        for call in calls:
            fn = call.get("function", {}) or {}
            fq = fn.get("name", "")
            try:
                args = json.loads(fn.get("arguments") or "{}")
            except Exception:
                args = {}
            meta = tool_index.get(fq)
            if not meta:
                res = {"ok": False, "error": f"unknown tool {fq}"}
            else:
                res = _mcp_call(meta["endpoint"], meta["name"], args)
            outcome = "ok" if res.get("ok") else ("refused" if str(res.get("error", "")).lower().find("permission") >= 0 or res.get("gated") else "error")
            trace.append({"tool": fq, "node": (meta or {}).get("node"), "server": (meta or {}).get("server"),
                          "principal": ident["principal"], "args": args, "ok": res.get("ok"),
                          "outcome": outcome, "result": res.get("content") if res.get("ok") else res.get("error")})
            _log_activity((meta or {}).get("node"), (meta or {}).get("server"), meta["name"] if meta else fq,
                          ident["principal"], json.dumps(args)[:200], outcome,
                          res.get("error") if outcome != "ok" else "", "chat")
            messages.append({"role": "tool", "tool_call_id": call.get("id"),
                             "content": json.dumps(res.get("content") if res.get("ok") else {"error": res.get("error")}, default=str)[:8000]})
    return {"ok": True, "answer": answer, "identity": ident, "trace": trace,
            "tools_available": len(fm_tools)}


# ── Cache + persistence + consumption adapters (the executive view) ──────────
# Pull executive data from each node's EXISTING MCP tools (manifest `adapters`),
# extract generically, cache in-memory AND persist a snapshot so the last-warmed
# view loads instantly on app start. Never blocks a page on a live query.
_CACHE: dict[str, dict] = {}
_SNAP_LOADED = False


def _snapshot_fqn() -> str:
    g = manifest().get("group", {}) or {}
    return g.get("snapshot_table") or f"{get_group_catalog()}.bricksurance_agent.group_snapshot"


def _snapshot_ensure() -> None:
    _sql(f"CREATE TABLE IF NOT EXISTS {_snapshot_fqn()} (key STRING, payload STRING, as_of TIMESTAMP) USING DELTA "
         f"COMMENT 'Group Control Tower cache snapshot — last warmed executive view, loaded on app start.'", wait="20s")


def _snapshot_load() -> None:
    global _SNAP_LOADED
    if _SNAP_LOADED:
        return
    _SNAP_LOADED = True
    try:
        _snapshot_ensure()
        r = _sql(f"SELECT key, payload, CAST(as_of AS string) FROM {_snapshot_fqn()}")
        for key, payload, as_of in r.get("rows", []):
            try:
                _CACHE[key] = {"data": json.loads(payload), "as_of": as_of}
            except Exception:
                pass
        logger.info("group: loaded %d cache entries from snapshot", len(_CACHE))
    except Exception as e:
        logger.info("group: snapshot load skipped: %s", str(e)[:150])


def _snapshot_save(key: str, data) -> None:
    try:
        _snapshot_ensure()
        e = json.dumps(data, default=str).replace("'", "''")
        _sql(f"DELETE FROM {_snapshot_fqn()} WHERE key='{key}'", wait="10s")
        _sql(f"INSERT INTO {_snapshot_fqn()} VALUES ('{key}', '{e[:900000]}', current_timestamp())", wait="10s")
    except Exception as ex:
        logger.info("group: snapshot save skipped for %s: %s", key, str(ex)[:120])


def cache_get(key: str):
    if not _SNAP_LOADED:
        _snapshot_load()
    return _CACHE.get(key)


def _adapters() -> dict:
    return (manifest().get("group", {}) or {}).get("adapters", {}) or {}


def _node_jsonrpc(node: dict) -> str | None:
    for s in node.get("mcp", []) or []:
        if s.get("transport") != "fastmcp" and not _is_todo(s.get("endpoint")):
            return s["endpoint"]
    return None


def _humanize(k: str) -> str:
    return k.replace("_", " ").strip().capitalize()


def _extract_headline(result) -> list[dict]:
    """Surface the tool's own top-level numeric fields as posture metrics (no recompute)."""
    out = []
    src = result if isinstance(result, dict) else {}
    # unwrap common envelopes
    for env in ("kpis", "summary", "headline", "metrics", "overview", "data"):
        if isinstance(src.get(env), dict):
            src = src[env]; break
    for k, v in src.items():
        if isinstance(v, bool):
            continue
        if isinstance(v, (int, float)):
            out.append({"metric_key": k, "label": _humanize(k), "value": v})
        if len(out) >= 5:
            break
    return out


_SEV = {"red": "red", "high": "red", "critical": "red", "amber": "amber", "medium": "amber",
        "warning": "amber", "info": "info", "low": "info", "ok": "info", "green": "info"}


def _extract_attention(result) -> list[dict]:
    """Find the first list-of-dicts in the tool result and map items to attention rows."""
    def firstlist(o):
        if isinstance(o, list) and o and isinstance(o[0], dict):
            return o
        if isinstance(o, dict):
            for v in o.values():
                r = firstlist(v)
                if r:
                    return r
        return None
    items = firstlist(result) or []
    out = []
    for it in items[:6]:
        sev = "info"
        for f in ("severity", "level", "status", "risk", "rag"):
            if it.get(f) is not None:
                sev = _SEV.get(str(it[f]).lower(), "info"); break
        def _clean(x):
            return str(x).strip() if x is not None else ""
        def _substantive(x):
            return len(_clean(x).strip(" -–—.·:")) >= 2   # not empty / just punctuation
        head = next((_clean(it[f]) for f in ("headline", "title", "label", "name", "check", "message", "issue", "finding")
                     if _substantive(it.get(f))), None)
        detail = next((_clean(it[f]) for f in ("detail_sentence", "detail", "reason", "description", "note", "message")
                       if _substantive(it.get(f)) and _clean(it.get(f)) != head), "")
        if head:   # only real, content-bearing items — skip separator/placeholder rows
            out.append({"severity": sev, "headline": head[:160], "detail": detail[:400],
                        "entity_ref": str(it.get("id") or it.get("entity_ref") or "")})
    return out


def _fetch(node: dict, tool: str, extract) -> list[dict]:
    ep = _node_jsonrpc(node)
    if not ep or not tool:
        return []
    res = _mcp_call(ep, tool, {}, timeout=90)
    return extract(res.get("content")) if res.get("ok") else []


def warmup() -> dict:
    """Refresh posture + attention for every live adapter node from its MCP tools,
    cache + persist. Returns progress. Page stays usable on the old cache meanwhile."""
    if not group_enabled():
        return {"ok": False, "error": "data plane not configured"}
    ad = _adapters(); results = []
    for n in _live_nodes():
        a = ad.get(n["id"])
        if not a:
            continue
        try:
            head = _fetch(n, a.get("headline_tool"), _extract_headline)
            att = _fetch(n, a.get("attention_tool"), _extract_attention)
            for row in head:
                row["node"] = n["id"]; row["deep_link"] = n.get("local_tower_url") or n.get("app_url")
            for row in att:
                row["node"] = n["id"]; row["deep_link"] = n.get("local_tower_url") or n.get("app_url")
            _CACHE[f"posture:{n['id']}"] = {"data": head, "as_of": _now()}
            _CACHE[f"attention:{n['id']}"] = {"data": att, "as_of": _now()}
            _snapshot_save(f"posture:{n['id']}", head)
            _snapshot_save(f"attention:{n['id']}", att)
            results.append({"node": n["id"], "ok": True, "headline": len(head), "attention": len(att)})
        except Exception as e:
            results.append({"node": n["id"], "ok": False, "error": str(e)[:150]})
    _CACHE["warmed_at"] = {"data": _now(), "as_of": _now()}
    _snapshot_save("warmed_at", _now())
    return {"ok": True, "warmed_at": _now(), "results": results}


def _now() -> str:
    import datetime
    return datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%SZ")


def _union_cache(prefix: str) -> list[dict]:
    if not _SNAP_LOADED:
        _snapshot_load()
    rows = []
    for k, v in _CACHE.items():
        if k.startswith(prefix + ":"):
            rows.extend(v.get("data") or [])
    return rows


# ── Routes (/api/group/* + the folded /api/agent/*) ──────────────────────────
def _user(request: Request) -> str:
    for h in ("X-Forwarded-Email", "X-Forwarded-Preferred-Username", "X-Forwarded-User"):
        v = request.headers.get(h)
        if v:
            return v
    return os.getenv("USER", "local-dev")


@router.get("/api/group/manifest")
async def api_manifest():
    m = manifest()
    return {"group": m.get("group", {}), "nodes": _nodes(), "edges": m.get("edges", []),
            "enabled": group_enabled(), "identity_mode": get_group_identity_mode()}


@router.get("/api/group/tiles")
async def api_tiles():
    """One tile per live node: headline passthrough (if published), watermark, health count."""
    tiles = []
    for n in _live_nodes():
        pv = n.get("published_views", {}) or {}
        head, health = pv.get("headline"), pv.get("health")
        tile = {"id": n["id"], "name": n["name"], "app_url": n.get("app_url"),
                "local_tower_url": n.get("local_tower_url"), "degraded": _is_todo(head)}
        if not _is_todo(head) and group_enabled():
            try:
                r = _sql(_tile_sql(head, 200))
                tile["headline"] = {"cols": r["cols"], "rows": r["rows"][:50], "view": head,
                                    "sql": _tile_sql(head, 200)}
                tile["watermark"] = _watermark(head, r["cols"]) or "watermark unavailable"
            except Exception as e:
                tile["degraded"], tile["error"] = True, str(e)[:150]
        if not _is_todo(health) and group_enabled():
            try:
                r = _sql(f"SELECT count(*) FROM {health}")
                tile["health_count"] = r["rows"][0][0] if r["rows"] else None
            except Exception:
                pass
        tiles.append(tile)
    # roadmap nodes are surfaced too, so the SPA renders them in the stub treatment
    roadmap = [{"id": n["id"], "name": n["name"], "app_url": n.get("app_url"), "roadmap": True}
               for n in _nodes() if n.get("status") != "live"]
    return {"tiles": tiles, "roadmap": roadmap, "enabled": group_enabled()}


@router.get("/api/group/audit")
async def api_audit(node: str = "", principal: str = "", refusals_only: int = 0, limit: int = 100):
    if not group_enabled():
        return {"enabled": False, "rows": [], "cols": _FIELDS}
    where = []
    if node:
        where.append(f"node = '{node.replace(chr(39), '')}'")
    if principal:
        where.append(f"principal ILIKE '%{principal.replace(chr(39), '')}%'")
    if refusals_only:
        where.append("(lower(outcome) IN ('refused','error') OR refusal_reason IS NOT NULL)")
    w = (" WHERE " + " AND ".join(where)) if where else ""
    try:
        _ensure_group_activity()
        q = f"SELECT * FROM (\n{_audit_union_sql()}\n){w} ORDER BY ts DESC NULLS LAST LIMIT {int(limit)}"
        r = _sql(q, wait="40s")
        return {"enabled": True, "cols": r["cols"], "rows": r["rows"], "sql": q}
    except Exception as e:
        return {"enabled": True, "cols": _FIELDS, "rows": [], "error": str(e)[:200]}


@router.get("/api/group/posture")
async def api_posture():
    """Posture strip — headline metrics per node, served from the (persisted) cache."""
    warmed = cache_get("warmed_at")
    return {"metrics": _union_cache("posture"), "warmed_at": (warmed or {}).get("data"), "enabled": group_enabled()}


@router.get("/api/group/attention")
async def api_attention():
    """Attention across the estate — each node's own judgement, unioned + sorted."""
    rows = _union_cache("attention")
    order = {"red": 0, "amber": 1, "info": 2}
    rows.sort(key=lambda r: order.get(r.get("severity", "info"), 3))
    warmed = cache_get("warmed_at")
    return {"items": rows, "warmed_at": (warmed or {}).get("data"), "enabled": group_enabled()}


@router.post("/api/group/warmup")
async def api_warmup():
    import asyncio
    return await asyncio.to_thread(warmup)


@router.get("/api/group/identities")
async def api_identities():
    g = manifest().get("group", {}) or {}
    return {"identities": g.get("identities", GROUP_IDENTITIES), "mode": get_group_identity_mode()}


@router.post("/api/group/chat")
async def api_chat(request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}
    q = str(body.get("question", "")).strip()
    profile = str(body.get("profile", "group-analyst"))
    if not q:
        return {"answer": "Ask a question across the estate.", "trace": [], "ok": True}
    import asyncio
    return await asyncio.to_thread(group_chat, q, profile)


# — folded concierge (kept at the same paths the AskBricksurance panel calls) —
@router.get("/api/agent/enabled")
async def api_agent_enabled():
    return {"enabled": agent_enabled()}


@router.post("/api/agent/ask")
async def api_agent_ask(request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}
    q = str(body.get("question", "")).strip()
    if not q:
        return {"answer": "Ask me anything about the Bricksurance demos.", "intent": "empty"}
    import asyncio
    return await asyncio.to_thread(agent_ask, _user(request), q[:2000])
