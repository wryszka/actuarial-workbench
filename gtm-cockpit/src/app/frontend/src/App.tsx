/**
 * UKI Insurance GTM Cockpit — shell.
 *
 * A territory operating system over the actuarial-workbench demo portfolio.
 * Left-nav switches between the persona views; each reads the governed
 * gtm_cockpit model. Reached from the actuarial-workbench hub's GTM page.
 */
import { BrowserRouter, Routes, Route, NavLink, Navigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, ShieldAlert, Rocket, Grid3x3, Globe2,
  MessagesSquare, Database, ListChecks, Building2, ArrowUpRight, Info,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Overview from './pages/Overview';
import CoverageGaps from './pages/CoverageGaps';
import Accelerator from './pages/Accelerator';
import DemoFit from './pages/DemoFit';
import Replicability from './pages/Replicability';
import Ask from './pages/Ask';
import DataQuality from './pages/DataQuality';
import Accounts from './pages/Accounts';
import AboutModal from './components/AboutModal';
import { getJSON, type AppConfig } from './lib/api';

const NAV = [
  { to: '/', label: 'Territory Overview', icon: LayoutDashboard, end: true },
  { to: '/coverage', label: 'Coverage Gaps', icon: ShieldAlert, hero: true },
  { to: '/accelerator', label: 'Accelerator Queue', icon: Rocket, hero: true },
  { to: '/demo-fit', label: 'Demo-Fit Matrix', icon: Grid3x3 },
  { to: '/replicability', label: 'EMEA Replicability', icon: Globe2 },
  { to: '/accounts', label: 'All Accounts', icon: ListChecks },
  { to: '/ask', label: 'Ask (Genie)', icon: MessagesSquare },
  { to: '/data-quality', label: 'Data Quality', icon: Database },
];

function Sidebar({ cfg, onAboutClick }: { cfg: AppConfig | null; onAboutClick: () => void }) {
  return (
    <aside className="w-60 shrink-0 bg-[#0f172a] text-gray-300 min-h-screen flex flex-col">
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2 text-white">
          <LayoutDashboard className="w-5 h-5 text-blue-400" />
          <span className="font-bold tracking-tight leading-tight">GTM Cockpit</span>
        </div>
        <p className="text-[11px] text-gray-500 mt-1">{cfg?.territory ?? 'UKI'} Insurance · {cfg?.entity_name ?? ''}</p>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'hover:bg-white/5 hover:text-white'}`}>
            <n.icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{n.label}</span>
            {n.hero && <span className="text-[9px] font-bold uppercase tracking-wider text-blue-300">hero</span>}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-white/10 space-y-2">
        <button
          onClick={onAboutClick}
          className="w-full text-left text-[11px] text-gray-500 hover:text-gray-300 inline-flex items-center gap-1.5 px-1 py-1 rounded hover:bg-white/5 transition-colors"
        >
          <Info className="w-3.5 h-3.5" /> About this demo
        </button>
        <a href="/gtm" className="text-[11px] text-gray-500 hover:text-gray-300 inline-flex items-center gap-1">
          <ArrowUpRight className="w-3 h-3" /> Back to the hub
        </a>
      </div>
    </aside>
  );
}

export default function App() {
  const [cfg, setCfg] = useState<AppConfig | null>(null);
  const [user, setUser] = useState<string | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  useEffect(() => {
    getJSON<AppConfig>('/api/config').then(setCfg).catch(() => {});
    getJSON<{ user: string }>('/api/me').then((d) => setUser(d.user)).catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <div className="flex min-h-screen bg-gray-100 font-[system-ui]">
        <Sidebar cfg={cfg} onAboutClick={() => setAboutOpen(true)} />
        <div className="flex-1 min-w-0">
          <header className="h-12 bg-white border-b border-gray-200 flex items-center px-6 gap-3">
            <Link to="/" className="text-sm font-semibold text-gray-700">UKI Insurance GTM Cockpit</Link>
            <span className="text-[11px] text-gray-400">demo · synthetic-safe internal GTM data</span>
            {user && (
              <span className="ml-auto text-xs text-gray-500 inline-flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> {user}
              </span>
            )}
          </header>
          <main className="max-w-6xl mx-auto p-6">
            <Routes>
              <Route path="/" element={<Overview cfg={cfg} />} />
              <Route path="/coverage" element={<CoverageGaps />} />
              <Route path="/accelerator" element={<Accelerator />} />
              <Route path="/demo-fit" element={<DemoFit />} />
              <Route path="/replicability" element={<Replicability />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/ask" element={<Ask cfg={cfg} />} />
              <Route path="/data-quality" element={<DataQuality />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
