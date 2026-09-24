import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { useMemo, useRef, useState } from 'react'
import { Play, Shuffle } from 'lucide-react'
import { MEDIA, type MediaItem, type Tag } from '../lib/media'
import { openMedia } from './MediaViewer'
import { Chip, Section } from './ui'

const FILTERS: { key: 'all' | 'video' | Tag; label: string }[] = [
  { key: 'all', label: 'Everything' },
  { key: 'track', label: '🏎️ On track' },
  { key: 'video', label: '🎬 Videos' },
  { key: 'carnage', label: '💥 Carnage' },
  { key: 'wave', label: '👋 The wavers' },
  { key: 'overview', label: '🦅 Bird’s eye' },
  { key: 'podium', label: '🏆 Podium' },
  { key: 'paddock', label: '😂 Paddock' },
  { key: 'screen', label: '📺 Timing screen' },
]

const PAGE = 36

function Tile({ m, i, onOpen }: { m: MediaItem; i: number; onOpen: () => void }) {
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const rx = useSpring(useTransform(my, [0, 1], [8, -8]), { stiffness: 200, damping: 20 })
  const ry = useSpring(useTransform(mx, [0, 1], [-10, 10]), { stiffness: 200, damping: 20 })
  const vid = useRef<HTMLVideoElement>(null)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 120, damping: 16, delay: (i % 12) * 0.03 }}
      className="mb-3 break-inside-avoid [perspective:900px]"
    >
      <motion.button
        onClick={onOpen}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          mx.set((e.clientX - r.left) / r.width)
          my.set((e.clientY - r.top) / r.height)
        }}
        onPointerEnter={() => void vid.current?.play().catch(() => {})}
        onPointerLeave={() => {
          mx.set(0.5)
          my.set(0.5)
          vid.current?.pause()
        }}
        style={{ rotateX: rx, rotateY: ry }}
        whileHover={{ scale: 1.04, zIndex: 10 }}
        className="group relative block w-full overflow-hidden rounded-2xl bg-panel text-left shadow-[0_20px_50px_-20px_#000]"
      >
        {m.kind === 'video' ? (
          <video
            ref={vid}
            src={m.src}
            poster={m.thumb}
            muted
            loop
            playsInline
            preload="none"
            className="w-full object-cover"
            style={{ aspectRatio: `${m.w} / ${m.h}` }}
          />
        ) : (
          <img src={m.thumb} alt={m.caption} loading="lazy" className="w-full object-cover" style={{ aspectRatio: `${m.w} / ${m.h}` }} />
        )}
        {m.kind === 'video' && (
          <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 font-mono text-[10px]">
            <Play size={10} fill="currentColor" /> {m.duration}s
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/90 to-transparent p-3 pt-8 text-sm transition-transform duration-300 group-hover:translate-y-0">
          {m.caption}
        </div>
      </motion.button>
    </motion.div>
  )
}

export default function Gallery() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('all')
  const [shown, setShown] = useState(PAGE)
  const [seed, setSeed] = useState(0)

  const list = useMemo(() => {
    const base =
      filter === 'all' ? MEDIA : filter === 'video' ? MEDIA.filter((m) => m.kind === 'video') : MEDIA.filter((m) => m.tags.includes(filter))
    if (!seed) return base
    // deterministic shuffle per seed
    return [...base].sort((a, b) => ((parseInt(a.id.slice(1)) * seed) % 97) - ((parseInt(b.id.slice(1)) * seed) % 97))
  }, [filter, seed])

  const visible = list.slice(0, shown)

  return (
    <Section
      id="paddock"
      kicker={`${MEDIA.length} photos & videos from the night`}
      title="The Paddock"
      aside={
        <motion.button
          whileTap={{ scale: 0.9, rotate: 180 }}
          onClick={() => setSeed((s) => s + 7)}
          className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm hover:border-white/30"
        >
          <Shuffle size={16} /> Shuffle
        </motion.button>
      }
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count =
            f.key === 'all' ? MEDIA.length : f.key === 'video' ? MEDIA.filter((m) => m.kind === 'video').length : MEDIA.filter((m) => m.tags.includes(f.key as Tag)).length
          return (
            <Chip
              key={f.key}
              active={filter === f.key}
              onClick={() => {
                setFilter(f.key)
                setShown(PAGE)
              }}
            >
              {f.label} <span className="font-mono text-xs text-muted">{count}</span>
            </Chip>
          )
        })}
      </div>

      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
        <AnimatePresence mode="popLayout">
          {visible.map((m, i) => (
            <Tile key={m.id} m={m} i={i} onOpen={() => openMedia(list, i)} />
          ))}
        </AnimatePresence>
      </div>

      {shown < list.length && (
        <div className="mt-8 flex justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShown((s) => s + PAGE)}
            className="rounded-full bg-race px-6 py-3 font-display text-lg uppercase shadow-[0_0_30px_#ff2a3b66]"
          >
            Load another {Math.min(PAGE, list.length - shown)} 🏁
          </motion.button>
        </div>
      )}
    </Section>
  )
}
