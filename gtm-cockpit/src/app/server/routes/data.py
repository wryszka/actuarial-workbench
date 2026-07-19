"""Read endpoints powering the cockpit views.

Each endpoint runs governed SQL against the gtm_cockpit schema and returns
JSON the frontend renders directly. All money is LIST $ — a trailing
consumption PROXY, not billed revenue (surfaced as a caveat in the UI).
"""
import logging

from fastapi import APIRouter, HTTPException

from server.config import fqn
from server.sql import execute_query

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["data"])

A = fqn("1_accounts")
O = fqn("2_opps")
U = fqn("3_ucos")
C = fqn("4_contacts")
DM = fqn("5_demo_map")
DF = fqn("6_demo_fit")
DUP = fqn("7_duplicates")
SW = fqn("8_software")
FN = fqn("9_functions")
RECO = fqn("10_recommendations")
IMP = fqn("11_impact")
DEC = fqn("decisions")


async def _one(sql: str):
    rows = await execute_query(sql)
    return rows[0] if rows else {}


# ── Territory overview ─────────────────────────────────────────────────────
@router.get("/overview")
async def overview():
    """Barbell / concentration, mix, coverage headline — the global-lead view."""
    try:
        totals = await _one(f"""
            SELECT
              COUNT(*) AS n_accounts,
              SUM(CASE WHEN has_signal THEN 1 ELSE 0 END) AS n_signal,
              SUM(CASE WHEN list_365d = 0 THEN 1 ELSE 0 END) AS n_zero,
              SUM(CASE WHEN coverage_gap THEN 1 ELSE 0 END) AS n_coverage_gap,
              SUM(CASE WHEN NOT has_sa THEN 1 ELSE 0 END) AS n_no_sa,
              ROUND(SUM(list_365d)) AS total_list,
              ROUND(SUM(open_opp_total)) AS total_open_opp,
              ROUND(SUM(renewal_total)) AS total_renewal,
              SUM(uco_total) AS total_ucos
            FROM {A}""")

        by_sub = await execute_query(f"""
            SELECT sub_industry,
                   COUNT(*) AS n,
                   ROUND(SUM(list_365d)) AS list_365d,
                   SUM(CASE WHEN has_signal THEN 1 ELSE 0 END) AS n_signal
            FROM {A} GROUP BY sub_industry ORDER BY list_365d DESC""")

        # Pareto: cumulative share of LIST across ranked accounts.
        top = await execute_query(f"""
            SELECT account, sub_industry, ROUND(list_365d) AS list_365d, has_sa
            FROM {A} WHERE list_365d > 0 ORDER BY list_365d DESC LIMIT 10""")

        by_country = await execute_query(f"""
            SELECT country, COUNT(*) AS n, ROUND(SUM(list_365d)) AS list_365d
            FROM {A} GROUP BY country ORDER BY n DESC""")

        # top-5 concentration %
        top5 = await _one(f"""
            WITH ranked AS (
              SELECT list_365d, ROW_NUMBER() OVER (ORDER BY list_365d DESC) AS rn
              FROM {A})
            SELECT ROUND(SUM(CASE WHEN rn <= 5 THEN list_365d ELSE 0 END)) AS top5,
                   ROUND(SUM(list_365d)) AS total FROM ranked""")
        return {"totals": totals, "by_sub": by_sub, "top_accounts": top,
                "by_country": by_country, "top5": top5}
    except Exception as e:
        logger.exception("overview failed")
        raise HTTPException(500, str(e)[:300])


# ── Coverage gaps (hero: SME + FE + sales) ─────────────────────────────────
@router.get("/coverage-gaps")
async def coverage_gaps():
    try:
        gaps = await execute_query(f"""
            SELECT rank, account, sub_industry, country, ae, sa_primary,
                   ROUND(list_365d) AS list_365d, ROUND(list_90d) AS list_90d,
                   uco_total, uco_active, uco_max_stage, n_opps,
                   ROUND(open_opp_total) AS open_opp_total, demos, incumbent, signal_note,
                   seat_chief_actuary, seat_cdo, seat_cuo, seat_head_pricing
            FROM {A} WHERE coverage_gap = true ORDER BY list_365d DESC""")
        # SA load table — one row per SA with their book.
        sa_load = await execute_query(f"""
            SELECT sa_primary AS sa,
                   COUNT(*) AS n_accounts,
                   SUM(CASE WHEN has_signal THEN 1 ELSE 0 END) AS n_signal,
                   ROUND(SUM(list_365d)) AS list_365d,
                   ROUND(SUM(open_opp_total)) AS open_opp_total,
                   SUM(uco_active) AS active_ucos
            FROM {A} WHERE sa_primary IS NOT NULL
            GROUP BY sa_primary ORDER BY list_365d DESC""")
        return {"gaps": gaps, "sa_load": sa_load}
    except Exception as e:
        logger.exception("coverage-gaps failed")
        raise HTTPException(500, str(e)[:300])


