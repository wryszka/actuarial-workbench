/**
 * Actuarial Workbench landing — the hub's only real page.
 *
 * Tiles for each workflow that shares the lakehouse:
 *   - live        → opens a deployed Databricks App in a new tab
 *   - in_progress → worked example being built (stub at /roadmap/{slug})
 *   - roadmap     → advertised, not built yet (stub at /roadmap/{slug})
 *
 * Live-tile URLs come from /api/config (per-workspace, env-driven). If config
 * is unavailable, the static default in the tile registry is used.
 *
 * Tile metadata lives in workbench-tiles.ts so adding a tile is one file.
 */
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TILES, type Tile } from '../lib/workbench-tiles';
import { fetchConfig } from '../lib/config';
import ContactFooter from '../components/ContactFooter';

export default function Workbench() {
  // Demo tiles route to in-hub landing pages (/demo/<slug>), which resolve the
  // per-workspace app URL from /api/config themselves — so the landing page only
  // needs the entity name for the header.
  const [entity, setEntity] = useState<string>('Bricksurance SE');

  useEffect(() => {
    fetchConfig()
      .then((c) => { if (c.entity_name) setEntity(c.entity_name); })
      .catch(() => undefined);
  }, []);

  const tiles: Tile[] = TILES;

  return (
    <>
    <div className="max-w-6xl mx-auto p-6 space-y-7">
      <header className="pt-2 flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-widest text-blue-700 font-bold">Actuarial Workbench</div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mt-1">Bricksurance — insurance on Databricks</h1>
          <p className="text-base text-gray-500 mt-1.5 leading-relaxed max-w-3xl">
            Real insurance business process demos, implemented fully in Databricks.
          </p>
        </div>
        <Link to="/contact"
          className="shrink-0 w-full sm:w-72 bg-white border-2 border-emerald-200 rounded-2xl p-4 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100 transition-all flex flex-col group">
          <div className="flex items-center gap-3">
            <img src="/laurence.png" alt="Laurence Ryszka"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-100 shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-bold text-gray-900">Laurence Ryszka</div>
              <div className="text-[11px] text-gray-500">Creator of the demos</div>
            </div>
          </div>
          <p className="text-[12px] text-gray-600 mt-2.5 leading-snug">
            Click for help, a demo, first steps, or weekly office hours.
          </p>
          <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
            Get in touch <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {tiles.map((t) => <TileCard key={t.slug} tile={t} />)}
      </div>

      <details className="bg-white rounded-lg border border-gray-200 p-4 text-sm text-gray-700 mt-2">
        <summary className="font-semibold text-gray-800 cursor-pointer">Platform overview</summary>
        <div className="mt-2 space-y-2 leading-relaxed">
          <p>
            Every workflow on this surface shares one foundation — Unity Catalog for governed
            tables and ML models, Delta for storage and time travel, MLflow for model versioning,
            Mosaic AI for the agent layer, Databricks Apps for the surfaces themselves. This hub is
            the launcher; each tile opens the app that owns that workflow.
          </p>
        </div>
      </details>

      <p className="text-[11px] text-gray-400 leading-relaxed border-t border-gray-200 pt-3">
        <span className="font-semibold text-gray-500">About this demo.</span>{' '}
        A Databricks Field Engineering demonstration. {entity} is a fictional composite insurer
        and all data referenced by the linked apps is synthetic — nothing here is real regulatory
        output or financial advice. Linked apps open only when deployed and running in this workspace.
      </p>
    </div>
    <ContactFooter />
    </>
  );
}

function TileDescription({ description, tone = 'default' }: { description: string | string[]; tone?: 'default' | 'muted' }) {
  const color = tone === 'muted' ? 'text-slate-600' : 'text-gray-600';
  const text = Array.isArray(description) ? description.join(' ') : description;
  return <p className={`text-xs ${color} leading-snug flex-1 line-clamp-2`}>{text}</p>;
}

