/**
 * SmallProjects — single point of entry for the demos and tools that don't
 * have a tile on the main grid. Reached from the small link under the contact
 * card in the landing header.
 *
 * Cards are grouped into one section per category (see small-projects.ts), with
 * a sticky jump bar to hop between sections. Each card leads with a KIND badge
 * so it's obvious what you're clicking into (Live app / Accelerator / …).
 */
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Boxes } from 'lucide-react';
import { projectsByCategory, KINDS, type SmallProject } from '../lib/small-projects';
import ContactFooter from '../components/ContactFooter';

export default function SmallProjects() {
  const groups = projectsByCategory();

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
            standalone demos, enablement material and tools. Each card links to the real
            assets: the app where one is deployed, the run doc, the notebooks and data in
            this workspace, and the public repo.
          </p>
        </div>
      </header>

      {/* Sticky jump bar — hop between category sections */}
      <nav className="sticky top-0 z-10 -mx-6 px-6 py-2.5 bg-white/90 backdrop-blur border-b border-gray-100 flex flex-wrap gap-1.5">
        {groups.map((g) => (
          <a key={g.id} href={`#cat-${g.id}`}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-colors">
            {g.label}
            <span className="ml-1.5 text-gray-400 font-normal">{g.projects.length}</span>
          </a>
        ))}
      </nav>

      {groups.map((g) => (
        <section key={g.id} id={`cat-${g.id}`} className="scroll-mt-16 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 flex items-center gap-3 pt-2">
            {g.label}
            <span className="flex-1 h-px bg-gray-200" />
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {g.projects.map((p, i) => <ProjectCard key={i} project={p} />)}
          </div>
        </section>
      ))}

      <p className="text-[11px] text-gray-400 italic pt-2">
        Want one of these walked through, or stood up in your workspace? Ask at office hours.
      </p>
    </div>
    <ContactFooter />
    </>
  );
}

function ProjectCard({ project }: { project: SmallProject }) {
  const kind = KINDS[project.kind];
  return (
    <div className="flex flex-col p-4 rounded-lg border border-gray-200 bg-white hover:border-blue-200 transition-colors">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded border ${kind.badge}`}>
          {kind.label}
        </span>
        <span className="text-sm font-semibold text-gray-900">{project.title}</span>
        {project.tag && (
          <span className="text-[11px] text-gray-400">· {project.tag}</span>
        )}
      </div>
      <p className="text-[12px] text-gray-500 leading-snug mt-1 flex-1">{project.description}</p>
      <div className="flex flex-wrap gap-1.5 mt-2.5">
        {project.links.map((l, i) => (
          <a key={i} href={l.href} target="_blank" rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md border transition-colors ${
              i === 0
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-500'
                : 'bg-white text-blue-700 border-blue-200 hover:border-blue-400 hover:bg-blue-50'
            }`}>
            {l.label} <ExternalLink className="w-3 h-3" />
          </a>
        ))}
      </div>
    </div>
  );
}
