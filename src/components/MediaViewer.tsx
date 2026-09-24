import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useSyncExternalStore } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { driversIn, type MediaItem } from '../lib/media'
import { currentDriver, driverHash, openDriver } from '../lib/nav'
import { writeHash } from '../lib/url'
import ShareButton from './ShareButton'
import { LinkedText } from './DriverLink'

// A tiny global store so any strip, grid or card can open the viewer.
let state: { list: MediaItem[]; index: number } | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function openMedia(list: MediaItem[], index: number, opts: { silent?: boolean } = {}) {
  const wasOpen = !!state
  state = { list, index }
  emit()
  if (!opts.silent) writeHash(`photo/${list[index].id}`, wasOpen ? 'replace' : 'push')
}
export function closeMedia(opts: { silent?: boolean } = {}) {
  if (!state) return
  state = null
  emit()
  if (opts.silent) return
  // if a dossier is still open underneath, the URL should point back to it
  const d = currentDriver()
  writeHash(d ? driverHash(d) : null, 'replace')
}
const close = () => closeMedia()
function nav(d: number) {
  if (!state) return
  state = { ...state, index: (state.index + d + state.list.length) % state.list.length }
  emit()
  writeHash(`photo/${state.list[state.index].id}`, 'replace')
}

export default function MediaViewer() {
  const s = useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => state,
  )

  useEffect(() => {
    if (!s) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') nav(1)
      if (e.key === 'ArrowLeft') nav(-1)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [s])

  const item = s ? s.list[s.index] : null

  return (
    <AnimatePresence>
      {s && item && (
        <motion.div
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/95 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.85, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.92, rotate: 2 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.5}
              onDragEnd={(_, info) => {
                if (info.offset.x < -80) nav(1)
                else if (info.offset.x > 80) nav(-1)
              }}
              onClick={(e) => e.stopPropagation()}
              className="relative"
            >
              {item.kind === 'video' ? (
                <video
                  src={item.src}
                  poster={item.thumb}
                  autoPlay
                  controls
                  playsInline
                  className="max-h-[80vh] max-w-full rounded-2xl bg-black shadow-2xl"
                />
              ) : (
                <img src={item.src} alt={item.caption} className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl" />
              )}
            </motion.div>
          </AnimatePresence>
          {/* a name in the caption opens the dossier, so get the viewer out of the way first */}
          <p className="mt-4 max-w-xl text-center text-lg" onClickCapture={(e) => (e.target as HTMLElement).closest('button') && closeMedia({ silent: true })}>
            <LinkedText text={item.caption} />
          </p>
          {driversIn(item).length > 0 && (
            <div className="mt-1 mb-1 flex gap-2">
              {driversIn(item).map((d) => (
                <button
                  key={d.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    closeMedia({ silent: true })
                    openDriver(d)
                  }}
                  className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm hover:bg-white/25"
                  title={`Open ${d.name}'s dossier`}
                >
                  <span className="rounded bg-white px-1 font-mono text-[11px] font-bold text-ink">#{d.kart}</span>
                  <span className="underline decoration-dotted underline-offset-4" style={{ textDecorationColor: d.color }}>
                    {d.name}
                  </span>
                  →
                </button>
              ))}
            </div>
          )}
          <p className="font-mono text-xs text-muted">
            {s.index + 1} / {s.list.length}
            {item.kind === 'video' ? ` · 🎬 ${item.duration}s` : ''} · swipe or ← →
          </p>

          <div className="absolute top-4 left-4" onClick={(e) => e.stopPropagation()}>
            <ShareButton hash={`photo/${item.id}`} title={item.caption} />
          </div>
          <button onClick={close} className="absolute top-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Close">
            <X />
          </button>
          {s.list.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  nav(-1)
                }}
                className="absolute top-1/2 left-3 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20 sm:grid"
                aria-label="Previous"
              >
                <ChevronLeft />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  nav(1)
                }}
                className="absolute top-1/2 right-3 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20 sm:grid"
                aria-label="Next"
              >
                <ChevronRight />
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
