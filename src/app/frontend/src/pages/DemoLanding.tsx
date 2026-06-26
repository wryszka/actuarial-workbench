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
  GraduationCap, BookOpen,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { DEMO_PAGES } from '../lib/demo-pages';
import { fetchConfig, type HubConfig } from '../lib/config';

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
    <div className="max-w-4xl mx-auto p-6 space-y-5">
      <Link to="/" className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Workbench
      </Link>

      <header className="border-b border-gray-200 pb-5">
        {demo.subtitle && (
          <div className="text-[11px] uppercase tracking-widest text-blue-700 font-bold">{demo.subtitle}</div>
        )}
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mt-1">{demo.title}</h1>
        <p className="text-sm text-gray-700 mt-2 leading-relaxed max-w-3xl">{demo.blurb}</p>
      </header>

      {/* Open demo — the primary action */}
      {appUrl && (
        <a href={appUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 p-5 rounded-2xl bg-gray-900 text-white hover:bg-gray-800 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
              <Rocket className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight">Open demo</div>
              <div className="text-[13px] text-gray-300">The running app · opens in a new tab</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" />
        </a>
      )}

      {/* Resources */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {demo.runDocUrl && (
          <ResourceCard
            icon={FileText} title="Demo run doc"
            sublabel="Step-by-step guide to running this demo"
            href={demo.runDocUrl} cta="Open doc" />
        )}
        <ResourceCard
          icon={Clapperboard} title="Client-facing demo"
          sublabel="Polished walkthrough video for customer audiences"
          href={demo.clientVideoUrl} cta="Watch" />
        <ResourceCard
          icon={GraduationCap} title="Learn how to run this"
          sublabel="Databricks-internal — how to deliver the demo end to end"
          href={demo.internalVideoUrl} cta="Watch" />
      </div>

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
