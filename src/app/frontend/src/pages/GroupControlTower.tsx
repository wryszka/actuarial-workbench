/**
 * Bricksurance Group — Control Tower.
 *
 * The estate front door, one level above the workbenches. Renders EXCLUSIVELY
 * from /api/group/* — an estate map, per-workbench "today" tiles, a cross-estate
 * AI-activity (audit union) view, and a chat agent wired to every MCP endpoint in
 * the estate. Aggregates and routes; never recomputes. Roadmap nodes, absent
 * views and planned edges render honestly (stub / degraded / non-traversable).
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, ArrowLeft, Server, ExternalLink, Bot, Send,
  Activity, ScrollText, Network, BookOpen, RefreshCw, Gauge, AlertTriangle, LayoutGrid,
} from 'lucide-react';

const j = (u: string) => fetch(u).then((r) => r.json());

interface Node { id: string; name: string; status: string; app_url?: string; local_tower_url?: string; mcp?: any[]; }
interface Edge { from: string; to: string; via: string; status: string; }

export default function GroupControlTower() {
  const [manifest, setManifest] = useState<any>(null);
  const [tiles, setTiles] = useState<any>(null);
  const [posture, setPosture] = useState<any>(null);
  const [domain, setDomain] = useState<any>(null);
  const [attention, setAttention] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<'group' | 'estate'>('group');
  const [warming, setWarming] = useState(false);

  const loadData = () => {
    j('/api/group/posture').then(setPosture).catch(() => {});
    j('/api/group/domain-status').then(setDomain).catch(() => {});
    j('/api/group/attention').then(setAttention).catch(() => {});
    j('/api/group/tiles').then(setTiles).catch(() => {});
  };
  useEffect(() => {
    j('/api/group/manifest').then(setManifest).catch((e) => setErr(String(e)));
    loadData();
  }, []);

  async function warmup() {
    if (warming) return;
    setWarming(true);
    try { await fetch('/api/group/warmup', { method: 'POST' }); loadData(); }
    catch { /* keep old cache */ } finally { setWarming(false); }
  }

  const nodes: Node[] = manifest?.nodes || [];
  const edges: Edge[] = manifest?.edges || [];
  const live = nodes.filter((n) => n.status === 'live');
  const roadmap = nodes.filter((n) => n.status !== 'live');
  const warmedAt = posture?.warmed_at || attention?.warmed_at;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-5">
      <Link to="/" className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Workbench
      </Link>

      <header className="flex items-start gap-4 border-b border-gray-200 pb-5">
        <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center shrink-0">
          <Building2 className="w-7 h-7 text-blue-700" />
        </div>
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-widest text-blue-700 font-bold">Bricksurance Group</div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Control Tower</h1>
          <p className="text-sm text-gray-600 mt-1.5 max-w-3xl leading-relaxed">
            Business status across the estate, for the top of the house. It <strong>aggregates and routes —
            never recomputes</strong>: every number is read from the owning workbench or returned by its
            governed tools, then cached so this view loads instantly.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <button onClick={warmup} disabled={warming} title="Refresh every cached panel from the workbenches' tools and re-run the cached questions"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-gray-300 text-[12px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${warming ? 'animate-spin' : ''}`} /> {warming ? 'Warming…' : 'Warm up'}
          </button>
          {warmedAt && <span className="text-[10px] text-gray-400">warmed {warmedAt}</span>}
        </div>
      </header>

      {err && <div className="text-[13px] text-red-700 bg-red-50 border border-red-200 rounded p-3">Control Tower API unavailable — {err}</div>}
      {!manifest && !err && <div className="text-sm text-gray-500">Loading the estate…</div>}

      {manifest && (
        <>
          <div className="flex gap-1 border-b border-gray-200">
            {([['group', 'Group view', Gauge], ['estate', 'Estate & agents', Network]] as const).map(([k, label, Icon]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors ${tab === k ? 'border-blue-600 text-blue-800' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          {tab === 'group' && (
            <>
              <PostureStrip posture={posture} />
              <WhyBanner attention={attention} />
              <DomainGrid domain={domain} />
              <Chat identities={manifest.group?.identities || []} enabled={manifest.enabled} identityMode={manifest.identity_mode} />
              <AttentionFeed attention={attention} nodes={live} />
            </>
          )}
          {tab === 'estate' && (
            <>
              <EstateMap nodes={nodes} edges={edges} />
              <Tiles tiles={tiles} />
              <AuditUnion nodes={live} />
            </>
          )}
          <Learn liveCount={live.length} roadmapCount={roadmap.length} />
        </>
      )}
    </div>
  );
}

/* ── shared board formatting helpers ───────────────────────────────────────── */
const fmtNum = (v: any) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  if (!isFinite(n)) return String(v ?? '—');
  const abs = Math.abs(n);
  return abs >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 0 })
       : Number.isInteger(n) ? String(n)
       : n.toLocaleString(undefined, { maximumFractionDigits: 1 });
};
const parseTrend = (t: any): number[] => {
  if (!t) return [];
  try { const a = typeof t === 'string' ? JSON.parse(t) : t; return Array.isArray(a) ? a.map((x: any) => (typeof x === 'number' ? x : parseFloat(x))).filter((x: number) => isFinite(x)) : []; }
  catch { return []; }
};
const STATUS_DOT: Record<string, string> = { red: 'bg-rose-400', amber: 'bg-amber-400', green: 'bg-emerald-400' };
const STATUS_CHIP: Record<string, string> = { red: 'bg-rose-100 text-rose-700 border-rose-200', amber: 'bg-amber-100 text-amber-700 border-amber-200', green: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
// favourable-direction colouring for a signed delta
const deltaClass = (delta: number, direction: string) => {
  if (!delta || direction === 'neutral' || !direction) return 'text-gray-400';
  const good = direction === 'up_good' ? delta > 0 : delta < 0;
  return good ? 'text-emerald-300' : 'text-rose-300';
};

/* ── tiny inline sparkline over a numeric trend ─────────────────────────────── */
function Sparkline({ data, stroke = '#60a5fa' }: { data: number[]; stroke?: string }) {
  if (!data || data.length < 2) return null;
  const W = 76, H = 22, lo = Math.min(...data), hi = Math.max(...data), span = hi - lo || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - lo) / span) * H}`).join(' ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="mt-1.5 overflow-visible">
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={W} cy={H - ((data[data.length - 1] - lo) / span) * H} r={1.8} fill={stroke} />
    </svg>
  );
}

