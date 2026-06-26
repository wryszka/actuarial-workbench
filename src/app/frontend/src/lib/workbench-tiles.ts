/**
 * Workbench tile registry — single source of truth for the hub launcher.
 *
 * Each tile is one of:
 *   - live      → opens a deployed Databricks App (external URL). The URL has a
 *                 sensible default here, overridden per-workspace by /api/config.
 *   - in_progress / roadmap → opens a stub at /roadmap/{slug} describing the
 *                 workflow and how it would plug into the platform.
 *
 * To plumb a new live workflow: set status 'live', point `to` at its deployed
 * app URL, and (optionally) wire a config var so the URL is env-driven. See
 * README.md → "Adding / plumbing a tile".
 */
import {
  Shield, TrendingUp, FileSpreadsheet, Network, AlertOctagon, BarChart3,
  Code2, Table2, ScrollText, HeartPulse, Waypoints, MonitorPlay,
} from 'lucide-react';

export type TileStatus = 'live' | 'in_progress' | 'roadmap' | 'contact';

export interface Tile {
  slug: string;                    // URL slug + key
  label: string;
  description: string | string[];  // a paragraph, or a list of bullet lines
  status: TileStatus;
  icon: React.ComponentType<{ className?: string }>;
  to: string;                      // navigate target (external URL for live tiles)
  accent?: 'blue';                 // live tile colour palette
  subtitle?: string;               // optional small line under the title (e.g. entity)
  photo?: string;                  // contact tile — path to a headshot in public/
}

// Static fallback URLs for the live tiles. These are overridden at runtime by
// /api/config (derived per-workspace from apps_domain_number) so the hub stays
// portable; they exist only so the tiles still open if config is unavailable.
// Default to the dev workspace (apps domain number ...654171).
export const DEFAULT_SOLVENCY_APP_URL =
  'https://solvency2-workbench-7474656169654171.aws.databricksapps.com';
export const DEFAULT_PRICING_APP_URL =
  'https://pricing-workbench-7474656169654171.aws.databricksapps.com/';
export const DEFAULT_CLAIMS_APP_URL =
  'https://claims-workbench-7474656169654171.aws.databricksapps.com';
export const DEFAULT_REINSURANCE_APP_URL =
  'https://reinsurance-workbench-7474656169654171.aws.databricksapps.com';
export const DEFAULT_LIFECAST_APP_URL =
  'https://lifecast-workbench-7474656169654171.aws.databricksapps.com';

