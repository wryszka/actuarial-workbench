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
import { DEFAULT_REINSURANCE_APP_URL } from './workbench-tiles';

export interface DemoPage {
  slug: string;
  title: string;
  subtitle?: string;
  blurb: string;
  appUrlKey?: keyof HubConfig;   // which /api/config field holds the app URL
  appUrlFallback?: string;       // used if config is unavailable
  runDocUrl?: string;            // "demo run doc" link
  clientVideoUrl?: string;       // client-facing walkthrough recording (placeholder if unset)
  internalVideoUrl?: string;     // Databricks-internal "how to run it" (placeholder if unset)
  learnInApp?: boolean;          // show the "full Learn section lives in the demo" note
}

export const DEMO_PAGES: Record<string, DemoPage> = {
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
    runDocUrl:
      'https://docs.google.com/document/d/1UL3evJpQUwRRGv7E3mY1D0sfDMM8BHj_SU49I0YXR1g/edit',
    learnInApp: true,
  },
};
