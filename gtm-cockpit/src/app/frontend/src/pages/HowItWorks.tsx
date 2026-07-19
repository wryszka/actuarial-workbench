/**
 * How it works — the transparent rules behind every recommendation, so nothing
 * in the cockpit is a black box. Documents the demo-recommendation engine, the
 * function/persona-connection logic, the software detection, and the data
 * lineage. Also shows live examples pulled from the model.
 */
import { useEffect, useState } from 'react';
import { HelpCircle, ArrowRight } from 'lucide-react';
import { getJSON, money, num, type Row } from '../lib/api';
import { PageHeader, Loading, Disclaimer } from '../components/ui';

export default function HowItWorks() {
  const [recos, setRecos] = useState<Row[] | null>(null);
  useEffect(() => { getJSON<{ recommendations: Row[] }>('/api/recommendations').then((d) => setRecos(d.recommendations)).catch(() => setRecos([])); }, []);

  return (
    <div>
      <PageHeader icon={HelpCircle} title="How it works"
        subtitle="Nothing here is a black box. This page documents exactly how the cockpit turns raw account data into the recommendations, function tags and coverage flags you see." />

      <Section title="1 · Where the data comes from">
        <p>The cockpit reads one governed Unity Catalog schema, <code>gtm_cockpit</code>, seeded from the UKI GTM account map (compiled from Salesforce + Logfood consumption + the internal Insurance Ecosystem Mapping). The parser turns human-authored text into typed fields:</p>
        <ul className="list-disc ml-5 mt-1 space-y-0.5">
          <li><strong>Consumption</strong> — <code>LIST 365d/90d</code> parsed to numbers ($5.11M → 5,110,000). A trailing consumption <em>proxy</em>, not billed revenue.</li>
          <li><strong>Open opps</strong> — the free-text blob split into name / stage / amount / renewal-vs-new / close-date.</li>
          <li><strong>UCOs</strong> — use-case objects tagged to their U1–U6 funnel stage.</li>
          <li><strong>Contacts</strong> — titles matched to decision seats (Chief Actuary, CDO, CUO, Head of Pricing, CRO, CFO, CTO).</li>
        </ul>
        <p className="mt-1">Refreshed on demand — a maintainer re-runs the seed pipeline from the source sheet (the header shows when).</p>
      </Section>

      <Section title="2 · How a demo gets recommended (the rule)">
        <p>Each account's “lead with” demos come from a transparent rules engine. A workbench is recommended when one or more of these fire, and the <strong>why?</strong> chip everywhere lists exactly which:</p>
        <div className="mt-2 grid md:grid-cols-2 gap-2">
          <Rule badge="sub-industry fit" desc="The workbench is the default lead for the account's sub-industry (e.g. Life/Pensions → LifeCast + IFRS 17)." />
          <Rule badge="incumbent in play" desc="Software we coexist with / displace is detected (Prophet → LifeCast; Radar/Earnix → Pricing; Guidewire → Claims/Underwriting; SAS → migration)." />
          <Rule badge="persona held" desc="We hold the function's decision-maker contact (Head of Pricing → Pricing; Chief Actuary → actuarial; CUO → Underwriting)." />
          <Rule badge="matching use-case" desc="An active UCO's theme matches the function (a live pricing UCO strengthens the Pricing rec)." />
          <Rule badge="named in the plan" desc="The GTM plan explicitly called this demo for this account." />
        </div>
        <p className="mt-2 text-gray-500">Example: <em>“Meet the underwriters at Hiscox → lead with Underwriting”</em> — because it fits Lloyd's/London Market, there are active RTS Underwriting Modernisation UCOs, and the plan named it. That's the reasoning shown on the chip; no hidden score.</p>
      </Section>

      <Section title="3 · Function & 'connected' logic">
        <p>An account shows signal in a <strong>function</strong> (Pricing, Underwriting, Claims, Actuarial, Finance, Data/Platform) when its use-case themes, recommended demos, or detected software point there. We're <strong>connected</strong> to that function when we hold the relevant decision seat — otherwise it's flagged “not connected,” i.e. a persona to go find (the whole point of the Function Explorer and Conversation Pack).</p>
      </Section>

      <Section title="4 · Software detection">
        <p>The software index scans incumbent + opp + use-case text for a vocabulary of ~30 suites (WTW Radar/Tyche, Earnix, Akur8, hyperexponential, FIS Prophet, RAFM, ResQ, Igloo, Guidewire, Duck Creek, SAS, Snowflake, Synapse, Oracle, Informatica, Tableau, Python, R, …). Absence means <em>not evidenced in our data</em>, not <em>absent at the customer</em> — which is why the Conversation Pack still lists suites “worth asking about.”</p>
      </Section>

      {/* Live examples */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 mt-5">
        <h3 className="font-bold text-gray-800 text-sm mb-3">Live examples — top recommendations, with their reasons</h3>
        {!recos ? <Loading /> : (
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase text-gray-400">
              <tr>
                <th className="text-left py-1.5 font-semibold">Account</th>
                <th className="text-left py-1.5 px-2 font-semibold">Lead with</th>
                <th className="text-left py-1.5 font-semibold">Because</th>
              </tr>
            </thead>
            <tbody>
              {recos.slice(0, 15).map((r, i) => (
                <tr key={i} className="border-t border-gray-100 align-top">
                  <td className="py-1.5 font-medium text-gray-800 whitespace-nowrap">{String(r.account)}
                    <div className="text-[10px] text-gray-400">{money(r.list_365d)} · score {num(r.score)}</div>
                  </td>
                  <td className="py-1.5 px-2 text-indigo-700 font-medium whitespace-nowrap">{String(r.workbench)}</td>
                  <td className="py-1.5 text-xs text-gray-600">{String(r.reasons)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Disclaimer>
        Every recommendation, function tag and coverage flag on this site is produced by the rules above — deterministic
        and inspectable. The one exception is the Conversation Pack, which uses a Claude model to <em>write up</em> a
        briefing from these same grounded facts (it's told not to invent). Consumption is a LIST-$ proxy.
      </Disclaimer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 mb-4">
      <h3 className="font-bold text-gray-800 text-sm mb-2">{title}</h3>
      <div className="text-sm text-gray-700 leading-relaxed">{children}</div>
    </div>
  );
}

function Rule({ badge, desc }: { badge: string; desc: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-gray-100 bg-gray-50 p-2.5">
      <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
      <div>
        <span className="text-[11px] font-bold text-blue-700">{badge}</span>
        <p className="text-[11px] text-gray-600 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
