/**
 * Next steps — the GTM follow-through behind each demo.
 *
 * A demo landing page shows a full-width "After the demo — next steps" band
 * when its slug has an entry here; the band opens /demo/<slug>/next-steps.
 *
 * The page is a STANDARD: three phases (understand → scope → prove & scale)
 * built by standardNextSteps() from universal assets — reference architecture
 * (one deck, deep-linked to the demo's slide), existing references, discovery
 * guide, sizing & cost guide, scoping workshop, POC plan template — plus
 * per-demo extras. A requests & feedback form (FEEDBACK_FORM_URL) closes
 * every page. Written so a standard SA can run first steps without the
 * insurance specialist.
 *
 * To roll out to another demo: add one standardNextSteps() entry with its
 * arch slide id (see ARCH_SLIDES).
 */

export interface NextStepAsset {
  title: string;
  sublabel: string;    // one line on what it is / why it matters
  href?: string;       // live link; omit for a non-clickable placeholder
  cta?: string;        // defaults to "Open"
  badge?: string;      // badge text; on placeholders defaults to "coming soon",
                       // on linked assets shown next to the title when set
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

/* ── Shared assets ──────────────────────────────────────────────────────── */

const ARCH_DECK =
  'https://docs.google.com/presentation/d/1YMxCOGG_tZYJuhttSfVi7OndYRRy-x-6zmT5blc4pv4/edit';

/** Section-divider slide per demo in the reference-architectures deck. */
export const ARCH_SLIDES: Record<string, string> = {
  'solvency-2': 'solv_div_slide',
  pricing: 'pric_div_slide',
  'claims-workbench': 'clai_div_slide',
  'underwriting-workbench': 'undw_div_slide',
  reinsurance: 'rein_div_slide',
  'ifrs-17': 'ifrs_div_slide',
  lifecast: 'life_div_slide',
  'legacy-migration': 'lega_div_slide', // SAS + Excel accelerators
};

const DISCOVERY_GUIDE_URL =
  'https://docs.google.com/document/d/1D6WTlevsdxrsrR_2lLsXZuERuy0xGl6YwBXe1rPOY2M/edit';
const REFERENCES_DOC_URL =
  'https://docs.google.com/document/d/1uvvMcaJPQjWRxvjSfEtJXQa1L3QuBpcbiNXnlxmti78/edit';
const SIZING_GUIDE_URL =
  'https://docs.google.com/document/d/1vDrxF3UnIe7QAkiorO7SetEJ4-puYqaAecAEmGLqHhA/edit';
const POC_PLAN_URL =
  'https://docs.google.com/document/d/1Mq_yNbS0Puw19zLhlZb44NH0QMm6kfIDHLNlMdGp6MA/edit';

/** Requests & feedback Google Form — the strip at the bottom of every page. */
export const FEEDBACK_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLScdASz6MdwBpcEhlh1cjEpH97JdgMpS_DglDGX0FXsCb3UJGg/viewform';

/* ── The standard ───────────────────────────────────────────────────────── */

interface StandardOptions {
  demoName: string;          // used in copy, e.g. "the pricing workbench"
  archSlideId: string;       // from ARCH_SLIDES
  understandExtras?: NextStepAsset[]; // demo-specific deep-dives
  scopeExtras?: NextStepAsset[];      // e.g. a demo-specific scoping workshop
  proveExtras?: NextStepAsset[];
}

function standardNextSteps(opts: StandardOptions): NextSteps {
  return {
    intro:
      'You’ve seen the demo — here is how it becomes real in an account, and it does not depend ' +
      'on the insurance specialist. Every step follows the standard Databricks motion (discovery, ' +
      'go/sizing, the FE PoC process) with the insurance specifics pre-filled, so any account team ' +
      'can run the first steps without an insurance background. Each asset below is a ' +
      'fill-in-the-blanks starting point, and the demos integrate with the client’s existing estate ' +
      '(Prophet, ResQ, Radar, Igloo, Guidewire) rather than replacing it. Escalation to the ' +
      'insurance lead is the exception, not the path.',
    phases: [
      {
        title: '1 · Understand what you saw',
        blurb: 'The production shape behind the demo, and who is already taking it into accounts.',
        assets: [
          {
            title: 'Reference architecture',
            sublabel: `The production blueprint for ${opts.demoName} — sources, medallion, models, serving and the app, governed end to end by Unity Catalog.`,
            href: `${ARCH_DECK}#slide=id.${opts.archSlideId}`,
            cta: 'Open deck',
          },
          {
            title: 'Existing references',
            sublabel: 'Who is already working with this in an account — find each other, compare notes, add your engagement.',
            href: REFERENCES_DOC_URL,
            cta: 'Open doc',
          },
          ...(opts.understandExtras ?? []),
        ],
      },
      {
        title: '2 · Scope it',
        blurb: 'From tool questions to the client’s process — discovery, terminology bridge, first-phase scope.',
        assets: [
          {
            title: 'Discovery guide',
            sublabel: 'From “how does the tool work” to the task, process and requirement behind it — terminology bridge, per-workbench question banks, and how to land alongside Prophet, ResQ, Radar or Igloo.',
            href: DISCOVERY_GUIDE_URL,
            cta: 'Open doc',
          },
          ...(opts.scopeExtras ?? []),
          {
            title: 'Sizing & cost estimate',
            sublabel: 'First-steps guide to the official sizing motion — Quicksizer and Lakemeter (go/sizing), the inputs to collect, and what each workbench actually consumes.',
            href: SIZING_GUIDE_URL,
            cta: 'Open doc',
            badge: 'internal',
          },
        ],
      },
      {
        title: '3 · Prove it & scale',
        blurb: 'A bounded proof with success criteria signed before it starts — aligned to the official FE PoC process.',
        assets: [
          {
            title: 'POC plan template',
            sublabel: 'A bounded proof on one process slice, pre-filled per workbench: success criteria, prerequisites, week-by-week plan, RACI — aligned to the FE PoC/MVP process.',
            href: POC_PLAN_URL,
            cta: 'Open doc',
          },
          {
            title: 'Deploy the code',
            sublabel: 'The demo code with its Databricks Asset Bundle — deployable into any workspace as the starting skeleton. Available upon request.',
            badge: 'upon request',
          },
          ...(opts.proveExtras ?? []),
        ],
      },
    ],
  };
}

/* ── Per-demo entries ───────────────────────────────────────────────────── */

export const NEXT_STEPS: Record<string, NextSteps> = {
  pricing: standardNextSteps({
    demoName: 'the pricing workbench',
    archSlideId: ARCH_SLIDES.pricing,
    understandExtras: [
      {
        title: 'Behind the scenes',
        sublabel: 'Technical deep-dive: every asset, the code that creates it, and how four models plus a rating engine serve millisecond quotes from one endpoint.',
        href: 'https://docs.google.com/document/d/1PyOMlo8x8yrXC8TLpRcYR480-xk2InlADOklkIcg93g/edit',
        cta: 'Open doc',
      },
    ],
    scopeExtras: [
      {
        title: 'Scoping workshop',
        sublabel: 'The workshop template we work through together — process mapping, data & ingestion, governance, integration, modelling, first-phase scope.',
        href: 'https://docs.google.com/document/d/10o--F4lMReF0a3ASXb92hB9ZvFuoB7mpk5Ug1wI8QWs/edit',
        cta: 'Open doc',
      },
    ],
  }),

  'solvency-2': standardNextSteps({
    demoName: 'the Solvency II workbench',
    archSlideId: ARCH_SLIDES['solvency-2'],
  }),

  'claims-workbench': standardNextSteps({
    demoName: 'the claims workbench',
    archSlideId: ARCH_SLIDES['claims-workbench'],
  }),

  'underwriting-workbench': standardNextSteps({
    demoName: 'the underwriting workbench',
    archSlideId: ARCH_SLIDES['underwriting-workbench'],
  }),

  reinsurance: standardNextSteps({
    demoName: 'the reinsurance workbench',
    archSlideId: ARCH_SLIDES.reinsurance,
  }),

  'ifrs-17': standardNextSteps({
    demoName: 'the IFRS 17 workbench',
    archSlideId: ARCH_SLIDES['ifrs-17'],
  }),

  lifecast: standardNextSteps({
    demoName: 'LifeCast',
    archSlideId: ARCH_SLIDES.lifecast,
  }),
};
