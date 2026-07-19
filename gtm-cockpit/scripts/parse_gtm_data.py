"""Parse the raw UKI GTM sheet + plan into clean, structured records.

Input  : gtm-cockpit/data/uki_sheet_*.csv  (exported from the Google Sheet)
Output : gtm-cockpit/data/gtm_seed.json    (consumed by seed_uc.py)

The raw book is human-authored: LIST $ like "$5.11M"/"$545K", a free-text
"Open opps" blob (name/stage/$ pipe-separated), a "UCOs" blob with [U1..U6]
stage tags, "SA / SSA" with role markers ([SA(primary)]/[DSA]), and a
"Key contacts" blob of "Name — Title". This script turns all of that into
typed fields + derived signal/coverage flags so the app can query it and the
personas' views (coverage gaps, accelerator queue, demo-fit) compute cleanly.

Deterministic, no network. Run: python3 scripts/parse_gtm_data.py
"""
import csv
import json
import re
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"

# ── Demo → business-process map (from the plan's demo→process table) ──────────
DEMO_MAP = [
    {"workbench": "Pricing", "process": "Technical price → rating engine → monitoring, one governed loop",
     "incumbent": "WTW Radar, Earnix, hyperexponential", "best_fit": "P&C personal & commercial"},
    {"workbench": "Claims Intelligence", "process": "FNOL → triage → settlement, agentic + fair-outcomes",
     "incumbent": "Guidewire, Duck Creek", "best_fit": "P&C, personal lines"},
    {"workbench": "Underwriting", "process": "Submission → extract → triage → refer/decline",
     "incumbent": "Guidewire, broker/MGA platforms", "best_fit": "Lloyd's / London Market, commercial"},
    {"workbench": "Reinsurance", "process": "Treaty submission → accumulation → capital",
     "incumbent": "Igloo/ResQ, internal cat models", "best_fit": "Reinsurers, Lloyd's"},
    {"workbench": "Solvency II", "process": "Quarterly close → QRTs → ORSA → sign-off",
     "incumbent": "ResQ, Igloo, SAS, Excel", "best_fit": "P&C & composite, EU/UK-regulated"},
    {"workbench": "IFRS 17", "process": "Quarterly close → PAA/GMM → CSM → disclosures",
     "incumbent": "FIS Prophet, RAFM, SAS", "best_fit": "Life & composite"},
    {"workbench": "LifeCast", "process": "Model points → BEL projection → results desk",
     "incumbent": "FIS Prophet, RAFM", "best_fit": "Life & pensions"},
    {"workbench": "Legacy migration (SAS/Excel)", "process": "Modernise the estate nobody dares touch",
     "incumbent": "SAS, Excel/VBA, mainframe", "best_fit": "All"},
    {"workbench": "Insurance ontology / data core", "process": "One governed semantic layer under everything",
     "incumbent": "Snowflake, Collibra, fragmented estates", "best_fit": "All, esp. acquisition-built"},
]

# Default demo recommendation by sub-industry (fallback when the priority tab
# doesn't name one). Keeps the demo-fit matrix populated across all 182.
SUBIND_DEMO = {
    "P&C": ["Pricing", "Claims Intelligence"],
    "Lloyd's/London Market": ["Underwriting", "Reinsurance"],
    "Life/Pensions": ["LifeCast", "IFRS 17"],
    "Broker": ["Insurance ontology / data core"],
    "Health": ["Claims Intelligence", "Insurance ontology / data core"],
    "Reinsurance": ["Reinsurance"],
}

STAGE_ORDER = ["POC Scoping", "Evaluation", "Proposal", "Validate", "Negotiation / Procurement", "Negotiation"]

# Authoritative duplicate-record clusters flagged in the plan (SFDC-verified).
# Matched by substring against the account name; consumption/UCOs are split
# across these records so they must be consolidated before allocation math.
KNOWN_DUPE_KEYS = {
    "Aviva": ["aviva"],
    "Legal & General": ["legal & general", "legal and general"],
    "Direct Line": ["direct line"],
    "Ardonagh": ["ardonagh"],
    "Aon": ["aon "],
    "Standard Life": ["standard life"],
}

