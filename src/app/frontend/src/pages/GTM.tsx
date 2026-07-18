/**
 * GTM — go-to-market planning assets for the Bricksurance team.
 *
 * Reached from a small, deliberately non-prominent link at the bottom of the
 * Contact page. Holds the account-mapping and planning docs. These are
 * access-controlled (owner-shared, not org-wide) because they name accounts,
 * consumption and deal stages — clicking opens Google's own access control.
 */
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ExternalLink, Map, Table2, FileText, Lock } from 'lucide-react';

interface GtmDoc {
  title: string;
  sublabel: string;
  href: string;
  icon: React.ElementType;
  tag?: string;
}

const DOCS: GtmDoc[] = [
  {
    title: 'UKI Insurance — GTM Plan & Account Map',
    sublabel: 'Per-account map: AE/SA, incumbent software, live use cases, which demo to lead with, team to elevate to. Plus priority ranking and whitespace.',
    href: 'https://docs.google.com/document/d/1thPuYhOf2a2ctsZWvS2MmWpF9ZGTmRvgQaCvpke1b_0/edit',
    icon: FileText,
  },
  {
    title: 'UKI Insurance — GTM Account Map (Sheet)',
    sublabel: 'The same, sortable: Priority accounts · Whitespace · All 182 accounts · Demo map. Filter by demo, incumbent, AE or consumption.',
    href: 'https://docs.google.com/spreadsheets/d/1MsRrS_LNHbxMpuifgcmp4IQjtlu4Ozo9gigeRZ3rCd0/edit',
    icon: Table2,
  },
  {
    title: 'EMEA Insurance — GTM Plan & Account Map',
    sublabel: 'The EMEA-wide companion (ex-UK/Ireland): 511 accounts, per-country weight, priority ranking, the reinsurance cluster. Which demo fits which account.',
    href: 'https://docs.google.com/document/d/13PV3MOpUksYA8I81EN_TiMbT9CO_ry4zsyueGriPJ10/edit',
    icon: FileText,
  },
  {
    title: 'EMEA Insurance — GTM Account Map (Sheet)',
    sublabel: 'Sortable: Priority accounts · By country · All 511 accounts · Demo map. Filter by country, demo, AE or consumption.',
    href: 'https://docs.google.com/spreadsheets/d/1K8KvQEUYHsSJGJGeq4jQmc4LnSK797pnsLauHLkD6Io/edit',
    icon: Table2,
  },
];

export default function GTM() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-5">
      <Link to="/contact" className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to the team
      </Link>

      <header className="border-b border-gray-200 pb-5 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
          <Map className="w-6 h-6 text-blue-700" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">GTM planning</h1>
          <p className="text-sm text-gray-700 mt-1.5 leading-relaxed max-w-3xl">
            Where we take the workbenches, and to whom. Account maps for organising insurance
            go-to-market — which demo fits which account, the incumbent software in play, and the
            team to elevate to.
          </p>
          <p className="text-[11px] text-gray-400 mt-2 inline-flex items-center gap-1">
            <Lock className="w-3 h-3" /> Access-controlled — these name accounts and deal detail, so they open only for people they’re shared with.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3">
        {DOCS.map((d) => <DocCard key={d.title} doc={d} />)}
      </div>
    </div>
  );
}

function DocCard({ doc }: { doc: GtmDoc }) {
  const Icon = doc.icon;
  if (!doc.href) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg border border-dashed border-slate-300 bg-slate-50">
        <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-slate-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-700 inline-flex items-center gap-2">
            {doc.title}
            <span className="text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
              {doc.tag ?? 'coming soon'}
            </span>
          </div>
          <p className="text-[12px] text-slate-500 leading-snug mt-0.5">{doc.sublabel}</p>
        </div>
      </div>
    );
  }
  return (
    <a href={doc.href} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40 transition-colors group">
      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-blue-700" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-gray-900 inline-flex items-center gap-1">
          {doc.title} <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-600" />
        </div>
        <p className="text-[12px] text-gray-500 leading-snug mt-0.5">{doc.sublabel}</p>
      </div>
      <ArrowRight className="w-4 h-4 shrink-0 text-blue-600 group-hover:translate-x-1 transition-transform" />
    </a>
  );
}
