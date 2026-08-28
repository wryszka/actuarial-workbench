/**
 * Roadmap stub content — one entry per roadmap / in-progress tile.
 *
 * Adding a tile stub = (1) entry in workbench-tiles.ts, (2) entry here. No
 * per-tile component file needed.
 *
 * `adjacent_links.to` values are paths *inside the Solvency II app*. The
 * RoadmapStub renders them as external deep links, prefixing the configured
 * Solvency app base URL — so "already-live" patterns open in that app.
 */
export interface RoadmapEntry {
  what: string;                                    // What this workflow covers (1 paragraph)
  workbench_capabilities: string[];                // Bullets — how it extends the platform
  adjacent_links: { label: string; to: string }[]; // Live patterns to point at (Solvency app paths)
  firstStepsDeckUrl?: string;                      // optional "first steps" deck (full-width card under the description)
  // ── Roadmap-doctrine fields (optional; rendered when present) — the memory of
  // what was discussed so it's never forgotten and can be delivered on an ask.
  persona?: string;                                // who asks the question
  canonical_question?: string;                     // in the persona's own words
  reverse_kill_shots?: string[];                   // questions we hand back across the table
  parity_posture?: string;                         // what we concede vs where we win
  data_dependency?: string;                        // data-core WP dependency
  stub_grade?: string;                             // S0 / S1 / S2 + escalation trigger
}