# Persona seats we care about for elevation / reachability.
SEAT_PATTERNS = {
    "Chief Actuary": r"chief actuary",
    "CDO": r"chief data|cdo\b|cdao|chief data & analytics|data & ai officer|chief data and",
    "CUO": r"chief underwriting|cuo\b|head of underwriting",
    "Head of Pricing": r"head of pricing|pricing director|director.*pricing",
    "CRO": r"chief risk|cro\b",
    "CFO / Finance": r"\bcfo\b|finance director|chief financial",
    "CTO": r"chief technology|cto\b",
}


def parse_money(s: str) -> float:
    """'$5.11M' → 5110000.0 ; '$545K' → 545000 ; '$60' → 60 ; '$0'/'-'/'' → 0."""
    if not s:
        return 0.0
    s = s.strip().replace("$", "").replace(",", "")
    if s in ("", "-", "?", "0"):
        return 0.0
    m = re.match(r"^([\d.]+)\s*([MKmk]?)", s)
    if not m:
        return 0.0
    val = float(m.group(1))
    unit = m.group(2).upper()
    if unit == "M":
        val *= 1_000_000
    elif unit == "K":
        val *= 1_000
    return val


def parse_opps(blob: str) -> list[dict]:
    """Split the free-text opp blob into structured opps.

    Each opp looks like: 'Name (Stage, $Amount)'. Amounts may be '?'.
    Truncated tails (the sheet clips long cells with '…') are dropped.
    """
    if not blob or blob.strip() in ("-", ""):
        return []
    opps = []
    for chunk in blob.split(" | "):
        chunk = chunk.strip().rstrip("…").strip()
        if not chunk:
            continue
        m = re.match(r"^(.*?)\s*\(([^,]+),\s*([^)]*)\)\s*$", chunk)
        if m:
            name, stage, amount = m.group(1).strip(), m.group(2).strip(), m.group(3).strip()
            is_renewal = bool(re.search(r"_Renewal_|renewal", name, re.I))
            # Extract close date from the _Renewal_M_D_YYYY convention if present.
            dm = re.search(r"_Renewal_(\d{1,2})_(\d{1,2})_(\d{4})", name)
            close_date = None
            if dm:
                close_date = f"{dm.group(3)}-{int(dm.group(1)):02d}-{int(dm.group(2)):02d}"
            opps.append({
                "name": name,
                "stage": stage,
                "amount": parse_money(amount),
                "amount_raw": amount,
                "type": "Renewal" if is_renewal else "New use case",
                "close_date": close_date,
            })
        else:
            # No parenthetical — keep the name so nothing is silently lost.
            opps.append({"name": chunk, "stage": "", "amount": 0.0,
                         "amount_raw": "", "type": "New use case", "close_date": None})
    return opps


def parse_ucos(blob: str) -> dict:
    """Count UCOs by stage U1–U6 and return the list of (name, stage)."""
    counts = {f"U{i}": 0 for i in range(1, 7)}
    items = []
    if not blob or blob.strip() in ("-", ""):
        return {"counts": counts, "items": items, "total": 0, "max_stage": None}
    for chunk in blob.split(" | "):
        chunk = chunk.strip().rstrip("…").strip()
        m = re.search(r"\[U([1-6])\]", chunk)
        if m:
            stage = f"U{m.group(1)}"
            counts[stage] += 1
            name = re.sub(r"\s*\[U[1-6]\]\s*$", "", chunk).strip()
            items.append({"name": name, "stage": stage})
    total = sum(counts.values())
    max_stage = None
    for i in range(6, 0, -1):
        if counts[f"U{i}"] > 0:
            max_stage = f"U{i}"
            break
    return {"counts": counts, "items": items, "total": total, "max_stage": max_stage}


