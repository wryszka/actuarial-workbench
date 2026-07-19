/**
 * Account 360 slide-over: consumption, opps, UCO funnel, contacts-by-seat
 * (persona reachability), recorded decisions, and a "Record a decision" button.
 * Opened from any account row across the cockpit.
 */
import { useEffect, useState } from 'react';
import { X, TrendingUp, Briefcase, Users, ClipboardList, Cpu } from 'lucide-react';
import { getJSON, money, num, truthy, type Row } from '../lib/api';
import { SubBadge, Seat, WhyChip } from './ui';
import DecisionModal from './DecisionModal';

interface Detail {
  account: Row; opps: Row[]; ucos: Row[]; contacts: Row[]; decisions: Row[];
  software?: Row[]; rationale?: Row[]; functions?: Row[];
}

const SEATS: [string, string][] = [
  ['seat_chief_actuary', 'Chief Actuary'], ['seat_cdo', 'CDO'], ['seat_cuo', 'CUO'],
  ['seat_head_pricing', 'Head of Pricing'], ['seat_cro', 'CRO'],
  ['seat_cfo', 'CFO/Finance'], ['seat_cto', 'CTO'],
];

export default function AccountDrawer({ account, onClose }: { account: string; onClose: () => void }) {
  const [d, setD] = useState<Detail | null>(null);
  const [err, setErr] = useState('');
  const [modal, setModal] = useState(false);

  function load() {
    getJSON<Detail>(`/api/account/${encodeURIComponent(account)}`).then(setD).catch((e) => setErr(String(e)));
  }
  useEffect(load, [account]);

  const a = d?.account ?? {};
  const ucoStages = ['U1', 'U2', 'U3', 'U4', 'U5', 'U6'];

  return (
    <div className="fixed inset-0 z-40 bg-black/30 flex justify-end" onClick={onClose}>
      <div className="bg-gray-50 w-full max-w-2xl h-full overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between z-10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">{account}</h2>
              {a.sub_industry ? <SubBadge sub={String(a.sub_industry)} /> : null}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {String(a.country ?? '')} · AE {String(a.ae ?? '—')} · SA {String(a.sa_primary ?? 'NONE')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setModal(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700">
              Record a decision
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {err && <div className="p-6 text-sm text-rose-600">{err}</div>}
        {!d && !err && <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>}

        {d && (
          <div className="p-6 space-y-5">
            {/* Consumption + demo */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-white border border-gray-200 p-3">
                <div className="text-[10px] uppercase text-gray-500 font-semibold">LIST 365d</div>
                <div className="text-lg font-bold text-gray-900">{money(a.list_365d)}</div>
              </div>
              <div className="rounded-lg bg-white border border-gray-200 p-3">
                <div className="text-[10px] uppercase text-gray-500 font-semibold">Open opps</div>
                <div className="text-lg font-bold text-gray-900">{money(a.open_opp_total)}</div>
              </div>
              <div className="rounded-lg bg-white border border-gray-200 p-3">
                <div className="text-[10px] uppercase text-gray-500 font-semibold">UCOs</div>
                <div className="text-lg font-bold text-gray-900">{num(a.uco_total)}</div>
              </div>
            </div>

            {a.demos ? (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <div className="text-[10px] uppercase text-blue-700 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Lead with
                </div>
                {/* Each recommended demo with its transparent rationale */}
                {d.rationale && d.rationale.length > 0 ? (
                  <div className="mt-1 space-y-1">
                    {d.rationale.map((r) => (
                      <div key={String(r.workbench)} className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-gray-900">{String(r.workbench)}</span>
                        <WhyChip reasons={String(r.reasons).split(' · ')} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm font-semibold text-gray-900 mt-0.5">{String(a.demos)}</div>
                )}
                {a.elevate_to ? <div className="text-xs text-gray-600 mt-1">Elevate to: {String(a.elevate_to)}</div> : null}
                {a.incumbent ? <div className="text-xs text-gray-500 mt-0.5">Incumbent: {String(a.incumbent)}</div> : null}
              </div>
            ) : null}

            {/* Software in play */}
            {d.software && d.software.length > 0 ? (
              <Section icon={Cpu} title="Software detected">
                <div className="flex flex-wrap gap-1.5">
                  {d.software.map((s, i) => (
                    <span key={i} className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-700"
                      title={`${String(s.category)} · we coexist/displace with ${String(s.displaced_by)}`}>
                      {String(s.software)}
                    </span>
                  ))}
                </div>
              </Section>
            ) : null}

            {/* UCO funnel */}
            <Section icon={TrendingUp} title="UCO funnel (U1 → U6)">
              <div className="flex gap-1.5">
                {ucoStages.map((s) => {
                  const c = num((a as Row)[s.toLowerCase()]);
                  return (
                    <div key={s} className={`flex-1 rounded-lg p-2 text-center ${c > 0 ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                      <div className="text-[10px] text-gray-500 font-semibold">{s}</div>
                      <div className={`text-sm font-bold ${c > 0 ? 'text-indigo-700' : 'text-gray-400'}`}>{c}</div>
                    </div>
                  );
                })}
              </div>
              {d.ucos.length > 0 && (
                <ul className="mt-2 space-y-0.5 max-h-40 overflow-y-auto">
                  {d.ucos.map((u, i) => (
                    <li key={i} className="text-xs text-gray-600 flex gap-2">
                      <span className="font-mono text-indigo-600 shrink-0">{String(u.stage)}</span>
                      <span className="truncate">{String(u.uco_name)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* Opps */}
            {d.opps.length > 0 && (
              <Section icon={Briefcase} title={`Open opportunities (${d.opps.length})`}>
                <table className="w-full text-xs">
                  <tbody>
                    {d.opps.map((o, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="py-1 pr-2 text-gray-700 truncate max-w-[240px]">{String(o.opp_name)}</td>
                        <td className="py-1 px-2 text-gray-500 whitespace-nowrap">{String(o.stage)}</td>
                        <td className="py-1 pl-2 text-right font-semibold text-gray-900">{money(o.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            )}

            {/* Persona reachability */}
            <Section icon={Users} title="Decision-seat reachability">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {SEATS.map(([k, label]) => <Seat key={k} held={truthy((a as Row)[k])} label={label} />)}
              </div>
              {d.contacts.length > 0 && (
                <ul className="space-y-0.5 max-h-40 overflow-y-auto">
                  {d.contacts.map((c, i) => (
                    <li key={i} className="text-xs text-gray-600">
                      <span className="font-medium text-gray-800">{String(c.name)}</span>
                      {c.title ? <span className="text-gray-400"> — {String(c.title)}</span> : null}
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* Decisions */}
            <Section icon={ClipboardList} title={`Recorded decisions (${d.decisions.length})`}>
              {d.decisions.length === 0 ? (
                <p className="text-xs text-gray-400">No decisions recorded yet.</p>
              ) : (
                <ul className="space-y-1">
                  {d.decisions.map((dec, i) => (
                    <li key={i} className="text-xs text-gray-600 border-l-2 border-blue-200 pl-2">
                      <span className="font-semibold text-gray-800">{String(dec.action)}</span>
                      {dec.value ? <span> · {String(dec.value)}</span> : null}
                      <span className="text-gray-400"> — {String(dec.changed_by)}, {String(dec.changed_at).slice(0, 10)}</span>
                      {dec.detail ? <div className="text-gray-500">{String(dec.detail)}</div> : null}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
        )}
      </div>

      {modal && <DecisionModal seed={{ account }} onClose={() => setModal(false)} onSaved={load} />}
    </div>
  );
}

function Section({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white border border-gray-200 p-4">
      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5 text-gray-400" /> {title}
      </h3>
      {children}
    </div>
  );
}
