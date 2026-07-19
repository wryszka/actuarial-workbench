/**
 * My Impact over UKI — an understated coverage footprint. Compares the UK/IE
 * book against the accounts materially helped, with consumption, C-level
 * engagement (y/n) and how many times each was seen. Click an account for what
 * was done there. Deliberately factual, not a trophy case; caveats up front.
 */
import { useEffect, useState } from 'react';
import { Award, Users2 } from 'lucide-react';
import { getJSON, money, num, truthy, type AppConfig, type Row } from '../lib/api';
import { PageHeader, StatTile, SubBadge, Bar, Loading, ErrorNote, Disclaimer } from '../components/ui';
import AccountDrawer from '../components/AccountDrawer';

interface Data { book: Row; helped: Row[]; agg: Row; helped_list: Row; }

export default function Impact({ cfg }: { cfg: AppConfig | null }) {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<string | null>(null);
  useEffect(() => { getJSON<Data>('/api/impact').then(setD).catch((e) => setErr(String(e))); }, []);

  if (err) return <ErrorNote msg={err} />;
  if (!d) return <Loading label="impact" />;

  const owner = cfg?.impact_owner ?? 'Laurence Ryszka';
  const bookList = num(d.book.total_list);
  const helpedList = num(d.helped_list.helped_list);
  const maxMtg = Math.max(...d.helped.map((h) => num(h.meetings)), 1);

  return (
    <div>
      <PageHeader icon={Award} title="My Impact over UKI"
        subtitle={`${owner}'s coverage footprint across the UK & Ireland insurance book — accounts materially engaged, the consumption they represent, and where the conversation reached the C-suite. Evidence-based; understated on purpose.`} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="Accounts helped" value={num(d.agg.n_helped)}
          sub={<>of {num(d.book.n_accounts)} in the UK/IE book</>} />
        <StatTile label="Consumption touched" value={money(helpedList)} accent="text-blue-700"
          sub={<>{Math.round((helpedList / (bookList || 1)) * 100)}% of the book’s LIST $ (helped accounts in-book)</>} />
        <StatTile label="C-level engagements" value={num(d.agg.n_clevel)} accent="text-violet-700"
          sub="accounts where the conversation reached a chief / C-suite seat" />
        <StatTile label="Meetings logged" value={num(d.agg.total_meetings)}
          sub="approx across engaged accounts (~12-month window)" />
      </div>

      {/* Coverage bar: helped vs book consumption */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 mt-5">
        <h3 className="font-bold text-gray-800 text-sm mb-2">Coverage of the book’s consumption</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1"><Bar value={helpedList} max={bookList} className="bg-blue-500" /></div>
          <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">{money(helpedList)} / {money(bookList)}</span>
        </div>
        <p className="text-[11px] text-gray-400 mt-2">
          Accounts {owner} has materially engaged represent {Math.round((helpedList / (bookList || 1)) * 100)}% of the UK/IE book’s trailing consumption (counting only helped accounts that appear in the book).
        </p>
      </div>

      {/* Helped accounts */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mt-5">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
          Accounts engaged
        </div>
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase text-gray-400">
            <tr>
              <th className="text-left px-4 py-2 font-semibold">Account</th>
              <th className="text-right px-2 py-2 font-semibold">LIST</th>
              <th className="text-center px-2 py-2 font-semibold">Times seen</th>
              <th className="text-center px-2 py-2 font-semibold">C-level</th>
              <th className="text-left px-2 py-2 font-semibold">Keywords</th>
            </tr>
          </thead>
          <tbody>
            {d.helped.map((h) => {
              const acct = String(h.account);
              const isOpen = open === acct;
              return (
                <>
                  <tr key={acct} className="border-t border-gray-100 hover:bg-blue-50/40 cursor-pointer"
                    onClick={() => setOpen(isOpen ? null : acct)}>
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-gray-900">{acct}</span>
                      {h.sub_industry ? <span className="ml-2"><SubBadge sub={String(h.sub_industry)} /></span> : null}
                    </td>
                    <td className="px-2 py-2.5 text-right font-semibold text-gray-800">{h.list_365d != null ? money(h.list_365d) : <span className="text-gray-300">—</span>}</td>
                    <td className="px-2 py-2.5 text-center">
                      {h.meetings != null ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-gray-700">{num(h.meetings)}</span>
                          <span className="w-12 hidden md:inline-block"><Bar value={num(h.meetings)} max={maxMtg} className="bg-indigo-400" /></span>
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      {truthy(h.clevel)
                        ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">C-LEVEL</span>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-2 py-2.5 text-[11px] text-gray-500 max-w-[220px] truncate">{String(h.keywords)}</td>
                  </tr>
                  {isOpen && (
                    <tr key={acct + '-d'} className="bg-slate-50 border-t border-gray-100">
                      <td colSpan={5} className="px-6 py-3">
                        <p className="text-sm text-gray-700">{String(h.what)}</p>
                        {truthy(h.clevel) && h.clevel_detail ? (
                          <p className="text-xs text-violet-700 mt-1"><strong>C-level:</strong> {String(h.clevel_detail)}</p>
                        ) : null}
                        {h.note ? <p className="text-xs text-gray-500 mt-1 italic">{String(h.note)}</p> : null}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] text-gray-400">source: {String(h.source)}</span>
                          {h.sub_industry ? (
                            <button onClick={(e) => { e.stopPropagation(); setDrawer(acct); }}
                              className="text-[11px] text-blue-600 hover:underline">open account 360 →</button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      <Disclaimer>
        <strong>How to read this.</strong> “Helped” = material, evidenced engagement (built / demoed / enabled), drawn from
        the promo deck, L7 evidence pack, kudos log and a calendar/email/Slack scan. Meeting counts are approximate over a
        ~12-month window; “—” means not scanned, not zero. Consumption is LIST $ (a proxy, not billed revenue), and the
        wider EMEA cohort ({owner} works accounts beyond UK/IE — ERGO/Munich Re, Vaudoise, Linea Directa and others) is
        deliberately excluded from this UKI view. Shown to frame coverage, not to keep score.
      </Disclaimer>

      <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-500 flex items-center gap-2">
        <Users2 className="w-3.5 h-3.5 shrink-0" />
        Force-multiplier context (portfolio-wide, EMEA): the workbenches have been run by 45+ SAs/SEs at their own accounts — this view counts only {owner}’s direct UK/IE engagements.
      </div>

      {drawer && <AccountDrawer account={drawer} onClose={() => setDrawer(null)} />}
    </div>
  );
}
