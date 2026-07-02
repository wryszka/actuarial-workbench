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
} from './workbench-tiles';

export interface DemoPage {
  slug: string;
  title: string;
  subtitle?: string;
  blurb: string;
  appUrlKey?: keyof HubConfig;   // which /api/config field holds the app URL
  appUrlFallback?: string;       // used if config is unavailable
  previewImage?: string;         // screenshot shown on the Open-demo tile (path in public/)
  runDocUrl?: string;            // "demo run doc" link
  clientVideoUrl?: string;       // client-facing walkthrough recording (placeholder if unset)
  internalVideoUrl?: string;     // Databricks-internal "how to run it" (placeholder if unset)
  smeVideoUrl?: string;          // SME training on this demo's process (placeholder if unset)
  learnInApp?: boolean;          // show the "full Learn section lives in the demo" note
}

export const DEMO_PAGES: Record<string, DemoPage> = {
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
    learnInApp: true,
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