def parse_sa(raw: str) -> dict:
    """Parse 'SA / SSA' → primary name, list of all, role flags."""
    if not raw or raw.strip() in ("NONE", "-", ""):
        return {"primary": None, "names": [], "has_primary": False, "dsa_only": False, "count": 0}
    parts = [p.strip() for p in raw.split(";") if p.strip()]
    names, primary, has_primary, dsa_flags = [], None, False, []
    for p in parts:
        name = re.sub(r"\s*\[.*?\]\s*", "", p).strip()
        names.append(name)
        role = re.search(r"\[(.*?)\]", p)
        role_s = role.group(1) if role else ""
        if "primary" in role_s.lower():
            primary = name
            has_primary = True
        dsa_flags.append("DSA" in role_s)
    if not primary and names:
        # multi-SA row with no explicit primary → treat first as effective lead
        primary = names[0]
        has_primary = True
    dsa_only = all(dsa_flags) and len(dsa_flags) > 0
    return {"primary": primary, "names": names, "has_primary": has_primary,
            "dsa_only": dsa_only, "count": len(names)}


def parse_contacts(blob: str) -> dict:
    """Parse 'Name — Title; ...' into contacts + which decision seats are held."""
    contacts, seats = [], {s: False for s in SEAT_PATTERNS}
    if not blob or blob.strip() in ("-", ""):
        return {"contacts": contacts, "seats": seats}
    for chunk in blob.split(";"):
        chunk = chunk.strip()
        if not chunk:
            continue
        m = re.split(r"\s+[—–-]\s+", chunk, maxsplit=1)
        name = m[0].strip()
        title = m[1].strip() if len(m) > 1 else ""
        contacts.append({"name": name, "title": title})
        tl = title.lower()
        for seat, pat in SEAT_PATTERNS.items():
            if re.search(pat, tl):
                seats[seat] = True
    return {"contacts": contacts, "seats": seats}


def load_priority_demos() -> dict:
    """Map account-name (lowercased) → recommended demo string from priority tab."""
    out = {}
    path = DATA / "uki_sheet_Priority_accounts.csv"
    with open(path, newline="") as f:
        for row in csv.DictReader(f):
            acct = (row.get("Account") or "").strip().lower()
            demo = (row.get("Demo to lead with") or "").strip()
            elevate = (row.get("Team to elevate to") or "").strip()
            incumbent = (row.get("Incumbent software") or "").strip()
            signal = (row.get("Live use-case signal") or "").strip()
            if acct:
                out[acct] = {"demo": demo, "elevate": elevate,
                             "incumbent": incumbent, "signal": signal}
    return out


def norm_name(name: str) -> str:
    """Loose normalisation to group duplicate SFDC records (Aviva ×5 etc.)."""
    n = name.lower()
    n = re.sub(r"\b(plc|ltd|limited|llc|group|holdings|services|uk|insurance|"
               r"company|corporation|se|inc|llp|the)\b", "", n)
    n = re.sub(r"[^a-z0-9]", "", n)
    return n