export const ROADMAP_CONTENT: Record<string, RoadmapEntry> = {
  pricing: {
    what: "Rate-making for non-life lines: GLM/GBM models, market-rate alignment, " +
      "underwriting-control checks, bias monitoring across protected attributes. " +
      "The same exposure + claims data that feeds reserving and SF.",
    workbench_capabilities: [
      "GLM / GBM models registered in Unity Catalog as MLflow pyfuncs — same governance interface as the SF + reserving models in the Lab.",
      "Mosaic AI for serving real-time quote requests; production / candidate aliases for safe rollout of new rate plans.",
      "Bias monitoring as a Lab diagnostic: protected-attribute parity checks alongside the existing variance-vs-prior + reasonableness checks.",
      "Same Overlays Register pattern for underwriter overrides — magnitude, rationale, approver, audit-trailed.",
      "Same audit panel: every premium quote carries its source data, the model version that priced it, and the underwriter overlay (if any).",
    ],
    adjacent_links: [
      { label: 'See the model registry pattern (Standard Formula)', to: '/lab/standard_formula' },
      { label: 'See the overlay pattern (Overlays Register)', to: '/overlays' },
    ],
  },

  'insurance-ontology': {
    what: "An ACORD-based semantic standard for the lakehouse: the industry's entities, " +
      "attributes, relationships and code lists expressed once as a governed vocabulary in " +
      "Unity Catalog, so Solvency II, Pricing, Claims, Reinsurance, LifeCast and the rest all " +
      "read from the same definitions instead of each re-inventing them.",
    workbench_capabilities: [
      "ACORD-aligned entity + attribute dictionary expressed as Unity Catalog tags, comments and a business glossary — the canonical names, types and allowed code lists in one governed place.",
      "Certified tables, views and metric views that implement the standard, so 'gross written premium' or 'syndicate' means exactly the same thing in every workbench.",
      "A relationship / ontology layer (insured ↔ policy ↔ claim ↔ treaty ↔ exposure) captured as governed structure — building on the MRC knowledge-graph pattern.",
      "End-to-end lineage and access control on the vocabulary itself: every definition traceable, every code list versioned and audited.",
      "AI that speaks the standard — Genie and the agents resolve business terms to the right governed columns automatically.",
    ],
    adjacent_links: [],
    firstStepsDeckUrl: 'https://docs.google.com/presentation/d/1vXC7SVZUC-23adWG5KTLvSwzzjNGKSskvf1Yq-AXOoc/edit',
  },

  'customer-lake': {
    what: "CustomerLake is Databricks' agentic Customer Data Platform, embedded in the lakehouse — " +
      "Customer 360, identity resolution, segmentation and cross-channel activation, run where the " +
      "data already lives and governed by Unity Catalog. For an insurer that means a governed " +
      "policyholder 360 across every line of business, without copying PII into a separate CDP.",
    workbench_capabilities: [
      "Policyholder 360 across policy admin, claims, quotes, telematics and web/app behaviour — unified on the same governed tables the other workbenches read, with no data movement.",
      "Agentic Identity Resolution (deterministic + probabilistic + agentic) links a customer across motor, home and life, across households, and across broker/agent records.",
      "Segments and next-best-action for the moments that matter in insurance: renewal retention, cross-line up-sell (motor → home → life), and lapse prevention + win-back.",
      "Campaign agents run continuous engagement — build the audience, recommend the action, activate across channels (email, ad platforms, the broker) and optimise to a business goal.",
      "Under Unity Catalog governance throughout: consent and marketing-preference controls, fraud-aware suppression and full lineage — the same governance plane as Solvency II, Pricing and Claims.",
    ],
    adjacent_links: [],
  },


  // ── Roadmap band (candidates, not commitments) ─────────────────────────────
  'exposure-management': {
    what: "The live, cross-line, cross-source exposure picture that no point solution owns. " +
      "Accumulation lives as a property lane inside underwriting; cat machinery lives inside " +
      "reinsurance — this joins them into one governed view of gross and net exposure, by treaty " +
      "and by coverholder, refreshed in hours not weeks. It sits between the boxes: it threatens " +
      "no incumbent's cat-model science, and it owns the join they can't.",
    persona: "Head of Exposure Management / CUO",
    canonical_question: "A named storm makes landfall in 36 hours. What is my exposure — gross, net of treaty, by coverholder — right now, and how sure am I?",
    workbench_capabilities: [
      "A live exposure map over the existing underwriting accumulation grain + the reinsurance cat curves — one view, cross-line, cross-source.",
      "An event-footprint selector (seeded synthetic footprints) that recomputes exposure inside the meeting, not the week.",
      "A gross → net waterfall through the existing treaty structures, by treaty and by coverholder.",
      "A governed multi-vendor blend — who chose the weights, when, and the number under the alternative — recorded and auditable.",
      "Model-version diff on your own book: when the vendor ships a new version, see line-by-line what moved and why.",
    ],
    reverse_kill_shots: [
      "Landfall is tonight — can your current process give the board a net exposure number by treaty and coverholder tomorrow morning, with the workings?",
      "When your vendor shipped the new model version, what happened to your booked PMLs — can you diff the two versions on your own book, line by line?",
      "You have two vendors' views. Show me the governed blend — who chose the weights, when, and what the number was under the alternative.",
    ],
    parity_posture: "Concede: the cat-model science (theirs, permanently — the seam is ELT/YLT import). Win: event-response speed, multi-vendor blending, model-version transparency, and licence economics.",
    data_dependency: "None to start — reads the existing underwriting + reinsurance schemas. Richer with WP1 (in-force by version) and WP6 (coverholder books).",
    stub_grade: "S1 candidate — the only Tier A stub with zero data-core dependency, so it ships first. → S2 on the first CUO room that runs past 30 minutes on this screen.",
    adjacent_links: [],
  },

  'delegated-authority': {
    what: "Delegated authority as analytics, not workflow. Incumbent DA platforms move files and " +
      "track tasks; they don't compute. This computes every line-size breach from the latest " +
      "bordereaux, spots the coverholder book deteriorating before its bordereau admits it, and " +
      "links it back to claims and reserving on the same book. Bordereaux ingestion — messy " +
      "per-sender files rescued into a governed, validated pipeline — is the foundation underneath " +
      "it. The MGA flip (the coverholder's own cockpit of the same data) is a second persona tab: " +
      "one dataset, two sides of the seam, itself a Delta Share demo beat.",
    persona: "Head of Delegated Authority / DUM",
    canonical_question: "Which of my forty binders is outside authority right now, and which coverholder's book went bad before their bordereau admitted it?",
    workbench_capabilities: [
      "A binder status board + breach queue over WP6 views — every line-size breach as of the latest bordereaux, computed not attested.",
      "Drill from breach → the bordereau row that caused it → the governed waiver trail.",
      "Per-sender column mapping to a canonical, ACORD-aligned schema; drift is rescued rather than silently dropped (Document AI / ai_query for messy headers).",
      "Data-quality expectations quarantine failing rows to a review queue with the rule that fired — never mixed into the clean book.",
      "Early-warning on deteriorating coverholder loss ratios — quarters before the audit calendar would catch them; MGA-flip persona tab via Delta Share.",
    ],
    reverse_kill_shots: [
      "Across all binders, show me every line-size breach as of the latest bordereaux — computed, not attested.",
      "Which coverholder's loss ratio deteriorated two quarters before your audit calendar would have caught it?",
      "Your bordereau column layout drifted in March. Who noticed, and what did it cost?",
    ],
    parity_posture: "Concede: workflow / task management (theirs). Win: breach detection computed not attested, early-warning from bordereau data, and the cross-link to claims / reserving they can't make.",
    data_dependency: "WP6 (hard) — this stub is the reason WP6 can be pulled forward in the data-core build.",
    stub_grade: "S1 candidate, highest external pull on the list (Howden adjacency, Lloyd's / Blueprint Two). → S2 on the first market-side room that asks for it by name.",
    adjacent_links: [],
  },

  'conduct': {
    what: "Consumer Duty fair value computed, not attested. The whole GRC category fills in a form; " +
      "this runs a governed function over the twin's own premium and claims data — acceptance rates, " +
      "settlement times — and shows which cohorts sit amber and whether renewal pricing walked them " +
      "there. It's the natural home for the FCA pricing-rules questions that today only get a nod " +
      "inside pricing.",
    persona: "Chief Customer Officer / CRO / Board",
    canonical_question: "Prove fair value by product from actual premium and claims experience — not from an attestation spreadsheet.",
    workbench_capabilities: [
      "A fair-value board over WP4 (with the seeded MONITOR amber) — the number computed from actual claims acceptance rates and settlement times.",
      "A complaints-ratio tile and a drill from an amber product to the underlying premium / claims evidence.",
      "The cross-domain join no point solution can make: renewal price-walks (WP5) against outcomes (WP4).",
      "A vulnerability flag raised in claims that surfaces at renewal — one governed customer view.",
    ],
    reverse_kill_shots: [
      "Show me fair value computed from your actual claims acceptance rates and settlement times — can your process produce the number, or only the attestation that someone looked?",
      "Which customer cohorts sit in your amber zone, and did your renewal pricing walk them there?",
      "A vulnerability flag was raised in claims. Where does it surface at renewal?",
    ],
    parity_posture: "Concede: workflow / attestation management and board-pack polish (theirs). Win: the numbers being real — computed from actual experience, not attested.",
    data_dependency: "WP4 (hard), WP2 (premium side), WP5 (the price-walk cross-link).",
    stub_grade: "S1 candidate. → S2 on the first CCO / CRO room, or the first time a pricing demo gets the FCA question twice.",
    adjacent_links: [],
  },

  'distribution': {
    what: "Broker analytics that follow the outcome, not the activity. CRM knows activity, BI knows " +
      "aggregates; neither follows a broker's book through loss development, renewal behaviour and " +
      "payment discipline, because those live in four systems. This ranks brokers by the ultimate " +
      "loss ratio of what they placed three years ago — and asks what the commission ladder is " +
      "actually rewarding. Also the natural home for the If P&C agentic-distribution thread.",
    persona: "Chief Distribution Officer",
    canonical_question: "Which brokers write business that looks profitable in year one and toxic by year three — and what is my commission ladder rewarding?",
    workbench_capabilities: [
      "A broker scorecard over the existing underwriting broker entities + claims outcomes + WP1 renewal chains + WP2 receivables.",
      "Drill from a broker → the book they placed → its loss development three years on.",
      "Risk-mix shift detection tied to commission-tier changes — what the ladder quietly rewards.",
      "The receivables-ageing signal joined from billing — the number that lives in nobody's CRM dashboard.",
    ],
    reverse_kill_shots: [
      "Rank brokers by the ultimate loss ratio of the business they placed three years ago — not by GWP this quarter.",
      "Which broker's submissions have quietly shifted risk-mix since their commission tier changed?",
      "Broker X's receivables age 2× the panel average. Where does that show up in your CRM?",
    ],
    parity_posture: "Concede: CRM activity capture and BI dashboards (theirs). Win: the outcome joins across loss development, renewal and billing that no point solution can make.",
    data_dependency: "WP1 + WP2 (medium — a degraded version runs on existing schemas).",
    stub_grade: "S1, deliberately thin — a strong supporting screen more than a headline act. → S2 on a named distribution-transformation account.",
    adjacent_links: [],
  },

  'investments-alm': {
    what: "The asset–liability join. Asset platforms don't know the liabilities exist; liability " +
      "systems return the favour — the gap between them is literally the workbench's name. Duration " +
      "gap against the actual annuity book, own-funds sensitivity with both sides moving. This is " +
      "not asset management (theirs, inside-the-box) — it's the asset-liability join (ours).",
    persona: "CIO / Chief Actuary",
    canonical_question: "What is my duration gap against the actual annuity book — tonight's positions, this quarter's liabilities?",
    workbench_capabilities: [
      "Duration gap over WP3 asset positions against the actual liability cashflows — not a benchmark someone emailed in.",
      "Own-funds sensitivity to ±100bps with both sides of the balance sheet moving together.",
      "Reuses the LifeCast liability projections — the liabilities are already modelled on the same twin.",
      "Governed as-of positioning: tonight's positions, this quarter's liabilities, reproducible.",
    ],
    reverse_kill_shots: [
      "Your asset system's 'liability benchmark' is a duration number someone emailed in March — show me it computed against tonight's book.",
      "Show me own-funds sensitivity to 100bps with both sides moving, reproduced today.",
    ],
    parity_posture: "Concede: asset management (Aladdin-class, inside-the-box). Win: the asset-liability join.",
    data_dependency: "WP3 — its views already serve LifeCast + the Solvency screens; the standalone app waits for a CIO room.",
    stub_grade: "S0 (spec only). → S1 alongside a CIO room.",
    adjacent_links: [],
  },

  'capital-model-governance': {
    what: "Not a Tyche / Igloo / ReMetrica rival — their stochastic machinery is strong and we say " +
      "so. Sited on their two real weaknesses: run economics (grid licences + overnight windows vs " +
      "serverless GPU burst) and model-change governance (can they reproduce last quarter's run, " +
      "diff model versions, show approval lineage? almost never). The LifeCast JAX nested-MC engine " +
      "is the reusable compute.",
    persona: "Chief Actuary / Head of Capital / validation",
    canonical_question: "Show me your last major model change — inputs, code, approvals — reproduced today.",
    workbench_capabilities: [
      "The Solvency II major / minor change process with reproducible runs — inputs, code and approvals reproduced on demand.",
      "Model-version diff on your own book: what changed between this run and the last, line by line.",
      "Approval lineage in Unity Catalog — every change traceable end to end.",
      "Serverless GPU burst for nested Monte Carlo (the LifeCast JAX engine) instead of grid licences + overnight windows; pairs with the Just Group governance scope on file.",
    ],
    reverse_kill_shots: [
      "Reproduce last quarter's capital run — inputs, code, approvals — today.",
      "Diff this model version against the last, line by line, on your own book.",
      "What did your last overnight grid run cost, and could it burst on demand instead?",
    ],
    parity_posture: "Concede: the heavy stochastic machinery and structure libraries (theirs, strong). Win: run economics and model-change governance.",
    data_dependency: "Reuses the LifeCast capital engine + existing Solvency schemas.",
    stub_grade: "S0. → S1 only alongside a LifeCast-led room where capital comes up.",
    adjacent_links: [],
  },

  'planning-reforecasting': {
    what: "Reforecasting on the same twin as the engines. Planning suites run on offline extracts of " +
      "actuarial output; a replan is a two-week email chain. Here the plan sits on the same " +
      "lakehouse — the what-if levers already exist in the Solvency and IFRS 17 screens, so this is " +
      "largely orchestration + presentation of machinery already built.",
    persona: "CFO / FP&A",
    canonical_question: "Reforecast the year under the new loss-ratio assumption — while we're still in the meeting.",
    workbench_capabilities: [
      "Reforecast on live actuals, not offline extracts — the plan knows the moment actuals move.",
      "What-if levers reused from the Solvency II and IFRS 17 screens — no new engine to build.",
      "Plan-vs-actual variance surfaced continuously; governed scenario versions with lineage.",
    ],
    reverse_kill_shots: [
      "When actuals moved last month, how long until your plan knew?",
      "Replan under a new loss-ratio assumption now, in this meeting, with the workings.",
    ],
    parity_posture: "Concede: the planning-suite workflow and the CFO champions who love it (hostile terrain). Win: the plan living on the same twin as the engines.",
    data_dependency: "Existing Solvency + IFRS 17 what-if machinery.",
    stub_grade: "S0 — not a core persona, but the ask ('can you do planning?') is common and the honest answer is strong, so the spec should exist.",
    adjacent_links: [],
  },

  'financial-crime-siu': {
    what: "The cross-domain fraud ring. The claims fraud agent already exists; a standalone SIU " +
      "workbench is only justified by the story point solutions can't tell — the ring that lives " +
      "across quote manipulation, claims patterns, payee networks and (WP6) coverholder anomalies, " +
      "in one graph. AML / KYC screening depth stays out (specialist ground, conceded).",
    persona: "Head of Counter-Fraud / SIU",
    canonical_question: "Your tool scores a claim; show me the network that scored the claim, the quote, and the payee together.",
    workbench_capabilities: [
      "A cross-domain ring graph — quote × claim × payee × coverholder — in one governed view.",
      "Builds on the existing claims fraud agent rather than replacing it.",
      "Network scoring, not single-claim scoring: the ring across products and lifecycle stages.",
      "Governed under Unity Catalog — every link traceable.",
    ],
    reverse_kill_shots: [
      "Your tool scores a claim; show me the network behind the claim, the quote and the payee together.",
      "Which ring spans products and lifecycle stages your point solution never joins?",
    ],
    parity_posture: "Concede: AML / KYC screening depth (specialist, conceded). Win: the cross-domain ring the claims-only tools never see.",
    data_dependency: "Existing claims + quote data; richer with WP6 coverholder anomalies.",
    stub_grade: "S0. → S1 on a counter-fraud-led ask.",
    adjacent_links: [],
  },

  'climate-orsa': {
    what: "A living climate scenario, not a PDF. Consultancies sell static deliverables — the " +
      "scenario dies the day the deck lands. This is a scenario layer over exposure (the Exposure & " +
      "Event Response machinery) + assets (WP3) + a transition-risk overlay on the corporate book, " +
      "re-runnable on this year's book today. Exposure shipping first makes this a scenario pack " +
      "before it's an app.",
    persona: "CRO / Chief Actuary / Sustainability",
    canonical_question: "Re-run last year's climate ORSA on this year's book — today.",
    workbench_capabilities: [
      "A scenario layer over the Exposure & Event Response machinery + WP3 assets.",
      "A transition-risk overlay on the corporate book.",
      "A re-runnable climate ORSA — this year's book, today, not last March's PDF.",
      "CSRD-aligned governed outputs with lineage.",
    ],
    reverse_kill_shots: [
      "Re-run last year's climate ORSA on this year's book — today.",
      "Your climate scenario is a PDF from March; where does it update when the book moves?",
    ],
    parity_posture: "Concede: nothing structural — consultancy PDF scenarios are the incumbent. Win: the scenario being live and re-runnable.",
    data_dependency: "The Exposure & Event Response machinery + WP3 assets; EMEA regulatory tailwind is real but asks are consultancy-mediated and slow.",
    stub_grade: "S0 — Exposure first makes this a scenario pack before it's an app.",
    adjacent_links: [],
  },

  'underwriting-workbench': {
    what: "The commercial underwriter's desk on the lakehouse — from submission arriving in the " +
      "inbox to a bound risk. Broker submissions (emails, SOVs, loss runs, questionnaires) are " +
      "extracted with Document AI, triaged against risk appetite, enriched with internal experience " +
      "and external data, priced, and put in front of the underwriter with the reasoning shown — " +
      "quote, refer or decline, with the whole trail governed.",
    workbench_capabilities: [
      "Submission intake: broker emails, SOVs, loss runs and questionnaires parsed with Document AI / ai_query into structured, ACORD-aligned data — low-confidence extractions quarantined for review.",
      "Appetite and triage: rules + models score each submission against line-of-business appetite, capacity and sanctions/KYC checks, so the desk works the best risks first.",
      "Enrichment: internal claims experience (the Claims workbench's book), geospatial exposure, and third-party firmographics joined onto the risk — one governed view of everything known.",
      "Rate–quote–bind with the reasoning shown: pricing via the same governed model patterns as the Pricing workbench, an underwriting agent that drafts the quote and explains the drivers, human in the loop for refer/decline.",
      "Portfolio steering: written vs plan by segment, capacity burn, and the feedback loop into pricing and accumulation — same Unity Catalog governance plane as every other workbench.",
    ],
    adjacent_links: [],
  },

  'ifrs-17': {
    what: "IFRS 17 financial reporting for insurance contracts: contract groups, " +
      "Contractual Service Margin (CSM), risk adjustment, fulfilment cashflows. Heavy " +
      "data overlap with Solvency II technical provisions.",
    workbench_capabilities: [
      "CSM + fulfilment-cashflow tables as a peer gold layer alongside the SII gold layer — same Delta + UC governance.",
      "Reuses the cashflow projection engine that drives life TPs (Prophet) — the IFRS 17 measurement model adds the CSM mechanics on top.",
      "Same audit panel: every CSM movement carries its lineage to the underlying contract group + assumption set.",
      "Same overlay register for unlocking adjustments and CSM smoothing decisions.",
      "Reverse path to SII: the CSM run can flag inconsistencies between IFRS 17 best-estimate and SII best-estimate.",
    ],
    adjacent_links: [
      { label: 'See the life technical provisions surface (S.12.01)', to: '/reserving-life' },
      { label: 'See the Audit panel pattern', to: '/report/s0501' },
    ],
  },

  reinsurance: {
    what: "Reinsurance program performance: treaty-level analytics, retrocession " +
      "optimisation, capital-relief modelling. Same exposures that feed the cat " +
      "model are the inputs an RI optimisation already needs.",
    workbench_capabilities: [
      "Treaty performance: per-treaty cession, recoveries, and net retention as a peer gold table.",
      "Retrocession optimisation: linear / convex programming models in UC reading the same exposure layers the cat model reads.",
      "Capital-relief calculator that ties RI structure changes back to the SF + cat SCR components — what-if for RI design.",
      "Same Lab interface — RI optimisation models are peer rows alongside reserving + SF + cat.",
      "Same audit + lineage: every RI decision carries its rationale, modelled benefit, and downstream SCR impact.",
    ],
    adjacent_links: [
      { label: 'See the cat engine in the Lab', to: '/lab/igloo_cat' },
    ],
  },

  'claims-analytics': {
    what: "Claim-level analytics: fraud signals, severity prediction, experience " +
      "monitoring, reserving feedback. Same claim transactions feeding S.05.01 and the " +
      "reserving model already feed these.",
    workbench_capabilities: [
      "Fraud / anomaly models registered alongside reserving and SF — uniform governance.",
      "Severity prediction at first notification of loss — informs case-reserve recommendations.",
      "Experience-monitoring dashboards drawn from the same gold tables, surfacing emerging trends to the reserving committee.",
      "Audit panel surfaces the model that flagged each claim, plus any analyst overrides as overlays.",
      "Closes the loop: insights from claims feed the next reserving + pricing cycle.",
    ],
    adjacent_links: [
      { label: 'See claim data in S.05.01', to: '/report/s0501' },
      { label: 'See the Senior Reserving Actuary agent', to: '/lab/reserving_pnc' },
    ],
  },

  'sas-migration': {
    what: "Worked example — translating an actuarial SAS code-base (reserving procedures, " +
      "valuation routines, capital model logic) into PySpark / Spark SQL on the lakehouse. " +
      "The same actuarial methods, but governed, parallelisable, and auditable. Bring your " +
      "macros and DATA steps; leave with notebooks, MLflow-tracked models, and UC-managed " +
      "tables that any other workflow on the platform can read.",
    workbench_capabilities: [
      "Reference notebooks that take a representative SAS reserving program (chain-ladder + BF on triangles, with judgemental adjustments) and walk through the line-by-line conversion to PySpark — assignment-by-assignment, with both versions runnable side by side for parity testing.",
      "Pattern catalogue for the recurring SAS → PySpark conversions: DATA step → DataFrame transformation, PROC SQL → Spark SQL, PROC SUMMARY → groupBy, macro variables → notebook widgets, formats + informats → typed columns.",
      "MLflow-tracked parity harness: each conversion ships with paired runs (SAS reference vs PySpark candidate) on the same input data, with row-level diff reports and tolerance checks. Once parity holds for N quarters, the SAS leg is retired.",
      "UC governance from day one — the migrated routines land as pyfuncs in the Lab alongside reserving_pnc and standard_formula. Same Champion / Challenger flow, same diagnostics tab, same audit.",
      "Cost + performance side-by-side: SAS run-time + licence cost vs serverless DLT run-time on the same workload. Headline of every migration page.",
    ],
    adjacent_links: [
      { label: 'See the reserving model pattern (P&C)', to: '/lab/reserving_pnc' },
      { label: 'See the worked-example notebooks (chain-ladder)', to: '/lab' },
    ],
  },

  'excel-migration': {
    what: "Worked example — lifting an actuarial Excel model (reserve roll-forward, capital " +
      "model walk, valuation cashflow grid) into governed Delta tables + notebooks. The " +
      "spreadsheet's intent is preserved; the calculation moves into the lakehouse where " +
      "lineage, versioning, and the audit trail are first-class.",
    workbench_capabilities: [
      "Reference notebook that takes a representative actuarial Excel — a quarterly reserve roll-forward with linked SCR walk — and converts it: named ranges → typed columns, INDEX/MATCH + VLOOKUP → joins, array formulas → window functions, hidden tabs → intermediate Delta tables. Each step traces back to the original cell range.",
      "Pattern catalogue for the common shapes: pivot tables → groupBy + pivot, dependent dropdowns → parameterised notebook widgets, conditional formatting → Lakeview dashboard visuals, what-if scenario manager → governed scenario table feeding a notebook re-run.",
      "Snapshot + diff harness: every Excel-side recalculation is compared against the lakehouse-side run for the same period; row-level mismatches surface before the spreadsheet is retired. Parity must hold N quarters before the file is moved to read-only.",
      "Replace email-shaped overlays with the Overlays Register: every manual cell adjustment becomes an auditable overlay with author + approver + rationale, hashed and linked to the cell it touches.",
      "Output stays familiar — same numbers, same column layout, same sign-off chain — but now sits on UC with lineage, time-travel, and the AI agent layer reading from it.",
    ],
    adjacent_links: [
      { label: 'See the Overlays Register pattern', to: '/overlays' },
      { label: 'See the QRT audit panel (S.05.01)', to: '/report/s0501' },
    ],
  },
};
