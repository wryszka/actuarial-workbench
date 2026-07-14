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
  Code2, Table2, ScrollText, HeartPulse, Waypoints, UsersRound, FileInput,
  Stamp, GraduationCap,
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

// Tile `description` is the ONE-LINE hook shown on the card. The full write-up
// lives on the click-through page (demo-pages.ts blurb, or roadmap-content.ts).
export const TILES: Tile[] = [
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
    slug: 'reserving-deep-dive',
    label: 'Reserving deep dive',
    description: 'Triangle methods, model validation and a methodology library.',
    status: 'roadmap',
    icon: BarChart3,
    to: '/roadmap/reserving-deep-dive',
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
    slug: 'mrc-intelligence',
    label: 'MRC policy intelligence',
    description: "Lloyd's MRC PDFs → an ACORD knowledge graph + multi-agent assistant.",
    status: 'in_progress',
    icon: ScrollText,
    to: '/roadmap/mrc-intelligence',
    subtitle: "Lloyd's market · ACORD",
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
  {
    slug: 'bordereaux-ingestion',
    label: 'Bordereaux ingestion',
    description: 'Messy delegated-authority bordereaux → a governed, validated pipeline.',
    status: 'roadmap',
    icon: FileInput,
    to: '/roadmap/bordereaux-ingestion',
    subtitle: 'Delegated authority · premium & claims',
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
