"""Create (or print) the GTM Cockpit Genie space over the gtm_cockpit schema.

Uses the genie-rooms GenieSpaceBuilder helper to assemble a valid v2
serialized_space, then creates it via `databricks genie create-space`.
Prints the new space_id — paste it into databricks.yml (genie_space_id var).

Run:  .venv/bin/python scripts/create_genie_space.py
"""
import json
import subprocess
import sys
from pathlib import Path

BUILDER = Path("/Users/laurence.ryszka/.vibe/marketplace/plugins/fe-internal-tools/"
               "skills/genie-rooms/resources")
sys.path.insert(0, str(BUILDER))
from genie_space_builder import GenieSpaceBuilder  # noqa: E402

CATALOG = "lr_dev_aws_us_catalog"
SCHEMA = "gtm_cockpit"
WAREHOUSE = "a3b61648ea4809e3"
PROFILE = "DEV"


def fq(t):
    return f"{CATALOG}.{SCHEMA}.{t}"


b = GenieSpaceBuilder(
    title="UKI Insurance GTM Cockpit",
    description=("Natural-language Q&A over the UKI insurance GTM account book — "
                 "accounts, consumption (LIST proxy $), open opps, UCO funnel, SA "
                 "coverage and demo-fit. Synthetic-safe internal GTM data."),
    warehouse_id=WAREHOUSE,
)

for t in ["1_accounts", "2_opps", "3_ucos", "4_contacts",
          "5_demo_map", "6_demo_fit", "7_duplicates"]:
    b.add_table(fq(t))

b.set_instructions(
    "This is a UKI (UK + Ireland) insurance go-to-market account book for "
    "Databricks Field Engineering. Grain: `1_accounts` is one row per account. "
    "`list_365d` and `list_90d` are a trailing consumption PROXY in USD (LIST $), "
    "NOT billed revenue — always caveat this. `has_signal` = the account has "
    "consumption, an open opp, or an active UCO. `coverage_gap` = has signal but "
    "no primary SA (or DSA-only) — these are the priority triage accounts. "
    "UCOs are use-case objects on a U1-U6 funnel (U1 earliest, U6 live); "
    "`uco_active` counts U1-U5. `2_opps` splits the pipeline into rows with "
    "opp_type Renewal vs 'New use case', a stage, and amount USD. `6_demo_fit` "
    "maps each account to the recommended Databricks workbench demo. "
    "`7_duplicates` lists duplicate SFDC records that must be consolidated before "
    "trusting consumption totals (e.g. Aviva has 5 records). When asked about "
    "'the biggest accounts' rank by list_365d. When asked about coverage gaps "
    "filter coverage_gap = true."
)

samples = [
    "Which accounts have signal but no primary SA, ranked by consumption?",
    "Show the top 10 accounts by trailing LIST consumption.",
    "How many accounts sit at zero consumption?",
    "Which Life/Pensions accounts should we lead with LifeCast?",
    "List open renewal opportunities by close date with their stage and amount.",
    "Which accounts have a Chief Actuary contact but no actuarial workbench shown?",
    "Count UCOs by stage U1 to U6 across the book.",
    "Which duplicate SFDC records need consolidating?",
]
b._set_list(b.SAMPLE_QUESTIONS_PATH,
            [{"id": __import__("uuid").uuid4().hex, "question": [s]} for s in samples])

b.add_example_sql(
    "Coverage gaps — signal but no SA",
    f"SELECT account, sub_industry, list_365d, uco_total\n"
    f"FROM {fq('1_accounts')}\nWHERE coverage_gap = true\nORDER BY list_365d DESC",
    "The priority triage list every lead asks for first.",
)
b.add_example_sql(
    "Renewal calendar",
    f"SELECT account, opp_name, stage, amount, close_date\n"
    f"FROM {fq('2_opps')}\nWHERE opp_type = 'Renewal'\nORDER BY close_date",
    "Open renewals by close date.",
)

b.validate()
serialized = b.to_json()

out = Path(__file__).resolve().parent.parent / "data" / "genie_space.json"
out.write_text(serialized)
print(f"Serialized space written → {out} ({len(serialized)} bytes)")

# Create the space via CLI.
cmd = ["databricks", "genie", "create-space", WAREHOUSE, serialized,
       "--title", b.title, "--description", b.description,
       "--profile", PROFILE, "-o", "json"]
res = subprocess.run(cmd, capture_output=True, text=True)
if res.returncode != 0:
    print("CREATE FAILED:", res.stderr[:800])
    sys.exit(1)
resp = json.loads(res.stdout)
print("space_id:", resp.get("space_id") or resp.get("id"))
print(json.dumps({k: resp.get(k) for k in ("space_id", "title", "warehouse_id")}, indent=2))
