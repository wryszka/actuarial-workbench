# Manifest gaps — Bricksurance Group Control Tower

Every `TODO` / `roadmap` / `planned` in `ESTATE_MANIFEST.yaml` is recorded here with
what closes it. The Control Tower **builds and runs with these gaps present** — it degrades
honestly (roadmap stub treatment, "watermark unavailable", non-traversable edges) and never
fabricates. Populated 2026-08-26 from the four workbenches' `/api/mcp` endpoints, Agent
Interface tabs, and their Unity Catalog schemas.

## Design law recap
The group tower reads only (a) the audit-union view and (b) verbatim SELECT-passthroughs
against manifest-listed published views. It contains **zero business-metric SQL**. Closing a
gap therefore means **the owning workbench publishes a view / wires a key** — never that the
group computes it.

## Node status

| Node | Group status | Why | To make it fully live for the group |
|---|---|---|---|
| reserving | **live** | `/api/mcp` (39 tools) + Agent Interface + real audit source (`5_gov_audit_event`) | publish a `health` anomaly view; publish policy/claim spine-key views |
| claims | **live** | `/api/mcp` (51 tools) + Agent Interface + audit (`agent_audit_payload`) | confirm `gold_sla_prediction` is the tower's headline view (or point at the real one) |
| solvency2 | **live** | `/api/mcp` (97 tools) + Agent Interface + audit (`5_mon_agent_audit`) | publish a headline + health metric view for the tile |
| ifrs17 | **live** | `/api/mcp` (24 tools) + Agent Interface + audit (`gld_ai_activity`) | publish a close-cockpit headline + health metric view |
| underwriting | **live** | standard `/api/mcp` (53 tools) added to the main app 2026-08-26 + audit (`gold_ai_activity`); FastMCP `uw-mcp` is the 2nd (mutating broker) surface | publish headline/health views; teach the group client the **FastMCP** transport to *call* uw-mcp's mutating tools (directory-listed for now) |
| pricing | **roadmap** | full MCP surface lives in **gen2 (another workstream)**; dev `/api/mcp` is the legacy 5-tool surface; gen2 is on a **different workspace** (cross-workspace reachability) | left untouched per instruction; another session redeploys gen2 + cross-workspace auth needed |
| reinsurance | **live** | standard `/api/mcp` (36 tools) added 2026-08-26 + audit (`bricksurance_re.gov_ai_activity`) | publish headline/health views |
| lifecast | **roadmap** | **no MCP surface** built yet | build `/api/mcp`; publish views + audit |

## Published views (tiles)
- **reserving.headline** → `reserving_workbench.regulatory_landing` (real view; confirm it is the tile-appropriate "today" grain).
- **claims.headline** → `claims_workbench.gold_sla_prediction`; **claims.health** → `gold_vulnerability_flags` (real views).
- **solvency2.headline / ifrs17.headline** → **TODO**: no metric view is currently published at a "today headline" grain. Until published, these tiles render **degraded** (roadmap treatment) — by design, not fabricated.
- All **`health`** views except claims are **TODO** → anomaly badge omitted for those tiles.

## As-of watermarks
Watermark = the freshness of the source view (`max(event ts)` or `_loaded_at`). Where a
headline view exposes neither, the tile shows **"watermark unavailable"** (never a fabricated
timestamp). To be confirmed per headline view as they are published.

## Audit sources (audit-union members)
Real, heterogeneous per node — the union view normalises each to
`(ts, node, server, tool_or_action, principal, entity_ref, outcome, refusal_reason, detail)`:

| Node | audit_source | Normalisation notes |
|---|---|---|
| reserving | `5_gov_audit_event` | `created_at→ts, actor→principal, event_type→tool_or_action, entity_type\|\|entity_id→entity_ref, detail→detail`; no outcome/refusal → NULL |
| solvency2 | `5_mon_agent_audit` | `called_at→ts, user_email→principal, method\|\|path→tool_or_action, status→outcome, status_code`; refusal derived from non-2xx |
| claims | `agent_audit_payload` | model-serving inference log: `request_time→ts, requester→principal, served_entity_id→server, status_code→outcome`; entity/tool parsed from `request` best-effort |
| ifrs17 | `gld_ai_activity` | `ts→ts, agent→server, activity→tool_or_action, group_id→entity_ref, signal→outcome, tools\|\|reasoning→detail` |
| **group** | `bricksurance_agent.group_activity` | the tower's own log (chat tool-calls + refusals) — created by the group router; carries native `outcome`/`refusal_reason`. This is where the two-identity-refusal beat is written. |

Roadmap nodes contribute no audit rows until group-wired.

## Spine edges (all `planned` at first cut)
No edge is `live` yet: a `live` edge needs **both** ends to publish a view keyed on the shared
`via` column so a real join returns rows. The workbenches publish domain views but not yet the
shared-key **spine views** a cross-node join needs. Until then every edge renders dashed /
non-traversable, and the horizontal-question demo (storyline 2) ships its widest *real* version
(single-node answers) and names the blocked edges. To light an edge: both workbenches publish a
view exposing the `via` key at a joinable grain, then flip the edge to `status: live`.

Candidate first edge to light: **claims ↔ reserving** on `policy_number` (both hold policy-keyed
data) — needs claims to publish a policy-keyed claims view and reserving a policy-keyed exposure
view.

## Identity profiles
`group.identities` are declared; per-profile auth resolves from secret-scope references
(databricks.yml → app.yaml). If per-profile service-principal auth cannot be provisioned on
this workspace, the tower falls back to the **app principal** and the delta is documented
prominently in `docs/GROUP_ARCHITECTURE.md` — the refusal storyline is then driven by a real
UC grant difference on the app principal, never simulated. Status: to be confirmed in G-P2.
