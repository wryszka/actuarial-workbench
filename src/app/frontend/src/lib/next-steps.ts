/**
 * Next steps — the GTM follow-through behind each demo.
 *
 * A demo landing page shows a full-width "After the demo — next steps" band
 * when its slug has an entry here; the band opens /demo/<slug>/next-steps.
 * The page walks the client journey in phases (scope → stand it up → skill up
 * & prove it), each phase holding asset cards. Assets without an `href` render
 * as "coming soon" placeholders — fill them one by one, same as the videos.
 *
 * To roll this out to another demo: add an entry keyed by the demo slug.
 */

export interface NextStepAsset {
  title: string;
  sublabel: string;    // one line on what it is / why it matters
  href?: string;       // live link; omit for a non-clickable placeholder
  cta?: string;        // defaults to "Open"
  badge?: string;      // placeholder badge text; defaults to "coming soon"
}

export interface NextStepPhase {
  title: string;       // e.g. "1 · Scope it"
  blurb: string;       // one sentence on what this phase achieves
  assets: NextStepAsset[];
}

export interface NextSteps {
  intro: string;       // "how this becomes real" — 2-3 sentences
  phases: NextStepPhase[];
}

export const NEXT_STEPS: Record<string, NextSteps> = {
  pricing: {
    intro:
      'You’ve seen the demo — here is how it becomes real in your estate. The path is deliberately ' +
      'incremental: scope one line of business against what you run today, stand the foundation up on ' +
      'your own data, and prove it with a bounded POC before going wider. Every asset below is the ' +
      'reusable starting point for that step — none of it starts from a blank page.',
    phases: [
      {
        title: '1 · Scope it',
        blurb: 'Map the demo to your estate — data sources, models, tooling, and the first line of business to land.',
        assets: [
          {
            title: 'Scoping workshop',
            sublabel: 'The workshop template we work through together — process mapping, data & ingestion, governance, integration, modelling, first-phase scope.',
            href: 'https://docs.google.com/document/d/10o--F4lMReF0a3ASXb92hB9ZvFuoB7mpk5Ug1wI8QWs/edit',
            cta: 'Open doc',
          },
          {
            title: 'Sizing & cost estimate',
            sublabel: 'Indicative platform consumption for your volumes — pipelines, training, serving and the app.',
          },
        ],
      },
      {
        title: '2 · Stand it up',
        blurb: 'The production shape of the demo, deployed on your workspace with your data.',
        assets: [
          {
            title: 'Reference architecture',
            sublabel: 'The production blueprint — ingestion with HITL, medallion, model factory, route-optimised serving and the app, governed end to end by Unity Catalog.',
            href: '/pricing-architecture.png',
            cta: 'View diagram',
          },
          {
            title: 'Deploy the code',
            sublabel: 'The demo code with its Databricks Asset Bundle — deployable into your own workspace as the starting skeleton. Available upon request.',
            badge: 'upon request',
          },
          {
            title: 'First implementation guide',
            sublabel: 'Step-by-step: swap the synthetic book for your policy + telematics data, adapt the feature table, retrain the first model family.',
          },
        ],
      },
      {
        title: '3 · Skill up & prove it',
        blurb: 'Get your team self-sufficient and demonstrate value on a bounded scope.',
        assets: [
          {
            title: 'Training path',
            sublabel: 'The Databricks Academy route for pricing teams — data engineering, ML on Databricks, and Unity Catalog governance.',
            href: 'https://www.databricks.com/learn/training/home',
            cta: 'Academy',
          },
          {
            title: 'Typical POC plan',
            sublabel: 'A bounded 4–6 week proof: one line of business, one model family end to end, with agreed success criteria.',
          },
        ],
      },
      {
        title: 'Partners',
        blurb: 'Partner solutions and delivery capacity around the workbench.',
        assets: [
          {
            title: 'Partner solutions',
            sublabel: 'Packaged partner offerings that extend the workbench — rating engines, data providers and pricing tooling integrations.',
          },
          {
            title: 'Delivery partners',
            sublabel: 'System integrators with insurance pricing practices who can deliver the implementation alongside your team.',
          },
        ],
      },
    ],
  },
};
