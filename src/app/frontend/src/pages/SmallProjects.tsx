/**
 * SmallProjects — single point of entry for the demos and tools that don't
 * have a tile on the main grid. Reached from the small link under the contact
 * card in the landing header.
 */
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ExternalLink, Boxes } from 'lucide-react';
import { SMALL_PROJECTS, type SmallProject } from '../lib/small-projects';
import ContactFooter from '../components/ContactFooter';

export default function SmallProjects() {
  return (
    <>
    <div className="max-w-5xl mx-auto p-6 space-y-5">
      <Link to="/" className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Workbench
      </Link>

      <header className="border-b border-gray-200 pb-5 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
          <Boxes className="w-6 h-6 text-blue-700" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Small projects</h1>
          <p className="text-sm text-gray-700 mt-1.5 leading-relaxed max-w-3xl">
            Everything built around the workbenches that doesn't have a tile of its own —
            standalone demos, enablement material and tools. Public ones link to their repo;
            the rest are available on request.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SMALL_PROJECTS.map((p, i) => <ProjectCard key={i} project={p} />)}
      </div>

      <p className="text-[11px] text-gray-400 italic pt-2">
        Want one of these walked through, or stood up in your workspace? Ask at office hours.
      </p>
    </div>
    <ContactFooter />
    </>
  );
}

function ProjectCard({ project }: { project: SmallProject }) {
  const inner = (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-gray-900">{project.title}</span>
        {project.tag && (
          <span className="text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
            {project.tag}
          </span>
        )}
        {!project.href && (
          <span className="text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
            {project.badge ?? 'on request'}
          </span>
        )}
      </div>
      <p className="text-[12px] text-gray-500 leading-snug mt-1 flex-1">{project.description}</p>
      {project.href && (
        <div className="text-[12px] font-bold text-blue-700 mt-2 inline-flex items-center gap-1">
          GitHub <ExternalLink className="w-3 h-3" />
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      )}
    </>
  );
  if (!project.href) {
    return <div className="flex flex-col p-4 rounded-lg border border-dashed border-slate-300 bg-slate-50">{inner}</div>;
  }
  return (
    <a href={project.href} target="_blank" rel="noopener noreferrer"
      className="flex flex-col p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors group">
      {inner}
    </a>
  );
}
