/**
 * API client + shared helpers for the GTM Cockpit.
 *
 * The backend returns numbers as strings (Databricks SQL inline results are
 * stringified), sometimes in scientific notation ("2.9691061E7"). `num()`
 * coerces those safely; the fmt helpers render money/counts consistently.
 */

export async function getJSON<T>(path: string): Promise<T> {
  const r = await fetch(path);
  if (!r.ok) throw new Error(`${path} → ${r.status}`);
  return r.json();
}

export async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${path} → ${r.status}`);
  return r.json();
}

export function num(v: unknown): number {
  if (v == null || v === '') return 0;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** $5.1M / $545K / $60 — compact money for the LIST proxy + pipeline. */
export function money(v: unknown): string {
  const n = num(v);
  if (n === 0) return '$0';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toFixed(0)}`;
}

export function pct(part: unknown, whole: unknown): string {
  const w = num(whole);
  if (w === 0) return '0%';
  return `${Math.round((num(part) / w) * 100)}%`;
}

export function truthy(v: unknown): boolean {
  return v === true || v === 'true' || v === 1 || v === '1';
}

// ── Shared types (loose — backend rows are string-valued) ──────────────────
export type Row = Record<string, unknown>;

export interface AppConfig {
  entity_name: string;
  territory: string;
  genie_space_id: string;
  catalog: string;
  schema: string;
}

export const SUBIND_COLORS: Record<string, string> = {
  'P&C': 'bg-blue-100 text-blue-800',
  "Lloyd's/London Market": 'bg-purple-100 text-purple-800',
  'Life/Pensions': 'bg-emerald-100 text-emerald-800',
  Broker: 'bg-amber-100 text-amber-800',
  Health: 'bg-rose-100 text-rose-800',
  Reinsurance: 'bg-cyan-100 text-cyan-800',
};

export function subColor(sub: string): string {
  return SUBIND_COLORS[sub] ?? 'bg-gray-100 text-gray-700';
}