# ── Accelerator queue + renewals (sales) ───────────────────────────────────
@router.get("/accelerator")
async def accelerator():
    try:
        # Open opps joined to the account's recommended demo + elevate target.
        opps = await execute_query(f"""
            SELECT o.account, o.opp_name, o.stage, ROUND(o.amount) AS amount,
                   o.opp_type, o.close_date,
                   a.demos, a.elevate_to, a.incumbent, a.sub_industry,
                   a.sa_primary, ROUND(a.list_365d) AS list_365d
            FROM {O} o JOIN {A} a ON o.account = a.account
            ORDER BY o.amount DESC""")
        renewals = await execute_query(f"""
            SELECT o.account, o.opp_name, o.stage, ROUND(o.amount) AS amount, o.close_date,
                   a.sa_primary, a.demos
            FROM {O} o JOIN {A} a ON o.account = a.account
            WHERE o.opp_type = 'Renewal' AND o.close_date IS NOT NULL
            ORDER BY o.close_date""")
        by_stage = await execute_query(f"""
            SELECT stage, opp_type, COUNT(*) AS n, ROUND(SUM(amount)) AS amount
            FROM {O} WHERE stage != '' GROUP BY stage, opp_type ORDER BY amount DESC""")
        return {"opps": opps, "renewals": renewals, "by_stage": by_stage}
    except Exception as e:
        logger.exception("accelerator failed")
        raise HTTPException(500, str(e)[:300])


# ── Demo-fit matrix + incumbent displacement (SME + global) ────────────────
@router.get("/demo-fit")
async def demo_fit():
    try:
        matrix = await execute_query(f"""
            SELECT workbench, sub_industry,
                   COUNT(*) AS n,
                   SUM(CASE WHEN has_signal THEN 1 ELSE 0 END) AS n_signal,
                   SUM(CASE WHEN has_sa THEN 1 ELSE 0 END) AS n_covered,
                   ROUND(SUM(list_365d)) AS list_365d
            FROM {DF} GROUP BY workbench, sub_industry""")
        demo_map = await execute_query(f"SELECT * FROM {DM}")
        # per-workbench demand summary (addressable accounts + whitespace $).
        by_workbench = await execute_query(f"""
            SELECT workbench,
                   COUNT(*) AS n_accounts,
                   SUM(CASE WHEN has_signal THEN 1 ELSE 0 END) AS n_signal,
                   SUM(CASE WHEN NOT has_signal THEN 1 ELSE 0 END) AS n_whitespace,
                   ROUND(SUM(list_365d)) AS list_365d
            FROM {DF} GROUP BY workbench ORDER BY n_accounts DESC""")
        return {"matrix": matrix, "demo_map": demo_map, "by_workbench": by_workbench}
    except Exception as e:
        logger.exception("demo-fit failed")
        raise HTTPException(500, str(e)[:300])


# ── EMEA replicability (global lead) ───────────────────────────────────────
@router.get("/replicability")
async def replicability():
    """UKI-side sizing of proven plays by sub-industry × incumbent. The EMEA
    projection is a documented stub (see UI note) pending EMEA data ingestion."""
    try:
        plays = await execute_query(f"""
            SELECT sub_industry,
                   COUNT(*) AS uki_accounts,
                   SUM(CASE WHEN has_signal THEN 1 ELSE 0 END) AS uki_signal,
                   SUM(CASE WHEN NOT has_signal THEN 1 ELSE 0 END) AS uki_whitespace,
                   ROUND(SUM(list_365d)) AS list_365d
            FROM {A} GROUP BY sub_industry ORDER BY uki_accounts DESC""")
        return {"plays": plays}
    except Exception as e:
        logger.exception("replicability failed")
        raise HTTPException(500, str(e)[:300])


