"""Conversation-pack agent + on-demand data refresh.

The **prep agent** helps an account owner walk into a function conversation
(e.g. "meet the underwriters") with confidence. It pulls everything the
governed model knows about the account, then uses a Claude Foundation-Model
endpoint to assemble a four-part pack:
  1. Your notes (passed in, to enrich)
  2. What we know (software / use-cases / landscape / contacts)
  3. What we don't know — questions to ask + software suites worth probing +
     the demos & edu material we can offer
  4. Comparable accounts — where we ran a similar play, with examples
A grounded follow-up Q&A lets them rehearse. All LLM calls go to a Claude
endpoint (Foundation Model API), per standard.

The **refresh** endpoint re-runs the parse+seed on demand (the chosen cadence).
"""
import json
import logging
import asyncio
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from server.config import fqn, get_llm_endpoint, get_workspace_client
from server.sql import execute_query, esc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["agent"])

A = fqn("1_accounts")
SW = fqn("8_software")
FN = fqn("9_functions")
RECO = fqn("10_recommendations")
DM = fqn("5_demo_map")

# Typical software suites worth probing, by function — the "what to ask about"
# list section 3 leans on even when nothing is detected for the account.
PROBE_SOFTWARE = {
    "Pricing": ["WTW Radar", "Earnix", "hyperexponential", "Akur8", "in-house GLMs"],
    "Underwriting": ["Guidewire", "broker/MGA platforms", "WTW Tyche", "in-house exposure tools"],
    "Claims": ["Guidewire", "Duck Creek", "Sapiens", "in-house claims"],
    "Actuarial": ["FIS Prophet", "RAFM", "Moody's AXIS", "ResQ", "Igloo", "Excel/VBA", "R"],
    "Finance": ["SAP", "Oracle", "Phinsys", "SAS", "Excel"],
    "Data/Platform": ["Snowflake", "Synapse", "SAS", "Hadoop", "Informatica", "Tableau", "Python"],
}

# Edu / demo material we can offer, by workbench.
EDU = {
    "Pricing": "Pricing Workbench demo + Bricksurance Academy pricing track",
    "Claims Intelligence": "Claims Workbench demo (agentic FNOL→settlement)",
    "Underwriting": "Underwriting Workbench demo (submission→refer/decline)",
    "Reinsurance": "Reinsurance Workbench demo (treaty→accumulation→capital)",
    "Solvency II": "Solvency II Workbench + QRT walkthrough",
    "IFRS 17": "IFRS 17 Workbench (PAA/GMM/CSM)",
    "LifeCast": "LifeCast demo (Prophet-on-Databricks) + actuarial exam lab",
    "Legacy migration (SAS/Excel)": "SAS & Excel migration accelerators",
    "Insurance ontology / data core": "Insurance ontology / semantic-layer demo",
}


async def _account_context(account: str) -> dict:
    a = esc(account)
    acct = await execute_query(f"SELECT * FROM {A} WHERE account = '{a}'")
    if not acct:
        raise HTTPException(404, "account not found")
    acct = acct[0]
    software = await execute_query(f"SELECT software, category, displaced_by, function FROM {SW} WHERE account = '{a}'")
    functions = await execute_query(f"SELECT function, seat, connected FROM {FN} WHERE account = '{a}'")
    reco = await execute_query(f"SELECT workbench, reasons FROM {RECO} WHERE account = '{a}' ORDER BY score DESC")
    contacts = await execute_query(f"SELECT name, title FROM {fqn('4_contacts')} WHERE account = '{a}'")
    ucos = await execute_query(f"SELECT uco_name, stage FROM {fqn('3_ucos')} WHERE account = '{a}'")
    return {"account": acct, "software": software, "functions": functions,
            "reco": reco, "contacts": contacts, "ucos": ucos}


async def _comparables(account: str, sub_industry: str, function: str) -> list[dict]:
    """Other accounts in the same sub-industry with signal in the same function —
    where a similar play has run."""
    a = esc(account)
    f = esc(function)
    s = esc(sub_industry)
    return await execute_query(f"""
        SELECT fn.account, ROUND(fn.list_365d) AS list_365d, fn.connected,
               acc.sa_primary, acc.uco_total, acc.demos
        FROM {FN} fn JOIN {A} acc ON fn.account = acc.account
        WHERE fn.function = '{f}' AND fn.sub_industry = '{s}'
          AND fn.account != '{a}' AND acc.has_signal = true
        ORDER BY fn.list_365d DESC LIMIT 5""")


def _llm(messages: list[dict], max_tokens: int = 1200) -> str:
    """Call the Claude Foundation-Model serving endpoint via REST (SDK auth
    header factory) — no openai extra needed, resilient like the Genie proxy."""
    import requests
    w = get_workspace_client()
    host = w.config.host.rstrip("/")
    headers = {**w.config._header_factory(), "Content-Type": "application/json"}
    url = f"{host}/serving-endpoints/{get_llm_endpoint()}/invocations"
    body = {"messages": messages, "max_tokens": max_tokens, "temperature": 0.2}
    r = requests.post(url, headers=headers, json=body, timeout=90)
    if not r.ok:
        raise RuntimeError(f"FMAPI {r.status_code}: {(r.text or '')[:300]}")
    data = r.json()
    return (data.get("choices") or [{}])[0].get("message", {}).get("content", "") or ""


class PackRequest(BaseModel):
    account: str
    function: str = "Underwriting"
    notes: str = ""


