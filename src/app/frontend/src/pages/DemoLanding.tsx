/**
 * DemoLanding — the standard demo page: tile → here → app / docs / videos.
 *
 * One component for every demo, driven by demo-pages.ts. Renders the
 * Open-demo card, the run doc, client-facing + Databricks-internal video
 * placeholders, and a note about the in-app Learn section.
 */
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, ExternalLink, Rocket, FileText, Clapperboard,
  GraduationCap, BookOpen, MonitorPlay, Milestone, Presentation,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { DEMO_PAGES, type DemoChoice } from '../lib/demo-pages';
import { TILES } from '../lib/workbench-tiles';
import { NEXT_STEPS } from '../lib/next-steps';
import { fetchConfig, type HubConfig } from '../lib/config';
import ContactFooter from '../components/ContactFooter';

export default function DemoLanding() {
  const { slug } = useParams<{ slug: string }>();
  const demo = slug ? DEMO_PAGES[slug] : undefined;

  const [cfg, setCfg] = useState<HubConfig | null>(null);
  useEffect(() => { fetchConfig().then(setCfg).catch(() => undefined); }, []);

  if (!demo) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-sm text-gray-700">
        <Link to="/" className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Workbench
        </Link>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight mt-4">Demo not found</h2>
        <p className="mt-2 text-gray-600">No demo page for "{slug}".</p>
      </div>
    );
  }

  const appUrl =
    (demo.appUrlKey && cfg?.[demo.appUrlKey]) || demo.appUrlFallback || '';

  return (
    <>
    <div className="max-w-5xl mx-auto p-6 space-y-5">
      <Link to="/" className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Workbench
      </Link>

      <header className="border-b border-gray-200 pb-5">
        {demo.subtitle && (
          <div className="text-[11px] uppercase tracking-widest text-blue-700 font-bold">{demo.subtitle}</div>
        )}
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mt-1">{demo.title}</h1>
        <p className="text-sm text-gray-700 mt-2 leading-relaxed max-w-3xl">{demo.blurb}</p>
        {TILES.find((t) => t.slug === slug)?.status === 'in_progress' && (
          <p className="text-sm font-semibold text-red-600 mt-2">This is not tested with clients yet.</p>
        )}
      </header>

      {/* Two-choice layout: some demos offer more than one worked example.
          The `primary` choice is the flagship — wide and dark; others compact. */}
      {demo.choices?.length ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          {demo.choices.map((c) => <ChoiceCard key={c.title} choice={c} />)}
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {appUrl && demo.previewImage ? (
          <a href={appUrl} target="_blank" rel="noopener noreferrer"
            className="relative rounded-2xl overflow-hidden bg-gray-900 group min-h-[15rem]">
            <img src={demo.previewImage} alt={`${demo.title} demo`}
              className="absolute inset-0 w-full h-full object-cover object-left-top" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-gray-900/10" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-500/30 backdrop-blur flex items-center justify-center shrink-0">
                <Rocket className="w-6 h-6 text-blue-200" />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-bold tracking-tight">Open demo</div>
                <div className="text-[12px] text-gray-200">The running app — opens in a new tab</div>
              </div>
              <ArrowRight className="w-5 h-5 ml-auto shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>
        ) : appUrl ? (
          <a href={appUrl} target="_blank" rel="noopener noreferrer"
            className="rounded-2xl bg-gray-900 text-white hover:bg-gray-800 transition-colors group p-6 flex flex-col justify-between min-h-[15rem]">
            <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Rocket className="w-7 h-7 text-blue-300" />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight">Open demo</div>
              <div className="text-sm text-gray-300 mt-1">The running app — opens in a new tab.</div>
              <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-blue-300">
                Launch <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </a>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 flex items-center justify-center text-sm text-slate-500 min-h-[15rem]">
            App URL not configured for this workspace.
          </div>
        )}

        {/* Right: smaller resource tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {demo.deckUrl && (
            <ResourceCard
              icon={Presentation} title={demo.deckLabel ?? 'First steps deck'}
              sublabel={demo.deckSublabel ?? 'Where this is heading and how to get started'}
              href={demo.deckUrl} cta="Open" />
          )}
          <ResourceCard
            icon={FileText} title="Demo run doc"
            sublabel="Step-by-step guide to running this demo"
            href={demo.runDocUrl} cta="Open doc" />
          <ResourceCard
            icon={Clapperboard} title="Client-facing demo"
            sublabel="Polished walkthrough video for customers"
            href={demo.clientVideoUrl} cta="Watch" />
          {!demo.hideTrainingCards && (
            <>
              <ResourceCard
                icon={GraduationCap} title="Learn how to run this"
                sublabel="Databricks-internal — deliver it end to end"
                href={demo.internalVideoUrl} cta="Watch" />
              <ResourceCard
                icon={MonitorPlay} title={`SME training — ${demo.title}`}
                sublabel="Subject-matter-expert walkthrough of the process"
                href={demo.smeVideoUrl} cta="Watch" />
            </>
          )}
        </div>
      </div>
      )}

      {/* After the demo — GTM next steps (only when published for this demo) */}
      {slug && NEXT_STEPS[slug] && (
        <Link to={`/demo/${slug}/next-steps`}
          className="flex items-center justify-between gap-3 p-5 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-600 text-white hover:from-blue-600 hover:to-blue-500 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Milestone className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight">After the demo — next steps</div>
              <div className="text-[13px] text-blue-100">Make it real in your estate: scoping workshop, reference architecture, the code, training path, POC plan.</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}

      {/* In-app Learn note */}
      {demo.learnInApp && (
        <section className="bg-gradient-to-br from-blue-50/60 to-white border border-blue-100 rounded-lg p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-blue-700" />
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            <strong>There’s a full Learn section inside the demo itself.</strong> Open the demo and look
            for <em>Learn</em> in the navigation — the concepts, glossary and walkthrough live there,
            kept in step with what the app shows.
          </p>
        </section>
      )}
    </div>
    <ContactFooter />
    </>
  );
}

function ChoiceCard({ choice }: { choice: DemoChoice }) {
  if (choice.primary) {
    // The flagship: wide (2/3), dark, unmissable.
    return (
      <div className="lg:col-span-2 rounded-2xl bg-gray-900 text-white p-7 flex flex-col gap-3">
        <div className="self-start rounded-full bg-blue-500/20 px-3 py-1 text-[12px] uppercase tracking-widest text-blue-200 font-bold">
          {choice.sublabel}
        </div>
        <div className="text-2xl font-bold tracking-tight">{choice.title}</div>
        <p className="text-[15px] text-gray-300 leading-relaxed flex-1">{choice.description}</p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <a href={choice.appUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 transition-colors">
            <Rocket className="w-4 h-4" /> {choice.appLabel ?? 'Open'}
          </a>
          {choice.runDocUrl && (
            <a href={choice.runDocUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/25 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
              <FileText className="w-4 h-4 text-blue-300" /> Run doc
            </a>
          )}
          {choice.deckUrl && (
            <a href={choice.deckUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/25 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
              <Presentation className="w-4 h-4 text-blue-300" /> First steps deck
            </a>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col gap-2.5 hover:border-blue-300 transition-colors">
      <div className="self-start rounded-full bg-blue-50 px-3 py-1 text-[11px] uppercase tracking-widest text-blue-700 font-bold">
        {choice.sublabel}
      </div>
      <div className="text-lg font-bold text-gray-900 tracking-tight">{choice.title}</div>
      <p className="text-[13px] text-gray-600 leading-relaxed flex-1">{choice.description}</p>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <a href={choice.appUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-[13px] font-bold hover:bg-gray-800 transition-colors">
          <Rocket className="w-3.5 h-3.5" /> {choice.appLabel ?? 'Open'}
        </a>
        {choice.runDocUrl && (
          <a href={choice.runDocUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-[13px] font-semibold text-gray-800 hover:border-blue-400 hover:bg-blue-50/40 transition-colors">
            <FileText className="w-3.5 h-3.5 text-blue-700" /> Run doc
          </a>
        )}
        {choice.deckUrl && (
          <a href={choice.deckUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-[13px] font-semibold text-gray-800 hover:border-blue-400 hover:bg-blue-50/40 transition-colors">
            <Presentation className="w-3.5 h-3.5 text-blue-700" /> Deck
          </a>
        )}
      </div>
    </div>
  );
}

function ResourceCard({ icon: Icon, title, sublabel, href, cta }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string; sublabel: string; href?: string; cta: string;
}) {
  if (!href) {
    // Placeholder — not produced yet.
    return (
      <div className="flex items-start gap-3 p-4 rounded-lg border border-dashed border-slate-300 bg-slate-50">
        <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-slate-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700">{title}</span>
            <span className="text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
              coming soon
            </span>
          </div>
          <div className="text-[12px] text-slate-500 leading-snug mt-0.5">{sublabel}</div>
        </div>
      </div>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors group">
      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-blue-700" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-gray-900 inline-flex items-center gap-1">
          {title} <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-600" />
        </div>
        <div className="text-[12px] text-gray-500 leading-snug mt-0.5">{sublabel}</div>
        <div className="text-[12px] font-bold text-blue-700 mt-1 inline-flex items-center gap-1">
          {cta} <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </a>
  );
}
