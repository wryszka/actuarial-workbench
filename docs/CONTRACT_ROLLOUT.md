# Contract rollout — per-workbench checklist

Status of the `vw_group_*` publish-contract views (see GROUP_PUBLISH_CONTRACT.md) per node.
The group view lights up a node's cards/sections as its views ship; missing → degrades.

Legend: ✅ shipped · 🟡 stubbed (view exists, thin/placeholder data) · ⬜ not started · n/a not applicable

| Node (schema) | headline | attention | decisions | calendar | readiness |
|---|---|---|---|---|---|
| solvency2 (`solvency2_workbench`) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| reserving (`reserving_workbench`) | ⬜ | ⬜ | ⬜ | ⬜ | n/a |
| claims (`claims_workbench`) | ⬜ | ⬜ | ⬜ | ⬜ | n/a |
| underwriting (`underwriting_workbench`) | ⬜ | ⬜ | ⬜ | ⬜ | n/a |
| reinsurance (`bricksurance_re`) | ⬜ | ⬜ | ⬜ | ⬜ | n/a |
| ifrs17 (`ifrs17_workbench`) | ⬜ | ⬜ | n/a | ⬜ | ⬜ |
| pricing gen2 (cross-workspace) | via MCP@warm-up | via MCP@warm-up | — | — | — |

## Source material located (from schema scans this session)
Each view is a thin `CREATE VIEW` over state the workbench already holds — no new computation.
Candidate sources to build from:
- **solvency2**: SCR/ORSA + readiness already computed by its own control tower (`Today` page /
  `/api/today` + `6_*` gold/monitoring tables); `5_mon_agent_audit` etc. Mostly **re-expose** what
  the local tower reads. Attention ≈ its existing attention items; calendar ≈ QRT close dates.
- **reserving**: `regulatory_landing`, `reserve_discounted`, `5_gov_audit_event`; attention ≈ its
  `/api/attention`; decisions ≈ pending selection approvals; calendar ≈ valuation sign-off date.
- **claims**: `gold_sla_prediction`, `gold_qa_scores`, `gold_vulnerability_flags`,
  `gold_handler_decisions`; headline = SLA/throughput; attention = vulnerability/QA flags;
  decisions = pending handler decisions.
- **underwriting**: `gold_ai_activity`, referral-control state; headline = GWP/appetite; attention =
  referral discipline breaches; decisions = referrals/committee queue; calendar = renewals due.
- **reinsurance**: `gov_ai_activity`; headline = capacity/capital headroom; attention = zone
  accumulation; decisions = submissions awaiting decision.
- **ifrs17**: close cockpit state; headline = CSM/onerous; calendar = IFRS 17 close; readiness =
  close stages.

## DDL shape (every view follows this pattern — example: claims headline)
```sql
CREATE OR REPLACE VIEW lr_dev_aws_us_catalog.claims_workbench.vw_group_headline AS
SELECT 'sla_on_time' AS metric_key, 'Claims SLA on-time' AS label,
       <value> AS value, '%' AS unit,
       <delta_1d> AS delta_1d, <delta_qtd> AS delta_qtd, 'up_good' AS direction,
       <as_of> AS as_of,
       'https://claims-workbench-7474656169654171.aws.databricksapps.com/' AS deep_link
FROM <existing gold view>
UNION ALL SELECT 'open_claims', ... ;
```

## Grants
Each shipped view is auto-covered by the schema-level SELECT already granted to the group SP
(`GRANT ... SELECT ON SCHEMA <schema>`; see GRANTS.md). No per-view grant needed.

## Rollout order (V2-P1)
solvency2 first (highest exec value; re-exposes existing) → claims → reserving → underwriting →
reinsurance → ifrs17. Ship `vw_group_headline` + `vw_group_attention` for each before the richer
classes; the group posture strip + attention feed need only those two to be compelling.
