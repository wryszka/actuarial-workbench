"""Seed the governed Unity Catalog tables for the GTM Cockpit.

Reads gtm-cockpit/data/gtm_seed.json (produced by parse_gtm_data.py) and
materialises the schema + numbered Delta tables via the SQL warehouse
(Statement Execution API through the Databricks SDK). Idempotent: drops and
recreates the read tables each run; creates the writeback tables only if
absent so recorded decisions survive a reseed.

Run:  python3 scripts/seed_uc.py            # dev (profile DEV)
      CATALOG=... SCHEMA=... WAREHOUSE=... python3 scripts/seed_uc.py

Tables
  1_accounts     one row per account, flattened facts + derived flags
  2_opps         one row per open opportunity (parsed from the blob)
  3_ucos         one row per use-case object with its U1–U6 stage
  4_contacts     one row per named contact + title
  5_demo_map     the nine workbenches → business process / incumbent / fit
  6_demo_fit     one row per (account, recommended demo) — feeds the matrix
  7_duplicates   duplicate SFDC-record clusters flagged for consolidation
  decisions      WRITEBACK — every lead decision (assign SA, priority, …)
  decisions_audit WRITEBACK — append-only audit of decision changes
"""
import json
import os
import time
from pathlib import Path

from databricks.sdk import WorkspaceClient
from databricks.sdk.service.sql import StatementState

DATA = Path(__file__).resolve().parent.parent / "data"
CATALOG = os.getenv("CATALOG", "lr_dev_aws_us_catalog")
SCHEMA = os.getenv("SCHEMA", "gtm_cockpit")
WAREHOUSE = os.getenv("WAREHOUSE", "a3b61648ea4809e3")
PROFILE = os.getenv("DATABRICKS_PROFILE", "DEV")

w = WorkspaceClient(profile=PROFILE)


def run(sql: str, scoped: bool = True):
    """Execute a statement. When scoped, sets catalog+schema so unqualified
    table names resolve (each statement is its own session — USE doesn't stick)."""
    kwargs = {"statement": sql, "warehouse_id": WAREHOUSE, "wait_timeout": "50s"}
    if scoped:
        kwargs["catalog"] = CATALOG
        kwargs["schema"] = SCHEMA
    r = w.statement_execution.execute_statement(**kwargs)
    # Poll if still running.
    while r.status and r.status.state in (StatementState.PENDING, StatementState.RUNNING):
        time.sleep(1)
        r = w.statement_execution.get_statement(r.statement_id)
    if r.status and r.status.state == StatementState.FAILED:
        msg = r.status.error.message if r.status.error else "unknown"
        raise RuntimeError(f"SQL failed: {msg}\n---\n{sql[:500]}")
    return r


def q(v) -> str:
    """SQL literal for a python value."""
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "TRUE" if v else "FALSE"
    if isinstance(v, (int, float)):
        return repr(v)
    return "'" + str(v).replace("\\", "\\\\").replace("'", "''") + "'"


def insert_batch(table: str, cols: list[str], rows: list[list], batch=40):
    if not rows:
        return
    collist = ", ".join(cols)
    for i in range(0, len(rows), batch):
        chunk = rows[i:i + batch]
        values = ",\n".join("(" + ", ".join(q(v) for v in row) + ")" for row in chunk)
        run(f"INSERT INTO {SCHEMA}.{table} ({collist}) VALUES\n{values}")


