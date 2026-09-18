/**
 * VideoTile — a poster tile that opens the video in a lightbox (YouTube embed),
 * with an "Open on YouTube" fallback in case the embed is CSP-blocked. Used on the
 * hub landing (intro) and on demo landing pages (client-facing walkthrough).
 */
import { useState } from 'react';
import { Play, X, ExternalLink } from 'lucide-react';

/** Extract a YouTube id from youtu.be/<id>, watch?v=<id>, or /embed/<id>. */
export function ytId(url: string | undefined): string {
  if (!url) return '';
  const m = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : '';
}

export default function VideoTile({
  youtubeId, poster, label, sublabel, className = '',
}: {
  youtubeId: string; poster: string; label: string; sublabel?: string; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const watch = `https://youtu.be/${youtubeId}`;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className={`relative rounded-2xl overflow-hidden bg-gray-900 group text-left w-full ${className}`}>
        <img src={poster} alt={label} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/25 to-gray-900/5" />
        <div className="absolute inset-x-0 bottom-0 p-4 flex items-center gap-3 text-white">
          <div className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center shrink-0 shadow group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 text-blue-700 ml-0.5" fill="currentColor" />
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-bold tracking-tight leading-tight">{label}</div>
            {sublabel && <div className="text-[12px] text-gray-200 leading-tight mt-0.5">{sublabel}</div>}
          </div>
        </div>
      </button>

      {open && (
        <div onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-4xl">
            <div className="flex items-center justify-between mb-2">
              <div className="text-white text-sm font-semibold">{label}</div>
              <button type="button" onClick={() => setOpen(false)}
                className="text-white/80 hover:text-white inline-flex items-center gap-1 text-[13px]">
                <X className="w-4 h-4" /> Close
              </button>
            </div>
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
              <iframe className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
                title={label}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen />
            </div>
            <div className="mt-2 text-center">
              <a href={watch} target="_blank" rel="noopener noreferrer"
                className="text-[12px] text-white/70 hover:text-white underline inline-flex items-center gap-1">
                Open on YouTube <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
