# Grants — Actuarial Workbench hub

## Group-tower grants (applied 2026-08-26, dev)
The hub app service principal (`7d88f801-5f80-428e-b803-91d4311795de`) needs read access to the
manifest-listed published views + audit sources, and write access for its own activity log. All on
`lr_dev_aws_us_catalog`, warehouse `a3b61648ea4809e3` (CAN_USE already held from the concierge).

```sql
GRANT USE CATALOG ON CATALOG lr_dev_aws_us_catalog TO `7d88f801-5f80-428e-b803-91d4311795de`;
-- read: published views (tiles) + audit sources (audit union), per workbench schema
GRANT USE SCHEMA, SELECT ON SCHEMA lr_dev_aws_us_catalog.reserving_workbench   TO `7d88f801-...`;
GRANT USE SCHEMA, SELECT ON SCHEMA lr_dev_aws_us_catalog.claims_workbench      TO `7d88f801-...`;
GRANT USE SCHEMA, SELECT ON SCHEMA lr_dev_aws_us_catalog.solvency2_workbench   TO `7d88f801-...`;
GRANT USE SCHEMA, SELECT ON SCHEMA lr_dev_aws_us_catalog.ifrs17_workbench      TO `7d88f801-...`;
GRANT USE SCHEMA, SELECT ON SCHEMA lr_dev_aws_us_catalog.bricksurance_re       TO `7d88f801-...`;
GRANT USE SCHEMA, SELECT ON SCHEMA lr_dev_aws_us_catalog.underwriting_workbench TO `7d88f801-...`;
-- write: the group's own activity log (group_activity) — a member of the audit union
GRANT USE SCHEMA, CREATE, MODIFY, SELECT ON SCHEMA lr_dev_aws_us_catalog.bricksurance_agent TO `7d88f801-...`;
```

**MCP connectivity:** the chat calls each live node's `/api/mcp` as the hub SP, on-behalf, over
HTTPS (same workspace) — no extra grant needed beyond the app proxy. Pricing gen2 is cross-workspace
(see GROUP_ARCHITECTURE.md) and may be unreachable.

**Model serving:** `GROUP_MODEL_ENDPOINT` (databricks-claude-sonnet-4-5) — the hub SP already has
query access to the shared FM endpoint.

**Scope is read-only + own-log.** The tower adds no privileges beyond the calling principal's UC
grants; it holds no business data of its own (only the `group_activity` operational log).

## Note
Narrower table-level grants (SELECT only on the specific published views + audit sources named in
the manifest, rather than schema-wide) are the production tightening — schema-wide SELECT was used
here for demo simplicity on synthetic data.
