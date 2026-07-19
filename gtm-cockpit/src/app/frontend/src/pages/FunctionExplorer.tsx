/**
 * Function Explorer — search the book by business function (Underwriting,
 * Pricing, Claims, Actuarial, Finance, Data/Platform). For the chosen function:
 * which accounts have signal, are we persona-connected (do we hold the seat),
 * and what software is in that space (Radar / Tyche / Prophet / Python…).
 */
import { useEffect, useState } from 'react';
import { Search, Plug, Unplug } from 'lucide-react';
import { getJSON, money, num, truthy, type Row } from '../lib/api';
import { PageHeader, SubBadge, Loading, ErrorNote, Disclaimer } from '../components/ui';
import AccountDrawer from '../components/AccountDrawer';

interface Summary { summary: Row[]; software: Row[]; }
interface Detail { function: string; accounts: Row[]; software: Row[]; }

const FN_ORDER = ['Underwriting', 'Pricing', 'Claims', 'Actuarial', 'Finance', 'Data/Platform'];

export default function FunctionExplorer() {
  const [sum, setSum] = useState<Summary | null>(null);
  const [fn, setFn] = useState<string>('Underwriting');
  const [detail, setDetail] = useState<Detail | null>(null);
  const [err, setErr] = useState('');
  const [drawer, setDrawer] = useState<string | null>(null);
  const [onlyGap, setOnlyGap] = useState(false);

  useEffect(() => { getJSON<Summary>('/api/functions').then(setSum).catch((e) => setErr(String(e))); }, []);
  useEffect(() => {
    setDetail(null);
    getJSON<Detail>(`/api/function/${encodeURIComponent(fn)}`).then(setDetail).catch((e) => setErr(String(e)));
  }, [fn]);

  if (err) return <ErrorNote msg={err} />;
  if (!sum) return <Loading label="functions" />;

  const summaryByFn = Object.fromEntries(sum.summary.map((r) => [String(r.function), r]));
  const accounts = (detail?.accounts ?? []).filter((a) => !onlyGap || !truthy(a.connected));

  return (
    <div>
      <PageHeader icon={Search} title="Function Explorer"
        subtitle="Search the book by business function. See which accounts have signal in it, whether we're connected to the decision-maker, and the software in that space (Radar, Tyche, Prophet, Python…)." />

      {/* Function selector tiles */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-5">
        {FN_ORDER.map((f) => {
          const s = summaryByFn[f];
          const active = f === fn;
          return (
            <button key={f} onClick={() => setFn(f)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                active ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}>
              <div className="text-xs font-bold text-gray-800">{f}</div>
              <div className="text-lg font-bold text-gray-900 mt-0.5">{num(s?.n_accounts)}</div>
              <div className="text-[10px] text-gray-500">{num(s?.n_connected)} connected · {money(s?.list_365d)}</div>
            </button>
          );
        })}
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Accounts in this function */}
        <div className="md:col-span-2 rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{fn} — accounts with signal</span>
            <label className="text-[11px] text-gray-500 inline-flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={onlyGap} onChange={(e) => setOnlyGap(e.target.checked)} /> only not-connected
            </label>
          </div>
          {!detail ? <Loading /> : (
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase text-gray-400">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Account</th>
                  <th className="text-right px-2 py-2 font-semibold">LIST</th>
                  <th className="text-center px-2 py-2 font-semibold">{fn} seat</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={String(a.account)} className="border-t border-gray-100 hover:bg-blue-50/40 cursor-pointer"
                    onClick={() => setDrawer(String(a.account))}>
                    <td className="px-4 py-2">
                      <span className="font-medium text-gray-900">{String(a.account)}</span>
                      <span className="ml-2"><SubBadge sub={String(a.sub_industry)} /></span>
                      <div className="text-[11px] text-gray-400">SA {String(a.sa_primary ?? 'NONE')} · {num(a.uco_total)} UCOs</div>
                    </td>
                    <td className="px-2 py-2 text-right font-semibold text-gray-800">{money(a.list_365d)}</td>
                    <td className="px-2 py-2 text-center">
                      {truthy(a.connected)
                        ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700"><Plug className="w-3 h-3" /> {String(a.seat)}</span>
                        : <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-500"><Unplug className="w-3 h-3" /> not connected</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Software in this function */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Software in {fn}</h3>
          {!detail || detail.software.length === 0 ? (
            <p className="text-xs text-gray-400">No specific software detected in the book for this function. Worth probing in conversation.</p>
          ) : (
            <div className="space-y-2">
              {detail.software.map((s) => (
                <div key={String(s.software)} className="border border-gray-100 rounded-lg p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-gray-800">{String(s.software)}</span>
                    <span className="text-[10px] text-gray-400">{num(s.n_accounts)} acct{num(s.n_accounts) > 1 ? 's' : ''}</span>
                  </div>
                  <div className="text-[10px] text-gray-500">{String(s.category)} · we coexist/displace with <span className="text-blue-600 font-medium">{String(s.displaced_by)}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Disclaimer>
        “Connected” = we hold a contact in the function’s decision seat ({fn === 'Data/Platform' ? 'CDO' : fn === 'Pricing' ? 'Head of Pricing' : fn === 'Actuarial' ? 'Chief Actuary' : fn === 'Finance' ? 'CFO/Finance' : 'CUO'}).
        Software is detected from incumbent + opp + use-case text — absence means “not evidenced,” not “none”; probe in conversation. Signal in a function is inferred from use-case themes, recommended demo, and detected software.
      </Disclaimer>

      {drawer && <AccountDrawer account={drawer} onClose={() => setDrawer(null)} />}
    </div>
  );
}
