import { motion } from 'motion/react'
import type { MediaItem } from '../lib/media'
import { openMedia } from './MediaViewer'

// Two rows of thumbnails drifting in opposite directions. Hover pauses; click opens.
export default function PhotoStrip({ items, tilt = -2 }: { items: MediaItem[]; tilt?: number }) {
  const half = Math.ceil(items.length / 2)
  const rows = [items.slice(0, half), items.slice(half)]

  return (
    <div className="relative overflow-hidden py-6" style={{ transform: `rotate(${tilt}deg) scale(1.04)` }}>
      {rows.map((row, r) => (
        <div key={r} className="group flex w-max gap-3 py-1.5">
          <motion.div
            className="flex gap-3 group-hover:[animation-play-state:paused]"
            style={{ animation: `marquee ${row.length * 3.2}s linear infinite ${r ? 'reverse' : ''}` }}
          >
            {[...row, ...row].map((m, i) => (
              <button
                key={`${m.id}-${i}`}
                onClick={() => openMedia(row, i % row.length)}
                className="relative h-32 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10 transition-transform hover:z-10 hover:scale-110 sm:h-40"
                style={{ aspectRatio: `${m.w} / ${m.h}` }}
                aria-label={m.caption}
              >
                <img src={m.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
                {m.kind === 'video' && <span className="absolute top-1.5 left-1.5 rounded-full bg-black/70 px-1.5 text-[10px]">▶</span>}
              </button>
            ))}
          </motion.div>
        </div>
      ))}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-ink to-transparent" />
    </div>
  )
}
