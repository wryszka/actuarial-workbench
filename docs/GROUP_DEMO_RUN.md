# Group Control Tower — demo run

Open the hub → the first tile, **Bricksurance Group — Control Tower** → `/group`. Everything is
deterministic (synthetic data) and reads live from `/api/group/*`.

## The five beats
1. **Estate at a glance.** The map: 7 live workbenches + 1 roadmap (lifecast). Each node shows its
   MCP servers by trust profile (internal/external/readonly) and its spine edges — solid = live,
   **dashed = planned, non-traversable** (all edges are planned today; see MANIFEST_GAPS.md). The hub
   is the frame, not a node.
2. **Notice → drill → return.** Tiles: reserving + claims show real headline passthroughs (with the
   exact `SELECT` and rows on "show the SQL"); the others degrade honestly ("headline view not
   published yet") — the tower never fabricates. Click through to the workbench's own tower.
3. **The horizontal question (chat).** Pick an identity, ask across the estate. The agent has **261
   estate tools** wired from every live node's MCP surface; it narrates while the workbenches'
   governed tools compute. The trace shows each tool call (node · tool · principal · outcome); every
   number in the answer appears in a tool result. Where a cross-workbench join needs a `planned`
   edge, the agent says so.
4. **Regulator beat.** "Show recent AI activity across the estate" → the audit-union card: one
   `UNION ALL` across every live workbench's audit source (+ the tower's own log). Filter by node or
   refusals-only.
5. **Access profiles (the honest caveat).** The identity selector offers group-analyst / underwriter
   / compliance-readonly / broker-external. **On this workspace they run under the app principal
   (fallback)** — so the two-identity *refusal* is documented as not-yet-realised, never simulated.
   Realising it = per-profile SPs with differing UC grants (see GROUP_ARCHITECTURE.md).

## What to say it proves
One governed front door over the whole estate — a live map, cross-estate AI activity, and one agent
that operates every workbench through its MCP tools — built by **aggregating and routing, never
recomputing**, entirely from a manifest. Adding a workbench is a manifest entry.
