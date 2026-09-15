/**
 * Small projects — the single point of entry for everything built around the
 * workbenches that doesn't warrant its own tile on the main grid.
 *
 * Each card carries clickable links to the project's REAL assets: the app if
 * one is deployed, the demo run doc, the notebook folder and dataset in this
 * workspace, and the public repo. Workspace links point at the dev workspace.
 */

const DEV_HOST = 'https://fevm-lr-dev-aws-us.cloud.databricks.com';
const DEV_CATALOG = 'lr_dev_aws_us_catalog';

const wsFolder = (path: string) => `${DEV_HOST}/#workspace${path}`;
const wsSchema = (schema: string) => `${DEV_HOST}/explore/data/${DEV_CATALOG}/${schema}`;

export interface SmallProjectLink {
  label: string;       // e.g. "Open app", "Run doc", "Notebooks", "Data", "GitHub"
  href: string;
}

export interface SmallProject {
  title: string;
  description: string;   // one line
  tag?: string;          // small category label
  links: SmallProjectLink[];
}

export const SMALL_PROJECTS: SmallProject[] = [
  {
    title: 'Price Optimisation (gen2)',
    description: "An honest, teach-it-then-run-it price-optimisation demo in the gen2 pricing workbench. Chapter 1 explains optimisation on one segment (grandma-in-a-BMW) then runs that exact calculation as a Databricks job; Chapter 2 scales to a nine-segment portfolio with a learned+validated demand model, a mixed-integer solver under a sales floor, and a governed approve→release (deterministic recompute + append-only Unity Catalog record); Chapter 3 chooses a plan that holds up across uncertain-future scenarios. The recorded demo. Fully synthetic data.",
    tag: 'Pricing / Optimisation',
    links: [
      { label: 'Open app', href: 'https://pricing-workbench-gen2-7474655676955816.aws.databricksapps.com/optimisation-demo' },
      { label: 'Recording scripts', href: 'https://docs.google.com/document/d/1cJ9Y2TjwRocLTv4vR1CmwdbsYeZTFIII2Ju2sBDwL8I/edit?tab=t.rodiui7eho2j' },
      { label: 'Runbook', href: 'https://github.com/wryszka/pricing-workbench-gen2/blob/main/docs/optimisation_demo_runbook.md' },
      { label: 'GitHub', href: 'https://github.com/wryszka/pricing-workbench-gen2' },
    ],
  },
  {
    title: 'Finance Analytics Accelerator',
    description: "A finance team's whole quote-to-renewal book on one governed platform — 43 real questions answered in plain English (Genie), on a live AI/BI dashboard, built with no code (Lakeflow Designer) and forecast forward (ai_forecast). The desktop-ETL / Alteryx displacement story. Fully synthetic data.",
    tag: 'Finance / Designer + Genie',
    links: [
      { label: 'Run doc', href: 'https://docs.google.com/document/d/12ivRWfHLrkZ--Gs1FIXvwX5BZy_t3vSD35VvTTK3snA/edit' },
      { label: 'Session plan', href: 'https://docs.google.com/document/d/13tUUsXneQs1rMKv_bUZHk64SrZ8G32mC3K_S7Sry_FA/edit' },
      { label: 'Genie', href: `${DEV_HOST}/genie/rooms/01f1aab1c4a61419b71907e4d2618cd5` },
      { label: 'Dashboard', href: `${DEV_HOST}/dashboardsv3/01f1aab47e1e1476995836e3ed6757f1/published` },
      { label: 'Notebooks', href: wsFolder('/Workspace/Shared/finance-analytics-accelerator') },
      { label: 'Data', href: wsSchema('finance_analytics_demo') },
      { label: 'GitHub', href: 'https://github.com/wryszka/finance-analytics-accelerator' },
    ],
  },
  {
    title: 'Designer Recon Accelerator',
    description: 'Finance & audit workflows off the desktop ETL tool: a monthly cash-flow rec that reads header cells from ~20 bank-rec workbooks and appends two columns to a rolling file (formatted Excel out), and a control sheet that sums ~6–7 category tables back to the whole at 0.00 variance — built no-code on Lakeflow Designer with parity to the penny — plus scheduled automation (pick-the-right-version file staging + fixed-width per-file contra) via Jobs, Autoloader and Unity Catalog audit. Fully synthetic data.',
    tag: 'Finance / Designer',
    links: [
      { label: 'Run doc', href: 'https://docs.google.com/document/d/1KCrZycSUilvWx52W-CT2q-qcc8IVcyKLCEfxOU-mkzc/edit' },
      { label: 'Session plan', href: 'https://docs.google.com/document/d/13tUUsXneQs1rMKv_bUZHk64SrZ8G32mC3K_S7Sry_FA/edit' },
      { label: 'Notebooks', href: wsFolder('/Workspace/Shared/designer-recon-accelerator') },
      { label: 'Data', href: wsSchema('designer_recon_demo') },
      { label: 'Files (Volume)', href: `${DEV_HOST}/explore/data/volumes/${DEV_CATALOG}/designer_recon_demo/recon_landing` },
      { label: 'GitHub', href: 'https://github.com/wryszka/designer-recon-accelerator' },
    ],
  },
  {
    title: 'H&B renewal workbench',
    description: 'US Health & Benefits underwriting — a fully-insured medical renewal exhibit reproduced as a live engine, with what-if negotiation levers (trend, pooling, credibility) and a Claude-generated deal summary. Fully synthetic data.',
    tag: 'Underwriting / H&B',
    links: [
      { label: 'Open app', href: 'https://hb-renewal-workbench-7474656169654171.aws.databricksapps.com' },
      { label: 'Data', href: wsSchema('hb_renewal') },
    ],
  },
  {
    title: 'SecOps demo',
    description: 'A SOC operator view — security telemetry medallion pipeline with vector-search runbooks and an operator app.',
    tag: 'Security',
    links: [
      { label: 'Open app', href: 'https://secops-operator-view-7474656169654171.aws.databricksapps.com' },
      { label: 'Run doc', href: 'https://docs.google.com/document/d/13zD2v47TDsYpwX6CzFjrYQmJWeTVBSVJDvLO2YpSg6Q/edit' },
      { label: 'Deck', href: 'https://docs.google.com/presentation/d/1vkqIv0zXS0xMuE9GHKF_KmHbPUqqoeFx_zYzMMIiAWQ/edit' },
      { label: 'Notebooks', href: wsFolder('/Workspace/Shared/secops_demo') },
      { label: 'Pipeline', href: `${DEV_HOST}/pipelines/69d30a2d-3ee5-4cf5-9a42-cc6279730df7` },
      { label: 'Data', href: wsSchema('secops_demo') },
      { label: 'GitHub', href: 'https://github.com/wryszka/secops_demo' },
    ],
  },
  {
    title: 'MRC policy intelligence',
    description: "Lloyd's MRC contract PDFs → an ACORD-aligned knowledge graph and a multi-agent assistant over the London-market wording.",
    tag: "Lloyd's / ACORD",
    links: [
      { label: 'GitHub', href: 'https://github.com/wryszka/insurance-mrc-poc' },
    ],
  },
  {
    title: 'Genie Code demo',
    description: 'An end-to-end motor-claims analytics pipeline built with natural-language prompts — Free Edition friendly.',
    tag: 'Genie',
    links: [
      { label: 'GitHub', href: 'https://github.com/wryszka/genie_code_demo' },
    ],
  },
  {
    title: 'Repair-or-Replace',
    description: 'Fleet claims decisioning — repair or replace a damaged vehicle, consistently and without assessor bias.',
    tag: 'Claims / fleet',
    links: [
      { label: 'GitHub', href: 'https://github.com/wryszka/repair-or-replace-demo' },
    ],
  },
  {
    title: 'H&S Hub (RIDDOR)',
    description: 'Health & safety hub — RIDDOR incident reporting, COSHH and risk assessments on Databricks Apps.',
    tag: 'Apps',
    links: [
      { label: 'GitHub', href: 'https://github.com/wryszka/riddor-app' },
    ],
  },
  {
    title: 'DABs demo',
    description: 'The Databricks Asset Bundles lifecycle end to end — validate, deploy, run, destroy; basic + advanced tracks.',
    tag: 'Platform',
    links: [
      { label: 'GitHub', href: 'https://github.com/wryszka/dabs-demo' },
    ],
  },
  {
    title: 'Shamrock bootcamp',
    description: 'A hands-on Databricks bootcamp built around a synthetic Irish motor insurance book.',
    tag: 'Enablement',
    links: [
      { label: 'Deck', href: 'https://docs.google.com/presentation/d/1uU-9D6j6JoReVX25lfZZixPURmD1uFk0fz1Tmi3nobg/edit' },
      { label: 'Attendee guide', href: 'https://docs.google.com/document/d/1hWgUrJcj_TIim31NVE6UTWg5bxXl79vchx2BAMkSOG8/edit' },
      { label: 'Notebooks', href: wsFolder('/Workspace/Shared/shamrock-general-bootcamp') },
      { label: 'GitHub', href: 'https://github.com/wryszka/shamrock-general-bootcamp' },
    ],
  },
  {
    title: 'Recon demo',
    description: 'SAS-to-Databricks output reconciliation — upload the monthly file, it lands in a UC Volume, a mapping-driven job classifies every field, and the exceptions surface on a cockpit dashboard. Customer-specific; code on request.',
    tag: 'Migration',
    links: [
      { label: 'Run guide', href: 'https://docs.google.com/document/d/1VbthGeCrqt79MkQsV8D2oJbssHciWVan6zLItd1oHrQ/edit' },
      { label: 'Open app', href: 'https://recon-upload-7474656169654171.aws.databricksapps.com' },
      { label: 'Cockpit', href: 'https://fevm-lr-dev-aws-us.cloud.databricks.com/dashboardsv3/01f184e2492e1a3f924bc78dc2f5efa5/published' },
      { label: 'Notebooks', href: wsFolder('/Workspace/Shared/recon-demo') },
      { label: 'Data', href: wsSchema('recon_demo') },
    ],
  },
  {
    title: 'WTW Hub demo',
    description: 'One Databricks foundation under four WTW products (Radar, Igloo, ResQ, RAFM) with an orchestration band and a governance rail — an architect-facing pitch app.',
    tag: 'Partner / WTW',
    links: [
      { label: 'Open app', href: 'https://wtw-hub-demo-7474659673789953.aws.databricksapps.com' },
    ],
  },
  {
    title: 'Videos',
    description: 'Demo video scripts and run-throughs for the workbenches — talk track, step-by-step click-path and pre-flight per video, numbered so the order holds. Optimization Parts 1 & 2 scripted; more to come.',
    tag: 'Enablement',
    links: [
      { label: 'Scripts doc', href: 'https://docs.google.com/document/d/1cJ9Y2TjwRocLTv4vR1CmwdbsYeZTFIII2Ju2sBDwL8I/edit' },
    ],
  },
];
