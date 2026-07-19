/**
 * Demo-Fit Matrix — workbench × sub-industry demand, plus the per-workbench
 * supply/demand summary (addressable accounts, signal, whitespace $) and the
 * demo→process/incumbent map. Surfaces over- and under-built demos (e.g.
 * Reinsurance over-built for the UKI market).
 */
import { useEffect, useState } from 'react';
import { Grid3x3 } from 'lucide-react';
import { getJSON, money, num, type Row } from '../lib/api';
import { PageHeader, Loading, ErrorNote, Disclaimer, Bar } from '../components/ui';

interface Data { matrix: Row[]; demo_map: Row[]; by_workbench: Row[]; }

const SUBS = ['P&C', "Lloyd's/London Market", 'Life/Pensions', 'Broker', 'Health', 'Reinsurance'];

export default function DemoFit() {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => { getJSON<Data>('/api/demo-fit').then(setD).catch((e) => setErr(String(e))); }, []);
  if (err) return <ErrorNote msg={err} />;
  if (!d) return <Loading label="demo-fit" />;

  // index matrix by workbench+sub
  const cell = (wb: string, sub: string) =>
    d.matrix.find((r) => r.workbench === wb && r.sub_industry === sub);
  const workbenches = d.by_workbench.map((r) => String(r.workbench));
  const maxN = Math.max(...d.by_workbench.map((r) => num(r.n_accounts)), 1);

  return (
    <div>
      <PageHeader icon={Grid3x3} title="Demo-Fit Matrix"
        subtitle="Which workbench addresses which slice of the book — and where demand and built assets are out of balance. Rows are the nine workbenches; columns are sub-industries." />

      <div className="rounded-xl border border-gray-200 bg-white p-4 overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-[11px] uppercase text-gray-400">
              <th className="text-left py-2 font-semibold">Workbench</th>
              {SUBS.map((s) => <th key={s} className="text-center py-2 px-1 font-semibold">{s.replace("Lloyd's/London Market", "Lloyd's")}</th>)}
              <th className="text-right py-2 pl-2 font-semibold">Whitespace</th>
            </tr>
          </thead>
          <tbody>
            {workbenches.map((wb) => {
              const wbRow = d.by_workbench.find((r) => r.workbench === wb)!;
              return (
                <tr key={wb} className="border-t border-gray-100">
                  <td className="py-2 font-medium text-gray-800 pr-2">{wb}</td>
                  {SUBS.map((s) => {
                    const c = cell(wb, s);
                    const n = c ? num(c.n) : 0;
                    const signal = c ? num(c.n_signal) : 0;
                    return (
                      <td key={s} className="text-center py-2 px-1">
                        {n > 0 ? (
                          <div className={`inline-flex flex-col items-center justify-center w-12 h-10 rounded-lg ${
                            signal > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                            <span className="font-bold text-sm leading-none">{n}</span>
                            {signal > 0 && <span className="text-[9px] leading-none mt-0.5">{signal} sig</span>}
                          </div>
                        ) : <span className="text-gray-200">·</span>}
                      </td>
                    );
                  })}
                  <td className="py-2 pl-2 text-right text-xs font-semibold text-gray-600">{num(wbRow.n_whitespace)} accts</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-[11px] text-gray-400 mt-2">Blue = has active signal · grey = whitespace only · number = accounts where that workbench is a recommended lead.</p>
      </div>

      {/* Supply / demand */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 mt-5">
        <h3 className="font-bold text-gray-800 text-sm mb-3">Supply vs demand — addressable accounts per workbench</h3>
        <div className="space-y-2.5">
          {d.by_workbench.map((r) => (
            <div key={String(r.workbench)}>
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className="font-medium text-gray-700">{String(r.workbench)}</span>
                <span className="text-gray-400">
                  {num(r.n_accounts)} accts · {num(r.n_signal)} signal · {money(r.list_365d)}
                </span>
              </div>
              <Bar value={num(r.n_accounts)} max={maxN} className="bg-indigo-500" />
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-3">
          A workbench addressing very few accounts (e.g. Reinsurance) is over-built for the current UKI book;
          one with high whitespace and low signal is unworked runway.
        </p>
      </div>

      {/* Demo → process map */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 mt-5">
        <h3 className="font-bold text-gray-800 text-sm mb-3">Demo → business-process map</h3>
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase text-gray-400">
            <tr>
              <th className="text-left py-1.5 font-semibold">Workbench</th>
              <th className="text-left py-1.5 px-2 font-semibold">Opens on</th>
              <th className="text-left py-1.5 px-2 font-semibold">Coexists with</th>
              <th className="text-left py-1.5 font-semibold">Best fit</th>
            </tr>
          </thead>
          <tbody>
            {d.demo_map.map((r) => (
              <tr key={String(r.workbench)} className="border-t border-gray-100 align-top">
                <td className="py-1.5 font-medium text-gray-800 pr-2 whitespace-nowrap">{String(r.workbench)}</td>
                <td className="py-1.5 px-2 text-xs text-gray-600">{String(r.business_process)}</td>
                <td className="py-1.5 px-2 text-xs text-gray-500">{String(r.incumbent)}</td>
                <td className="py-1.5 text-xs text-gray-500">{String(r.best_fit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Disclaimer>
        Demo recommendations come from the plan’s per-account “lead with” calls where set, else a sub-industry
        default — a starting point for the conversation, not a scored fit model. Coexistence (never rip-and-replace)
        is the intended posture against each incumbent.
      </Disclaimer>
    </div>
  );
}
