/**
 * Coverage Gaps — the shared hero view for SME / FE / sales leads.
 *
 * Top: the live "signal without a specialist" queue (accounts with consumption
 * / opps / active UCOs but no primary SA), ranked by consumption, each with a
 * one-click "Assign SA" writeback. Bottom: the SA load-balance roll-up so a
 * lead can see who to assign to and who's over-loaded.
 */
import { useEffect, useState } from 'react';
import { ShieldAlert, UserPlus, Users } from 'lucide-react';
import { getJSON, money, num, truthy, type Row } from '../lib/api';
import { PageHeader, SubBadge, Bar, Loading, ErrorNote, Disclaimer, Seat } from '../components/ui';
import DecisionModal, { type DecisionSeed } from '../components/DecisionModal';
import AccountDrawer from '../components/AccountDrawer';

interface Data { gaps: Row[]; sa_load: Row[]; }

export default function CoverageGaps() {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState('');
  const [seed, setSeed] = useState<DecisionSeed | null>(null);
  const [drawer, setDrawer] = useState<string | null>(null);

  function load() { getJSON<Data>('/api/coverage-gaps').then(setD).catch((e) => setErr(String(e))); }
  useEffect(load, []);

  if (err) return <ErrorNote msg={err} />;
  if (!d) return <Loading label="coverage" />;

  const maxLoad = Math.max(...d.sa_load.map((r) => num(r.list_365d)), 1);

  return (
    <div>
      <PageHeader icon={ShieldAlert} iconBg="bg-rose-100" title="Coverage Gaps"
        subtitle="The signal leaking through a coverage gap: accounts with consumption, open opps or active use-cases but no primary SA. Assign a specialist and record it — the decision lands in the governed log." />

      <div className="rounded-xl border border-rose-200 bg-white overflow-hidden">
        <div className="px-4 py-2.5 bg-rose-50 border-b border-rose-200 text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" /> Signal without a specialist ({d.gaps.length})
        </div>
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase text-gray-400 bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 font-semibold">Account</th>
              <th className="text-right px-2 py-2 font-semibold">LIST 365d</th>
              <th className="text-center px-2 py-2 font-semibold">UCOs</th>
              <th className="text-left px-2 py-2 font-semibold">Lead with</th>
              <th className="text-left px-2 py-2 font-semibold">Seats held</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {d.gaps.map((r) => (
              <tr key={String(r.account)} className="border-t border-gray-100 hover:bg-rose-50/40">
                <td className="px-4 py-2.5">
                  <button onClick={() => setDrawer(String(r.account))} className="text-left group">
                    <span className="font-semibold text-gray-900 group-hover:text-blue-700">{String(r.account)}</span>
                    <span className="ml-2"><SubBadge sub={String(r.sub_industry)} /></span>
                    <div className="text-[11px] text-gray-400">AE {String(r.ae)} · SA {String(r.sa_primary ?? 'NONE')}</div>
                  </button>
                </td>
                <td className="px-2 py-2.5 text-right font-bold text-gray-900">{money(r.list_365d)}</td>
                <td className="px-2 py-2.5 text-center">
                  <span className="text-gray-700">{num(r.uco_total)}</span>
                  {num(r.uco_active) > 0 && <span className="text-[10px] text-indigo-600 ml-1">{num(r.uco_active)} live</span>}
                </td>
                <td className="px-2 py-2.5 text-xs text-gray-600 max-w-[160px] truncate">{String(r.demos)}</td>
                <td className="px-2 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {truthy(r.seat_chief_actuary) && <Seat held label="Chief Act." />}
                    {truthy(r.seat_cdo) && <Seat held label="CDO" />}
                    {truthy(r.seat_cuo) && <Seat held label="CUO" />}
                    {truthy(r.seat_head_pricing) && <Seat held label="Pricing" />}
                  </div>
                </td>
                <td className="px-2 py-2.5 text-right">
                  <button onClick={() => setSeed({ account: String(r.account), action: 'assign_sa' })}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap">
                    <UserPlus className="w-3.5 h-3.5" /> Assign SA
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SA load balance */}
      <div className="rounded-xl border border-gray-200 bg-white mt-5 p-5">
        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5 mb-1">
          <Users className="w-4 h-4 text-gray-500" /> SA load & consumption concentration
        </h3>
        <p className="text-xs text-gray-500 mb-3">Who carries what — to decide where an unassigned account should go, and who’s over-loaded.</p>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase text-gray-400 sticky top-0 bg-white">
              <tr>
                <th className="text-left py-1.5 font-semibold">SA</th>
                <th className="text-center py-1.5 px-2 font-semibold">Accts</th>
                <th className="text-center py-1.5 px-2 font-semibold">Signal</th>
                <th className="text-center py-1.5 px-2 font-semibold">Live UCOs</th>
                <th className="text-left py-1.5 px-2 font-semibold w-40">Consumption</th>
              </tr>
            </thead>
            <tbody>
              {d.sa_load.map((r) => (
                <tr key={String(r.sa)} className="border-t border-gray-100">
                  <td className="py-1.5 font-medium text-gray-800">{String(r.sa)}</td>
                  <td className="py-1.5 px-2 text-center text-gray-600">{num(r.n_accounts)}</td>
                  <td className="py-1.5 px-2 text-center text-gray-600">{num(r.n_signal)}</td>
                  <td className="py-1.5 px-2 text-center text-gray-600">{num(r.active_ucos)}</td>
                  <td className="py-1.5 px-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1"><Bar value={num(r.list_365d)} max={maxLoad} className="bg-blue-500" /></div>
                      <span className="text-xs font-semibold text-gray-700 w-12 text-right">{money(r.list_365d)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Disclaimer>
        A <strong>coverage gap</strong> = an account with signal (consumption, an open opp, or an active U1–U5
        use-case) and no primary SA (or DSA-only). Consumption is a LIST-$ proxy. Assigning an SA here records a
        decision in <code>gtm_cockpit.decisions</code> — it does not change Salesforce.
      </Disclaimer>

      {seed && <DecisionModal seed={seed} onClose={() => setSeed(null)} onSaved={load} />}
      {drawer && <AccountDrawer account={drawer} onClose={() => setDrawer(null)} />}
    </div>
  );
}