/* ── Posture strip — board hero cards: value+unit, favourable-delta, sparkline ─ */
function PostureStrip({ posture }: { posture: any }) {
  const metrics: any[] = posture?.metrics || [];
  if (!posture) return <div className="text-sm text-gray-500">Loading posture…</div>;
  if (!metrics.length) return <div className="text-[12.5px] text-gray-400 italic">No posture metrics cached yet — click <strong>Warm up</strong> to pull them from the workbenches.</div>;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {metrics.slice(0, 12).map((m, i) => {
        const delta = (m.delta_qtd ?? m.delta_1d);
        const trend = parseTrend(m.trend);
        return (
          <a key={i} href={m.deep_link} target="_blank" rel="noopener noreferrer"
             className="rounded-xl bg-[#0f172a] text-white p-3.5 hover:bg-[#1e293b] transition-colors flex flex-col">
            <div className="flex items-start gap-1.5">
              <div className="text-[10px] uppercase tracking-wider text-blue-300 font-semibold leading-tight flex-1">{m.label}</div>
              <span className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${STATUS_DOT[m.status] || 'bg-gray-500'}`} />
            </div>
            <div className="text-2xl font-bold tracking-tight mt-1 leading-none">
              {fmtNum(m.value)}<span className="text-sm font-semibold text-gray-400 ml-0.5">{m.unit}</span>
            </div>
            {typeof delta === 'number' && (
              <div className={`text-[11px] font-semibold mt-1 ${deltaClass(delta, m.direction)}`}>
                {delta > 0 ? '▲' : delta < 0 ? '▼' : ''} {Math.abs(delta).toFixed(1)}%{m.delta_qtd != null ? ' QTD' : ''}
              </div>
            )}
            {m.plan_value != null && <div className="text-[10px] text-gray-500 mt-0.5">plan {fmtNum(m.plan_value)}{m.unit}</div>}
            {trend.length >= 2 && <Sparkline data={trend} />}
            <div className="text-[10px] text-gray-500 mt-auto pt-1.5">{m.node}</div>
          </a>
        );
      })}
    </div>
  );
}

/* ── Domain status grid — verbatim RAG cards, per-node KPI rows ─────────────── */
function DomainGrid({ domain }: { domain: any }) {
  const domains: any[] = domain?.domains || [];
  if (!domain) return null;
  if (!domains.length) return <div className="text-[12.5px] text-gray-400 italic">No domain status cached yet — click <strong>Warm up</strong>.</div>;
  return (
    <section>
      <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-2"><LayoutGrid className="w-4 h-4 text-blue-600" /> Domain status</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {domains.map((d, i) => {
          const kpis: any[] = d.kpis || [];
          const link = kpis[0]?.deep_link;
          return (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-3.5 flex flex-col">
              <div className="flex items-center gap-2">
                <a href={link} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold text-gray-900 capitalize hover:text-blue-700">{String(d.node).replace(/_/g, ' ')}</a>
                <span className={`ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_CHIP[d.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{d.status}</span>
              </div>
              {d.status_reason && <div className="text-[12px] text-gray-600 mt-1 leading-snug">{d.status_reason}</div>}
              <div className="mt-2.5 pt-2.5 border-t border-gray-100 grid grid-cols-2 gap-x-3 gap-y-2">
                {kpis.map((k, j) => (
                  <div key={j}>
                    <div className="text-[10px] uppercase tracking-wide text-gray-400 truncate">{k.label}</div>
                    <div className="text-[15px] font-bold text-gray-900 leading-tight">
                      {fmtNum(k.value)}<span className="text-[11px] font-semibold text-gray-400 ml-0.5">{k.unit !== 'count' ? k.unit : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── Why-this-matters banner — verbatim top attention detail, attributed ───── */
function WhyBanner({ attention }: { attention: any }) {
  const top = (attention?.items || [])[0];
  if (!top) return null;
  const tone = top.severity === 'red' ? 'bg-rose-50 border-rose-200 text-rose-800' : top.severity === 'amber' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-blue-50 border-blue-200 text-blue-800';
  return (
    <div className={`rounded-xl border p-3.5 flex items-start gap-3 ${tone}`}>
      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
      <div>
        <div className="text-[11px] uppercase tracking-wider font-bold">Why this matters · {top.node}</div>
        <div className="text-[13.5px] font-medium mt-0.5">{top.headline}</div>
        {top.detail && <div className="text-[12.5px] mt-0.5 opacity-90">{top.detail}</div>}
      </div>
    </div>
  );
}

/* ── Attention feed — unioned, severity-sorted, node-attributed ────────────── */
function AttentionFeed({ attention, nodes }: { attention: any; nodes: Node[] }) {
  const [node, setNode] = useState('');
  const items: any[] = (attention?.items || []).filter((it: any) => !node || it.node === node);
  const chip = (s: string) => s === 'red' ? 'bg-rose-100 text-rose-700' : s === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700';
  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-blue-600" /> Attention across the estate</h2>
        <select value={node} onChange={(e) => setNode(e.target.value)} className="ml-auto border border-gray-300 rounded px-2 py-1 text-[12px]">
          <option value="">all nodes</option>{nodes.map((n) => <option key={n.id} value={n.id}>{n.id}</option>)}
        </select>
      </div>
      {!items.length ? <div className="text-[12.5px] text-gray-400 italic">Nothing needs attention (or not warmed yet).</div> : (
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
          {items.map((it, i) => (
            <a key={i} href={it.deep_link} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 px-3.5 py-2.5 hover:bg-gray-50">
              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${chip(it.severity)}`}>{it.severity}</span>
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-gray-900">{it.headline} <span className="text-[11px] text-gray-400 font-normal">· {it.node}</span></div>
                {it.detail && <div className="text-[12px] text-gray-500 truncate">{it.detail}</div>}
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

/* ── 1. Estate map — value-chain of node cards + honest edges ────────────── */
const PROFILE_TONE: Record<string, string> = {
  internal: 'bg-blue-50 text-blue-700 border-blue-200',
  external: 'bg-amber-50 text-amber-700 border-amber-200',
  readonly: 'bg-slate-50 text-slate-600 border-slate-200',
};

function EstateMap({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) {
  const edgesFrom = (id: string) => edges.filter((e) => e.from === id);
  return (
    <section>
      <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-1"><Network className="w-4 h-4 text-blue-600" /> Estate map</h2>
      <p className="text-[12.5px] text-gray-500 mb-3">
        Every node is a workbench; the chips under it are its MCP servers, labelled by trust boundary. Edges are
        spine relationships — <span className="text-emerald-700 font-medium">solid = live &amp; joinable</span>,
        <span className="text-gray-400 font-medium"> dashed = planned, non-traversable</span>. The hub itself is the frame, not a node.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {nodes.map((n) => {
          const roadmap = n.status !== 'live';
          const out = edgesFrom(n.id);
          return (
            <div key={n.id} className={`rounded-xl border p-3.5 ${roadmap ? 'border-dashed border-gray-300 bg-gray-50/60 opacity-75' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center justify-between gap-2">
                <a href={n.app_url} target="_blank" rel="noopener noreferrer"
                   className={`text-sm font-bold ${roadmap ? 'text-gray-500' : 'text-gray-900 hover:text-blue-700'} inline-flex items-center gap-1`}>
                  {n.name}{!roadmap && <ExternalLink className="w-3 h-3" />}
                </a>
                <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${roadmap ? 'bg-gray-200 text-gray-500' : 'bg-emerald-100 text-emerald-700'}`}>
                  {roadmap ? 'roadmap' : 'live'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {(n.mcp || []).map((s: any, i: number) => (
                  <span key={i} title={`${s.name} · ${s.transport || 'jsonrpc'}`}
                    className={`text-[10px] px-1.5 py-0.5 rounded border inline-flex items-center gap-1 ${PROFILE_TONE[s.profile] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                    <Server className="w-2.5 h-2.5" />{s.profile || 'mcp'}
                  </span>
                ))}
                {(!n.mcp || !n.mcp.length) && <span className="text-[10px] text-gray-400">no MCP yet</span>}
              </div>
              {out.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100 space-y-0.5">
                  {out.map((e, i) => (
                    <div key={i} className={`text-[11px] flex items-center gap-1 ${e.status === 'live' ? 'text-emerald-700' : 'text-gray-400'}`}>
                      <span className="font-mono">{e.status === 'live' ? '──▶' : '- -▶'}</span>
                      {e.to} <span className="text-gray-400">· {e.via}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── 2. Workbench tiles — headline passthrough / degraded / watermark ────── */
function Tiles({ tiles }: { tiles: any }) {
  const [drill, setDrill] = useState<string | null>(null);
  if (!tiles) return null;
  return (
    <section>
      <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3"><Activity className="w-4 h-4 text-blue-600" /> Workbench tiles</h2>
      {!tiles.enabled && <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-3">Live data plane not configured in this workspace — tiles show structure only.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(tiles.tiles || []).map((t: any) => (
          <div key={t.id} className="rounded-xl border border-gray-200 bg-white p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">{t.name}</span>
              {typeof t.health_count === 'number' && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">{t.health_count} flag{t.health_count === 1 ? '' : 's'}</span>}
            </div>
            {t.degraded ? (
              <p className="text-[12px] text-gray-400 mt-2 italic">Headline view not published yet — tile degraded (no fabricated numbers).</p>
            ) : (
              <>
                <div className="text-[11px] text-gray-400 mt-1">as of {t.watermark || 'watermark unavailable'}</div>
                <div className="text-[12px] text-gray-600 mt-1">{(t.headline?.rows?.length || 0)} rows · <code className="font-mono text-[11px]">{(t.headline?.view || '').split('.').slice(-1)[0]}</code></div>
                <button onClick={() => setDrill(drill === t.id ? null : t.id)} className="text-[11px] text-blue-700 hover:underline mt-1">
                  {drill === t.id ? 'hide' : 'show the SQL + rows'}
                </button>
                {drill === t.id && (
                  <div className="mt-2 border-t border-gray-100 pt-2">
                    <code className="block text-[10.5px] font-mono bg-slate-50 border border-slate-200 rounded p-1.5 mb-1 break-all">{t.headline?.sql}</code>
                    <div className="overflow-x-auto max-h-40 border border-gray-100 rounded">
                      <table className="text-[10.5px]"><thead><tr>{(t.headline?.cols || []).map((c: string) => <th key={c} className="px-1.5 py-1 text-left bg-slate-50 font-semibold whitespace-nowrap">{c}</th>)}</tr></thead>
                        <tbody>{(t.headline?.rows || []).slice(0, 8).map((r: any[], i: number) => <tr key={i} className="border-t border-gray-100">{r.map((c, k) => <td key={k} className="px-1.5 py-1 whitespace-nowrap">{String(c)}</td>)}</tr>)}</tbody></table>
                    </div>
                  </div>
                )}
              </>
            )}
            <a href={t.local_tower_url || t.app_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-700 hover:underline inline-flex items-center gap-1 mt-2">open workbench <ExternalLink className="w-3 h-3" /></a>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── 3. Audit union — cross-estate AI activity ───────────────────────────── */
function AuditUnion({ nodes }: { nodes: Node[] }) {
  const [data, setData] = useState<any>(null);
  const [node, setNode] = useState('');
  const [refusals, setRefusals] = useState(false);
  const load = () => j(`/api/group/audit?limit=60&refusals_only=${refusals ? 1 : 0}${node ? `&node=${node}` : ''}`).then(setData).catch(() => {});
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [node, refusals]);
  return (
    <section>
      <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-1"><ScrollText className="w-4 h-4 text-blue-600" /> AI activity — audit union</h2>
      <p className="text-[12.5px] text-gray-500 mb-2">One <code className="font-mono text-[11px]">UNION ALL</code> across every live workbench's audit source (the one permitted piece of non-passthrough SQL). Every AI touch across the estate, in one place.</p>
      <div className="flex items-center gap-2 mb-2 text-[12px]">
        <select value={node} onChange={(e) => setNode(e.target.value)} className="border border-gray-300 rounded px-2 py-1">
          <option value="">all nodes</option>
          {nodes.map((n) => <option key={n.id} value={n.id}>{n.id}</option>)}
        </select>
        <label className="inline-flex items-center gap-1 text-gray-600"><input type="checkbox" checked={refusals} onChange={(e) => setRefusals(e.target.checked)} /> refusals only</label>
      </div>
      {data?.error && <div className="text-[12px] text-amber-700">audit union: {data.error}</div>}
      <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-72">
        <table className="text-[11px] w-full"><thead className="sticky top-0"><tr>{['ts', 'node', 'server', 'tool_or_action', 'principal', 'outcome'].map((c) => <th key={c} className="px-2 py-1.5 text-left bg-slate-100 font-semibold whitespace-nowrap">{c}</th>)}</tr></thead>
          <tbody>{(data?.rows || []).map((r: any[], i: number) => {
            const cols = data.cols || []; const g = (name: string) => r[cols.indexOf(name)];
            const out = String(g('outcome') || '');
            return <tr key={i} className="border-t border-gray-100"><td className="px-2 py-1 whitespace-nowrap text-gray-500">{String(g('ts') || '').slice(0, 19)}</td><td className="px-2 py-1">{String(g('node') || '')}</td><td className="px-2 py-1 whitespace-nowrap">{String(g('server') || '')}</td><td className="px-2 py-1 whitespace-nowrap">{String(g('tool_or_action') || '')}</td><td className="px-2 py-1 whitespace-nowrap">{String(g('principal') || '')}</td><td className={`px-2 py-1 ${/refus|error|deni|4\d\d|5\d\d/i.test(out) ? 'text-rose-700 font-semibold' : 'text-emerald-700'}`}>{out}</td></tr>;
          })}
          {!(data?.rows || []).length && <tr><td colSpan={6} className="px-2 py-3 text-gray-400 text-center">no activity rows{data && !data.enabled ? ' (data plane not configured)' : ''}</td></tr>}
          </tbody></table>
      </div>
    </section>
  );
}

/* ── 4. Chat — identity + estate MCP tools + plan/trace/answer ───────────── */
function Chat({ identities, enabled, identityMode }: { identities: string[]; enabled: boolean; identityMode: string }) {
  const [profile, setProfile] = useState(identities[0] || 'group-analyst');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<any>(null);
  const [sugg, setSugg] = useState<any[]>([]);
  useEffect(() => { fetch('/api/group/chat-suggestions').then((r) => r.json()).then((d) => setSugg(d.questions || [])).catch(() => {}); }, []);
  async function ask(question: string) {
    if (!question.trim() || busy) return;
    setBusy(true); setRes(null);
    try {
      const r = await fetch('/api/group/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, profile }) });
      setRes(await r.json());
    } catch (e) { setRes({ answer: `chat error: ${e}`, trace: [] }); }
    finally { setBusy(false); }
  }
  return (
    <section className="border border-gray-200 rounded-xl bg-white p-4">
      <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-1"><Bot className="w-4 h-4 text-blue-600" /> Ask the estate</h2>
      <p className="text-[12.5px] text-gray-500 mb-2">One agent wired to every workbench's MCP tools. It narrates; the workbenches' governed tools compute. Every number in the answer comes from a tool result shown in the trace.</p>
      <div className="flex items-center gap-2 mb-2 text-[12px]">
        <span className="text-gray-500">Acting as</span>
        <select value={profile} onChange={(e) => setProfile(e.target.value)} className="border border-gray-300 rounded px-2 py-1">
          {identities.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {identityMode !== 'secret-scope' && <span className="text-[11px] text-amber-600" title="Per-profile SP auth not provisioned; all profiles run under the app principal (documented). Refusals are never simulated.">app-principal fallback</span>}
      </div>
      <div className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ask(q)} placeholder={enabled ? 'Ask across the estate…' : 'data plane not configured'} disabled={!enabled || busy}
          className="flex-1 border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50" />
        <button onClick={() => ask(q)} disabled={!enabled || busy || !q.trim()} className="px-3 py-1.5 bg-blue-700 text-white rounded text-xs font-semibold disabled:opacity-50 inline-flex items-center gap-1"><Send className="w-3.5 h-3.5" /> Ask</button>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">{sugg.map((s) => <button key={s.q} onClick={() => { setQ(s.q); ask(s.q); }} disabled={!enabled || busy} title={s.q} className="text-[11px] px-2 py-0.5 rounded-full border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 inline-flex items-center gap-1">{s.cached && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="pre-warmed — answers instantly" />}{s.q.slice(0, 52)}…</button>)}</div>
      {busy && <div className="text-[12px] text-gray-500 mt-3">Planning + calling estate tools…</div>}
      {res && (
        <div className="mt-3 space-y-2">
          {(res.trace || []).length > 0 && (
            <div className="border border-gray-100 rounded-lg divide-y divide-gray-100">
              {res.trace.map((t: any, i: number) => (
                <div key={i} className="px-2.5 py-1.5 text-[11px] flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded font-semibold ${t.outcome === 'ok' ? 'bg-emerald-50 text-emerald-700' : t.outcome === 'refused' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{t.outcome}</span>
                  <code className="font-mono text-slate-700">{t.node}·{t.tool?.split('__').slice(-1)[0]}</code>
                  <span className="text-gray-400">as {t.principal}</span>
                </div>
              ))}
            </div>
          )}
          <div className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap bg-slate-50 border border-slate-200 rounded p-2.5">{res.answer}</div>
          <div className="flex items-center gap-2 text-[10.5px] text-gray-400">
            {res.cached && <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">answered from cache</span>}
            {typeof res.tools_available === 'number' && <span>{res.tools_available} estate tools available to the agent</span>}
          </div>
        </div>
      )}
    </section>
  );
}

/* ── 5. Learn ─────────────────────────────────────────────────────────────── */
function Learn({ liveCount, roadmapCount }: { liveCount: number; roadmapCount: number }) {
  return (
    <section className="bg-slate-50 border border-gray-200 rounded-xl p-4 text-[12.5px] text-gray-600">
      <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-1"><BookOpen className="w-4 h-4" /> How the Control Tower works</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Aggregate &amp; route, never recompute.</strong> Tiles read a view the owning workbench publishes; questions go through workbench MCP tools. No business metric is computed here.</li>
        <li><strong>Manifest-driven.</strong> The whole estate ({liveCount} live, {roadmapCount} roadmap) is defined in <code className="font-mono">ESTATE_MANIFEST.yaml</code> — adding a workbench is a manifest entry, not code.</li>
        <li><strong>One boundary.</strong> Every warehouse query, MCP call and model call lives in one router package; the rest of the hub holds no data.</li>
        <li className="flex flex-wrap items-center gap-2"><span>Trust profiles:</span> <span className="px-1.5 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">internal</span><span className="px-1.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">external</span><span className="px-1.5 py-0.5 rounded border bg-slate-50 text-slate-600 border-slate-200">readonly</span> — the chat can only call what the selected identity's grants allow.</li>
        <li><strong>What it does NOT do:</strong> no recompute, no writes/binds, no privileges beyond the calling principal.</li>
      </ul>
    </section>
  );
}