function TileCard({ tile }: { tile: Tile }) {
  const isLive = tile.status === 'live';
  const isInProgress = tile.status === 'in_progress';
  const Icon = tile.icon;
  const isExternal = isLive && /^https?:\/\//.test(tile.to);

  if (isLive) {
    const cls = LIVE_TILE_PALETTE[tile.accent ?? 'blue'];
    const periodNote = tile.subtitle ?? (isExternal ? 'External app · new tab' : 'Live in this workspace');
    const containerCls = `block bg-white border-2 ${cls.border} rounded-xl p-4 transition-all hover:shadow-lg ${cls.hover} group flex flex-col`;
    const inner = (
      <>
        <div className="flex items-start gap-2.5 mb-2">
          <div className={`w-9 h-9 rounded-lg ${cls.iconBg} flex items-center justify-center transition-colors shrink-0`}>
            <Icon className={`w-5 h-5 ${cls.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className={`text-[15px] font-bold ${cls.title} tracking-tight leading-tight`}>{tile.label}</h3>
              <span className="text-[9px] uppercase tracking-widest font-bold px-1 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">live</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">{periodNote}</p>
          </div>
        </div>
        <TileDescription description={tile.description} />
        <div className={`mt-2 inline-flex items-center gap-1 text-xs font-bold ${cls.arrow}`}>
          Open <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </>
    );
    return isExternal
      ? <a href={tile.to} target="_blank" rel="noopener noreferrer" className={containerCls}>{inner}</a>
      : <Link to={tile.to} className={containerCls}>{inner}</Link>;
  }

  if (isInProgress) {
    const hasLink = Boolean(tile.to);
    const isExternalLink = hasLink && /^https?:\/\//.test(tile.to);
    const inner = (
      <>
        <div className="flex items-start gap-2.5 mb-2">
          <div className={`w-9 h-9 rounded-lg bg-amber-100 ${hasLink ? 'group-hover:bg-amber-200' : ''} flex items-center justify-center transition-colors shrink-0`}>
            <Icon className="w-5 h-5 text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-[15px] font-bold text-amber-900 tracking-tight leading-tight">{tile.label}</h3>
              <span className="text-[9px] uppercase tracking-widest font-bold px-1 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />in&nbsp;progress
              </span>
            </div>
            <p className="text-[10px] text-amber-700/80 mt-0.5">{tile.subtitle ?? 'Being built'}</p>
          </div>
        </div>
        <TileDescription description={tile.description} />
        {hasLink && (
          <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-amber-700">
            {isExternalLink ? 'Open' : 'Read more'} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </>
    );
    const baseCls = 'block bg-white border-2 border-amber-300 rounded-xl p-4 transition-all flex flex-col';
    const linkCls = `${baseCls} hover:shadow-lg hover:border-amber-400 hover:shadow-amber-100 group`;
    if (!hasLink) return <div className={baseCls}>{inner}</div>;
    return isExternalLink
      ? <a href={tile.to} target="_blank" rel="noopener noreferrer" className={linkCls}>{inner}</a>
      : <Link to={tile.to} className={linkCls}>{inner}</Link>;
  }

  // Roadmap tile — de-emphasised. Empty `to` = non-clickable; external opens in a tab.
  const roadHasLink = Boolean(tile.to);
  const roadExternal = roadHasLink && /^https?:\/\//.test(tile.to);
  const roadInner = (
    <>
      <div className="flex items-start gap-2.5 mb-2">
        <div className="w-9 h-9 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-slate-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-[15px] font-bold text-slate-700 tracking-tight leading-tight">{tile.label}</h3>
            <span className="text-[9px] uppercase tracking-widest font-bold px-1 py-0.5 rounded bg-slate-200 text-slate-600">soon</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">{tile.subtitle ?? 'Roadmap'}</p>
        </div>
      </div>
      <TileDescription description={tile.description} tone="muted" />
      {roadHasLink && (
        <div className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500">
          {roadExternal ? 'Open' : 'Read more'} <ArrowRight className="w-3 h-3" />
        </div>
      )}
    </>
  );
  const roadBase = 'block bg-slate-50 border border-slate-200 rounded-xl p-4 transition-all flex flex-col';
  const roadLink = `${roadBase} hover:bg-white hover:shadow-md`;
  if (!roadHasLink) return <div className={roadBase}>{roadInner}</div>;
  return roadExternal
    ? <a href={tile.to} target="_blank" rel="noopener noreferrer" className={roadLink}>{roadInner}</a>
    : <Link to={tile.to} className={roadLink}>{roadInner}</Link>;
}

const LIVE_TILE_PALETTE = {
  blue: {
    border: 'border-blue-300', hover: 'hover:border-blue-400 hover:shadow-blue-100',
    iconBg: 'bg-blue-100 group-hover:bg-blue-200', iconColor: 'text-blue-700',
    title: 'text-blue-900', arrow: 'text-blue-700',
  },
};
