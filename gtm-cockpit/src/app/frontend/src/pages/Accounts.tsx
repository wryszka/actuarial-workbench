/**
 * All Accounts — the full 182-row book, searchable and filterable by
 * sub-industry / coverage. Every row opens the Account 360 drawer. The
 * "browse everything" backstop under the opinionated persona views.
 */
import { useEffect, useMemo, useState } from 'react';
import { ListChecks, Search } from 'lucide-react';
import { getJSON, money, num, truthy, type Row } from '../lib/api';
import { PageHeader, SubBadge, Loading, ErrorNote } from '../components/ui';
import AccountDrawer from '../components/AccountDrawer';

const SUBS = ['All', 'P&C', "Lloyd's/London Market", 'Life/Pensions', 'Broker', 'Health', 'Reinsurance'];
const FILTERS = ['All', 'Signal', 'Whitespace', 'Coverage gaps'];

export default function Accounts() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [sub, setSub] = useState('All');
  const [filter, setFilter] = useState('All');
  const [drawer, setDrawer] = useState<string | null>(null);

  useEffect(() => { getJSON<{ accounts: Row[] }>('/api/accounts').then((d) => setRows(d.accounts)).catch((e) => setErr(String(e))); }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    return rows.filter((r) => {
      if (q && !String(r.account).toLowerCase().includes(q.toLowerCase())
        && !String(r.ae).toLowerCase().includes(q.toLowerCase())
        && !String(r.sa_primary).toLowerCase().includes(q.toLowerCase())) return false;
      if (sub !== 'All' && r.sub_industry !== sub) return false;
      if (filter === 'Signal' && !truthy(r.has_signal)) return false;
      if (filter === 'Whitespace' && truthy(r.has_signal)) return false;
      if (filter === 'Coverage gaps' && !truthy(r.coverage_gap)) return false;
      return true;
    });
  }, [rows, q, sub, filter]);

  if (err) return <ErrorNote msg={err} />;
  if (!rows) return <Loading label="the book" />;

  return (
    <div>
      <PageHeader icon={ListChecks} title="All Accounts"
        subtitle={`The full ${rows.length}-account UKI insurance book. Search, filter, and open any account for its 360 view.`} />

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search account, AE or SA…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm" />
        </div>
        <select value={sub} onChange={(e) => setSub(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          {SUBS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 text-xs font-medium ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-400 mb-2">{filtered.length} of {rows.length} accounts</div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase text-gray-400 bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 font-semibold">Account</th>
              <th className="text-left px-2 py-2 font-semibold">AE / SA</th>
              <th className="text-right px-2 py-2 font-semibold">LIST 365d</th>
              <th className="text-center px-2 py-2 font-semibold">Opps</th>
              <th className="text-center px-2 py-2 font-semibold">UCOs</th>
              <th className="text-left px-2 py-2 font-semibold">Lead with</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={String(r.account)} className="border-t border-gray-100 hover:bg-blue-50/40 cursor-pointer"
                onClick={() => setDrawer(String(r.account))}>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{String(r.account)}</span>
                    <SubBadge sub={String(r.sub_industry)} />
                    {truthy(r.coverage_gap) && <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-rose-100 text-rose-600">GAP</span>}
                  </div>
                </td>
                <td className="px-2 py-2 text-xs text-gray-500">
                  {String(r.ae)}<br /><span className={truthy(r.has_sa) ? 'text-gray-500' : 'text-rose-500 font-medium'}>{String(r.sa_primary ?? 'NONE')}</span>
                </td>
                <td className="px-2 py-2 text-right font-semibold text-gray-800">{money(r.list_365d)}</td>
                <td className="px-2 py-2 text-center text-gray-500">{num(r.n_opps) || '·'}</td>
                <td className="px-2 py-2 text-center text-gray-500">{num(r.uco_total) || '·'}</td>
                <td className="px-2 py-2 text-xs text-gray-500 max-w-[180px] truncate">{String(r.demos)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {drawer && <AccountDrawer account={drawer} onClose={() => setDrawer(null)} />}
    </div>
  );
}
