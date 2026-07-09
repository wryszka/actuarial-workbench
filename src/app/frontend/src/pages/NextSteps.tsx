/**
 * NextSteps — "after the demo" page for a demo (/demo/:slug/next-steps).
 *
 * Config-driven by next-steps.ts: an intro, then phased asset cards
 * (scope → stand it up → skill up & prove it). Assets without an href render
 * as coming-soon placeholders. Same standard for every demo.
 */
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ExternalLink, Milestone, MessageSquarePlus } from 'lucide-react';
import { NEXT_STEPS, FEEDBACK_FORM_URL, type NextStepAsset } from '../lib/next-steps';
import { DEMO_PAGES } from '../lib/demo-pages';
import ContactFooter from '../components/ContactFooter';

export default function NextSteps() {
  const { slug } = useParams<{ slug: string }>();
  const steps = slug ? NEXT_STEPS[slug] : undefined;
  const demo = slug ? DEMO_PAGES[slug] : undefined;

  if (!steps || !demo || !slug) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-sm text-gray-700">
        <Link to="/" className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Workbench
        </Link>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight mt-4">No next steps yet</h2>
        <p className="mt-2 text-gray-600">Next steps haven't been published for "{slug}".</p>
      </div>
    );
  }

  return (
    <>
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <Link to={`/demo/${slug}`} className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to {demo.title}
      </Link>

      <header className="border-b border-gray-200 pb-5">
        <div className="text-[11px] uppercase tracking-widest text-blue-700 font-bold">After the demo · {demo.title}</div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mt-1">Next steps — make it real</h1>
        <p className="text-sm text-gray-700 mt-2 leading-relaxed max-w-3xl">{steps.intro}</p>
      </header>

      {steps.phases.map((phase, i) => (
        <section key={i} className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <Milestone className="w-4 h-4 text-blue-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">{phase.title}</h2>
              <p className="text-[12px] text-gray-500">{phase.blurb}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {phase.assets.map((a, j) => <AssetCard key={j} asset={a} />)}
          </div>
        </section>
      ))}

      {/* Requests & feedback — one form for everything, every page */}
      <a href={FEEDBACK_FORM_URL} target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-between gap-3 p-4 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors group">
        <div className="flex items-center gap-3">
          <MessageSquarePlus className="w-5 h-5 text-emerald-300 shrink-0" />
          <div>
            <div className="text-sm font-bold">Requests &amp; feedback</div>
            <div className="text-[12px] text-gray-300">
              Missing an asset, hit a bug, have an idea? One simple form — bug, idea, new feature or feedback.
            </div>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
      </a>

      <p className="text-[11px] text-gray-400 italic pt-1">
        Placeholders fill in as the assets are produced — use the form above if you need one sooner.
      </p>
    </div>
    <ContactFooter />
    </>
  );
}

function AssetCard({ asset }: { asset: NextStepAsset }) {
  // In-app routes go through the router; anything with a file extension (e.g.
  // /pricing-architecture.png) must be a real navigation so the server serves it.
  const internal = asset.href?.startsWith('/') && !asset.href.includes('.');
  if (!asset.href) {
    return (
      <div className="flex flex-col p-4 rounded-lg border border-dashed border-slate-300 bg-slate-50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">{asset.title}</span>
          <span className="text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
            {asset.badge ?? 'coming soon'}
          </span>
        </div>
        <p className="text-[12px] text-slate-500 leading-snug mt-1 flex-1">{asset.sublabel}</p>
      </div>
    );
  }
  const inner = (
    <>
      <div className="text-sm font-semibold text-gray-900 inline-flex items-center gap-1.5 flex-wrap">
        {asset.title} <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-600" />
        {asset.badge && (
          <span className="text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
            {asset.badge}
          </span>
        )}
      </div>
      <p className="text-[12px] text-gray-500 leading-snug mt-1 flex-1">{asset.sublabel}</p>
      <div className="text-[12px] font-bold text-blue-700 mt-2 inline-flex items-center gap-1">
        {asset.cta ?? 'Open'} <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </>
  );
  const cls = 'flex flex-col p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors group';
  return internal
    ? <Link to={asset.href} className={cls}>{inner}</Link>
    : <a href={asset.href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>;
}
