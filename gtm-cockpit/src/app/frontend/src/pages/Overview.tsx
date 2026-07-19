/**
 * Territory Overview — the global/SME-lead altitude view: the barbell
 * (concentration + long tail), sub-industry mix, top logos, and the coverage
 * headline. Opens with an "Impact" strip that frames the cockpit as a
 * territory operating system (the leadership story), not another demo.
 */
import { useEffect, useState } from 'react';
import { LayoutDashboard, TrendingUp } from 'lucide-react';
import { getJSON, money, num, pct, type AppConfig, type Row } from '../lib/api';
import { PageHeader, StatTile, SubBadge, Bar, Loading, ErrorNote, Disclaimer, ExplainPanel } from '../components/ui';

interface Data {
  totals: Row; by_sub: Row[]; top_accounts: Row[]; by_country: Row[]; top5: Row;
}

export default function Overview({ cfg }: { cfg: AppConfig | null }) {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => { getJSON<Data>('/api/overview').then(setD).catch((e) => setErr(String(e))); }, []);

  if (err) return <ErrorNote msg={err} />;
  if (!d) return <Loading label="the territory" />;

  const t = d.totals;
  const maxSub = Math.max(...d.by_sub.map((r) => num(r.list_365d)), 1);
  const top5share = pct(d.top5.top5, d.top5.total);

  return (
    <div>
      <PageHeader icon={LayoutDashboard} title="Territory Overview"
        subtitle={`${cfg?.territory ?? 'UKI'} insurance go-to-market at a glance — where consumption concentrates, where the whitespace is, and how well the book is covered. One governed source the whole team reads from.`} />

      <ExplainPanel>
        <p>This is the top-of-territory picture of the UKI insurance book. The tiles count accounts, trailing consumption, open pipeline and coverage gaps; the charts show where consumption concentrates (a <strong>barbell</strong> — a few big logos + a long $0 tail) and how it splits by sub-industry.</p>
        <p><strong>How to read it:</strong> “consumption” is a LIST-$ proxy, not billed revenue. “Coverage gaps” = accounts with signal but no primary SA. Use this to see shape; use Coverage Gaps and the Accelerator Queue to act.</p>
      </ExplainPanel>

      {/* Impact strip — the leadership framing */}
      <div className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 mb-5">
        <div className="text-[11px] uppercase tracking-wider text-blue-300 font-semibold">Why this exists</div>
        <p className="text-sm text-slate-200 mt-1 leading-relaxed max-w-3xl">
          The actuarial-workbench portfolio proves nine insurance processes. This cockpit turns that
          portfolio into a <span className="text-white font-semibold">territory operating system</span>: it
          fuses consumption, pipeline and incumbent-mapping across {num(t.n_accounts)} accounts into one place
          to decide <em>what to show, to whom, next</em> — and records the decision, governed and audited.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="Accounts" value={num(t.n_accounts)}
          sub={`${num(t.n_signal)} with active signal · ${num(t.n_zero)} at $0`} />
        <StatTile label="Trailing consumption" value={money(t.total_list)} accent="text-blue-700"
          sub={<>Top 5 logos = <span className="font-semibold">{top5share}</span> of the book</>} />
        <StatTile label="Open pipeline" value={money(t.total_open_opp)}
          sub={`+ ${money(t.total_renewal)} renewals in play`} />
        <StatTile label="Coverage gaps" value={num(t.n_coverage_gap)} accent="text-rose-600"
          sub={<>signal but no/weak SA · {num(t.n_no_sa)} accounts have no primary SA</>} />
      </div>

      {/* Barbell + mix */}
      <div className="grid md:grid-cols-2 gap-5 mt-5">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-600" /> Consumption by sub-industry
          </h3>
          <div className="space-y-2.5">
            {d.by_sub.map((r) => (
              <div key={String(r.sub_industry)}>
                <div className="flex items-center justify-between text-xs mb-0.5">
                  <span className="flex items-center gap-1.5">
                    <SubBadge sub={String(r.sub_industry)} />
                    <span className="text-gray-400">{num(r.n)} accts · {num(r.n_signal)} signal</span>
                  </span>
                  <span className="font-semibold text-gray-800">{money(r.list_365d)}</span>
                </div>
                <Bar value={num(r.list_365d)} max={maxSub} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-3">Top logos (the barbell head)</h3>
          <table className="w-full text-sm">
            <tbody>
              {d.top_accounts.map((r, i) => (
                <tr key={String(r.account)} className="border-t border-gray-100">
                  <td className="py-1.5 text-gray-400 w-6">{i + 1}</td>
                  <td className="py-1.5 font-medium text-gray-800 truncate max-w-[200px]">{String(r.account)}</td>
                  <td className="py-1.5"><SubBadge sub={String(r.sub_industry)} /></td>
                  <td className="py-1.5 text-right font-semibold text-gray-900">{money(r.list_365d)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[11px] text-gray-400 mt-3">
            Five logos carry {top5share} of consumption while {num(t.n_zero)} accounts sit at $0 — a barbell the
            cockpit makes actionable rather than just visible.
          </p>
        </div>
      </div>

      <Disclaimer>
        <strong>About this view.</strong> Built by Databricks Field Engineering. Consumption is trailing-12-month
        LIST $ — a relative <em>ranking proxy</em>, not billed revenue. Sub-industry and incumbent fields are
        partly name-inferred, and duplicate SFDC records (see Data Quality) split some logos’ figures. This is an
        internal GTM planning aid layered on top of Salesforce, not a system of record.
      </Disclaimer>
    </div>
  );
}
