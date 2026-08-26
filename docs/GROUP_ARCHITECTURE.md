# Bricksurance Group Control Tower — architecture

The hub's first data-aware feature: the estate front door, one level above the workbenches.
New `/group` SPA route + one FastAPI router package. Installed 2026-08-26.

## Design law (structural, enforced)
**Aggregate and route; never recompute.** The group tower reads only (a) the audit-union view
and (b) verbatim `SELECT * FROM <manifest view>` passthroughs against workbench-published views,
and calls workbench **MCP servers** for everything else. It contains **zero business-metric SQL**.
If a workbench doesn't publish a needed view, the tile degrades to the roadmap treatment (no
fabricated numbers). If a spine edge isn't real, the map draws it dashed / non-traversable.

## The boundary (the most important deliverable)
Every warehouse query, MCP call and model-serving call in the hub lives in **`src/app/server/group/`**.
The rest of the backend (`app.py`, `config.py`) is FastAPI+uvicorn-pure. Enforced by
`scripts/scan_boundary.py` (CI/smoke; fails on any databricks/SQL/MCP token outside the package).
The pre-existing Ask-Bricksurance concierge was **folded into this package** so the boundary is
genuinely true (not weakened with exceptions); `/api/agent/*` still resolves from here.

## Manifest-driven
`ESTATE_MANIFEST.yaml` (repo root; copied into `src/app/` at build so it ships) is the single
source of truth — nodes, published views, MCP endpoints + trust profiles, audit sources, spine
edges. `/api/group/manifest` serves the parsed form. Adding a workbench = a manifest entry, no code.
The app renders entirely from the manifest (mutating a test copy re-renders the map/tiles).

## Endpoints (`/api/group/*`)
- `manifest` — nodes + edges + group config.
- `tiles` — per-live-node headline passthrough (+ watermark, health count) or `degraded:true`.
- `audit` — the union view (filters: node, principal, refusals_only).
- `identities` — the principal profiles.
- `chat` (POST) — model-serving endpoint with **every live node's MCP tools** wired (261 today),
  bounded tool-loop, returns plan → tool-calls (node/server/principal/outcome) → answer. Numeric
  traceability: answer numbers come from a tool result in the trace.
- `/api/agent/*` — the folded concierge.

## Audit union
One `UNION ALL` (the only non-passthrough SQL) built **dynamically**: for each live node's
`audit_source`, columns are discovered via `information_schema` and mapped by synonym to
`(ts, node, server, tool_or_action, principal, entity_ref, outcome, refusal_reason, detail)`.
Plus the group's own `group_activity` log (chat tool-calls + refusals). Resilient to heterogeneous
audit schemas without hardcoding per-node SQL.

## Identity mechanism — and the documented fallback
`group.identities` = named profiles the operator picks before chatting. Intended: each resolves
server-side from a secret-scope SP reference; the SPA only sees profile names.
**On this workspace, per-profile SP auth is NOT provisioned, so `GROUP_IDENTITY_MODE=app-principal`
(fallback): every profile runs under the hub app SP.** Consequence, stated honestly: the
two-identity-refusal storyline is **not yet realised** — a refusal is **never simulated** client-side.
To realise it: provision per-profile SPs with differing UC grants + set `group_identity_mode:
secret-scope` and wire the scope refs in `databricks.yml`; the refusal then comes from a real UC/MCP
gate and is written to the audit union.

## Cross-workspace note (pricing gen2)
The pricing node points at gen2 on a **different workspace** (`fevm-lr-pricing-v2-aws-us`). The
dev-hosted hub SP may not authenticate to that workspace's app proxy — if unreachable, the node
renders healthy-unknown, never faked. It also currently exposes only the legacy 5-tool surface until
the owning session redeploys.

## Production split
Today the tower is co-hosted in the launcher. A production split would move `server/group/` to its
own Databricks App with its own service principal (least-privilege: SELECT on published views +
audit sources, CAN_QUERY on the model endpoint, MCP connectivity), leaving the launcher dataless
again. The boundary package is written to make that lift a move, not a rewrite.
