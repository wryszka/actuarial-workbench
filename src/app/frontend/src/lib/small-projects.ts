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
    title: 'Semantic lakehouse POC',
    description: 'A governed semantic layer on Databricks — metric views over the lakehouse, a best-practice pattern for consistent business metrics.',
    tag: 'Semantic layer',
    links: [
      { label: 'GitHub', href: 'https://github.com/wryszka/semantic-lakehouse-poc' },
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
];
