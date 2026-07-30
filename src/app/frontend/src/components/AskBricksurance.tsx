/**
 * Ask Bricksurance — a floating concierge chat, bottom-right on every hub page.
 *
 * Answers questions about the whole Bricksurance estate (which demo fits a
 * client ask, what a workbench does, where the docs live) from a curated
 * knowledge corpus via /api/agent/ask. Every question is logged server-side.
 * Hidden entirely when the agent isn't enabled in this workspace.
 */
import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';

interface Msg { role: 'user' | 'agent'; text: string; }

const SUGGESTIONS = [
  'A client asked for a reserving demo — what can I use?',
  'What fits a Lloyd’s underwriting conversation?',
  'Which demo replaces Prophet?',
];

export default function AskBricksurance() {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/agent/enabled').then((r) => r.json()).then((d) => setEnabled(!!d.enabled)).catch(() => setEnabled(false));
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, busy]);

  if (!enabled) return null;

  async function send(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    setMsgs((m) => [...m, { role: 'user', text: question }]);
    setInput('');
    setBusy(true);
    try {
      const r = await fetch('/api/agent/ask', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const d = await r.json();
      setMsgs((m) => [...m, { role: 'agent', text: d.answer || 'No answer.' }]);
    } catch {
      setMsgs((m) => [...m, { role: 'agent', text: 'Something went wrong — your question was still recorded.' }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-blue-600 text-white pl-3 pr-4 py-3 shadow-lg shadow-blue-300/40 hover:bg-blue-500 transition-colors">
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-bold">Ask Bricksurance</span>
        </button>
      )}

      {/* Slide-over panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[min(92vw,26rem)] h-[min(80vh,34rem)] flex flex-col rounded-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden">
          <header className="flex items-center gap-2 px-4 py-3 bg-[#1e293b] text-white shrink-0">
            <Sparkles className="w-4 h-4 text-blue-300" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold leading-tight">Ask Bricksurance</div>
              <div className="text-[10px] text-gray-300">Your concierge for the demos — which one fits, where it lives.</div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded"><X className="w-4 h-4" /></button>
          </header>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {msgs.length === 0 && (
              <div className="space-y-2">
                <p className="text-[12px] text-gray-500 px-1">Ask about any demo, or tell me what’s missing — every question is recorded so we build what you need.</p>
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)}
                    className="block w-full text-left text-[12px] text-blue-700 bg-white border border-blue-100 rounded-lg px-3 py-2 hover:border-blue-300 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-800'
                }`}>{m.text}</div>
              </div>
            ))}
            {busy && <div className="flex justify-start"><div className="bg-white border border-gray-200 rounded-2xl px-3 py-2 text-[13px] text-gray-400">Thinking…</div></div>}
            <div ref={endRef} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-center gap-2 p-3 border-t border-gray-200 bg-white shrink-0">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the demos…"
              className="flex-1 text-[13px] px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-400 outline-none" />
            <button type="submit" disabled={busy || !input.trim()}
              className="p-2 rounded-lg bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-500 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
