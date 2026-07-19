/**
 * Accelerator Queue — the sales-lead hero.
 *
 * Every open opp joined to the account's recommended demo + elevation persona,
 * ranked by amount (a stand-in for $ × movability). A renewal calendar with
 * RAG risk flags by close date, and a stage-mix summary. Each row can log a
 * next step / assign a demo (writeback).
 */
import { useEffect, useMemo, useState } from 'react';
import { Rocket, CalendarClock, PlayCircle } from 'lucide-react';
import { getJSON, money, num, type Row } from '../lib/api';
import { PageHeader, SubBadge, Loading, ErrorNote, Disclaimer, StatTile, ExplainPanel } from '../components/ui';
import DecisionModal, { type DecisionSeed } from '../components/DecisionModal';
import AccountDrawer from '../components/AccountDrawer';

interface Data { opps: Row[]; renewals: Row[]; by_stage: Row[]; }

const HOT_STAGES = ['Negotiation', 'Negotiation / Procurement', 'Procurement'];

function riskOf(closeDate: string, stage: string): { label: string; cls: string } | null {
  if (!closeDate) return null;
  const now = new Date('2026-07-19');
  const dt = new Date(closeDate);
  const days = Math.round((dt.getTime() - now.getTime()) / 86400000);
  const hot = HOT_STAGES.some((s) => stage.includes(s));
  if (days < 0) return { label: 'OVERDUE', cls: 'bg-rose-600 text-white' };
  if (days <= 90 && hot) return { label: `${days}d · at risk`, cls: 'bg-rose-100 text-rose-700' };
  if (days <= 90) return { label: `${days}d`, cls: 'bg-amber-100 text-amber-700' };
  return { label: `${days}d`, cls: 'bg-gray-100 text-gray-500' };
}

