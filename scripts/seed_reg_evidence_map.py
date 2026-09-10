#!/usr/bin/env python3
"""Create + seed group_regulatory.reg_evidence_map — (framework, article/control)
-> the estate asset that evidences it. First-pass seed; human-refined (WS-B)."""
import json, subprocess

WH = "a3b61648ea4809e3"
TBL = "lr_dev_aws_us_catalog.group_regulatory.reg_evidence_map"

def run(stmt):
    p = subprocess.run(
        ["databricks", "api", "post", "/api/2.0/sql/statements", "--profile", "DEV",
         "--json", json.dumps({"warehouse_id": WH, "statement": stmt, "wait_timeout": "30s"})],
        capture_output=True, text=True)
    try:
        d = json.loads(p.stdout)
        st = d.get("status", {})
        return st.get("state"), (st.get("error") or {}).get("message", ""), d.get("result", {})
    except Exception:
        return "ERR", p.stdout[:200] + p.stderr[:200], {}

# Rows: framework | ref | requirement | control (estate asset) | asset_kind | asset_location | owner | status
ROWS = [
    ("eu-ai-act", "Art 12", "Record-keeping / automatic logging", "Governed AI audit events on every workbench", "audit", "per-node audit_source (e.g. reserving_workbench.5_gov_audit_event)", "all nodes", "evidenced"),
    ("eu-ai-act", "Art 14", "Human oversight", "Overlays Register: overrides with magnitude, rationale, approver", "overlays", "pricing / reserving overlays register", "pricing,reserving", "evidenced"),
    ("eu-ai-act", "Art 13", "Transparency to deployers", "Page explainers and why-decided rationale", "ui", "workbench app pages", "all nodes", "partial"),
    ("eu-ai-act", "Art 11 / Annex IV", "Technical documentation", "Model registry: versions, model cards, champion/challenger", "model_registry", "Unity Catalog MLflow registry", "model nodes", "partial"),
    ("eu-ai-act", "Art 10", "Data and data governance", "Unity Catalog lineage/access plus bias monitoring", "lineage", "Unity Catalog + pricing bias checks", "platform,pricing", "partial"),
    ("eu-ai-act", "Art 15", "Accuracy and robustness", "MLflow evaluation and oracle tests", "eval", "mlflow eval runs", "pricing,claim-to-confidence", "partial"),
    ("eu-ai-act", "Art 27", "Fundamental rights impact assessment", "FRIA record scaffold for life/health high-risk", "manifest", "group_regulatory.reg_fria (roadmap)", "lifecast", "roadmap"),
    ("eu-ai-act", "Art 50", "Transparency to users", "Agent AI-disclosure and generated-content marking", "ui", "workbench chat surfaces", "agent nodes", "partial"),
    ("dora", "Art 28", "ICT third-party risk / Register of Information", "ICT third-party register", "manifest", "ESTATE_MANIFEST regulatory.ict_register", "group", "evidenced"),
    ("dora", "Art 9-10", "ICT protection and detection", "UC access control + audit events + OTEL telemetry", "lineage", "Unity Catalog + OTEL logs", "platform", "evidenced"),
    ("dora", "Art 17", "ICT incident management", "Audit union plus advise-only incident scan", "audit", "audit union + regulatory:incidents", "group", "partial"),
    ("dora", "Art 11", "Business continuity and recovery", "Critical functions with RTO/RPO/BIA", "manifest", "ESTATE_MANIFEST regulatory.critical_functions", "group", "partial"),
    ("dora", "Art 24-27", "Digital operational resilience testing (TLPT)", "Testing programme", "roadmap", "n/a", "group", "roadmap"),
    ("solvency-2", "Model governance", "Model validation and reproducibility", "Model registry + overlays + reserving validation", "model_registry", "reserving / solvency validation + overlays", "reserving,solvency2", "evidenced"),
]

print("create:", run(f"""CREATE TABLE IF NOT EXISTS {TBL} (
  framework STRING, ref STRING, requirement STRING, control STRING,
  asset_kind STRING, asset_location STRING, owner STRING, status STRING
) USING DELTA COMMENT '[group-regulatory] Article/control -> estate evidence asset. Seed, human-refined (WS-B). bxc_project=group_regulatory'""")[:2])
print("tag:", run(f"ALTER TABLE {TBL} SET TAGS ('bxc_project'='group_regulatory','bxc_group_contract'='1')")[:2])
print("clear:", run(f"DELETE FROM {TBL}")[:2])
vals = ",".join("(" + ",".join("'" + c.replace("'", "''") + "'" for c in r) + ")" for r in ROWS)
print("insert:", run(f"INSERT INTO {TBL} (framework,ref,requirement,control,asset_kind,asset_location,owner,status) VALUES {vals}")[:2])
state, err, res = run(f"SELECT framework, count(*) n, sum(CASE WHEN status='evidenced' THEN 1 ELSE 0 END) evidenced FROM {TBL} GROUP BY framework ORDER BY framework")
print("verify:", state, err[:120])
for row in res.get("data_array", []):
    print("  ", row)