def main():
    prio = load_priority_demos()
    accounts = []
    name_groups = {}

    with open(DATA / "uki_sheet_All_accounts_182.csv", newline="") as f:
        for row in csv.DictReader(f):
            name = (row.get("Account") or "").strip()
            if not name:
                continue
            sub = (row.get("Sub-industry") or "").strip()
            list365 = parse_money(row.get("LIST 365d", ""))
            list90 = parse_money(row.get("LIST 90d", ""))
            opps = parse_opps(row.get("Open opps", ""))
            ucos = parse_ucos(row.get("UCOs (U1–U6)", ""))
            sa = parse_sa(row.get("SA / SSA", ""))
            contacts = parse_contacts(row.get("Key contacts", ""))

            open_opp_total = sum(o["amount"] for o in opps if o["type"] != "Renewal")
            renewal_total = sum(o["amount"] for o in opps if o["type"] == "Renewal")
            has_signal = list365 > 0 or ucos["total"] > 0 or len(opps) > 0
            active_ucos = sum(ucos["counts"][f"U{i}"] for i in range(1, 6))  # U1-U5 = in-flight

            # Recommended demo: priority tab wins; else sub-industry default.
            p = prio.get(name.lower(), {})
            demo_reco = p.get("demo") or " · ".join(SUBIND_DEMO.get(sub, []))
            demos = [d.strip() for d in re.split(r"·|\+", demo_reco) if d.strip()]

            coverage_gap = has_signal and (not sa["has_primary"] or sa["dsa_only"])

            rec = {
                "rank": int(row.get("Rank") or 0),
                "account": name,
                "norm_name": norm_name(name),
                "sub_industry": sub,
                "country": (row.get("Country") or "").strip(),
                "segment": (row.get("Segment") or "").strip(),
                "tier": (row.get("Tier") or "").strip(),
                "ae": (row.get("AE") or "").strip(),
                "ae_role": (row.get("AE role") or "").strip(),
                "sa_primary": sa["primary"],
                "sa_names": sa["names"],
                "sa_count": sa["count"],
                "has_sa": sa["has_primary"],
                "list_365d": list365,
                "list_90d": list90,
                "opps": opps,
                "open_opp_total": open_opp_total,
                "renewal_total": renewal_total,
                "n_opps": len(opps),
                "uco_counts": ucos["counts"],
                "uco_total": ucos["total"],
                "uco_active": active_ucos,
                "uco_max_stage": ucos["max_stage"],
                "uco_items": ucos["items"],
                "contacts": contacts["contacts"],
                "seats": contacts["seats"],
                "demos": demos,
                "elevate_to": p.get("elevate", ""),
                "incumbent": p.get("incumbent", ""),
                "signal_note": p.get("signal", ""),
                "has_signal": has_signal,
                "coverage_gap": coverage_gap,
            }
            accounts.append(rec)
            name_groups.setdefault(rec["norm_name"], []).append(name)

    # Duplicate-record clusters. Use the plan's authoritative key list (SFDC-
    # verified) matched by substring across ALL account names, so records whose
    # legal names diverge (e.g. "Aviva", "Aviva plc", "Aviva Insurance") still
    # group. Fall back to fuzzy norm_name groups for anything not in the list.
    all_names = [a["account"] for a in accounts]
    dupes = []
    claimed = set()
    for label, keys in KNOWN_DUPE_KEYS.items():
        recs = [n for n in all_names
                if any(k in n.lower() for k in keys)]
        if len(recs) > 1:
            dupes.append({"cluster": label, "records": recs, "count": len(recs), "source": "plan"})
            claimed.update(recs)
    for k, v in name_groups.items():
        if len(v) > 1 and not any(r in claimed for r in v):
            dupes.append({"cluster": v[0], "records": v, "count": len(v), "source": "fuzzy"})
    dupes.sort(key=lambda d: -d["count"])

    seed = {
        "accounts": accounts,
        "demo_map": DEMO_MAP,
        "duplicates": dupes,
        "meta": {
            "n_accounts": len(accounts),
            "n_signal": sum(1 for a in accounts if a["has_signal"]),
            "n_coverage_gap": sum(1 for a in accounts if a["coverage_gap"]),
            "total_list_365d": sum(a["list_365d"] for a in accounts),
        },
    }
    out = DATA / "gtm_seed.json"
    out.write_text(json.dumps(seed, indent=2))

    m = seed["meta"]
    print(f"Parsed {m['n_accounts']} accounts → {out}")
    print(f"  signal: {m['n_signal']}  coverage-gaps: {m['n_coverage_gap']}  "
          f"total LIST365: ${m['total_list_365d']:,.0f}")
    print(f"  duplicate clusters: {len(dupes)} "
          f"(top: {', '.join(d['cluster'] + ' x' + str(d['count']) for d in dupes[:5])})")
    # Sanity: show the coverage-gap accounts (the hero list).
    gaps = sorted([a for a in accounts if a["coverage_gap"]], key=lambda a: -a["list_365d"])
    print("  coverage-gap accounts (signal, no/weak SA):")
    for a in gaps[:8]:
        print(f"    {a['account']:<32} ${a['list_365d']:>12,.0f}  ucos={a['uco_total']} sa={a['sa_primary']}")


if __name__ == "__main__":
    main()