export const TILES: Tile[] = [
  {
    slug: 'solvency-2',
    label: 'Solvency II',
    description: 'Capital, governance, disclosure, ORSA — full cycle with native model development and end-to-end audit trail.',
    status: 'live',
    icon: Shield,
    to: DEFAULT_SOLVENCY_APP_URL,
    accent: 'blue',
  },
  {
    slug: 'pricing',
    label: 'Pricing workbench',
    description: 'The full pricing loop on Databricks — ingest, build, price, investigate, govern. AI agents across it: data-quality checks, factor-lift explainers, model selection, and "why this price?" quote investigation via Genie + Mosaic AI.',
    status: 'live',
    icon: TrendingUp,
    to: DEFAULT_PRICING_APP_URL,
    accent: 'blue',
    subtitle: 'Commercial motor',
  },
  {
    slug: 'ifrs-17',
    label: 'IFRS 17',
    description: 'Contract groups, CSM, financial disclosure. Heavy data overlap with Solvency II technical provisions.',
    status: 'roadmap',
    icon: FileSpreadsheet,
    to: '/roadmap/ifrs-17',
  },
  {
    slug: 'reinsurance',
    label: 'Reinsurance',
    description: 'Treaty submission intelligence for a reinsurer — triage and rate-on-line pricing, then the crux: each submission’s marginal accumulation into the peak windstorm zone and its Solvency II capital impact, decided in seconds. Live cat-event response when a storm makes landfall, with Genie, a tool-calling agent and AI/BI over one governed book.',
    status: 'live',
    icon: Network,
    to: '/demo/reinsurance',        // two-level: tile → demo landing → app/docs/videos
    accent: 'blue',
    subtitle: 'Bricksurance Re',
  },
  {
    slug: 'claims-workbench',
    label: 'Claims Intelligence Workbench',
    description: 'From first notice to settlement on one governed platform. AI auto-closes the simple claims in minutes and flags the rest for a handler — with its reasoning shown. Built on the Databricks Smart Claims accelerator, extended with agentic AI.',
    status: 'live',
    icon: AlertOctagon,
    to: DEFAULT_CLAIMS_APP_URL,
    accent: 'blue',
    subtitle: 'Bricksurance SE',
  },
  {
    slug: 'lifecast',
    label: 'LifeCast',
    description: 'Life insurance liability modelling, end to end on real worked examples — governed model points and assumptions, best-estimate liability projection, ESG scenario testing and stochastic fan-out — with the actuarial engine logic versioned, audited and run on serverless.',
    status: 'in_progress',
    icon: HeartPulse,
    to: DEFAULT_LIFECAST_APP_URL,
    subtitle: 'Bricksurance Life · external app',
  },
  {
    slug: 'reserving-deep-dive',
    label: 'Reserving deep dive',
    description: 'Triangle methods, model validation, methodology library. Extends the chain-ladder + BF examples already in the Lab.',
    status: 'roadmap',
    icon: BarChart3,
    to: '/roadmap/reserving-deep-dive',
  },
  {
    slug: 'sas-migration',
    label: 'SAS migration',
    description: 'Worked example — moving a legacy SAS program to PySpark / Spark SQL on the lakehouse with Genie Code. PROC SQL, DATA step + RETAIN, and PROC MEANS translated and run on governed Delta tables.',
    status: 'live',
    icon: Code2,
    to: '/sas-migration',
    accent: 'blue',
  },
  {
    slug: 'excel-migration',
    label: 'Excel migration',
    description: 'Worked examples — lifting actuarial Excel + VBA into governed Delta: EIOPA RFR ingestion, the Solvency II SCR Standard Formula (with Excel round-trip + parity), and monthly experience / loss-ratio monitoring served through a Genie space and AI/BI dashboard.',
    status: 'in_progress',
    icon: Table2,
    to: '/excel-migration',
  },
  {
    slug: 'mrc-intelligence',
    label: 'MRC policy intelligence',
    description: "Lloyd's Market Reform Contract (MRC) PDFs turned into a governed knowledge graph using ACORD terminology — insured, broker, syndicate, limits, clauses and exclusions, and the links between them, extracted with the Foundation Model API. A multi-agent assistant (Genie NL-to-SQL, Knowledge Assistant vector search, and a Claude supervisor) answers underwriter, broker and compliance questions over it.",
    status: 'in_progress',
    icon: ScrollText,
    to: '',                       // description only for now — not yet wired to the app
    subtitle: "Lloyd's market · ACORD",
  },
  {
    slug: 'insurance-ontology',
    label: 'Insurance ontology',
    description: 'A shared insurance semantic layer in Unity Catalog — ACORD-aligned entities, attributes and code lists as governed definitions, tags, a business glossary and certified metric views, so every workbench speaks one language with lineage end to end.',
    status: 'roadmap',
    icon: Waypoints,
    to: '/roadmap/insurance-ontology',
  },
  {
    slug: 'sme-training',
    label: 'SME training recording',
    description: 'A recorded subject-matter-expert session on the insurance domain behind these demos — how each maps to real actuarial, underwriting and claims work. Watch before you present.',
    status: 'roadmap',
    icon: MonitorPlay,
    to: '',                       // recording link to come — placeholder for now
    subtitle: 'Enablement · recording to come',
  },
  {
    slug: 'contact',
    label: 'Laurence Ryszka',
    description: 'Insurance Tech Lead — for any questions or details, info inside.',
    status: 'contact',
    icon: HeartPulse,                 // unused for contact tiles (photo shown instead)
    to: '/contact',
    photo: '/laurence.png',
    subtitle: 'Owner & creator of these demos',
  },
];
