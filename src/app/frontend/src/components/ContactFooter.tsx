/**
 * ContactFooter — full-width contact / office-hours band.
 *
 * Shared across the hub landing and every demo landing page: how to reach out,
 * weekly office hours, the #bricksurance Slack channel and go/laurence.
 */
import { Mail, MessagesSquare, CalendarClock, ExternalLink } from 'lucide-react';

export default function ContactFooter() {
  return (
    <footer className="mt-8 bg-[#1e293b] text-white">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-300 leading-relaxed">
            For a demo, an issue, first steps to stand one of these up — or anything at all.
            Weekly office hours every <strong className="text-white">Friday at 4:00 PM UK time</strong>.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-sm">
            <a href="mailto:laurence.ryszka@databricks.com"
              className="inline-flex items-center gap-1.5 text-gray-200 hover:text-white">
              <Mail className="w-4 h-4 text-emerald-300" /> laurence.ryszka@databricks.com
            </a>
            <span className="inline-flex items-center gap-1.5 text-gray-200">
              <MessagesSquare className="w-4 h-4 text-emerald-300" /> #bricksurance
            </span>
            <span className="inline-flex items-center gap-1.5 text-gray-200">
              <CalendarClock className="w-4 h-4 text-emerald-300" /> Fri 4:00 PM UK
            </span>
            <a href="http://go/laurence" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-emerald-300 hover:text-emerald-200">
              <ExternalLink className="w-4 h-4" /> go/laurence
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