def main():
    seed = json.loads((DATA / "gtm_seed.json").read_text())
    accounts = seed["accounts"]

    run(f"CREATE SCHEMA IF NOT EXISTS {CATALOG}.{SCHEMA} "
        f"COMMENT 'UKI Insurance GTM Cockpit — governed account/opp/UCO model + decision writeback (synthetic-safe internal GTM data).'",
        scoped=False)

    # ── 1_accounts ────────────────────────────────────────────────────────
    run("DROP TABLE IF EXISTS `1_accounts`")
    run("""CREATE TABLE `1_accounts` (
        rank INT, account STRING, sub_industry STRING, country STRING,
        segment STRING, tier STRING, ae STRING, ae_role STRING,
        sa_primary STRING, sa_count INT, has_sa BOOLEAN,
        list_365d DOUBLE, list_90d DOUBLE,
        open_opp_total DOUBLE, renewal_total DOUBLE, n_opps INT,
        uco_total INT, uco_active INT, uco_max_stage STRING,
        u1 INT, u2 INT, u3 INT, u4 INT, u5 INT, u6 INT,
        incumbent STRING, elevate_to STRING, demos STRING, signal_note STRING,
        has_signal BOOLEAN, coverage_gap BOOLEAN, active BOOLEAN,
        uk_driven BOOLEAN, active_consuming BOOLEAN,
        seat_chief_actuary BOOLEAN, seat_cdo BOOLEAN, seat_cuo BOOLEAN,
        seat_head_pricing BOOLEAN, seat_cro BOOLEAN, seat_cfo BOOLEAN, seat_cto BOOLEAN
    ) USING DELTA COMMENT 'One row per UKI insurance account: flattened facts + derived signal/coverage flags. active = real assigned AE + signal (the honest "accounts we actually talk to" denominator).'""")
    acct_cols = ["rank", "account", "sub_industry", "country", "segment", "tier",
                 "ae", "ae_role", "sa_primary", "sa_count", "has_sa",
                 "list_365d", "list_90d", "open_opp_total", "renewal_total", "n_opps",
                 "uco_total", "uco_active", "uco_max_stage",
                 "u1", "u2", "u3", "u4", "u5", "u6",
                 "incumbent", "elevate_to", "demos", "signal_note",
                 "has_signal", "coverage_gap", "active", "uk_driven", "active_consuming",
                 "seat_chief_actuary", "seat_cdo", "seat_cuo",
                 "seat_head_pricing", "seat_cro", "seat_cfo", "seat_cto"]
    acct_rows = []
    for a in accounts:
        c = a["uco_counts"]
        s = a["seats"]
        acct_rows.append([
            a["rank"], a["account"], a["sub_industry"], a["country"], a["segment"], a["tier"],
            a["ae"], a["ae_role"], a["sa_primary"], a["sa_count"], a["has_sa"],
            a["list_365d"], a["list_90d"], a["open_opp_total"], a["renewal_total"], a["n_opps"],
            a["uco_total"], a["uco_active"], a["uco_max_stage"],
            c["U1"], c["U2"], c["U3"], c["U4"], c["U5"], c["U6"],
            a["incumbent"], a["elevate_to"], " · ".join(a["demos"]), a["signal_note"],
            a["has_signal"], a["coverage_gap"], a["active"],
            a["uk_driven"], a["active_consuming"],
            s["Chief Actuary"], s["CDO"], s["CUO"], s["Head of Pricing"],
            s["CRO"], s["CFO / Finance"], s["CTO"],
        ])
    insert_batch("1_accounts", acct_cols, acct_rows)

    # ── 2_opps ────────────────────────────────────────────────────────────
    run("DROP TABLE IF EXISTS `2_opps`")
    run("""CREATE TABLE `2_opps` (
        account STRING, opp_name STRING, stage STRING, amount DOUBLE,
        amount_raw STRING, opp_type STRING, close_date STRING
    ) USING DELTA COMMENT 'One row per open opportunity, parsed from the account book free-text.'""")
    opp_rows = [[a["account"], o["name"], o["stage"], o["amount"], o["amount_raw"],
                 o["type"], o["close_date"]]
                for a in accounts for o in a["opps"]]
    insert_batch("2_opps", ["account", "opp_name", "stage", "amount", "amount_raw",
                            "opp_type", "close_date"], opp_rows)

    # ── 3_ucos ────────────────────────────────────────────────────────────
    run("DROP TABLE IF EXISTS `3_ucos`")
    run("""CREATE TABLE `3_ucos` (
        account STRING, uco_name STRING, stage STRING
    ) USING DELTA COMMENT 'One row per use-case object with its U1–U6 funnel stage.'""")
    uco_rows = [[a["account"], u["name"], u["stage"]]
                for a in accounts for u in a["uco_items"]]
    insert_batch("3_ucos", ["account", "uco_name", "stage"], uco_rows)

    # ── 4_contacts ────────────────────────────────────────────────────────
    run("DROP TABLE IF EXISTS `4_contacts`")
    run("""CREATE TABLE `4_contacts` (
        account STRING, name STRING, title STRING
    ) USING DELTA COMMENT 'One row per named key contact + title (persona reachability).'""")
    contact_rows = [[a["account"], ct["name"], ct["title"]]
                    for a in accounts for ct in a["contacts"]]
    insert_batch("4_contacts", ["account", "name", "title"], contact_rows)

    # ── 5_demo_map ────────────────────────────────────────────────────────
    run("DROP TABLE IF EXISTS `5_demo_map`")
    run("""CREATE TABLE `5_demo_map` (
        workbench STRING, business_process STRING, incumbent STRING, best_fit STRING
    ) USING DELTA COMMENT 'The nine workbenches → business process / incumbent it coexists with / best-fit sub-industry.'""")
    insert_batch("5_demo_map", ["workbench", "business_process", "incumbent", "best_fit"],
                 [[d["workbench"], d["process"], d["incumbent"], d["best_fit"]] for d in seed["demo_map"]])

    # ── 6_demo_fit ────────────────────────────────────────────────────────
    run("DROP TABLE IF EXISTS `6_demo_fit`")
    run("""CREATE TABLE `6_demo_fit` (
        account STRING, sub_industry STRING, workbench STRING,
        list_365d DOUBLE, has_signal BOOLEAN, has_sa BOOLEAN
    ) USING DELTA COMMENT 'One row per (account, recommended workbench) — feeds the demo-fit matrix.'""")
    fit_rows = [[a["account"], a["sub_industry"], d, a["list_365d"], a["has_signal"], a["has_sa"]]
                for a in accounts for d in a["demos"] if d]
    insert_batch("6_demo_fit", ["account", "sub_industry", "workbench",
                                "list_365d", "has_signal", "has_sa"], fit_rows)

    # ── 7_duplicates ──────────────────────────────────────────────────────
    run("DROP TABLE IF EXISTS `7_duplicates`")
    run("""CREATE TABLE `7_duplicates` (
        cluster STRING, records STRING, record_count INT, source STRING
    ) USING DELTA COMMENT 'Duplicate SFDC-record clusters flagged for consolidation before allocation math.'""")
    insert_batch("7_duplicates", ["cluster", "records", "record_count", "source"],
                 [[d["cluster"], " | ".join(d["records"]), d["count"], d["source"]] for d in seed["duplicates"]])

    # ── 8_software ──────────────────────────────────────────────────────────
    run("DROP TABLE IF EXISTS `8_software`")
    run("""CREATE TABLE `8_software` (
        account STRING, sub_industry STRING, software STRING, function STRING,
        category STRING, displaced_by STRING, list_365d DOUBLE
    ) USING DELTA COMMENT 'One row per (account, software) mention detected across incumbent/opps/UCO text — the "is Radar/Tyche/Python in play?" index.'""")
    sw_rows = [[a["account"], a["sub_industry"], s["software"], s["function"],
                s["category"], s["displaced_by"], a["list_365d"]]
               for a in accounts for s in a["software"]]
    insert_batch("8_software", ["account", "sub_industry", "software", "function",
                                "category", "displaced_by", "list_365d"], sw_rows)

    # ── 9_functions ─────────────────────────────────────────────────────────
    run("DROP TABLE IF EXISTS `9_functions`")
    run("""CREATE TABLE `9_functions` (
        account STRING, sub_industry STRING, function STRING, seat STRING,
        connected BOOLEAN, from_uco BOOLEAN, from_software BOOLEAN,
        list_365d DOUBLE, has_sa BOOLEAN
    ) USING DELTA COMMENT 'One row per (account, business function) with persona-connection status — feeds the Function Explorer.'""")
    fn_rows = [[a["account"], a["sub_industry"], f["function"], f["seat"],
                f["connected"], f["from_uco"], f["from_software"], a["list_365d"], a["has_sa"]]
               for a in accounts for f in a["functions"]]
    insert_batch("9_functions", ["account", "sub_industry", "function", "seat",
                                 "connected", "from_uco", "from_software", "list_365d", "has_sa"], fn_rows)

    # ── 10_recommendations ────────────────────────────────────────────────────
    run("DROP TABLE IF EXISTS `10_recommendations`")
    run("""CREATE TABLE `10_recommendations` (
        account STRING, workbench STRING, reasons STRING, score INT
    ) USING DELTA COMMENT 'Transparent per-account demo recommendation rationale — the signals behind each "lead with" call.'""")
    reco_rows = [[a["account"], r["workbench"], " · ".join(r["reasons"]), r["score"]]
                 for a in accounts for r in a["rationale"]]
    insert_batch("10_recommendations", ["account", "workbench", "reasons", "score"], reco_rows)

    # ── 11_impact ─────────────────────────────────────────────────────────────
    # impact_data.py names real customer accounts + engagement detail, so it's
    # kept local-only (gitignored). If absent (fresh clone), the table is still
    # created empty so the app's Impact view degrades gracefully.
    run("DROP TABLE IF EXISTS `11_impact`")
    run("""CREATE TABLE `11_impact` (
        account STRING, helped BOOLEAN, meetings INT, clevel BOOLEAN,
        clevel_detail STRING, keywords STRING, what STRING, note STRING, source STRING
    ) USING DELTA COMMENT 'Impact footprint — accounts materially helped, meeting counts, C-level engagement, keywords. Evidence-based (promo deck / evidence pack / kudos / calendar-email-slack). Local-only seed.'""")
    impact_path = Path(__file__).resolve().parent / "impact_data.py"
    if impact_path.exists():
        import importlib.util
        spec = importlib.util.spec_from_file_location("impact_data", impact_path)
        impact_mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(impact_mod)
        imp_rows = [[i["account"], True, i["meetings"], i["clevel"], i["clevel_detail"],
                     " · ".join(i["keywords"]), i["what"], i["note"], i["source"]]
                    for i in impact_mod.IMPACT]
        insert_batch("11_impact", ["account", "helped", "meetings", "clevel",
                                   "clevel_detail", "keywords", "what", "note", "source"], imp_rows)
    else:
        print("  (impact_data.py not present — 11_impact left empty)")

    # ── decisions (writeback) — create only if absent ───────────────────────
    run("""CREATE TABLE IF NOT EXISTS decisions (
        decision_id STRING, account STRING, action STRING,
        value STRING, detail STRING, owner STRING, due_date STRING,
        status STRING, changed_by STRING, changed_at TIMESTAMP
    ) USING DELTA COMMENT 'Lead decisions recorded in the cockpit (assign SA, set priority, log next step, flag risk, claim whitespace, DQ flag, endorse play, designate strategic).'""")
    run("""CREATE TABLE IF NOT EXISTS decisions_audit (
        event_id STRING, decision_id STRING, account STRING, action STRING,
        value STRING, changed_by STRING, changed_at TIMESTAMP
    ) USING DELTA COMMENT 'Append-only audit trail for every decision written back.'""")

    # ── verify ──────────────────────────────────────────────────────────────
    for t in ["1_accounts", "2_opps", "3_ucos", "4_contacts", "5_demo_map",
              "6_demo_fit", "7_duplicates", "8_software", "9_functions",
              "10_recommendations", "11_impact", "decisions"]:
        r = run(f"SELECT COUNT(*) AS n FROM `{t}`")
        n = r.result.data_array[0][0] if r.result and r.result.data_array else "?"
        print(f"  {SCHEMA}.{t:<14} rows={n}")
    print(f"Seeded {CATALOG}.{SCHEMA} ✓")


if __name__ == "__main__":
    main()
