/**
 * Small projects — the single point of entry for everything built around the
 * workbenches that doesn't warrant its own tile on the main grid.
 *
 * Each entry links to its public GitHub repo; entries without a public home
 * (customer-specific or not yet published) carry an "on request" badge instead.
 */
export interface SmallProject {
  title: string;
  description: string;   // one line
  href?: string;         // public link; omit for on-request
  badge?: string;        // shown when no href (defaults to "on request")
  tag?: string;          // small category label
}

export const SMALL_PROJECTS: SmallProject[] = [
  {
    title: 'Regulatory Reporting Workbench',
    description: 'One app, two regimes — EU Solvency II and US NAIC statutory reporting side by side with a regime toggle.',
    tag: 'Reporting',
  },
  {
    title: 'Genie Code demo',
    description: 'An end-to-end motor-claims analytics pipeline built with natural-language prompts — Free Edition friendly.',
    href: 'https://github.com/wryszka/genie_code_demo',
    tag: 'Genie',
  },
  {
    title: 'Repair-or-Replace',
    description: 'Fleet claims decisioning — repair or replace a damaged vehicle, consistently and without assessor bias.',
    href: 'https://github.com/wryszka/repair-or-replace-demo',
    tag: 'Claims / fleet',
  },
  {
    title: 'H&S Hub (RIDDOR)',
    description: 'Health & safety hub — RIDDOR incident reporting, COSHH and risk assessments on Databricks Apps.',
    href: 'https://github.com/wryszka/riddor-app',
    tag: 'Apps',
  },
  {
    title: 'DABs demo',
    description: 'The Databricks Asset Bundles lifecycle end to end — validate, deploy, run, destroy; basic + advanced tracks.',
    href: 'https://github.com/wryszka/dabs-demo',
    tag: 'Platform',
  },
  {
    title: 'Shamrock bootcamp',
    description: 'A hands-on Databricks bootcamp built around a synthetic Irish motor insurance book.',
    href: 'https://github.com/wryszka/shamrock-general-bootcamp',
    tag: 'Enablement',
  },
  {
    title: 'SecOps demo',
    description: 'A SOC operator view — security telemetry medallion pipeline with vector-search runbooks.',
    href: 'https://github.com/wryszka/secops_demo',
    tag: 'Security',
  },
  {
    title: 'Recon demo',
    description: 'SAS-to-Databricks output reconciliation — mapping-driven comparison with row-level verdicts.',
    tag: 'Migration',
  },
];
