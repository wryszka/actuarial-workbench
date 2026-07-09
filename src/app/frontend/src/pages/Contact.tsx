/**
 * Contact — the Bricksurance team behind the workbenches.
 *
 * Reached from the "Bricksurance Team" header card. Laurence as the main
 * contact, the team members below, then executive support, weekly office
 * hours, and the go/laurence link that carries everything else.
 */
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Slack, CalendarClock, ExternalLink, ArrowRight, Boxes } from 'lucide-react';

const EMAIL = 'laurence.ryszka@databricks.com';
const SLACK_CHANNEL = '#bricksurance';
const GO_LINK = 'http://go/laurence';

interface TeamMember {
  name: string;
  title: string;
  email: string;
  photo: string;
}

const TEAM: TeamMember[] = [
  {
    name: 'Alexander Migunov',
    title: 'Sr. Solutions Engineer',
    email: 'alexander.migunov@databricks.com',
    photo: '/aleksander-migunov.png',
  },
  {
    name: 'Pinchu Ye',
    title: 'Senior Solutions Engineer',
    email: 'pinchu.ye@databricks.com',
    photo: '/pinchu-ye.png',
  },
];

const EXEC_SUPPORT: TeamMember[] = [
  {
    name: 'Marcela Granados',
    title: 'Principal, Global Head of Insurance GTM',
    email: 'marcela.granados@databricks.com',
    photo: '/marcela-granados.png',
  },
  {
    name: 'Anita Yuen',
    title: 'Manager, Field Engineering',
    email: 'anita.yuen@databricks.com',
    photo: '/anita-yuen.png',
  },
];

function MemberCard({ m }: { m: TeamMember }) {
  return (
    <a href={`mailto:${m.email}`}
      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors">
      <img src={m.photo} alt={m.name}
        className="w-14 h-14 rounded-xl object-cover shrink-0 ring-2 ring-emerald-100" />
      <div className="min-w-0">
        <div className="text-sm font-bold text-gray-900 leading-tight">{m.name}</div>
        <div className="text-[12px] text-gray-500 mt-0.5">{m.title}</div>
        <div className="text-[11px] text-emerald-700 mt-0.5 break-all inline-flex items-center gap-1">
          <Mail className="w-3 h-3 shrink-0" /> {m.email}
        </div>
      </div>
    </a>
  );
}

export default function Contact() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-5">
      <Link to="/" className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Workbench
      </Link>

      <header className="flex items-start gap-5 border-b border-gray-200 pb-5">
        <img src="/laurence.png" alt="Laurence Ryszka"
          className="w-28 h-28 rounded-2xl object-cover shrink-0 ring-2 ring-emerald-100" />
        <div className="flex-1 pt-1">
          <div className="text-[11px] uppercase tracking-widest text-emerald-700 font-bold">Questions &amp; office hours</div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mt-1">Laurence Ryszka</h1>
          <p className="text-base text-gray-500 mt-0.5">Insurance Tech Lead</p>
          <p className="text-sm text-gray-700 mt-3 leading-relaxed max-w-2xl">
            Built every workbench on this hub. Reach out to <strong>book a demo</strong>, if you
            <strong> hit an issue</strong>, want help with the <strong>first steps to stand one of these
            up in your own account</strong> — or anything at all.
          </p>
        </div>
        <img src="/bricksurance-logo.png" alt="Bricksurance"
          className="h-28 w-auto object-contain shrink-0 self-center hidden sm:block" />
      </header>

      {/* The team */}
      <section>
        <h2 className="text-base font-bold text-gray-900 mb-2.5">The team</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {TEAM.map((m) => <MemberCard key={m.email} m={m} />)}
        </div>
      </section>

      {/* Executive sponsors */}
      <section>
        <h2 className="text-base font-bold text-gray-900 mb-2.5">Executive sponsors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {EXEC_SUPPORT.map((m) => <MemberCard key={m.email} m={m} />)}
        </div>
      </section>

      {/* Office hours — the headline call to action */}
      <section className="bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-200 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <CalendarClock className="w-5 h-5 text-emerald-700" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-900">Weekly office hours</h2>
            <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">
              Every <strong>Friday at 4:00 PM UK time</strong> — open session, drop in with anything:
              a walkthrough, a question, or where to start. No agenda needed.
            </p>
          </div>
        </div>
      </section>

      {/* Direct contact rows */}
      <section className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-base font-bold text-gray-900 mb-3">Get in touch</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <a href={`mailto:${EMAIL}`}
            className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors group">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900">Email</div>
              <div className="text-[12px] text-gray-500 break-all">{EMAIL}</div>
            </div>
          </a>
          <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <Slack className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900">Slack</div>
              <div className="text-[12px] text-gray-500">Ask in {SLACK_CHANNEL} on the Databricks Slack</div>
            </div>
          </div>
        </div>

        {/* go/ link — everything else lives here */}
        <a href={GO_LINK} target="_blank" rel="noopener noreferrer"
          className="mt-3 flex items-center justify-between gap-3 p-3.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors group">
          <div className="flex items-center gap-3">
            <ExternalLink className="w-4 h-4 text-emerald-300 shrink-0" />
            <div>
              <div className="text-sm font-bold">go/laurence</div>
              <div className="text-[12px] text-gray-300">Booking link, office-hours calendar, demo catalogue and more.</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
        </a>
      </section>

      <p className="text-[11px] text-gray-400 italic text-center pt-2">
        Want one of these in your account, or a tailored version for your line of business? That's exactly what office hours are for.
      </p>

      {/* Quiet corner link to everything without a tile of its own */}
      <div className="flex justify-end">
        <Link to="/small-projects"
          className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-blue-700 transition-colors">
          <Boxes className="w-3 h-3" /> Small projects <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
