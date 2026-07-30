/**
 * Demo landing pages — the standard middle level between a tile and the app.
 *
 * A tile with `to: '/demo/<slug>'` opens DemoLanding, which reads its entry
 * here and renders a consistent set of resources for every demo:
 *   - Open demo            → the running app
 *   - Demo run doc         → the step-by-step run guide
 *   - Client-facing demo   → polished walkthrough video (placeholder until set)
 *   - How to run it        → Databricks-internal enablement video (placeholder)
 *   - + a note that the demo has a full in-app Learn section
 *
 * To make a demo use this pattern: add an entry here and point its tile at
 * `/demo/<slug>`. `appUrlKey` selects which /api/config URL the Open-demo card
 * opens (falls back to `appUrlFallback` if config is unavailable).
 */
import type { HubConfig } from './config';
import {
  DEFAULT_SOLVENCY_APP_URL, DEFAULT_PRICING_APP_URL, DEFAULT_CLAIMS_APP_URL,
  DEFAULT_REINSURANCE_APP_URL, DEFAULT_LIFECAST_APP_URL,
  DEFAULT_UNDERWRITING_APP_URL, DEFAULT_IFRS17_APP_URL, DEFAULT_RESERVING_APP_URL,
} from './workbench-tiles';

export interface DemoChoice {
  title: string;
  sublabel: string;         // classification chip above the title
  description: string;
  appUrl: string;           // what "Open" launches (app, console, dashboard…)
  appLabel?: string;        // label of the Open button (default "Open")
  runDocUrl?: string;
  deckUrl?: string;
  blueprintUrl?: string;    // solution blueprint (user journey → components → migration)
  primary?: boolean;        // the flagship: rendered wide (2/3) and dark
}

export interface DemoPage {
  slug: string;
  title: string;
  subtitle?: string;
  blurb: string;
  choices?: DemoChoice[];        // when set, the landing offers these instead of one Open-demo card
  appUrlKey?: keyof HubConfig;   // which /api/config field holds the app URL
  appUrlFallback?: string;       // used if config is unavailable
  previewImage?: string;         // screenshot shown on the Open-demo tile (path in public/)
  runDocUrl?: string;            // "demo run doc" link
  deckUrl?: string;              // extra resource card when set (deck or companion doc)
  deckLabel?: string;            // title of that card (default "First steps deck")
  deckSublabel?: string;         // sublabel of that card
  clientVideoUrl?: string;       // client-facing walkthrough recording (placeholder if unset)
  internalVideoUrl?: string;     // Databricks-internal "how to run it" (placeholder if unset)
  smeVideoUrl?: string;          // SME training on this demo's process (placeholder if unset)
  hideTrainingCards?: boolean;   // drop the internal "how to run" + SME training cards
  learnInApp?: boolean;          // show the "full Learn section lives in the demo" note
}

