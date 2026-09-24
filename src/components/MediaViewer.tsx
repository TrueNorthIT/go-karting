import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useSyncExternalStore } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { MediaItem } from '../lib/media'

// A tiny global store so any strip, grid or card can open the viewer.
let state: { list: MediaItem[]; index: number } | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function openMedia(list: MediaItem[], index: number) {
  state = { list, index }
  emit()
}
function close() {
  state = null
  emit()
}
function nav(d: number) {
  if (!state) return
  state = { ...state, index: (state.index + d + state.list.length) % state.list.length }
  emit()
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
          <p className="mt-4 max-w-xl text-center text-lg">{item.caption}</p>
          <p className="font-mono text-xs text-muted">
            {s.index + 1} / {s.list.length}
            {item.kind === 'video' ? ` · 🎬 ${item.duration}s` : ''} · swipe or ← →
          </p>

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
