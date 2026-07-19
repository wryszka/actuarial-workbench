# UKI Insurance GTM Cockpit

A data-backed Databricks App that turns the actuarial-workbench demo portfolio
into a **territory operating system**. It reads a governed Unity Catalog model
of the UKI insurance GTM book (182 accounts) and gives SME, insurance-global,
sales and FE leads one place to decide *what demo to show which account next*,
and to **record decisions with an audit trail**.

Reached from the actuarial-workbench hub's **GTM planning** page (a prominent
card above the source Google maps).

## Views

| View | Who it's for | What it does |
|------|--------------|--------------|
| **Territory Overview** | Global / SME leads | The barbell (top-5 logos ≈ 60% of consumption, long tail of $0 accounts), sub-industry mix, coverage headline. |
| **Coverage Gaps** ⭐ | SME · FE · sales | The signal-without-a-specialist queue (consumption/opps/active UCOs but no SA), one-click *Assign SA* writeback, SA load-balance roll-up. |
| **Accelerator Queue** ⭐ | Sales | Every open opp joined to its next-best demo + elevation persona, ranked by value; renewal calendar with risk flags. |
| **Demo-Fit Matrix** | SME · global | Workbench × sub-industry demand; supply/demand per workbench (over/under-built); demo→process/incumbent map. |
| **EMEA Replicability** | Global lead | Size a proven UKI play across the wider EMEA book (EMEA figures are a documented estimate — see caveat). |
| **All Accounts** | Everyone | The searchable full book; every row opens an Account 360 drawer. |
| **Ask (Genie)** | Everyone | Natural-language Q&A over the governed tables; shows the generated SQL + data so answers cite their source. |
| **Data Quality** | All leads | Duplicate-record dedupe queue (Aviva ×5 etc.) + unassigned-signal list, as tracked items. |

## Stack

- **Frontend** — React 19 + Vite + Tailwind 4 (TypeScript), a left-nav SPA.
- **Backend** — FastAPI: read endpoints per view, audited decision **writeback**
  (`X-Forwarded-Email` identity), and a Genie Conversation REST proxy.
- **Data** — governed Unity Catalog schema `gtm_cockpit` (numbered Delta tables
  `1_accounts` … `7_duplicates` + `decisions` / `decisions_audit`), a SQL
  warehouse, and a Genie space over the schema.

## Data model (governed UC)

Seeded by `scripts/parse_gtm_data.py` (parses the raw UKI sheet/plan — money,
free-text opps, UCO stages, SA roles, contact seats, demo-fit, dedupe clusters)
→ `scripts/seed_uc.py` (creates schema + loads Delta). The raw GTM data (real
account names, consumption, deal stages) is **not** committed — see `.gitignore`.

## Build / run

```bash
# 1. Data layer (once / on data change) — needs the UKI export in data/
make parse            # → data/gtm_seed.json
make seed             # create schema + load governed UC tables (dev)
make genie            # create the Genie space (prints space_id → databricks.yml)

# 2. Local dev
make dev              # backend (uvicorn:8000) + frontend (vite)

# 3. Deploy
make deploy-dev       # build SPA + bundle deploy + app deploy (dev)
make app-start / app-stop
```

**Deployed (dev):** `https://gtm-cockpit-7474656169654171.aws.databricksapps.com`
(FE dev workspace `fevm-lr-dev-aws-us`, app name `gtm-cockpit`).

After first deploy, grant the app's service principal `CAN_USE` on the warehouse,
`USE/SELECT/MODIFY` on the schema, and `CAN_RUN` on the Genie space.

## About this demo

Built by Databricks Field Engineering as an **internal GTM planning aid** layered
on top of Salesforce — not a system of record. Consumption is trailing-12-month
**LIST $**, a relative ranking proxy, **not** billed revenue. Sub-industry and
incumbent fields are partly name-inferred; duplicate SFDC records split some
logos' figures (see the Data Quality view). Decisions written here land in
`gtm_cockpit.decisions`; they do not change Salesforce.
