/**
 * Roadmap stub content — one entry per roadmap / in-progress tile.
 *
 * Adding a tile stub = (1) entry in workbench-tiles.ts, (2) entry here. No
 * per-tile component file needed.
 *
 * Language here is customer- and vendor-facing: it describes what a workflow
 * does and how it works alongside the systems an insurer already runs. It never
 * names or disparages another vendor and never frames this as replacing one —
 * value is shown through the workflow itself. Internal positioning lives only in
 * the playbook roadmap doc, never in the app.
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
  // Optional context shown when present — who the workflow is for and the
  // question it answers, in the customer's own terms.
  persona?: string;
  canonical_question?: string;
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


  // ── Roadmap band ───────────────────────────────────────────────────────────
  'exposure-management': {
    what: "A live, cross-line view of exposure — gross, net of treaty and by coverholder — " +
      "brought together from underwriting accumulation and the reinsurance catastrophe view " +
      "into one governed picture, refreshed in hours. It works alongside the catastrophe models " +
      "an insurer already runs, bringing their outputs together with the book so the whole " +
      "position is visible in one place when an event is developing.",
    persona: "Head of Exposure Management / Chief Underwriting Officer",
    canonical_question: "A named storm makes landfall in 36 hours. What is my exposure — gross, net of treaty, by coverholder — right now, and how sure am I?",
    workbench_capabilities: [
      "A live exposure map that brings together the underwriting accumulation grain and the reinsurance catastrophe view — one picture, across lines and sources.",
      "An event-footprint selector (illustrative synthetic footprints) that recomputes exposure quickly as a situation develops.",
      "A gross → net waterfall through the treaty structures, by treaty and by coverholder.",
      "A place to bring more than one model's view together under governance, with the chosen weights and the alternative recorded and auditable.",
      "Model-version transparency: when a catastrophe model updates, see clearly what moved on the book and why.",
    ],
    adjacent_links: [],
  },

  'delegated-authority': {
    what: "Delegated authority brought to life as live analytics on top of the systems already in " +
      "place. It computes line-size breaches from the latest bordereaux, highlights coverholder " +
      "books whose performance is drifting, and links them back to claims and reserving on the same " +
      "book. Turning each sender's bordereau into clean, validated, governed data is the foundation " +
      "underneath it — and the same governed view can be shared back to the coverholder as their own, " +
      "via Delta Sharing.",
    persona: "Head of Delegated Authority / Delegated Underwriting Manager",
    canonical_question: "Which of my binders is outside authority right now, and which coverholder's book is drifting before the next audit would catch it?",
    workbench_capabilities: [
      "A binder status board and breach queue — every line-size breach as of the latest bordereaux, computed live.",
      "Drill from a breach to the bordereau row behind it, with the governed waiver trail.",
      "Per-sender column mapping into one canonical, ACORD-aligned schema; format drift is rescued rather than dropped (Document AI / ai_query for messy headers).",
      "Data-quality expectations quarantine rows that fail, with the rule that fired — kept out of the clean book.",
      "Early sight of coverholder loss-ratio drift, with the option to share the same governed view back to the coverholder via Delta Sharing.",
    ],
    adjacent_links: [],
  },

  'conduct': {
    what: "Consumer Duty fair value computed from actual premium and claims experience — acceptance " +
      "rates, settlement times — rather than summarised by hand. It shows which customer cohorts sit " +
      "in the amber zone and how renewal pricing relates to their outcomes, drawing on the same " +
      "governed data as pricing and claims, and it's a natural home for FCA pricing-rules evidence.",
    persona: "Chief Customer Officer / Chief Risk Officer / Board",
    canonical_question: "Can we show fair value by product from our actual premium and claims experience?",
    workbench_capabilities: [
      "A fair-value board computed from actual claims acceptance rates and settlement times, with an illustrative amber cohort.",
      "A complaints-ratio view and a drill from an amber product to the underlying premium and claims evidence.",
      "The link between renewal pricing and customer outcomes, on one governed view.",
      "A vulnerability flag raised in claims that carries through to renewal.",
    ],
    adjacent_links: [],
  },

  'distribution': {
    what: "Broker analytics that follow outcomes through the cycle — loss development, renewal " +
      "behaviour and payment discipline — brought together from the systems where they live today. " +
      "It ranks brokers by the ultimate loss ratio of the business they placed and shows how the " +
      "commission structure relates to the risk being written. It's also a natural home for agentic " +
      "distribution journeys built on Genie and MCP.",
    persona: "Chief Distribution Officer",
    canonical_question: "Which brokers write business that looks profitable in year one and develops adversely by year three — and what is the commission structure rewarding?",
    workbench_capabilities: [
      "A broker scorecard bringing together broker records, claims outcomes, renewal chains and receivables.",
      "Drill from a broker to the book they placed and its loss development over time.",
      "How risk-mix relates to commission structure across the cycle.",
      "The receivables-ageing signal, brought in from billing alongside the rest.",
    ],
    adjacent_links: [],
  },

  'investments-alm': {
    what: "Assets and liabilities in one governed view. It shows the duration gap against the actual " +
      "annuity book and own-funds sensitivity with both sides of the balance sheet moving together, " +
      "reusing the liability projections already modelled on the same lakehouse. It complements the " +
      "asset-management platform an insurer already runs — the focus is the asset-liability " +
      "relationship.",
    persona: "Chief Investment Officer / Chief Actuary",
    canonical_question: "What is my duration gap against the actual annuity book — tonight's positions, this quarter's liabilities?",
    workbench_capabilities: [
      "Duration gap computed against the actual liability cashflows, not a static benchmark.",
      "Own-funds sensitivity to rate moves with assets and liabilities moving together.",
      "Reuses the LifeCast liability projections on the same lakehouse.",
      "Governed, reproducible as-of positioning.",
    ],
    adjacent_links: [],
  },

  'capital-model-governance': {
    what: "Governance and economics around the capital model, working alongside the internal-model " +
      "tooling an insurer already uses. It focuses on two things that are often hard to do elsewhere: " +
      "reproducing a prior capital run — inputs, code and approvals — on demand, and running the heavy " +
      "nested Monte Carlo on serverless compute that scales to zero. The stochastic modelling itself " +
      "stays where it is; this adds reproducibility, version diffing and lineage on top.",
    persona: "Chief Actuary / Head of Capital / Model Validation",
    canonical_question: "Can we reproduce our last major model change — inputs, code, approvals — on demand?",
    workbench_capabilities: [
      "Reproduce a prior capital run — inputs, code and approvals — on demand.",
      "Diff one model version against another on the same book.",
      "Approval lineage captured in Unity Catalog, traceable end to end.",
      "Serverless GPU compute for nested Monte Carlo (the LifeCast JAX engine), scaling to zero between runs.",
    ],
    adjacent_links: [],
  },

  'planning-reforecasting': {
    what: "Reforecasting on the same lakehouse as the actuarial engines, so a replan can happen while " +
      "the assumption is still being discussed. The what-if levers already exist in the Solvency II " +
      "and IFRS 17 screens; this brings them together into a planning view that stays close to live " +
      "actuals, complementing the existing planning process.",
    persona: "Chief Financial Officer / FP&A",
    canonical_question: "Can we reforecast the year under a new loss-ratio assumption while we're still in the meeting?",
    workbench_capabilities: [
      "Reforecast on live actuals rather than offline extracts.",
      "What-if levers reused from the Solvency II and IFRS 17 screens.",
      "Plan-versus-actual variance kept close to the source, with governed scenario versions.",
    ],
    adjacent_links: [],
  },

  'financial-crime-siu': {
    what: "A cross-domain view of financial-crime risk, connecting signals that usually sit in " +
      "separate places — quote patterns, claims patterns, payee networks and coverholder anomalies — " +
      "into one governed graph. It builds on the existing claims fraud detection rather than replacing " +
      "it, adding the network picture across products and lifecycle stages. Specialist AML / KYC " +
      "screening stays with the dedicated tools an insurer already uses.",
    persona: "Head of Counter-Fraud / Special Investigations",
    canonical_question: "Can we see the network behind a claim — the quote, the payee, the connected parties — not just a score on the single claim?",
    workbench_capabilities: [
      "A ring graph connecting quote, claim, payee and coverholder in one governed view.",
      "Builds on the existing claims fraud detection.",
      "Network-level scoring across products and lifecycle stages, alongside single-claim scoring.",
      "Governed under Unity Catalog, every link traceable.",
    ],
    adjacent_links: [],
  },

  'climate-orsa': {
    what: "A climate scenario that stays current rather than fixed at a point in time — a scenario " +
      "layer over the exposure view and the asset side, with a transition-risk overlay on the " +
      "corporate book, re-runnable on the current book on demand. It complements consultancy-led " +
      "climate work by keeping the numbers up to date between engagements.",
    persona: "Chief Risk Officer / Chief Actuary / Head of Sustainability",
    canonical_question: "Can we re-run last year's climate ORSA on this year's book, on demand?",
    workbench_capabilities: [
      "A scenario layer over the exposure view and the asset side.",
      "A transition-risk overlay on the corporate book.",
      "A climate ORSA that can be re-run on the current book on demand.",
      "CSRD-aligned, governed outputs with lineage.",
    ],
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