# ── Account 360 ────────────────────────────────────────────────────────────
@router.get("/account/{account}")
async def account_detail(account: str):
    from server.sql import esc
    a = esc(account)
    try:
        acct = await _one(f"SELECT * FROM {A} WHERE account = '{a}'")
        if not acct:
            raise HTTPException(404, "account not found")
        opps = await execute_query(
            f"SELECT opp_name, stage, ROUND(amount) AS amount, opp_type, close_date "
            f"FROM {O} WHERE account = '{a}' ORDER BY amount DESC")
        ucos = await execute_query(
            f"SELECT uco_name, stage FROM {U} WHERE account = '{a}' ORDER BY stage")
        contacts = await execute_query(
            f"SELECT name, title FROM {C} WHERE account = '{a}'")
        decisions = await execute_query(
            f"SELECT action, value, detail, owner, due_date, status, changed_by, "
            f"CAST(changed_at AS STRING) AS changed_at FROM {DEC} "
            f"WHERE account = '{a}' ORDER BY changed_at DESC")
        software = await execute_query(
            f"SELECT software, function, category, displaced_by FROM {SW} WHERE account = '{a}'")
        rationale = await execute_query(
            f"SELECT workbench, reasons, score FROM {RECO} WHERE account = '{a}' ORDER BY score DESC")
        functions = await execute_query(
            f"SELECT function, seat, connected FROM {FN} WHERE account = '{a}'")
        return {"account": acct, "opps": opps, "ucos": ucos,
                "contacts": contacts, "decisions": decisions,
                "software": software, "rationale": rationale, "functions": functions}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("account_detail failed")
        raise HTTPException(500, str(e)[:300])


# ── Data quality (dedupe queue) ────────────────────────────────────────────
@router.get("/data-quality")
async def data_quality():
    try:
        dupes = await execute_query(
            f"SELECT cluster, records, record_count, source FROM {DUP} "
            f"ORDER BY record_count DESC")
        no_sa_signal = await execute_query(f"""
            SELECT account, ROUND(list_365d) AS list_365d, uco_total
            FROM {A} WHERE coverage_gap = true ORDER BY list_365d DESC""")
        return {"duplicates": dupes, "coverage_gaps": no_sa_signal}
    except Exception as e:
        logger.exception("data-quality failed")
        raise HTTPException(500, str(e)[:300])


# ── Accounts (searchable full book) ────────────────────────────────────────
@router.get("/accounts")
async def accounts():
    try:
        rows = await execute_query(f"""
            SELECT rank, account, sub_industry, country, tier, ae, sa_primary,
                   has_sa, ROUND(list_365d) AS list_365d, ROUND(list_90d) AS list_90d,
                   n_opps, ROUND(open_opp_total) AS open_opp_total, uco_total, uco_active,
                   demos, incumbent, has_signal, coverage_gap
            FROM {A} ORDER BY list_365d DESC, account""")
        return {"accounts": rows}
    except Exception as e:
        logger.exception("accounts failed")
        raise HTTPException(500, str(e)[:300])


# ── Function Explorer (search by function + persona + software) ────────────
@router.get("/functions")
async def functions_summary():
    """The six business functions with account counts, persona-connection, and
    the software in play — the landing for the Function Explorer."""
    try:
        summary = await execute_query(f"""
            SELECT function,
                   COUNT(*) AS n_accounts,
                   SUM(CASE WHEN connected THEN 1 ELSE 0 END) AS n_connected,
                   SUM(CASE WHEN has_sa THEN 1 ELSE 0 END) AS n_covered,
                   ROUND(SUM(list_365d)) AS list_365d
            FROM {FN} GROUP BY function ORDER BY list_365d DESC""")
        software = await execute_query(f"""
            SELECT function, software, COUNT(*) AS n_accounts, ROUND(SUM(list_365d)) AS list_365d
            FROM {SW} GROUP BY function, software ORDER BY n_accounts DESC""")
        return {"summary": summary, "software": software}
    except Exception as e:
        logger.exception("functions_summary failed")
        raise HTTPException(500, str(e)[:300])


