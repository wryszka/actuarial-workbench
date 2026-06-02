/**
 * AcceleratorDetail — live detail page for the SAS migration + Excel
 * accelerator tiles.
 *
 * Reuses the narrative from roadmap-content.ts (what + capabilities) and adds a
 * "Live in this workspace" section that deep-links into the real deployed
 * pieces — notebooks, jobs, the DLT pipeline, the Lakeview dashboard, and
 * Catalog Explorer tables — built from /api/config. Links whose config is
 * missing are simply omitted.
 */
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Compass, ExternalLink, ChevronRight, FolderOpen, PlayCircle,
  Workflow, LayoutDashboard, Table2, Github, NotebookPen,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { ROADMAP_CONTENT } from '../lib/roadmap-content';
import { TILES } from '../lib/workbench-tiles';
import { fetchConfig, dbx, type HubConfig } from '../lib/config';

const GITHUB: Record<string, string> = {
  'sas-migration': 'https://github.com/wryszka/sas_migration',
  'excel-migration': 'https://github.com/wryszka/actuarial-excel-accelerator',
};

interface Piece {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sublabel: string;
  href: string;
}

function buildPieces(slug: string, c: HubConfig): Piece[] {
  const host = c.workspace_host;
  if (!host) return [];
  const pieces: Piece[] = [];

  if (slug === 'sas-migration') {
    if (c.sas_notebook_path)
      pieces.push({ icon: NotebookPen, label: 'Open the demo notebook',
        sublabel: 'Self-contained — creates the data, shows the SAS, runs the Genie Code translation',
        href: dbx.workspacePath(host, c.sas_notebook_path) });
    if (c.sas_job_id)
      pieces.push({ icon: PlayCircle, label: 'Run job — SAS Migration demo',
        sublabel: 'Re-creates the policies + claims tables and runs all three translations',
        href: dbx.job(host, c.sas_job_id) });
    if (c.catalog_name && c.sas_schema) {
      pieces.push({ icon: Table2, label: `Table — ${c.sas_schema}.policies`,
        sublabel: 'Catalog Explorer — lineage, audit, sample data',
        href: dbx.table(host, c.catalog_name, c.sas_schema, 'policies') });
      pieces.push({ icon: Table2, label: `Table — ${c.sas_schema}.claims`,
        sublabel: 'Catalog Explorer — lineage, audit, sample data',
        href: dbx.table(host, c.catalog_name, c.sas_schema, 'claims') });
    }
  }

  if (slug === 'excel-migration') {
    if (c.excel_folder_path)
      pieces.push({ icon: FolderOpen, label: 'Browse the accelerator notebooks',
        sublabel: 'demo_01_rfr_etl + demo_02a_scr_sf — the full migration recipe, step by step',
        href: dbx.workspacePath(host, c.excel_folder_path) });
    if (c.excel_rfr_job_id)
      pieces.push({ icon: PlayCircle, label: 'Run job — EIOPA RFR ETL (demo 1)',
        sublabel: 'bronze autoloader → DLT silver → gold rfr_curves',
        href: dbx.job(host, c.excel_rfr_job_id) });
    if (c.excel_pipeline_id)
      pieces.push({ icon: Workflow, label: 'DLT pipeline — silver_rfr (demo 1)',
        sublabel: 'Unpivot + data-quality expectations + forward rate',
        href: dbx.pipeline(host, c.excel_pipeline_id) });
    if (c.excel_scr_job_id)
      pieces.push({ icon: PlayCircle, label: 'Run job — SCR Standard Formula (demo 2A)',
        sublabel: 'orchestrator → parity test → MLflow sweep → UC UDFs → dashboard',
        href: dbx.job(host, c.excel_scr_job_id) });
    if (c.excel_dashboard_id)
      pieces.push({ icon: LayoutDashboard, label: 'Lakeview dashboard — SCR Standard Formula',
        sublabel: 'SCR waterfall, sub-module breakdown, worst scenarios',
        href: dbx.dashboard(host, c.excel_dashboard_id) });
    if (c.catalog_name && c.excel_schema)
      pieces.push({ icon: Table2, label: `Table — ${c.excel_schema}.rfr_curves`,
        sublabel: 'Catalog Explorer — the gold term-structure table demos 2 + 3 consume',
        href: dbx.table(host, c.catalog_name, c.excel_schema, 'rfr_curves') });
  }

  return pieces;
}

export default function AcceleratorDetail({ slug }: { slug: string }) {
  const tile = TILES.find((t) => t.slug === slug);
  const content = slug ? ROADMAP_CONTENT[slug] : undefined;

  const [cfg, setCfg] = useState<HubConfig | null>(null);
  useEffect(() => { fetchConfig().then(setCfg).catch(() => undefined); }, []);

  if (!tile || !content || !slug) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-sm text-gray-700">
        <Link to="/" className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Workbench
        </Link>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight mt-4">Accelerator not found</h2>
        <p className="mt-2 text-gray-600">No content for slug "{slug}".</p>
      </div>
    );
  }

  const Icon = tile.icon;
  const pieces = cfg ? buildPieces(slug, cfg) : [];
  const github = GITHUB[slug];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-5">
      <Link to="/" className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Workbench
      </Link>

      <header className="flex items-start gap-4 border-b border-gray-200 pb-5">
        <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
          <Icon className="w-7 h-7 text-blue-700" />
        </div>
        <div className="flex-1 pt-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{tile.label}</h1>
            <span className="text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
              live
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Worked example · deployed in this workspace — open the pieces below.
          </p>
        </div>
      </header>

      {/* Live pieces — the whole point of this page */}
      <section className="bg-white border-2 border-blue-200 rounded-lg p-5">
        <h2 className="text-base font-bold text-gray-900 mb-1">Live in this workspace</h2>
        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
          Deployed and run on {cfg?.catalog_name || 'this workspace'}. Each opens in the Databricks workspace (new tab).
        </p>
        {pieces.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            Workspace links aren't configured for this deployment yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {pieces.map((p, i) => {
              const PIcon = p.icon;
              return (
                <a key={i} href={p.href} target="_blank" rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors group">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <PIcon className="w-4 h-4 text-blue-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-gray-900 inline-flex items-center gap-1">
                      {p.label}
                      <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-600" />
                    </div>
                    <div className="text-[11px] text-gray-500 leading-snug mt-0.5">{p.sublabel}</div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
        {github && (
          <a href={github} target="_blank" rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800">
            <Github className="w-3.5 h-3.5" /> Source on GitHub <ChevronRight className="w-3 h-3" />
          </a>
        )}
      </section>

      <section className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-base font-bold text-gray-900 mb-2">What this workflow covers</h2>
        <p className="text-sm text-gray-700 leading-relaxed">{content.what}</p>
      </section>

      <section className="bg-gradient-to-br from-blue-50/50 to-white border border-blue-100 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-3">
          <Compass className="w-4 h-4 text-blue-700" />
          <h2 className="text-base font-bold text-gray-900">What this looks like on the platform</h2>
        </div>
        <ul className="space-y-2">
          {content.workbench_capabilities.map((c, i) => (
            <li key={i} className="text-sm text-gray-700 leading-relaxed flex items-start gap-2">
              <span className="text-blue-600 font-mono mt-0.5">·</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
