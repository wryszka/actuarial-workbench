/**
 * EMEA Replicability — the global-lead view: size a proven UKI play by
 * sub-industry, then (once endorsed) scale it across the wider EMEA book.
 *
 * The UKI side is fully data-driven. The EMEA projection is a documented
 * ESTIMATE derived from the known 511-account EMEA companion (per the GTM
 * plan) via a per-sub-industry multiplier — clearly labelled as a stub until
 * the EMEA dataset is ingested into the model. A lead can endorse a play for
 * regional scale (writeback).
 */
import { useEffect, useState } from 'react';
import { Globe2, CheckCircle2 } from 'lucide-react';
import { getJSON, num, type Row } from '../lib/api';
import { PageHeader, SubBadge, Loading, ErrorNote, Disclaimer, ExplainPanel } from '../components/ui';
import DecisionModal, { type DecisionSeed } from '../components/DecisionModal';

interface Data { plays: Row[]; }

// EMEA companion is ~511 accounts (per the GTM plan) vs 182 UKI. Until the EMEA
// data is modelled, project an indicative addressable count with a documented
// per-sub-industry multiplier (reinsurance/Lloyd's skew London-heavy in UKI, so
// EMEA multiplier is lower; Life/P&C is broader across the continent).
const EMEA_MULT: Record<string, number> = {
  'P&C': 3.2, 'Life/Pensions': 3.0, 'Broker': 2.2,
  "Lloyd's/London Market": 1.3, 'Health': 2.8, 'Reinsurance': 4.0,
};

const PLAY_BY_SUB: Record<string, string> = {
  'P&C': 'Pricing · Claims (vs WTW Radar / Earnix / Guidewire)',
  'Life/Pensions': 'LifeCast · IFRS 17 (vs FIS Prophet)',
  'Broker': 'Ontology · Data core',
  "Lloyd's/London Market": 'Underwriting · Reinsurance',
  'Health': 'Claims · Data core',
  'Reinsurance': 'Reinsurance',
};

export default function Replicability() {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState('');
  const [seed, setSeed] = useState<DecisionSeed | null>(null);
  useEffect(() => { getJSON<Data>('/api/replicability').then(setD).catch((e) => setErr(String(e))); }, []);
  if (err) return <ErrorNote msg={err} />;
  if (!d) return <Loading label="plays" />;

  return (
    <div>
      <PageHeader icon={Globe2} title="EMEA Replicability"
        subtitle="Take a play that works in UKI and size the analogous account population across the wider EMEA book — the decision that turns a territory motion into a region-wide one." />

      <ExplainPanel>
        <p>Each row is a sub-industry play (e.g. Life/Pensions → LifeCast/IFRS 17 vs FIS Prophet). The UKI columns are live from the model; the <strong>EMEA est.</strong> is an <em>indicative</em> projection = UKI account count × a documented per-sub-industry multiplier from the ~511-account EMEA companion — a planning signal, not a modelled count. “Endorse for scale” records a governed decision.</p>
      </ExplainPanel>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase text-gray-400 bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 font-semibold">Sub-industry</th>
              <th className="text-left px-2 py-2 font-semibold">The play</th>
              <th className="text-center px-2 py-2 font-semibold">UKI accts</th>
              <th className="text-center px-2 py-2 font-semibold">UKI signal</th>
              <th className="text-center px-2 py-2 font-semibold">EMEA est.*</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {d.plays.map((r) => {
              const sub = String(r.sub_industry);
              const emea = Math.round(num(r.uki_accounts) * (EMEA_MULT[sub] ?? 2.5));
              return (
                <tr key={sub} className="border-t border-gray-100">
                  <td className="px-4 py-2.5"><SubBadge sub={sub} /></td>
                  <td className="px-2 py-2.5 text-xs text-gray-600 max-w-[240px]">{PLAY_BY_SUB[sub] ?? '—'}</td>
                  <td className="px-2 py-2.5 text-center font-semibold text-gray-900">{num(r.uki_accounts)}</td>
                  <td className="px-2 py-2.5 text-center text-gray-600">{num(r.uki_signal)}</td>
                  <td className="px-2 py-2.5 text-center">
                    <span className="font-semibold text-indigo-700">~{emea}</span>
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <button onClick={() => setSeed({ account: `EMEA play · ${sub}`, action: 'endorse_play', value: PLAY_BY_SUB[sub] })}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 whitespace-nowrap">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Endorse for scale
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Disclaimer>
        <strong>* EMEA estimate is a documented stub.</strong> The UKI columns are live from the governed model.
        The EMEA figures are an <em>indicative</em> projection (UKI account count × a per-sub-industry multiplier
        derived from the ~511-account EMEA companion described in the GTM plan) — a planning signal, not a
        modelled count. Ingesting the EMEA book into <code>gtm_cockpit</code> would replace these with real numbers;
        that’s the intended next iteration. Endorsing a play records a governed decision.
      </Disclaimer>

      {seed && <DecisionModal seed={seed} onClose={() => setSeed(null)} />}
    </div>
  );
}
