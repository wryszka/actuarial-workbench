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
  Activity, ScrollText, Network, BookOpen,
} from 'lucide-react';

const j = (u: string) => fetch(u).then((r) => r.json());

interface Node { id: string; name: string; status: string; app_url?: string; local_tower_url?: string; mcp?: any[]; }
interface Edge { from: string; to: string; via: string; status: string; }

export default function GroupControlTower() {
  const [manifest, setManifest] = useState<any>(null);
  const [tiles, setTiles] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    j('/api/group/manifest').then(setManifest).catch((e) => setErr(String(e)));
    j('/api/group/tiles').then(setTiles).catch(() => {});
  }, []);

  const nodes: Node[] = manifest?.nodes || [];
  const edges: Edge[] = manifest?.edges || [];
  const live = nodes.filter((n) => n.status === 'live');
  const roadmap = nodes.filter((n) => n.status !== 'live');

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Link to="/" className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Workbench
      </Link>

      <header className="flex items-start gap-4 border-b border-gray-200 pb-5">
        <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center shrink-0">
          <Building2 className="w-7 h-7 text-blue-700" />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-widest text-blue-700 font-bold">Bricksurance Group</div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Control Tower</h1>
          <p className="text-sm text-gray-600 mt-1.5 max-w-3xl leading-relaxed">
            The estate front door, one level above the workbenches. A live map of every workbench and the
            agents it exposes, cross-estate AI activity, and one assistant wired to every MCP endpoint.
            It <strong>aggregates and routes — it never recomputes</strong>: every number is read from the
            owning workbench's published view or returned by its governed tools.
          </p>
        </div>
      </header>

      {err && <div className="text-[13px] text-red-700 bg-red-50 border border-red-200 rounded p-3">Control Tower API unavailable — {err}</div>}
      {!manifest && !err && <div className="text-sm text-gray-500">Loading the estate…</div>}

      {manifest && (
        <>
          <EstateMap nodes={nodes} edges={edges} />
          <Tiles tiles={tiles} />
          <AuditUnion nodes={live} />
          <Chat identities={manifest.group?.identities || []} enabled={manifest.enabled} identityMode={manifest.identity_mode} />
          <Learn liveCount={live.length} roadmapCount={roadmap.length} />
        </>
      )}
    </div>
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
  const PROMPTS = [
    'What is the reserving position for commercial property, and how does it feed the QRTs?',
    'Show recent AI activity across claims and reinsurance.',
    'Which submissions in reinsurance are close to a capacity limit?',
  ];
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
      <div className="flex flex-wrap gap-1.5 mt-2">{PROMPTS.map((p) => <button key={p} onClick={() => { setQ(p); ask(p); }} disabled={!enabled || busy} className="text-[11px] px-2 py-0.5 rounded-full border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50">{p.slice(0, 46)}…</button>)}</div>
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
          {typeof res.tools_available === 'number' && <div className="text-[10.5px] text-gray-400">{res.tools_available} estate tools available to the agent</div>}
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