export default function Accelerator() {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState('');
  const [seed, setSeed] = useState<DecisionSeed | null>(null);
  const [drawer, setDrawer] = useState<string | null>(null);
  const [tab, setTab] = useState<'queue' | 'renewals'>('queue');

  useEffect(() => { getJSON<Data>('/api/accelerator').then(setD).catch((e) => setErr(String(e))); }, []);

  const newOpps = useMemo(() => (d?.opps ?? []).filter((o) => o.opp_type !== 'Renewal'), [d]);
  const totalNew = newOpps.reduce((s, o) => s + num(o.amount), 0);
  const totalRenewal = (d?.renewals ?? []).reduce((s, o) => s + num(o.amount), 0);

  if (err) return <ErrorNote msg={err} />;
  if (!d) return <Loading label="the pipeline" />;

  return (
    <div>
      <PageHeader icon={Rocket} iconBg="bg-indigo-100" title="Accelerator Queue"
        subtitle="For each open opportunity: the demo to run next and the persona to run it for — ranked by value. Plus the renewal calendar with risk flags. Turns nine demos into a prioritised sell motion." />

      <ExplainPanel>
        <p>Two tabs. <strong>Next-best-demo queue</strong>: every open new-business opp joined to the account's recommended workbench + the persona to elevate to, ranked by opp value. <strong>Renewal calendar</strong>: open renewals by close date.</p>
        <p><strong>How the demo is picked:</strong> the same transparent rules as everywhere (sub-industry fit · incumbent in play · persona held · matching use-case) — open any account to see the “why?”. <strong>Risk flags</strong> are derived from close date vs stage (OVERDUE, or ≤90d while in negotiation). Reconcile to Salesforce before acting.</p>
      </ExplainPanel>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatTile label="New-business opps" value={newOpps.length} sub={money(totalNew)} />
        <StatTile label="Renewals in play" value={d.renewals.length} sub={money(totalRenewal)} accent="text-blue-700" />
        <StatTile label="Hot / at-risk" accent="text-rose-600"
          value={d.renewals.filter((r) => { const x = riskOf(String(r.close_date), String(r.stage)); return x && (x.label === 'OVERDUE' || x.label.includes('risk')); }).length}
          sub="renewals overdue or ≤90d in negotiation" />
        <StatTile label="Stages tracked" value={d.by_stage.length} sub="across the open book" />
      </div>

      <div className="flex gap-1 mb-3">
        <TabBtn active={tab === 'queue'} onClick={() => setTab('queue')} icon={PlayCircle}>Next-best-demo queue</TabBtn>
        <TabBtn active={tab === 'renewals'} onClick={() => setTab('renewals')} icon={CalendarClock}>Renewal calendar</TabBtn>
      </div>

      {tab === 'queue' && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase text-gray-400 bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 font-semibold">Opportunity</th>
                <th className="text-left px-2 py-2 font-semibold">Stage</th>
                <th className="text-right px-2 py-2 font-semibold">Amount</th>
                <th className="text-left px-2 py-2 font-semibold">Run this demo</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {newOpps.slice(0, 60).map((o, i) => (
                <tr key={i} className="border-t border-gray-100 hover:bg-indigo-50/40">
                  <td className="px-4 py-2.5">
                    <button onClick={() => setDrawer(String(o.account))} className="text-left">
                      <div className="font-medium text-gray-900 truncate max-w-[300px] hover:text-blue-700">{String(o.opp_name)}</div>
                      <div className="text-[11px] text-gray-400">{String(o.account)} <SubBadge sub={String(o.sub_industry)} /></div>
                    </button>
                  </td>
                  <td className="px-2 py-2.5 text-xs text-gray-500 whitespace-nowrap">{String(o.stage)}</td>
                  <td className="px-2 py-2.5 text-right font-semibold text-gray-900">{money(o.amount)}</td>
                  <td className="px-2 py-2.5">
                    <div className="text-xs font-medium text-indigo-700 max-w-[180px] truncate">{String(o.demos) || '—'}</div>
                    {o.elevate_to ? <div className="text-[10px] text-gray-400 truncate max-w-[180px]">→ {String(o.elevate_to)}</div> : null}
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <button onClick={() => setSeed({ account: String(o.account), action: 'assign_demo', value: String(o.demos).split('·')[0]?.trim() })}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 whitespace-nowrap">
                      Assign demo
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'renewals' && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase text-gray-400 bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 font-semibold">Account · renewal</th>
                <th className="text-left px-2 py-2 font-semibold">Close</th>
                <th className="text-left px-2 py-2 font-semibold">Stage</th>
                <th className="text-right px-2 py-2 font-semibold">Value</th>
                <th className="text-center px-2 py-2 font-semibold">Risk</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {d.renewals.map((r, i) => {
                const risk = riskOf(String(r.close_date), String(r.stage));
                return (
                  <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <button onClick={() => setDrawer(String(r.account))} className="font-medium text-gray-900 hover:text-blue-700">{String(r.account)}</button>
                    </td>
                    <td className="px-2 py-2.5 text-xs text-gray-500 whitespace-nowrap">{String(r.close_date)}</td>
                    <td className="px-2 py-2.5 text-xs text-gray-500">{String(r.stage)}</td>
                    <td className="px-2 py-2.5 text-right font-semibold text-gray-900">{money(r.amount)}</td>
                    <td className="px-2 py-2.5 text-center">
                      {risk && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${risk.cls}`}>{risk.label}</span>}
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <button onClick={() => setSeed({ account: String(r.account), action: 'flag_risk' })}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50">
                        Flag risk
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Disclaimer>
        Opps are parsed from the account book’s free-text field into stage + amount; amounts are the recorded
        opp value (renewals are gross contract values, not incremental). “Risk” is derived from close date vs
        stage as a planning heuristic. Reconcile to Salesforce before acting — this accelerates the decision, it
        isn’t the system of record.
      </Disclaimer>

      {seed && <DecisionModal seed={seed} onClose={() => setSeed(null)} />}
      {drawer && <AccountDrawer account={drawer} onClose={() => setDrawer(null)} />}
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, children }: {
  active: boolean; onClick: () => void; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg ${
        active ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
      <Icon className="w-4 h-4" /> {children}
    </button>
  );
}
