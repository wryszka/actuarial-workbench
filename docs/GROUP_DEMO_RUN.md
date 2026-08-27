# Group Control Tower — demo run

Open the hub → the first tile, **Bricksurance Group — Control Tower** → `/group`. Two tabs:
**Group view** (the board pack) and **Estate & agents** (the map + audit union). Everything reads
from `/api/group/*` and is served from a warmed cache, so the page loads instantly even if a
workbench is cold. Data is deterministic (synthetic). Hit **Warm up** (header) to refresh from the
workbenches' published views + re-run the board questions.

## The board beats (Group view — the default tab)
1. **Posture at a glance.** Six hero cards, one per same-workspace domain, each a passthrough of that
   workbench's `vw_group_headline` — value + unit, a favourable-direction delta, a sparkline, plan
   line, and a RAG dot. Live today: solvency **208.8%** (green), IFRS 17 CSM **£17.0m** (amber),
   reserving BE **£51.6m** (red — AvE breach), claims SLA **64.4%** (amber, £405m reserves),
   underwriting GWP **£672.5m vs plan −6.5%** (red), reinsurance peak utilisation **97.6%** (amber).
   Nothing is computed here — each number comes from a view the owning workbench publishes.
2. **Why it's red (domain grid).** Below the heroes, one RAG card per domain with the workbench's
   **own verbatim** `status_reason` and its KPI rows. e.g. underwriting: "vs plan −6.5% · top
   finding: Convert HAZARDOUS_ACTIVITY…"; reinsurance: "Peak zone European Windstorm at 97.6% of
   appetite · min headroom €12m". Fixed board order (solvency → IFRS 17 → reserving → claims →
   underwriting → reinsurance). Click any card through to the workbench.
3. **Ask the estate (resilient chat).** One agent wired to every live node's MCP tools; it narrates
   while the workbenches' governed tools compute, and the trace shows each call
   (node · tool · principal · outcome). The three board chips (green dot = **pre-warmed**) answer
   instantly, and — the point of the cache — **stay answerable from cache if the analyst model or a
   node's MCP is down** ("answered from cache" badge). Every number in a live answer appears in a
   tool result.

## The estate beats (Estate & agents tab)
4. **Estate map.** 7 live workbenches + 1 roadmap (lifecast); each node shows its MCP servers by
   trust profile and its spine edges — solid = live, **dashed = planned, non-traversable** (all edges
   planned today; see MANIFEST_GAPS.md). The hub is the frame, not a node.
5. **Regulator beat (audit union).** One `UNION ALL` across every live workbench's audit source (+ the
   tower's own log). Filter by node or refusals-only.

## The honest caveats
- **Pricing degrades on purpose.** Pricing gen2 is cross-workspace (fevm-lr-pricing-v2-aws-us) — it
  publishes no contract view here, so it shows no hero/card. The tower never fabricates.
- **Access profiles.** The identity selector (group-analyst / underwriter / compliance-readonly /
  broker-external) runs under the **app principal (fallback)** on this workspace, so the two-identity
  *refusal* is documented as not-yet-realised, never simulated. Realising it = per-profile SPs with
  differing UC grants (see GROUP_ARCHITECTURE.md).

## What to say it proves
One governed front door over the whole estate — a board-grade posture read, each domain's own verbatim
judgement, cross-estate AI activity, and one agent that operates every workbench through its MCP tools
— built by **aggregating and routing, never recomputing**. The workbenches own their numbers (each
publishes a tagged contract view over its own gold, `bxc_group_contract=1`); the tower only reads,
unions, and routes, from a manifest. Adding a workbench is a manifest entry plus two published views.