@router.post("/prep-pack")
async def prep_pack(req: PackRequest):
    """Generate the four-section conversation pack for an account + function."""
    try:
        ctx = await _account_context(req.account)
        comps = await _comparables(req.account, str(ctx["account"].get("sub_industry", "")), req.function)
        probe = PROBE_SOFTWARE.get(req.function, [])
        # Deterministic material offer from the account's recommended workbenches.
        edu = []
        for r in ctx["reco"]:
            wb = r["workbench"]
            for key, val in EDU.items():
                if key.split()[0].lower() in wb.lower() or wb.lower() in key.lower():
                    if val not in edu:
                        edu.append(val)

        known = {
            "account": ctx["account"].get("account"),
            "sub_industry": ctx["account"].get("sub_industry"),
            "consumption_list_365d": ctx["account"].get("list_365d"),
            "sa": ctx["account"].get("sa_primary"),
            "software_detected": [s["software"] for s in ctx["software"]],
            "use_cases": [f"{u['uco_name']} [{u['stage']}]" for u in ctx["ucos"]][:12],
            "contacts": [f"{c['name']} — {c['title']}" for c in ctx["contacts"]],
            "functions_connected": [f["function"] for f in ctx["functions"] if f["connected"]],
            "recommended_demos": [r["workbench"] for r in ctx["reco"]],
        }
        prompt = f"""You are prepping a Databricks account team member to walk into a conversation with the **{req.function}** function at **{req.account}** and talk with confidence.

Use ONLY the grounded facts below. Where a fact is missing, treat it as an unknown to ask about — do NOT invent software, names, or use-cases.

GROUNDED FACTS (from the governed GTM model):
{json.dumps(known, indent=2)}

TYPICAL {req.function.upper()} SOFTWARE WORTH PROBING (ask which are in play): {', '.join(probe)}

DEMOS / EDU MATERIAL WE CAN OFFER: {'; '.join(edu) or 'the relevant workbench demos'}

THE ACCOUNT OWNER'S OWN NOTES (weave in / prioritise these): {req.notes or '(none provided)'}

Produce a tight, skimmable briefing in markdown with EXACTLY these four sections:
### 1. Where we are
2-3 sentences: the account, the function, our current footprint and why we're meeting them now.
### 2. What we know
Bullet the landscape: software in play, live use-cases, consumption signal, who we know (contacts/seats). Ground every bullet in the facts.
### 3. What we don't know — ask these
5-7 sharp discovery questions specific to {req.function} at this account, PLUS a one-line "software worth asking about" list from the probe list. Flag which decision-maker seats we do NOT yet hold.
### 4. How we help + who's done this
Name the specific demos/edu material to offer and the business process each opens on. Keep it to what fits {req.function}.

Be concise and confident. No preamble."""

        pack_md = await asyncio.to_thread(_llm, [{"role": "user", "content": prompt}], 1400)
        return {"account": req.account, "function": req.function,
                "pack_markdown": pack_md, "known": known,
                "comparables": comps, "probe_software": probe, "edu": edu}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("prep_pack failed")
        raise HTTPException(500, f"Prep agent failed: {str(e)[:300]}")


class ChatRequest(BaseModel):
    account: str
    function: str = ""
    pack_markdown: str = ""
    question: str
    history: list[dict[str, Any]] = []


@router.post("/prep-chat")
async def prep_chat(req: ChatRequest):
    """Grounded follow-up Q&A on top of a generated pack — rehearse answers."""
    try:
        ctx = await _account_context(req.account)
        facts = {
            "account": ctx["account"].get("account"),
            "sub_industry": ctx["account"].get("sub_industry"),
            "software_detected": [s["software"] for s in ctx["software"]],
            "use_cases": [f"{u['uco_name']} [{u['stage']}]" for u in ctx["ucos"]][:12],
            "contacts": [f"{c['name']} — {c['title']}" for c in ctx["contacts"]],
            "recommended_demos": [r["workbench"] for r in ctx["reco"]],
        }
        system = (f"You help a Databricks account team member rehearse for a {req.function} "
                  f"conversation at {req.account}. Answer ONLY from the grounded facts and the "
                  f"prep pack. If asked something the facts don't cover, say it's an unknown to "
                  f"confirm with the customer — never invent. Be brief and practical.\n\n"
                  f"GROUNDED FACTS:\n{json.dumps(facts, indent=2)}\n\nPREP PACK:\n{req.pack_markdown[:3000]}")
        messages = [{"role": "system", "content": system}]
        messages += req.history[-6:]
        messages.append({"role": "user", "content": req.question})
        answer = await asyncio.to_thread(_llm, messages, 700)
        return {"answer": answer}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("prep_chat failed")
        raise HTTPException(500, f"Prep chat failed: {str(e)[:300]}")


@router.get("/prep-context/{account}")
async def prep_context(account: str):
    """The grounded 'what we know / don't know' scaffold, without the LLM —
    lets the UI render sections 2/3 instantly while the pack generates."""
    ctx = await _account_context(account)
    return ctx


# ── Refresh status (on-demand cadence) ─────────────────────────────────────
@router.get("/refresh-status")
async def refresh_status():
    """When was the governed model last refreshed? Read from Delta table
    history so the header can show a real freshness stamp. On-demand cadence:
    a maintainer re-runs `make seed` (or the seed job) to refresh."""
    try:
        rows = await execute_query(f"""
            SELECT CAST(MAX(timestamp) AS STRING) AS last_refresh
            FROM (DESCRIBE HISTORY {A})""")
        last = rows[0].get("last_refresh") if rows else None
        return {"last_refresh": last, "cadence": "on-demand",
                "note": "Refreshed on demand from the source GTM sheet via the seed pipeline."}
    except Exception as e:
        logger.exception("refresh_status failed")
        return {"last_refresh": None, "cadence": "on-demand", "note": str(e)[:200]}
