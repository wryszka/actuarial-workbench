/**
 * Small shared UI primitives — stat tiles, badges, bars, section headers,
 * loading/empty states, and the "About this view" disclaimer. Kept
 * dependency-free (Tailwind classes only) to match the hub's styling.
 */
import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
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