@router.get("/function/{function}")
async def function_detail(function: str):
    """Accounts with signal in a function: persona-connected or not, software in play."""
    from server.sql import esc
    f = esc(function)
    try:
        accounts_ = await execute_query(f"""
            SELECT fn.account, fn.sub_industry, fn.seat, fn.connected,
                   fn.from_uco, fn.from_software, ROUND(fn.list_365d) AS list_365d, fn.has_sa,
                   a.sa_primary, a.uco_total
            FROM {FN} fn JOIN {A} a ON fn.account = a.account
            WHERE fn.function = '{f}' ORDER BY fn.list_365d DESC""")
        software = await execute_query(f"""
            SELECT software, category, displaced_by, COUNT(*) AS n_accounts,
                   collect_set(account) AS accounts
            FROM {SW} WHERE function = '{f}' GROUP BY software, category, displaced_by
            ORDER BY n_accounts DESC""")
        return {"function": function, "accounts": accounts_, "software": software}
    except Exception as e:
        logger.exception("function_detail failed")
        raise HTTPException(500, str(e)[:300])


@router.get("/software")
async def software_index():
    """Full software index — which suites are mentioned, where, how much $."""
    try:
        idx = await execute_query(f"""
            SELECT software, function, category, displaced_by,
                   COUNT(*) AS n_accounts, ROUND(SUM(list_365d)) AS list_365d,
                   collect_set(account) AS accounts
            FROM {SW} GROUP BY software, function, category, displaced_by
            ORDER BY n_accounts DESC""")
        return {"software": idx}
    except Exception as e:
        logger.exception("software_index failed")
        raise HTTPException(500, str(e)[:300])


# ── How recommendations work (the rules, transparent) ──────────────────────
@router.get("/recommendations")
async def recommendations():
    try:
        rows = await execute_query(f"""
            SELECT r.account, a.sub_industry, r.workbench, r.reasons, r.score,
                   ROUND(a.list_365d) AS list_365d
            FROM {RECO} r JOIN {A} a ON r.account = a.account
            WHERE a.has_signal = true ORDER BY r.score DESC, a.list_365d DESC LIMIT 100""")
        return {"recommendations": rows}
    except Exception as e:
        logger.exception("recommendations failed")
        raise HTTPException(500, str(e)[:300])


# ── My Impact over UKI ─────────────────────────────────────────────────────
@router.get("/impact")
async def impact():
    """Coverage footprint: UK book vs accounts materially helped, with C-level
    and meeting counts. Understated by design."""
    try:
        book = await _one(f"""
            SELECT COUNT(*) AS n_accounts,
                   SUM(CASE WHEN active THEN 1 ELSE 0 END) AS n_active,
                   ROUND(SUM(CASE WHEN active THEN list_365d ELSE 0 END)) AS active_list,
                   ROUND(SUM(list_365d)) AS total_list
            FROM {A} WHERE country = 'United Kingdom' OR country = 'Ireland'""")
        helped = await execute_query(f"""
            SELECT i.account, i.meetings, i.clevel, i.clevel_detail, i.keywords,
                   i.what, i.note, i.source,
                   ROUND(a.list_365d) AS list_365d, a.sub_industry
            FROM {IMP} i LEFT JOIN {A} a ON i.account = a.account
            ORDER BY COALESCE(i.meetings, 0) DESC,
                     i.clevel DESC,
                     COALESCE(a.list_365d, 0) DESC""")
        agg = await _one(f"""
            SELECT COUNT(*) AS n_helped,
                   SUM(CASE WHEN clevel THEN 1 ELSE 0 END) AS n_clevel,
                   SUM(COALESCE(meetings,0)) AS total_meetings
            FROM {IMP}""")
        # consumption of the helped accounts that exist in the book
        helped_list = await _one(f"""
            SELECT ROUND(SUM(a.list_365d)) AS helped_list
            FROM {IMP} i JOIN {A} a ON i.account = a.account""")
        return {"book": book, "helped": helped, "agg": agg, "helped_list": helped_list}
    except Exception as e:
        logger.exception("impact failed")
        raise HTTPException(500, str(e)[:300])


# ── Decisions log ──────────────────────────────────────────────────────────
@router.get("/decisions")
async def decisions_log():
    try:
        rows = await execute_query(f"""
            SELECT decision_id, account, action, value, detail, owner, due_date,
                   status, changed_by, CAST(changed_at AS STRING) AS changed_at
            FROM {DEC} ORDER BY changed_at DESC LIMIT 200""")
        return {"decisions": rows}
    except Exception as e:
        logger.exception("decisions_log failed")
        raise HTTPException(500, str(e)[:300])
