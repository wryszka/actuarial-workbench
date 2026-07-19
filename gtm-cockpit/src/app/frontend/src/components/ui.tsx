/**
 * Small shared UI primitives — stat tiles, badges, bars, section headers,
 * loading/empty states, and the "About this view" disclaimer. Kept
 * dependency-free (Tailwind classes only) to match the hub's styling.
 */
import { useState, type ReactNode } from 'react';
import { Info, HelpCircle, ChevronDown } from 'lucide-react';
import { subColor } from '../lib/api';

export function StatTile({ label, value, sub, accent }: {
  label: string; value: ReactNode; sub?: ReactNode; accent?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">{label}</div>
      <div className={`text-2xl font-bold mt-1 tracking-tight ${accent ?? 'text-gray-900'}`}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5 leading-snug">{sub}</div>}
    </div>
  );
}

export function SubBadge({ sub }: { sub: string }) {
  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${subColor(sub)}`}>{sub}</span>;
}

export function Bar({ value, max, className }: { value: number; max: number; className?: string }) {
  const w = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
      <div className={`h-full rounded-full ${className ?? 'bg-blue-500'}`} style={{ width: `${w}%` }} />
    </div>
  );
}

export function PageHeader({ title, subtitle, icon: Icon, iconBg }: {
  title: string; subtitle?: string; icon: React.ElementType; iconBg?: string;
}) {
  return (
    <header className="flex items-start gap-4 border-b border-gray-200 pb-4 mb-5">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg ?? 'bg-blue-100'}`}>
        <Icon className="w-6 h-6 text-blue-700" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-gray-600 mt-1 max-w-3xl leading-relaxed">{subtitle}</p>}
      </div>
    </header>
  );
}

/** "What am I looking at" — collapsed by default, click to unfold. Every page
 *  opens with one so a cold visitor knows what the view shows + how to read it. */
export function ExplainPanel({ children, defaultOpen = false }: { children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50/60">
      <button onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-blue-800">
        <HelpCircle className="w-3.5 h-3.5 shrink-0" />
        What am I looking at?
        <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-3 pb-3 pt-0 text-[12px] text-blue-900/80 leading-relaxed space-y-1.5">{children}</div>}
    </div>
  );
}

/** Inline "Why?" popover for a single derived datapoint (e.g. a demo reco).
 *  Renders the reasons the rules engine produced. */
export function WhyChip({ reasons }: { reasons: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5">
        <HelpCircle className="w-3 h-3" /> why?
      </button>
      {open && (
        <span className="absolute z-20 left-0 top-5 w-64 rounded-lg border border-gray-200 bg-white shadow-lg p-2.5 text-left"
          onClick={(e) => e.stopPropagation()}>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Because</span>
          <ul className="space-y-0.5">
            {reasons.map((r, i) => <li key={i} className="text-[11px] text-gray-700 flex gap-1.5"><span className="text-blue-500">•</span>{r}</li>)}
          </ul>
        </span>
      )}
    </span>
  );
}

export function Disclaimer({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800 leading-relaxed">
      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

export function Loading({ label }: { label?: string }) {
  return <div className="p-10 text-center text-gray-400 text-sm">Loading {label ?? ''}…</div>;
}

export function ErrorNote({ msg }: { msg: string }) {
  return (
    <div className="p-4 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm">
      Couldn’t load this view: {msg}. The SQL warehouse may be starting — retry in a moment.
    </div>
  );
}

export function Seat({ held, label }: { held: boolean; label: string }) {
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
      held ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400 line-through'}`}>
      {label}
    </span>
  );
}
