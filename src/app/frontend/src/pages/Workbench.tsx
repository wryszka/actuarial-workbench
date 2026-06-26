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
import { ArrowRight, Mail, MessagesSquare, CalendarClock, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TILES, type Tile } from '../lib/workbench-tiles';
import { fetchConfig } from '../lib/config';

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
      <header className="pt-2">
        <div className="text-[11px] uppercase tracking-widest text-blue-700 font-bold">Actuarial Workbench</div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mt-1">{entity} — Composite Insurer</h1>
        <p className="text-base text-gray-500 mt-1.5 leading-relaxed max-w-3xl">
          One front door for the actuarial work — each workflow is its own app on the
          shared lakehouse. Solvency II and Pricing are running today; the others are next.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

function ContactFooter() {
  return (
    <footer className="mt-8 bg-[#1e293b] text-white">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <img src="/laurence.png" alt="Laurence Ryszka"
          className="w-16 h-16 rounded-full object-cover shrink-0 ring-2 ring-white/10" />
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-widest text-emerald-300 font-bold">Questions &amp; suggestions</div>
          <h2 className="text-lg font-bold tracking-tight mt-0.5">Contact Laurence Ryszka — Insurance Tech Lead</h2>
          <p className="text-sm text-gray-300 mt-1 leading-relaxed">
            For a demo, an issue, first steps to stand one of these up — or anything at all.
            Weekly office hours every <strong className="text-white">Friday at 4:00 PM UK time</strong>.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-sm">
            <a href="mailto:laurence.ryszka@databricks.com"
              className="inline-flex items-center gap-1.5 text-gray-200 hover:text-white">
              <Mail className="w-4 h-4 text-emerald-300" /> laurence.ryszka@databricks.com
            </a>
            <span className="inline-flex items-center gap-1.5 text-gray-200">
              <MessagesSquare className="w-4 h-4 text-emerald-300" /> #bricksurance
            </span>
            <span className="inline-flex items-center gap-1.5 text-gray-200">
              <CalendarClock className="w-4 h-4 text-emerald-300" /> Fri 4:00 PM UK
            </span>
            <a href="http://go/laurence" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-emerald-300 hover:text-emerald-200">
              <ExternalLink className="w-4 h-4" /> go/laurence
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function TileDescription({ description, tone = 'default' }: { description: string | string[]; tone?: 'default' | 'muted' }) {
  const color = tone === 'muted' ? 'text-slate-600' : 'text-gray-700';
  if (Array.isArray(description)) {
    return (
      <ul className="space-y-1.5 flex-1">
        {description.map((line, i) => (
          <li key={i} className={`text-sm ${color} leading-snug border-l-2 border-blue-300 pl-2.5`}>{line}</li>
        ))}
      </ul>
    );
  }
  return <p className={`text-sm ${color} leading-relaxed flex-1`}>{description}</p>;
}

function TileCard({ tile }: { tile: Tile }) {
  const isLive = tile.status === 'live';
  const isInProgress = tile.status === 'in_progress';
  const Icon = tile.icon;
  const isExternal = isLive && /^https?:\/\//.test(tile.to);

  if (tile.status === 'contact') {
    return (
      <Link to={tile.to}
        className="block bg-white border-2 border-emerald-200 rounded-2xl p-5 transition-all hover:shadow-lg hover:border-emerald-300 hover:shadow-emerald-100 flex flex-col group">
        <div className="flex items-start gap-3 mb-3">
          {tile.photo
            ? <img src={tile.photo} alt={tile.label} className="w-14 h-14 rounded-full object-cover shrink-0 ring-2 ring-emerald-100" />
            : <div className="w-14 h-14 rounded-full bg-emerald-100" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">{tile.label}</h3>
              <span className="text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                contact
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">{tile.subtitle}</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed flex-1">{tile.description}</p>
        <div className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-emerald-700">
          Get in touch <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>
    );
  }

  if (isLive) {
    const cls = LIVE_TILE_PALETTE[tile.accent ?? 'blue'];
    const periodNote = tile.subtitle
      ? (isExternal ? `${tile.subtitle} · opens in new tab` : tile.subtitle)
      : (isExternal ? 'External app · opens in new tab' : 'Worked example · live in this workspace');
    const containerCls = `block bg-white border-2 ${cls.border} rounded-2xl p-5 transition-all hover:shadow-lg ${cls.hover} group flex flex-col`;
    const inner = (
      <>
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-12 h-12 rounded-xl ${cls.iconBg} flex items-center justify-center transition-colors`}>
            <Icon className={`w-6 h-6 ${cls.iconColor}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className={`text-xl font-bold ${cls.title} tracking-tight`}>{tile.label}</h3>
              <span className="text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                live
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5 font-mono">{periodNote}</p>
          </div>
        </div>
        <TileDescription description={tile.description} />
        <div className={`mt-3 inline-flex items-center gap-1 text-sm font-bold ${cls.arrow}`}>
          Open <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </>
    );
    return isExternal
      ? <a href={tile.to} target="_blank" rel="noopener noreferrer" className={containerCls}>{inner}</a>
      : <Link to={tile.to} className={containerCls}>{inner}</Link>;
  }

  if (isInProgress) {
    // In-progress tile — warmer than roadmap, signals active build. When `to`
    // is empty the card is description-only (not yet wired to anything).
    const hasLink = Boolean(tile.to);
    const isExternalLink = hasLink && /^https?:\/\//.test(tile.to);
    const inner = (
      <>
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-12 h-12 rounded-xl bg-amber-100 ${hasLink ? 'group-hover:bg-amber-200' : ''} flex items-center justify-center transition-colors`}>
            <Icon className="w-6 h-6 text-amber-700" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-amber-900 tracking-tight">{tile.label}</h3>
              <span className="text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                in progress
              </span>
            </div>
            <p className="text-[11px] text-amber-700/80 mt-0.5">{tile.subtitle ?? 'Worked example · being built'}</p>
          </div>
        </div>
        <TileDescription description={tile.description} />
        {hasLink && (
          <div className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-amber-700">
            {isExternalLink ? 'Open' : 'Read more'} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </>
    );
    const baseCls = 'block bg-white border-2 border-amber-300 rounded-2xl p-5 transition-all flex flex-col';
    const linkCls = `${baseCls} hover:shadow-lg hover:border-amber-400 hover:shadow-amber-100 group`;
    if (!hasLink) return <div className={baseCls}>{inner}</div>;
    return isExternalLink
      ? <a href={tile.to} target="_blank" rel="noopener noreferrer" className={linkCls}>{inner}</a>
      : <Link to={tile.to} className={linkCls}>{inner}</Link>;
  }

  // Roadmap tile — visually de-emphasised. When `to` is empty the card is
  // non-clickable (coming soon, no destination yet); external URLs open in a tab.
  const roadHasLink = Boolean(tile.to);
  const roadExternal = roadHasLink && /^https?:\/\//.test(tile.to);
  const roadInner = (
    <>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center">
          <Icon className="w-6 h-6 text-slate-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-slate-700 tracking-tight">{tile.label}</h3>
            <span className="text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
              coming soon
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">{tile.subtitle ?? 'Roadmap'}</p>
        </div>
      </div>
      <TileDescription description={tile.description} tone="muted" />
      {roadHasLink && (
        <div className="mt-3 inline-flex items-center gap-1 text-xs text-slate-500">
          {roadExternal ? 'Open' : 'Read more'} <ArrowRight className="w-3 h-3" />
        </div>
      )}
    </>
  );
  const roadBase = 'block bg-slate-50 border border-slate-200 rounded-2xl p-5 transition-all flex flex-col';
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
