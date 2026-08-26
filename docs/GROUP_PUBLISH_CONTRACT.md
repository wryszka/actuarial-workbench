# Group publish contract v2

The Executive View reads business status from views each workbench **publishes**. The group
tower unions and sorts; it never computes a metric. This contract is the interface: a workbench
that ships these views lights up in the group view; one that doesn't degrades gracefully (section
absent, gap logged). All views live in the workbench's own published schema (same workspace); the
group principal (`7d88f801-…`) gets SELECT.

**Group-side SQL carve-out (enforced by the boundary scan):** one `UNION ALL` per contract view
class (`vw_group_headline`, `vw_group_attention`, `vw_group_decisions`, `vw_group_calendar`) —
same permitted class as the audit union — plus verbatim `SELECT * FROM <published view>`
passthroughs. Nothing else. The workbench computes all judgement (severity, urgency, health,
detail sentences); the group only aggregates.

## The five view classes

### 1. `vw_group_headline` — posture numbers (2–4 rows/node)
| column | type | notes |
|---|---|---|
| metric_key | string | stable id, e.g. `scr_ratio`, `combined_ratio`, `gwp` |
| label | string | display, e.g. "SCR coverage ratio" |
| value | double | the number |
| unit | string | `%`, `£m`, `ratio`, `count`, … |
| delta_1d | double \| null | change vs 1 day ago (signed, same unit) |
| delta_qtd | double \| null | change quarter-to-date (signed) |
| direction | string | `up_good` \| `down_good` \| `neutral` — how to colour a move |
| as_of | timestamp | freshness of the underlying data |
| deep_link | string | URL into the owning workbench |

Posture cards map to metric_keys: **making money** → `gwp` + `combined_ratio`; **solvent** →
`scr_ratio` (+ `worst_orsa_stress`); **on deadline** → nearest `vw_group_calendar` row; **needs me**
→ `count(vw_group_decisions)`.

### 2. `vw_group_attention` — the estate's judgement, already made
| column | type | notes |
|---|---|---|
| severity | string | `red` \| `amber` \| `info` |
| category | string | e.g. `capital`, `reserving`, `data_quality`, `conduct` |
| headline | string | short |
| detail_sentence | string | **the verbatim sentence the group banner renders** — the workbench's own words |
| entity_ref | string | the thing it's about (policy/claim/QRT/…) |
| as_of | timestamp | |
| deep_link | string | |

Group sorts severity (red>amber>info) then recency. The banner renders the single top row's
`detail_sentence` verbatim, attributed to the node. **The synthesis question ("are these related?")
is NOT a view — it is answered by the chat agent** (cross-node correlation is business judgement).

### 3. `vw_group_decisions` — what's waiting on a human
| column | type | notes |
|---|---|---|
| decision_key | string | stable id |
| title | string | |
| waiting_on_role | string | e.g. `chief_actuary`, `underwriter`, `board` |
| age_hours | double | how long it's waited |
| urgency | string | `high` \| `medium` \| `low` |
| as_of | timestamp | |
| deep_link | string | |

### 4. `vw_group_calendar` — regulatory milestones
| column | type | notes |
|---|---|---|
| milestone_key | string | e.g. `qrt_q4_close`, `ifrs17_q4`, `orsa_board` |
| label | string | |
| due_date | date | group computes `days_remaining` (business days) — the ONE derived field, non-business |
| health | string | `on_track` \| `attention` \| `late` (the node's judgement) |
| as_of | timestamp | |
| deep_link | string | |

### 5. `vw_group_readiness` (optional) — the per-QRT readiness table, generalised
| column | type | notes |
|---|---|---|
| process_key | string | |
| row_label | string | e.g. "S.02.01 Balance sheet" |
| stages | string (JSON) | array of `{label, status}` where status ∈ `done`\|`in_progress`\|`blocked`\|`todo` |
| as_of | timestamp | |
| deep_link | string | |

## Rules
- **Node-authored judgement only.** severity/urgency/health/detail_sentence are the workbench's;
  the group never overrides or invents them.
- **Watermarks are real.** `as_of` is the freshness of the source; the group badges every number
  with it and shows "stale · refresh" past TTL — never a fabricated timestamp.
- **Partial rollout is fine.** A missing view class → that section/card is absent for that node and
  the gap is logged in `CONTRACT_ROLLOUT.md`. The build succeeds with partial rollout.
- **No client names** anywhere.

## Group endpoints these back (V2-P2)
`/api/group/posture` (headline union), `/api/group/attention`, `/api/group/decisions`,
`/api/group/calendar`, `/api/group/readiness` — each: union of published views across live nodes,
served from the data cache (V2-P3), every row carrying node + as_of.
