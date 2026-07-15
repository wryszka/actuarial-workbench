/**
 * Usage — who opens the hub and which demos they launch.
 *
 * Reads /api/usage/summary (server aggregates a Delta table of visit + click
 * events, keyed by the OAuth-proxy user). Degrades gracefully: shows a notice
 * when tracking isn't provisioned in this workspace.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, Users, MousePointerClick, Clock } from 'lucide-react';

type Row = string[];
interface Summary {
  enabled: boolean;
  error?: string;
  totals?: Row;          // [events, users]
  top_demos?: Row[];     // [item, opens]
  top_users?: Row[];     // [user_email, events, last_seen]
  recent?: Row[];        // [event_ts, user_email, event_type, item]
}

function fmtTs(v: string): string {
  if (!v) return '';
  const d = new Date(v.includes('T') ? v : v.replace(' ', 'T') + 'Z');
  return isNaN(d.getTime()) ? v : d.toLocaleString();
}

export default function Usage() {
  const [data, setData] = useState<Summary | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    fetch('/api/usage/summary').then((r) => r.json()).then(setData).catch(() => setFailed(true));
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-5">
      <Link to="/" className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Workbench
      </Link>

      <header className="border-b border-gray-200 pb-5 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
          <BarChart3 className="w-6 h-6 text-blue-700" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Usage</h1>
          <p className="text-sm text-gray-700 mt-1.5 leading-relaxed max-w-3xl">
            Who is opening the hub and which demos they launch. Recorded from the signed-in
            user on every visit and demo-open, into a governed Unity Catalog table.
          </p>
        </div>
      </header>

      {failed && <Notice text="Couldn't load usage data." />}
      {data && !data.enabled && (
        <Notice text="Usage tracking isn't enabled in this workspace. Set USAGE_WAREHOUSE_ID and USAGE_TABLE to turn it on." />
      )}
      {data && data.enabled && data.error && <Notice text="Usage data is temporarily unavailable." />}

      {data && data.enabled && !data.error && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Stat icon={MousePointerClick} label="Events recorded" value={data.totals?.[0] ?? '0'} />
            <Stat icon={Users} label="Distinct users" value={data.totals?.[1] ?? '0'} />
            <Stat icon={BarChart3} label="Demos opened" value={String((data.top_demos ?? []).reduce((s, r) => s + Number(r[1] || 0), 0))} />
          </div>

          <Panel title="Most-opened demos" icon={BarChart3}>
            {(data.top_demos ?? []).length === 0 ? <Empty /> : (
              <ul className="divide-y divide-gray-100">
                {data.top_demos!.map((r, i) => (
                  <li key={i} className="flex items-center justify-between py-1.5 text-sm">
                    <span className="text-gray-800">{r[0]}</span>
                    <span className="font-bold text-blue-700">{r[1]}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Most active users" icon={Users}>
            {(data.top_users ?? []).length === 0 ? <Empty /> : (
              <ul className="divide-y divide-gray-100">
                {data.top_users!.map((r, i) => (
                  <li key={i} className="flex items-center justify-between py-1.5 text-sm gap-3">
                    <span className="text-gray-800 truncate">{r[0]}</span>
                    <span className="text-gray-400 text-xs shrink-0">{fmtTs(r[2])}</span>
                    <span className="font-bold text-blue-700 shrink-0 w-10 text-right">{r[1]}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Recent activity" icon={Clock}>
            {(data.recent ?? []).length === 0 ? <Empty /> : (
              <ul className="divide-y divide-gray-100">
                {data.recent!.map((r, i) => (
                  <li key={i} className="flex items-center gap-3 py-1.5 text-sm">
                    <span className="text-gray-400 text-xs w-40 shrink-0">{fmtTs(r[0])}</span>
                    <span className="text-gray-800 truncate flex-1">{r[1]}</span>
                    <span className="text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 shrink-0">{r[2]}</span>
                    <span className="text-gray-500 text-xs w-32 truncate text-right shrink-0">{r[3]}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <Icon className="w-4 h-4 text-blue-600" />
      <div className="text-2xl font-bold text-gray-900 mt-2">{value}</div>
      <div className="text-[11px] text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4">
      <h2 className="text-sm font-bold text-gray-900 mb-2 inline-flex items-center gap-1.5">
        <Icon className="w-4 h-4 text-blue-600" /> {title}
      </h2>
      {children}
    </section>
  );
}

function Empty() {
  return <p className="text-xs text-gray-400 italic py-2">Nothing recorded yet.</p>;
}

function Notice({ text }: { text: string }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">{text}</div>
  );
}
