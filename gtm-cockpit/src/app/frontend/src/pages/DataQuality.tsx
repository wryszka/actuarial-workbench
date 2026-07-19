/**
 * Data Quality — the dedupe queue (duplicate SFDC records that split a logo's
 * consumption/UCOs) as tracked items, plus the unassigned-signal list. Every
 * persona flagged that allocation math can't be trusted until these are fixed.
 */
import { useEffect, useState } from 'react';
import { Database, Copy, UserX } from 'lucide-react';
import { getJSON, money, num, type Row } from '../lib/api';
import { PageHeader, Loading, ErrorNote, Disclaimer, ExplainPanel } from '../components/ui';
import DecisionModal, { type DecisionSeed } from '../components/DecisionModal';

interface Data { duplicates: Row[]; coverage_gaps: Row[]; }

export default function DataQuality() {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState('');
  const [seed, setSeed] = useState<DecisionSeed | null>(null);
  useEffect(() => { getJSON<Data>('/api/data-quality').then(setD).catch((e) => setErr(String(e))); }, []);
  if (err) return <ErrorNote msg={err} />;
  if (!d) return <Loading label="data quality" />;

  return (
    <div>
      <PageHeader icon={Database} title="Data Quality"
        subtitle="The known dirt in the book, tracked. Duplicate SFDC records split a logo's consumption and use-cases across rows; unassigned-signal accounts leak coverage. Fix these before trusting allocation math." />

      <ExplainPanel>
        <p><strong>Duplicate clusters</strong> are matched from the plan's SFDC-verified list (e.g. Aviva has 5 records) — because consumption and UCOs split across them, flagship logos can read as under-invested until consolidated. <strong>Signal with no specialist</strong> repeats the coverage-gap accounts here as a data-health item. Tracking either records a governed decision; the actual SFDC merge is a sales-ops action outside this tool.</p>
      </ExplainPanel>

      <div className="rounded-xl border border-amber-200 bg-white overflow-hidden mb-5">
        <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-2">
          <Copy className="w-4 h-4" /> Duplicate-record clusters — consolidate before planning ({d.duplicates.length})
        </div>
        <table className="w-full text-sm">
          <tbody>
            {d.duplicates.map((r) => (
              <tr key={String(r.cluster)} className="border-t border-gray-100">
                <td className="px-4 py-2.5">
                  <span className="font-semibold text-gray-900">{String(r.cluster)}</span>
                  <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                    {num(r.record_count)} records
                  </span>
                  <div className="text-[11px] text-gray-400 mt-0.5 max-w-[520px]">{String(r.records)}</div>
                </td>
                <td className="px-2 py-2.5 text-right">
                  <button onClick={() => setSeed({ account: String(r.cluster), action: 'dq_flag', value: `consolidate ${num(r.record_count)} records` })}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 whitespace-nowrap">
                    Track consolidation
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
          <UserX className="w-4 h-4" /> Signal with no specialist ({d.coverage_gaps.length})
        </div>
        <table className="w-full text-sm">
          <tbody>
            {d.coverage_gaps.map((r) => (
              <tr key={String(r.account)} className="border-t border-gray-100">
                <td className="px-4 py-2 font-medium text-gray-800">{String(r.account)}</td>
                <td className="px-2 py-2 text-right text-gray-600">{money(r.list_365d)}</td>
                <td className="px-2 py-2 text-center text-xs text-gray-500">{num(r.uco_total)} UCOs</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Disclaimer>
        Duplicate clusters are matched from the plan’s SFDC-verified list (e.g. Aviva has 5 records). Because
        consumption and UCOs are split across those records, flagship logos can read as under-invested until
        consolidated. Tracking a consolidation records a governed decision; the actual SFDC merge is a sales-ops
        action outside this tool.
      </Disclaimer>

      {seed && <DecisionModal seed={seed} onClose={() => setSeed(null)} />}
    </div>
  );
}
