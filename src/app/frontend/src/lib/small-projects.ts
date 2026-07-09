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
      { label: 'Notebooks', href: wsFolder('/Workspace/Shared/secops_demo') },
      { label: 'Data', href: wsSchema('secops_demo') },
      { label: 'GitHub', href: 'https://github.com/wryszka/secops_demo' },
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
      { label: 'Notebooks', href: wsFolder('/Workspace/Shared/shamrock-general-bootcamp') },
      { label: 'GitHub', href: 'https://github.com/wryszka/shamrock-general-bootcamp' },
    ],
  },
  {
    title: 'Recon demo',
    description: 'SAS-to-Databricks output reconciliation — mapping-driven comparison with row-level verdicts. Customer-specific; code on request.',
    tag: 'Migration',
    links: [
      { label: 'Notebooks', href: wsFolder('/Workspace/Shared/recon-demo') },
      { label: 'Data', href: wsSchema('recon_demo') },
    ],
  },
];