export const DEMO_PAGES: Record<string, DemoPage> = {
  'agent-governance': {
    slug: 'agent-governance',
    title: 'Agent Governance',
    subtitle: 'The control plane for insurance AI agents · DORA / Solvency II · led by Philipp Tiefenbacher',
    blurb:
      'As agents spread across the business — pricing, claims, underwriting, reinsurance — an insurer ' +
      'needs one place to see and control them, not fragmented agents scattered across systems. ' +
      'Agent Atlas is that control plane: a single governance layer over every agent in the ' +
      'Bricksurance estate. It connects internal and external agents (including ones running outside ' +
      'Databricks); enforces guardrails and safety policies at the AI gateway; gives observability ' +
      'over every agent trace in Unity Catalog for GDPR and PII handling; keeps a registry of who ' +
      'owns each agent, the tools (UC functions) it can call, and what it costs; and maps those ' +
      'technical controls to the regulations an insurer must answer to — DORA, Solvency II — so a ' +
      'risk or compliance officer can pull an evidence pack showing exactly how the agents are ' +
      'controlled. Built with Philipp Tiefenbacher on the Agentic Solutions Hub pattern.',
    appUrlFallback: 'https://agent-atlas-7474656169654171.aws.databricksapps.com/welcome',
    learnInApp: true,
  },

  'actuarial-lab': {
    slug: 'actuarial-lab',
    title: 'Actuarial Exam Lab',
    subtitle: 'Actuaries’ own exam prep · Free Edition',
    blurb:
      'Not Databricks training — this is the actuary’s own professional training, run on Databricks. ' +
      'Three labs built on real, official exam material: CAS Exam 5 reserving with the CAS’s own ' +
      'chainladder library on the real Loss Reserve Database, the SOA ATPA sample take-home end to ' +
      'end, and IFoA CS1 Paper B (April 2024, all five questions) — every reproducible number ' +
      'asserted against the societies’ examiner reports. Everything loads itself: run the setup ' +
      'notebook once and the data is there — the CAS database ships inside the chainladder ' +
      'package, the SOA data is the publicly posted ATPA sample assessment, and the IFoA April ' +
      '2024 exam datasets are bundled into a governed volume, each with its source documented in ' +
      'the notebook. Exam papers and reports remain © SOA / CAS / IFoA — go to the societies for ' +
      'the full material. Built for the free, never-expiring Databricks Free Edition: for GTM ' +
      'conversations with societies, universities and prep providers — and for any actuary who ' +
      'wants a study environment that just works.',
    appUrlFallback:
      'https://fevm-lr-dev-aws-us.cloud.databricks.com/#workspace/Workspace/Shared/.bundle/actuarial-lab/files/src/notebooks',
    runDocUrl:
      'https://docs.google.com/document/d/1EimnJbuDWUbqHpLp5IY2P5cMezBvVU01FzVqd2QFnMk/edit',
    hideTrainingCards: true,
  },

  'ifrs-17': {
    slug: 'ifrs-17',
    title: 'IFRS 17',
    subtitle: 'Bricksurance SE',
    blurb:
      'The quarterly IFRS 17 close, end to end: nine governed feeds, a quality gate that blocks the ' +
      'close visibly, real PAA/GMM measurement engines (B96-ordered CSM, the §57 onerous test every ' +
      'quarter, real EIOPA discount curves), a balanced subledger reconciled to GL, §80/§101/§104 ' +
      'disclosures that foot by construction, and sign-off with as-at reproduction via Delta time ' +
      'travel. AI agents narrate the movements — deterministic SQL decides them.',
    appUrlKey: 'ifrs17_app_url',
    appUrlFallback: DEFAULT_IFRS17_APP_URL,
    runDocUrl:
      'https://docs.google.com/document/d/11dqx4qErSn-yuUtSQElQM8-62V_7QlHAzXOArJBXm7o/edit',
    learnInApp: true,
  },

  'reserving': {
    slug: 'reserving',
    title: 'Reserving',
    subtitle: 'Bricksurance SE',
    blurb:
      'A day in the life of a reserving actuary on Databricks: the loss-development triangle derived ' +
      'live from the claim ledger (reconciling to the penny), governed loss-development-factor ' +
      'selection with a human override when a data anomaly distorts the empirical pick, a methodology ' +
      'library (chain-ladder, Bornhuetter-Ferguson, Mack, GLM, peer-comparison) each registered in ' +
      'Unity Catalog, actual-vs-expected validation, an audit-trailed expert-judgement repository, and ' +
      'a reserving-committee view with a Senior Reserving Actuary agent — every reserve estimate traced ' +
      'to the QRT cells it produces. The same triangle machinery pricing teams use for rate indications.',
    appUrlKey: 'reserving_app_url',
    appUrlFallback: DEFAULT_RESERVING_APP_URL,
    learnInApp: true,
  },

  'solvency-2': {
    slug: 'solvency-2',
    title: 'Solvency II',
    subtitle: 'Bricksurance SE',
    blurb:
      'Capital, governance, disclosure and ORSA — the full Solvency II cycle on one platform, ' +
      'with native model development and an end-to-end audit trail.',
    appUrlKey: 'solvency_app_url',
    appUrlFallback: DEFAULT_SOLVENCY_APP_URL,
    previewImage: '/solvency-2-preview.png',
    runDocUrl:
      'https://docs.google.com/document/d/17P21XLBKiCQ4ErpI_PbqkoySns0hfAlR78B4_xaWUgM/edit',
    clientVideoUrl: 'https://youtu.be/gqVdLiK4TNo',
    learnInApp: true,
  },

  pricing: {
    slug: 'pricing',
    title: 'Pricing workbench',
    subtitle: 'Commercial motor',
    blurb:
      'The full pricing loop on Databricks — ingest, build, price, investigate, govern. AI agents ' +
      'across it: data-quality checks, factor-lift explainers, model selection, and “why this price?” ' +
      'quote investigation via Genie + Mosaic AI.',
    appUrlKey: 'pricing_app_url',
    appUrlFallback: DEFAULT_PRICING_APP_URL,
    previewImage: '/pricing-preview.png',
    runDocUrl:
      'https://docs.google.com/document/d/1VHVMrbwo1D2Gfl2NKnKJzosBlS-hltcFZ9guvBejUkM/edit',
  },

  'claims-workbench': {
    slug: 'claims-workbench',
    title: 'Claims Intelligence Workbench',
    subtitle: 'Bricksurance SE',
    blurb:
      'From first notice to settlement on one governed platform. AI auto-closes the simple claims in ' +
      'minutes and flags the rest for a handler — with its reasoning shown. Built on the Databricks ' +
      'Smart Claims accelerator, extended with agentic AI.',
    appUrlKey: 'claims_app_url',
    appUrlFallback: DEFAULT_CLAIMS_APP_URL,
    previewImage: '/claims-preview.png',
    runDocUrl:
      'https://docs.google.com/document/d/1JYlkNrESd53c4he-XS_TqEbOAoke9dUptcvpqUUfE2w/edit',
    deckUrl:
      'https://docs.google.com/document/d/1RWa2OG2UFt6afu6KwH4c6SzN5NPH6apLJu5IO1Lpo8A/edit',
    deckLabel: 'You asked, we built it',
    deckSublabel: 'Workshop use cases mapped to the live demo, screen by screen',
    learnInApp: true,
  },

  lifecast: {
    slug: 'lifecast',
    title: 'LifeCast',
    subtitle: 'Bricksurance Life',
    blurb:
      'Life insurance liability modelling, end to end on real worked examples — governed model points ' +
      'and assumptions, best-estimate liability projection, ESG scenario testing and GPU-accelerated ' +
      'stochastic fan-out — with the actuarial engine logic versioned, audited and run on serverless.',
    appUrlKey: 'lifecast_app_url',
    appUrlFallback: DEFAULT_LIFECAST_APP_URL,
    previewImage: '/lifecast-preview.png',
    runDocUrl:
      'https://docs.google.com/document/d/1daijoVb751CezD_qLQBEqLPbM4HePms7ScvBa24hxfg/edit',
    learnInApp: true,
  },

  'underwriting-workbench': {
    slug: 'underwriting-workbench',
    title: 'Underwriting workbench',
    subtitle: 'Commercial lines',
    blurb:
      'The commercial underwriter’s desk on the lakehouse — from submission arriving in the inbox to a ' +
      'bound risk. Broker submissions (emails, SOVs, loss runs, questionnaires) are extracted with ' +
      'Document AI, triaged against risk appetite, enriched with internal experience and external data, ' +
      'priced, and put in front of the underwriter with the reasoning shown — quote, refer or decline, ' +
      'with the whole trail governed.',
    appUrlKey: 'underwriting_app_url',
    appUrlFallback: DEFAULT_UNDERWRITING_APP_URL,
    runDocUrl:
      'https://docs.google.com/document/d/1-J6OfcRAekJUEwmA3kWD3GpBZx7OoNT0LbDLA7j-jRY/edit',
  },

  'insurance-ontology': {
    slug: 'insurance-ontology',
    title: 'Insurance ontology',
    subtitle: 'Bricksurance data core · ACORD',
    blurb:
      'Semantics live next to the data, governed in Unity Catalog. Two examples at two altitudes: ' +
      'the full insurance semantic layer that powers Genie and every workbench out of the box — ' +
      'and a small worked example of migrating legacy BI semantics onto it.',
    choices: [
      {
        title: 'The insurance semantic layer',
        sublabel: 'Data model as code · ACORD · Unity Catalog',
        description:
          'The whole of insurance — policies, claims, premiums, parties, reinsurance — modelled once ' +
          'as code and compiled into governed Unity Catalog schemas, tables, relationships, metrics ' +
          'and a business glossary. Deploy it and the platform already speaks insurance: point Genie ' +
          'at it and it answers business questions straight away, with almost no configuration — the ' +
          'semantics are already there. It’s the common language under every workbench in this ' +
          'hub, and the foundation for any agent that needs to understand an insurance business.',
        // Lives on the serverless workspace — not derived from apps_domain_number.
        appUrl: 'https://data-core-console-7474659673789953.aws.databricksapps.com',
        appLabel: 'Open the console',
        runDocUrl:
          'https://docs.google.com/document/d/1wQoDuRBpgVd3FM1AIV7MwWpm5PNH1WJ2c9LQZ4l23og/edit',
        deckUrl: 'https://docs.google.com/presentation/d/1vXC7SVZUC-23adWG5KTLvSwzzjNGKSskvf1Yq-AXOoc/edit',
        primary: true,
      },
      {
        title: 'Migrating legacy semantics',
        sublabel: 'Simple worked example · SSAS & Tabular → metric views',
        description:
          'For estates where the same metric lives in SSAS cubes, Tabular models and BI tools — and ' +
          'the copies disagree. A small end-to-end example of the destination: one governed metric ' +
          'view feeding Genie, dashboards, Excel and Power BI, so every tool returns the same number. ' +
          'Run doc = a 15-minute demo; deck = the migration story in three waves.',
        appUrl:
          'https://fevm-lr-dev-aws-us.cloud.databricks.com/dashboardsv3/01f17e9a41c2175e8d9d4cd6838d155a/published',
        appLabel: 'Example dashboard',
        blueprintUrl:
          'https://docs.google.com/document/d/12sFiZxHesUIMHH3w1j4HHmCkbfccQyGtJ1DOjwG9F6Y/edit',
        runDocUrl:
          'https://docs.google.com/document/d/1AfZ3ddIq4f9N2hLpwzx5fiBdIH4_r1Sq-YSkJ6LtLqI/edit',
        deckUrl:
          'https://docs.google.com/presentation/d/1CJGAtjRjKipZld-zgILQxti59cD9s8IHfkQvfk4kp5k/edit',
      },
    ],
  },

  reinsurance: {
    slug: 'reinsurance',
    title: 'Reinsurance',
    subtitle: 'Bricksurance Re',
    blurb:
      'Treaty submission intelligence for a reinsurer — triage and rate-on-line pricing, then the crux: ' +
      'each submission’s marginal accumulation into the peak windstorm zone and its Solvency II capital ' +
      'impact, decided in seconds. Plus a live cat-event response when a storm makes landfall.',
    appUrlKey: 'reinsurance_app_url',
    appUrlFallback: DEFAULT_REINSURANCE_APP_URL,
    previewImage: '/reinsurance-preview.png',
    runDocUrl:
      'https://docs.google.com/document/d/1UL3evJpQUwRRGv7E3mY1D0sfDMM8BHj_SU49I0YXR1g/edit',
    learnInApp: true,
  },
};
