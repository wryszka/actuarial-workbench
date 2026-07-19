/**
 * Ask (Genie) — inline natural-language Q&A over the governed gtm_cockpit
 * model via the Genie Conversation REST proxy. Renders the text answer, the
 * generated SQL (collapsible), and the result table — so answers cite the
 * underlying governed data (a guardrail every persona asked for).
 */
import { useRef, useState } from 'react';
import { MessagesSquare, Send, ChevronDown, Sparkles } from 'lucide-react';
import { getJSON, postJSON, type AppConfig } from '../lib/api';
import { PageHeader, Disclaimer } from '../components/ui';

interface Turn {
  role: 'user' | 'genie';
  text?: string;
  sql?: string;
  columns?: string[];
  rows?: unknown[][];
  pending?: boolean;
  error?: string;
}

const SAMPLES = [
  'Which accounts have signal but no primary SA, ranked by consumption?',
  'Show the top 10 accounts by trailing LIST consumption.',
  'Which Life/Pensions accounts should we lead with LifeCast?',
  'List open renewals by close date with stage and amount.',
];

export default function Ask({ cfg }: { cfg: AppConfig | null }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const convId = useRef<string | null>(null);
  const spaceId = cfg?.genie_space_id;

  async function ask(question: string) {
    if (!question.trim() || busy || !spaceId) return;
    setTurns((t) => [...t, { role: 'user', text: question }, { role: 'genie', pending: true }]);
    setInput('');
    setBusy(true);
    try {
      let msg;
      if (!convId.current) {
        const r = await postJSON<{ conversation_id: string; message: { message_id: string; conversation_id: string } }>(
          `/api/genie/${spaceId}/start`, { content: question });
        convId.current = r.conversation_id;
        msg = r.message;
      } else {
        const r = await postJSON<{ message: { message_id: string; conversation_id: string } }>(
          `/api/genie/${spaceId}/conversations/${convId.current}/message`, { content: question });
        msg = r.message;
      }
      const mid = msg.message_id;
      const cid = msg.conversation_id || convId.current;

      // Poll until COMPLETED.
      let status = '', tries = 0, final: Record<string, unknown> = {};
      while (tries++ < 45) {
        await new Promise((res) => setTimeout(res, 1500));
        final = await getJSON(`/api/genie/${spaceId}/conversations/${cid}/messages/${mid}`);
        status = String(final.status ?? '');
        if (status === 'COMPLETED' || status === 'FAILED') break;
      }

      // Build the answer turn: text + optional query-result.
      let text = '';
      const atts = (final.attachments as Record<string, unknown>[]) ?? [];
      for (const a of atts) if (a.text) text += String(a.text) + '\n';
      let sql: string | undefined, columns: string[] | undefined, rows: unknown[][] | undefined;
      try {
        const qr = await getJSON<{ has_result: boolean; sql?: string; columns?: string[]; rows?: unknown[][] }>(
          `/api/genie/${spaceId}/conversations/${cid}/messages/${mid}/query-result`);
        if (qr.has_result) { sql = qr.sql; columns = qr.columns; rows = qr.rows; }
      } catch { /* text-only answer */ }

      setTurns((t) => {
        const copy = [...t];
        copy[copy.length - 1] = {
          role: 'genie',
          text: text.trim() || (status === 'FAILED' ? '' : 'Done.'),
          sql, columns, rows,
          error: status === 'FAILED' ? String(final.error ?? 'Genie could not answer that.') : undefined,
        };
        return copy;
      });
    } catch (e) {
      setTurns((t) => {
        const copy = [...t];
        copy[copy.length - 1] = { role: 'genie', error: String(e) };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader icon={MessagesSquare} iconBg="bg-emerald-100" title="Ask (Genie)"
        subtitle="Ask the GTM book in plain English. Answers come from a Databricks Genie space over the governed gtm_cockpit tables — the generated SQL and data are shown so every answer cites its source." />

      {turns.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 mb-4">
          <div className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mb-2">
            <Sparkles className="w-4 h-4 text-emerald-500" /> Try asking
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLES.map((s) => (
              <button key={s} onClick={() => ask(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-emerald-50 hover:border-emerald-200">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 mb-4">
        {turns.map((t, i) => <TurnView key={i} turn={t} />)}
      </div>

      <div className="sticky bottom-4 flex gap-2 bg-white rounded-xl border border-gray-300 p-2 shadow-sm">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask(input)}
          placeholder={spaceId ? 'Ask about the UKI insurance book…' : 'Genie space not configured'}
          disabled={!spaceId || busy}
          className="flex-1 px-3 py-2 text-sm outline-none disabled:opacity-50" />
        <button onClick={() => ask(input)} disabled={!spaceId || busy || !input.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
          <Send className="w-4 h-4" /> {busy ? 'Thinking…' : 'Ask'}
        </button>
      </div>

      <Disclaimer>
        Genie answers are generated over synthetic-safe internal GTM data (LIST $ is a consumption proxy). Always
        sanity-check the SQL shown; Genie is an assistant, not an authoritative report.
      </Disclaimer>
    </div>
  );
}

function TurnView({ turn }: { turn: Turn }) {
  const [showSql, setShowSql] = useState(false);
  if (turn.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-2 text-sm max-w-[80%]">{turn.text}</div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 text-sm max-w-[90%] w-full">
        {turn.pending && <span className="text-gray-400">Genie is working…</span>}
        {turn.error && <span className="text-rose-600">{turn.error}</span>}
        {turn.text && <div className="text-gray-800 whitespace-pre-wrap">{turn.text}</div>}
        {turn.sql && (
          <div className="mt-2">
            <button onClick={() => setShowSql((s) => !s)}
              className="text-[11px] text-gray-400 hover:text-gray-600 inline-flex items-center gap-1">
              <ChevronDown className={`w-3 h-3 transition-transform ${showSql ? 'rotate-180' : ''}`} /> {showSql ? 'Hide' : 'Show'} SQL
            </button>
            {showSql && <pre className="mt-1 text-[11px] bg-gray-900 text-gray-100 rounded-lg p-2.5 overflow-x-auto">{turn.sql}</pre>}
          </div>
        )}
        {turn.columns && turn.rows && turn.rows.length > 0 && (
          <div className="mt-2 overflow-x-auto max-h-72">
            <table className="w-full text-xs">
              <thead className="text-[10px] uppercase text-gray-400">
                <tr>{turn.columns.map((c) => <th key={c} className="text-left px-2 py-1 font-semibold whitespace-nowrap">{c}</th>)}</tr>
              </thead>
              <tbody>
                {turn.rows.slice(0, 50).map((row, ri) => (
                  <tr key={ri} className="border-t border-gray-100">
                    {row.map((cell, ci) => <td key={ci} className="px-2 py-1 text-gray-700 whitespace-nowrap">{String(cell ?? '')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
