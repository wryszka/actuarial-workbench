/**
 * Conversation Pack — the prep agent. Pick an account + the function/audience
 * you're about to meet (e.g. "underwriters"), drop your own notes, and a
 * Claude-backed agent assembles a grounded four-part pack:
 *   1. Where we are  2. What we know  3. What we don't know — ask these
 *   4. How we help + who's done this (comparable accounts)
 * A grounded Q&A chat lets you rehearse. Everything is grounded in the
 * governed model — the agent is told not to invent.
 */
import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Send, Building2, FileText, Copy, Check } from 'lucide-react';
import { getJSON, postJSON, money, num, type Row } from '../lib/api';
import { PageHeader, Disclaimer } from '../components/ui';

const FUNCTIONS = ['Underwriting', 'Pricing', 'Claims', 'Actuarial', 'Finance', 'Data/Platform'];

interface Pack {
  account: string; function: string; pack_markdown: string;
  known: Record<string, unknown>; comparables: Row[]; probe_software: string[]; edu: string[];
}

export default function ConversationPack() {
  const [accounts, setAccounts] = useState<Row[]>([]);
  const [account, setAccount] = useState('');
  const [fn, setFn] = useState('Underwriting');
  const [notes, setNotes] = useState('');
  const [pack, setPack] = useState<Pack | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getJSON<{ accounts: Row[] }>('/api/accounts').then((d) => {
      setAccounts(d.accounts);
      const withSignal = d.accounts.find((a) => a.has_signal);
      setAccount(String((withSignal ?? d.accounts[0])?.account ?? ''));
    }).catch((e) => setErr(String(e)));
  }, []);

  async function generate() {
    if (!account) return;
    setLoading(true); setErr(''); setPack(null);
    try {
      const p = await postJSON<Pack>('/api/prep-pack', { account, function: fn, notes });
      setPack(p);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader icon={Sparkles} iconBg="bg-violet-100" title="Conversation Pack"
        subtitle="Walk into a function conversation with confidence. Pick the account and who you're meeting, drop your notes, and a Claude agent builds a grounded pack — what we know, what to ask, what to offer, and where we've done this before." />

      {/* Builder */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 mb-5">
        <div className="grid md:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-xs font-semibold text-gray-600">Account</span>
            <select value={account} onChange={(e) => setAccount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {accounts.map((a) => <option key={String(a.account)} value={String(a.account)}>{String(a.account)}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-gray-600">Who are you meeting?</span>
            <select value={fn} onChange={(e) => setFn(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {FUNCTIONS.map((f) => <option key={f} value={f}>{f === 'Data/Platform' ? 'Data / Platform team' : `${f} team`}</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <button onClick={generate} disabled={loading || !account}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">
              <Sparkles className="w-4 h-4" /> {loading ? 'Generating…' : 'Build the pack'}
            </button>
          </div>
        </div>
        <label className="block mt-3">
          <span className="text-xs font-semibold text-gray-600">1 · Drop your notes here to enrich the pack</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            placeholder="Anything you already know — recent calls, who introduced you, what they care about…"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </label>
      </div>

      {err && <div className="p-4 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm mb-4">{err}</div>}
      {loading && <div className="p-10 text-center text-gray-400 text-sm">The prep agent is reading the governed model + drafting your pack…</div>}

      {pack && (
        <div className="grid md:grid-cols-3 gap-5">
          <div className="md:col-span-2 space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-800 inline-flex items-center gap-2"><FileText className="w-4 h-4 text-violet-600" /> Briefing — {pack.account} · {pack.function}</h3>
                <button onClick={() => { navigator.clipboard.writeText(pack.pack_markdown); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                  className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1">
                  {copied ? <><Check className="w-3.5 h-3.5 text-emerald-600" /> copied</> : <><Copy className="w-3.5 h-3.5" /> copy</>}
                </button>
              </div>
              <Markdown text={pack.pack_markdown} />
            </div>
            <PrepChat account={pack.account} fn={pack.function} packMd={pack.pack_markdown} />
          </div>

          {/* Comparable accounts */}
          <div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 inline-flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Where we've done this
              </h3>
              <p className="text-[11px] text-gray-400 mb-2">Same sub-industry + {pack.function} signal — talk to these SAs.</p>
              {pack.comparables.length === 0 ? (
                <p className="text-xs text-gray-400">No close comparables in the book yet.</p>
              ) : (
                <div className="space-y-2">
                  {pack.comparables.map((c) => (
                    <div key={String(c.account)} className="border border-gray-100 rounded-lg p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-gray-800">{String(c.account)}</span>
                        <span className="text-xs text-gray-500">{money(c.list_365d)}</span>
                      </div>
                      <div className="text-[10px] text-gray-500">SA {String(c.sa_primary ?? 'NONE')} · {num(c.uco_total)} UCOs</div>
                      <div className="text-[10px] text-gray-400 mt-0.5 truncate">{String(c.demos)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {pack.probe_software.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-4 mt-4">
                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Software worth asking about</h3>
                <div className="flex flex-wrap gap-1.5">
                  {pack.probe_software.map((s) => <span key={s} className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-600">{s}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Disclaimer>
        The pack is generated by a <strong>Claude model</strong> (Foundation Model API) grounded strictly in the governed
        <code> gtm_cockpit</code> model + your notes — it’s told not to invent software, names or use-cases, so treat any
        gap as a question to confirm with the customer. Comparable accounts are same-sub-industry peers with signal in the
        same function.
      </Disclaimer>
    </div>
  );
}

function PrepChat({ account, fn, packMd }: { account: string; fn: string; packMd: string }) {
  const [turns, setTurns] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  async function ask() {
    const q = input.trim();
    if (!q || busy) return;
    setInput('');
    setTurns((t) => [...t, { role: 'user', text: q }]);
    setBusy(true);
    try {
      const r = await postJSON<{ answer: string }>('/api/prep-chat', {
        account, function: fn, pack_markdown: packMd, question: q,
        history: turns.map((t) => ({ role: t.role, content: t.text })),
      });
      setTurns((t) => [...t, { role: 'assistant', text: r.answer }]);
    } catch (e) {
      setTurns((t) => [...t, { role: 'assistant', text: `Sorry — ${String(e)}` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Rehearse — ask the pack a question</h3>
      <div className="space-y-2 mb-3 max-h-72 overflow-y-auto">
        {turns.length === 0 && <p className="text-xs text-gray-400">e.g. “How do I open the agentic underwriting topic?” · “What’s our best proof point for a Lloyd’s CUO?”</p>}
        {turns.map((t, i) => (
          <div key={i} className={t.role === 'user' ? 'text-right' : ''}>
            <span className={`inline-block rounded-2xl px-3 py-1.5 text-sm max-w-[85%] text-left ${
              t.role === 'user' ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-800'}`}>{t.text}</span>
          </div>
        ))}
        {busy && <div className="text-xs text-gray-400">thinking…</div>}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ask()}
          placeholder="Ask to rehearse…" className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300" />
        <button onClick={ask} disabled={busy || !input.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/** Minimal markdown renderer — headings, bold, bullets. Avoids a dependency. */
function Markdown({ text }: { text: string }) {
  const blocks = useMemo(() => text.split('\n'), [text]);
  return (
    <div className="space-y-1 text-sm text-gray-700">
      {blocks.map((line, i) => {
        if (/^###\s/.test(line)) return <h4 key={i} className="font-bold text-gray-900 mt-3 text-[15px]">{line.replace(/^###\s/, '')}</h4>;
        if (/^##\s/.test(line)) return <h3 key={i} className="font-bold text-gray-900 mt-3">{line.replace(/^##\s/, '')}</h3>;
        if (/^[-*]\s/.test(line)) return <li key={i} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: inline(line.replace(/^[-*]\s/, '')) }} />;
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal" dangerouslySetInnerHTML={{ __html: inline(line.replace(/^\d+\.\s/, '')) }} />;
        if (line.trim() === '') return <div key={i} className="h-1" />;
        return <p key={i} dangerouslySetInnerHTML={{ __html: inline(line) }} />;
      })}
    </div>
  );
}

function inline(s: string): string {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded text-xs">$1</code>');
}
