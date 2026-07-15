/**
 * Actuarial Workbench hub — standalone launcher.
 *
 * Two routes only: the tile landing (/) and the roadmap stub (/roadmap/:slug).
 * No sidebar, no operational pages — every live workflow is its own deployed
 * app that the tiles open. This app is purely the front door.
 */
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Building2, LayoutGrid } from 'lucide-react';
import { useEffect, useState } from 'react';
import Workbench from './pages/Workbench';
import RoadmapStub from './pages/RoadmapStub';
import AcceleratorDetail from './pages/AcceleratorDetail';
import Contact from './pages/Contact';
import DemoLanding from './pages/DemoLanding';
import NextSteps from './pages/NextSteps';
import SmallProjects from './pages/SmallProjects';
import Usage from './pages/Usage';

function SignedInUser() {
  const [user, setUser] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => setUser(d.user || null))
      .catch(() => setUser(null));
  }, []);
  if (!user) return null;
  return (
    <Link to="/usage" title={`${user} — view usage`}
      className="text-xs text-gray-400 hover:text-white transition-colors truncate max-w-[200px] inline-flex items-center gap-1.5">
      <Building2 className="w-3.5 h-3.5 shrink-0" />
      {user}
    </Link>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-10 bg-[#1e293b] text-white border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <LayoutGrid className="w-5 h-5 text-blue-400 shrink-0" />
          <span className="text-base font-bold tracking-tight">Actuarial Workbench</span>
        </Link>
        <div className="ml-auto">
          <SignedInUser />
        </div>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100 font-[system-ui]">
        <TopBar />
        <main>
          <Routes>
            <Route path="/" element={<Workbench />} />
            <Route path="/sas-migration" element={<AcceleratorDetail slug="sas-migration" />} />
            <Route path="/excel-migration" element={<AcceleratorDetail slug="excel-migration" />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/small-projects" element={<SmallProjects />} />
            <Route path="/usage" element={<Usage />} />
            <Route path="/demo/:slug" element={<DemoLanding />} />
            <Route path="/demo/:slug/next-steps" element={<NextSteps />} />
            <Route path="/roadmap/:slug" element={<RoadmapStub />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
