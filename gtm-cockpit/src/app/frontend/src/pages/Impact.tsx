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
  const activeList = num(d.book.active_list) || num(d.book.total_list);
  const helpedList = num(d.helped_list.helped_list);
  const maxMtg = Math.max(...d.helped.map((h) => num(h.meetings)), 1);

  return (
    <div>
      <PageHeader icon={Award} title="Laurence’s Impact"
        subtitle={`${owner}'s footprint across the UK-driven insurance book — accounts run by UK/Ireland-based AE teams (regardless of where the group is HQ'd), the consumption they represent, and where the conversation reached the C-suite (Chief Actuary counts). Evidence-based; the deck's proof, not a proposal.`} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="UK-driven accounts engaged" value={<>{num(d.agg.n_helped)} <span className="text-gray-400 text-lg">of {num(d.book.n_active)}</span></>}
          sub={`of ${num(d.book.n_active)} active consuming UK-driven accounts — insurers, brokers, MGAs & bancassurers worked directly`} />
        <StatTile label="Consumption touched" value={money(helpedList)} accent="text-blue-700"
          sub="trailing LIST $ across the engaged accounts" />
        <StatTile label="Reached the C-suite" value={num(d.agg.n_clevel)} accent="text-violet-700"
          sub="accounts where the conversation reached a chief seat (CDO, Chief Actuary, CUO, Chief Claims, COO, CTO)" />
        <StatTile label="Meetings" value={num(d.agg.total_meetings)}
          sub="approx across engaged accounts (~12-month window)" />
      </div>

      {/* Reach against the active book (the accounts we actually talk to) */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 mt-5">
        <h3 className="font-bold text-gray-800 text-sm mb-2">Consumption across the accounts {owner} has worked</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1"><Bar value={helpedList} max={Math.max(activeList, helpedList)} className="bg-blue-500" /></div>
          <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">{money(helpedList)} touched</span>
        </div>
        <p className="text-[11px] text-gray-400 mt-2">
          Set against ~{money(activeList)} of trailing consumption across the {num(d.book.n_active)} active consuming UK-driven accounts (real UK/IE-based AE, signal, live consumption).
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
        <strong>Scope + how to read this.</strong> This is the <strong>UK-driven</strong> book — accounts run by UK/Ireland-based
        AE teams even where the group is HQ'd abroad (so Allianz UK, LV=, AXA UK count; <strong>Canada Life</strong> (AMER-driven)
        and <strong>Athora</strong> (Netherlands-driven) are excluded). HSBC is included though outside the formal insurance patch —
        it's UK-driven, Asia-Life work (Global CTO). “Engaged” = material, evidenced work (built / demoed / enabled), from the
        promo deck, L7 evidence pack, kudos log and a calendar/email/Slack scan. Meeting counts are approximate calendar
        intensity (~15-month window); “—” means not scanned, not zero. Consumption is LIST $ (a proxy, not billed revenue).
        Wider EMEA/APAC wins ({owner} also works Munich Re, Tryg, Vaudoise, Linea Directa, VIG, AIA…) are deliberately out of
        this UK-driven view. This tab is the deck's evidence base — every claim traces to a source.
      </Disclaimer>

      <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-500 flex items-center gap-2">
        <Users2 className="w-3.5 h-3.5 shrink-0" />
        Force-multiplier context (portfolio-wide, EMEA): the workbenches have been run by 45+ SAs/SEs at their own accounts — this view counts only {owner}’s direct UK/IE engagements.
      </div>

      {drawer && <AccountDrawer account={drawer} onClose={() => setDrawer(null)} />}
    </div>
  );
}
