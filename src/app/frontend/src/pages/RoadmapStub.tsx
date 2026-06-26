/**
 * RoadmapStub — single page used by all roadmap / in-progress tiles.
 *
 * Each tile passes a slug. Content lives in roadmap-content.ts. The
 * "adjacent capabilities already live" links are paths inside the Solvency II
 * app, rendered as external deep links onto its configured base URL.
 */
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Compass, ExternalLink, ChevronRight, Presentation, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ROADMAP_CONTENT } from '../lib/roadmap-content';
import { TILES, DEFAULT_SOLVENCY_APP_URL } from '../lib/workbench-tiles';
import { fetchConfig } from '../lib/config';

export default function RoadmapStub() {
  const { slug } = useParams<{ slug: string }>();
  const tile = TILES.find((t) => t.slug === slug);
  const content = slug ? ROADMAP_CONTENT[slug] : undefined;

  // Base URL of the Solvency II app, for the "already-live" deep links.
  const [solvencyBase, setSolvencyBase] = useState<string>(DEFAULT_SOLVENCY_APP_URL);
  useEffect(() => {
    fetchConfig()
      .then((c) => { if (c.solvency_app_url) setSolvencyBase(c.solvency_app_url); })
      .catch(() => undefined);
  }, []);

  if (!tile || !content) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-sm text-gray-700">
        <Link to="/" className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Workbench
        </Link>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight mt-4">Roadmap entry not found</h2>
        <p className="mt-2 text-gray-600">No roadmap content for slug "{slug}".</p>
      </div>
    );
  }

  const Icon = tile.icon;
  const isInProgress = tile.status === 'in_progress';
  const deepLink = (to: string) => `${solvencyBase.replace(/\/$/, '')}${to.startsWith('/') ? to : `/${to}`}`;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-5">
      <Link to="/" className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Workbench
      </Link>

      <header className="flex items-start gap-4 border-b border-gray-200 pb-5">
        <div className={`w-14 h-14 rounded-xl ${isInProgress ? 'bg-amber-100' : 'bg-slate-100'} flex items-center justify-center shrink-0`}>
          <Icon className={`w-7 h-7 ${isInProgress ? 'text-amber-700' : 'text-slate-600'}`} />
        </div>
        <div className="flex-1 pt-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{tile.label}</h1>
            {isInProgress ? (
              <span className="text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                in progress
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 border border-slate-300">
                coming soon
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {isInProgress
              ? 'Worked example · being built right now — drop in and follow the line-by-line conversion as it lands.'
              : 'Roadmap · same platform, different workflow.'}
          </p>
        </div>
      </header>

      <section className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-base font-bold text-gray-900 mb-2">What this workflow covers</h2>
        <p className="text-sm text-gray-700 leading-relaxed">{content.what}</p>
      </section>

      {content.firstStepsDeckUrl && (
        <a href={content.firstStepsDeckUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 p-5 rounded-2xl bg-gray-900 text-white hover:bg-gray-800 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
              <Presentation className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight">First steps deck</div>
              <div className="text-[13px] text-gray-300">Where this is heading and how to get started · opens in a new tab</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" />
        </a>
      )}

      <section className="bg-gradient-to-br from-blue-50/50 to-white border border-blue-100 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-3">
          <Compass className="w-4 h-4 text-blue-700" />
          <h2 className="text-base font-bold text-gray-900">What this would look like on the platform</h2>
        </div>
        <ul className="space-y-2">
          {content.workbench_capabilities.map((c, i) => (
            <li key={i} className="text-sm text-gray-700 leading-relaxed flex items-start gap-2">
              <span className="text-blue-600 font-mono mt-0.5">·</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </section>

      {content.adjacent_links.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-base font-bold text-gray-900 mb-3">Adjacent capabilities already live</h2>
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">
            Pieces of this workflow that already exist in the Solvency II app — same model
            registry pattern, same overlay register, same audit panel. Opens in a new tab.
          </p>
          <ul className="space-y-1.5">
            {content.adjacent_links.map((l, i) => (
              <li key={i}>
                <a href={deepLink(l.to)} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-blue-700 hover:text-blue-900 inline-flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  {l.label} <ChevronRight className="w-3 h-3" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-[11px] text-gray-400 italic text-center pt-3">
        Have a workflow that should be a tile? Talk to us.
      </p>
    </div>
  );
}
