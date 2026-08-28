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
  Shield, TrendingUp, FileSpreadsheet, Network, AlertOctagon,
  Code2, Table2, HeartPulse, Waypoints, UsersRound,
  Stamp, GraduationCap, ShieldCheck, Building2,
  CloudLightning, ClipboardCheck, Scale, Share2, Landmark,
  Layers, CalendarClock, Fingerprint, Leaf,
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
export const DEFAULT_UNDERWRITING_APP_URL =
  'https://underwriting-workbench-7474656169654171.aws.databricksapps.com';
export const DEFAULT_EXCEL_APP_URL =
  'https://excel-accelerator-7474656169654171.aws.databricksapps.com';
export const DEFAULT_IFRS17_APP_URL =
  'https://ifrs17-workbench-7474656169654171.aws.databricksapps.com';
export const DEFAULT_RESERVING_APP_URL =
  'https://reserving-workbench-7474656169654171.aws.databricksapps.com';

// Tile `description` is the ONE-LINE hook shown on the card. The full write-up
// lives on the click-through page (demo-pages.ts blurb, or roadmap-content.ts).
export const TILES: Tile[] = [
  {
    slug: 'group-control-tower',
    label: 'Bricksurance Group — Control Tower',
    description: 'The estate front door — one level above the workbenches: live map, cross-estate AI activity, and an agent wired to every workbench.',
    status: 'live',
    icon: Building2,
    to: '/group',              // internal SPA route (no env var)
    accent: 'blue',
    subtitle: 'Bricksurance Group · estate control tower',
  },
  {
    slug: 'solvency-2',
    label: 'Solvency II',
    description: 'The full Solvency II cycle — capital, governance, disclosure and ORSA.',
    status: 'live',
    icon: Shield,
    to: '/demo/solvency-2',
    accent: 'blue',
    subtitle: 'Bricksurance SE',
  },
  {
    slug: 'pricing',
    label: 'Pricing workbench',
    description: 'The end-to-end commercial-motor pricing loop, governed and AI-assisted.',
    status: 'live',
    icon: TrendingUp,
    to: '/demo/pricing',
    accent: 'blue',
    subtitle: 'Commercial motor',
  },
  {
    slug: 'underwriting-workbench',
    label: 'Underwriting workbench',
    description: 'Submission to bind — triage, appetite, enrichment and quote, AI-assisted.',
    status: 'in_progress',
    icon: Stamp,
    to: '/demo/underwriting-workbench',
    subtitle: 'Commercial lines',
  },
  {
    slug: 'ifrs-17',
    label: 'IFRS 17',
    description: 'The quarterly close, feeds to sign-off — CSM, onerous test, disclosures, audit.',
    status: 'in_progress',
    icon: FileSpreadsheet,
    to: '/demo/ifrs-17',
    accent: 'blue',
    subtitle: 'Bricksurance SE',
  },
  {
    slug: 'reserving',
    label: 'Reserving',
    description: 'Triangles to sign-off — methodology library, LDF selection, validation, expert judgement.',
    status: 'in_progress',
    icon: Table2,
    to: '/demo/reserving',
    accent: 'blue',
    subtitle: 'Bricksurance SE',
  },
  {
    slug: 'reinsurance',
    label: 'Reinsurance',
    description: 'Treaty submission intelligence — accumulation, capital and live cat response.',
    status: 'live',
    icon: Network,
    to: '/demo/reinsurance',        // two-level: tile → demo landing → app/docs/videos
    accent: 'blue',
    subtitle: 'Bricksurance Re',
  },
  {
    slug: 'claims-workbench',
    label: 'Claims Intelligence Workbench',
    description: 'First notice to settlement — AI auto-closes the simple, flags the rest.',
    status: 'live',
    icon: AlertOctagon,
    to: '/demo/claims-workbench',
    accent: 'blue',
    subtitle: 'Bricksurance SE',
  },
  {
    slug: 'lifecast',
    label: 'LifeCast',
    description: 'Life liability modelling end to end — projection, ESG, GPU stochastic fan-out.',
    status: 'in_progress',
    icon: HeartPulse,
    to: '/demo/lifecast',
    subtitle: 'Bricksurance Life',
  },
  {
    slug: 'sas-migration',
    label: 'SAS migration',
    description: 'Legacy SAS → PySpark / Spark SQL with Genie Code, on governed Delta.',
    status: 'live',
    icon: Code2,
    to: '/sas-migration',
    accent: 'blue',
  },
  {
    slug: 'excel-migration',
    label: 'Excel migration',
    description: 'Four use cases off the spreadsheet estate: VBA ETL, models to UC, Genie/AI-BI, Lakeflow Designer.',
    status: 'in_progress',
    icon: Table2,
    // Opens the Excel Accelerator front-door app directly (no in-hub detail
    // page). Overridden per-workspace by /api/config → excel_app_url.
    to: DEFAULT_EXCEL_APP_URL,
    accent: 'blue',
    subtitle: 'Bricksurance SE',
  },
  {
    slug: 'agent-governance',
    label: 'Agent Governance',
    description: 'Govern every insurance agent — pricing, claims, reinsurance — under one control plane.',
    status: 'in_progress',
    icon: ShieldCheck,
    to: '/demo/agent-governance',   // landing page → Agent Atlas app
    subtitle: 'Agent governance · DORA / Solvency II',
  },
  {
    slug: 'insurance-ontology',
    label: 'Insurance ontology',
    description: 'An ACORD-based insurance semantic layer, governed in Unity Catalog.',
    status: 'in_progress',
    icon: Waypoints,
    to: '/demo/insurance-ontology',   // landing page → console app + first-steps deck
    subtitle: 'ACORD data core',
  },
  {
    slug: 'customer-lake',
    label: 'CustomerLake',
    description: "Databricks' agentic CDP for insurance — a governed policyholder 360.",
    status: 'roadmap',
    icon: UsersRound,
    to: '/roadmap/customer-lake',
    subtitle: 'Agentic CDP · policyholder 360',
  },
  // ── Roadmap band: candidates, not commitments. Each sited where incumbents are
  // structurally weak (between-the-boxes / speed / economics / self-governance).
  // Full thinking (canonical question, parity posture, reverse kill-shots) lives
  // on the click-through page (roadmap-content.ts). See the playbook roadmap.
  {
    slug: 'exposure-management',
    label: 'Exposure & Event Response',
    description: 'The live cross-line exposure picture — gross, net of treaty, by coverholder — that no point solution owns.',
    status: 'roadmap',
    icon: CloudLightning,
    to: '/roadmap/exposure-management',
    subtitle: 'Between the boxes · cat + treaty + coverholder',
  },
  {
    slug: 'delegated-authority',
    label: 'Delegated Authority',
    description: 'Binders outside authority and coverholder books going bad — computed from bordereaux, not attested.',
    status: 'roadmap',
    icon: ClipboardCheck,
    to: '/roadmap/delegated-authority',
    subtitle: 'Binders & bordereaux · breach as analytics',
  },
  {
    slug: 'conduct',
    label: 'Customer & Conduct',
    description: 'Consumer Duty fair value computed from actual premium and claims — not an attestation spreadsheet.',
    status: 'roadmap',
    icon: Scale,
    to: '/roadmap/conduct',
    subtitle: 'Consumer Duty · fair value computed',
  },
  {
    slug: 'distribution',
    label: 'Distribution & Broker Analytics',
    description: 'Rank brokers by the ultimate loss ratio of what they placed three years ago — and what commission rewards.',
    status: 'roadmap',
    icon: Share2,
    to: '/roadmap/distribution',
    subtitle: 'Broker outcomes, not activity',
  },
  {
    slug: 'investments-alm',
    label: 'Investments & ALM',
    description: 'Duration gap against the actual annuity book — the asset–liability join nobody’s platform owns.',
    status: 'roadmap',
    icon: Landmark,
    to: '/roadmap/investments-alm',
    subtitle: 'The asset–liability join',
  },
  {
    slug: 'capital-model-governance',
    label: 'Capital & Model Governance',
    description: 'Reproduce last quarter’s capital run and diff model versions — governance the incumbent can’t show.',
    status: 'roadmap',
    icon: Layers,
    to: '/roadmap/capital-model-governance',
    subtitle: 'Reproduce & diff the internal model',
  },
  {
    slug: 'planning-reforecasting',
    label: 'Planning & Reforecasting',
    description: 'Reforecast the year under a new assumption while you’re still in the meeting.',
    status: 'roadmap',
    icon: CalendarClock,
    to: '/roadmap/planning-reforecasting',
    subtitle: 'Replan on live actuals',
  },
  {
    slug: 'financial-crime-siu',
    label: 'Financial Crime / SIU',
    description: 'The fraud ring across quote, claim and payee — the network point solutions never join.',
    status: 'roadmap',
    icon: Fingerprint,
    to: '/roadmap/financial-crime-siu',
    subtitle: 'The cross-domain fraud ring',
  },
  {
    slug: 'climate-orsa',
    label: 'Climate & CSRD',
    description: 'Re-run last year’s climate ORSA on this year’s book, today — not a PDF from March.',
    status: 'roadmap',
    icon: Leaf,
    to: '/roadmap/climate-orsa',
    subtitle: 'A living climate ORSA',
  },
  {
    slug: 'actuarial-lab',
    label: 'Actuarial Exam Lab',
    description: 'Real society exam labs — CAS reserving, SOA ATPA, IFoA CS1B — on Free Edition, zero setup.',
    status: 'live',
    icon: GraduationCap,
    to: '/demo/actuarial-lab',
    accent: 'blue',
    subtitle: 'Actuaries’ own exam prep',
  },
];
