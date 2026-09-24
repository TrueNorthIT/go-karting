import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Pause, Play, SkipBack, SkipForward, X } from 'lucide-react'
import { MEDIA, byId, withTag, type MediaItem } from '../lib/media'
import { radio, type Mood } from '../lib/radio'

// ---- open/close from anywhere ----
let open = false
const subs = new Set<() => void>()
export function startMovieNight() {
  open = true
  subs.forEach((s) => s())
}
function stop() {
  open = false
  subs.forEach((s) => s())
}

type Slide = { type: 'title'; act: string; title: string; sub: string; mood: Mood } | { type: 'media'; m: MediaItem; mood: Mood }

function buildReel(): Slide[] {
  const used = new Set<string>()
  const take = (items: MediaItem[], n: number) => {
    const out = items.filter((m) => !used.has(m.id)).slice(0, n)
    out.forEach((m) => used.add(m.id))
    return out
  }
  const track = MEDIA.filter((m) => m.tags.includes('track') && !m.tags.includes('overview'))
  const photosOnly = (a: MediaItem[]) => a.filter((m) => m.kind === 'photo')
  const clips = (a: MediaItem[]) => a.filter((m) => m.kind === 'video')

  const act1 = [byId('m001'), byId('m003'), ...take(withTag('overview'), 3), ...take(photosOnly(track), 8), ...take(clips(track), 2)]
  const act2 = [...take(withTag('carnage'), 12), ...take(withTag('screen'), 2)]
  const act3 = [...take(withTag('wave'), 6), ...take(photosOnly(track), 8), ...take(clips(track), 2)]
  const act4 = [byId('m002'), byId('m007'), byId('m006'), byId('m005'), byId('m004')]

  const media = (a: MediaItem[], mood: Mood): Slide[] => a.map((m) => ({ type: 'media', m, mood }))
  return [
    { type: 'title', act: 'Act I', title: 'Lights Out', sub: 'Heat 48 · 19:30 · fifteen very confident drivers', mood: 'green' },
    ...media(act1, 'green'),
    { type: 'title', act: 'Act II', title: 'Red Flag', sub: 'five of them, in fact', mood: 'red' },
    ...media(act2, 'red'),
    { type: 'title', act: 'Act III', title: 'The Wavers', sub: 'hands on the wheel, please', mood: 'yellow' },
    ...media(act3, 'green'),
    { type: 'title', act: 'Act IV', title: 'Glory', sub: 'and one photobomb', mood: 'chequered' },
    ...media(act4, 'green'),
  ]
}

const PHOTO_MS = 3200
const TITLE_MS = 2600
const CLIP_MS = 7000

export default function MovieNight() {
  const isOpen = useSyncExternalStore(
    (fn) => {
      subs.add(fn)
      return () => subs.delete(fn)
    },
    () => open,
  )
  const reel = useMemo(buildReel, [])
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const timer = useRef(0)
  const radioWasPlaying = useRef(false)

  const slide = reel[i]
  const dur = slide.type === 'title' ? TITLE_MS : slide.m.kind === 'video' ? Math.min(CLIP_MS, (slide.m.duration ?? 5) * 1000) : PHOTO_MS

  // start: music on, from the top
  useEffect(() => {
    if (!isOpen) return
    setI(0)
    setPaused(false)
    radioWasPlaying.current = radio.playing
    radio.setSong(0)
    radio.play()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
      radio.setMood('green')
      if (!radioWasPlaying.current) radio.stop()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    radio.setMood(slide.mood)
  }, [isOpen, slide.mood])

  useEffect(() => {
    if (!isOpen || paused) return
    timer.current = window.setTimeout(() => {
      if (i < reel.length - 1) setI(i + 1)
      else setPaused(true)
    }, dur)
    return () => clearTimeout(timer.current)
  }, [isOpen, paused, i, dur, reel.length])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stop()
      if (e.key === 'ArrowRight') setI((x) => Math.min(x + 1, reel.length - 1))
      if (e.key === 'ArrowLeft') setI((x) => Math.max(x - 1, 0))
      if (e.key === ' ') {
        e.preventDefault()
        setPaused((p) => !p)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, reel.length])

  const kb = i % 4 // Ken Burns direction

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[80] overflow-hidden bg-black"
          initial={{ opacity: 0, scale: 1.15 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <AnimatePresence mode="popLayout">
            <motion.div
              key={i}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              {slide.type === 'title' ? (
                <div className="grid h-full place-items-center bg-ink">
                  <div className="checker absolute inset-x-0 top-0 h-6 opacity-80" />
                  <div className="checker absolute inset-x-0 bottom-0 h-6 opacity-80" />
                  <div className="text-center">
                    <motion.div
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="font-mono text-sm tracking-[0.5em] text-race uppercase"
                    >
                      {slide.act}
                    </motion.div>
                    <motion.h2
                      initial={{ scale: 2.5, opacity: 0, rotate: -8 }}
                      animate={{ scale: 1, opacity: 1, rotate: -3 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.15 }}
                      className={`font-display text-7xl uppercase sm:text-9xl ${slide.mood === 'red' ? 'text-race' : slide.mood === 'yellow' ? 'text-[#ffc53d]' : 'text-white'}`}
                    >
                      {slide.title}
                    </motion.h2>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-4 text-lg text-muted">
                      {slide.sub}
                    </motion.p>
                  </div>
                </div>
              ) : (
                <>
                  {/* blurred fill so portrait shots fill a landscape screen */}
                  <img src={slide.m.thumb} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl" />
                  <div className="absolute inset-0 grid place-items-center overflow-hidden">
                    {slide.m.kind === 'video' ? (
                      <video src={slide.m.src} autoPlay muted playsInline className="max-h-full max-w-full shadow-2xl" />
                    ) : (
                      <motion.img
                        src={slide.m.src}
                        alt={slide.m.caption}
                        className="max-h-full max-w-full shadow-2xl"
                        initial={{ scale: 1.12, x: kb % 2 ? 30 : -30, y: kb > 1 ? 20 : -20 }}
                        animate={{ scale: 1, x: 0, y: 0 }}
                        transition={{ duration: dur / 1000 + 0.6, ease: 'linear' }}
                      />
                    )}
                  </div>
                  {slide.mood === 'red' && <div className="pointer-events-none absolute inset-0 bg-race/10 mix-blend-multiply" />}
                  <motion.div
                    initial={{ x: -60, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="absolute bottom-16 left-4 max-w-lg -rotate-1 rounded-xl bg-black/75 px-4 py-2 text-lg backdrop-blur sm:left-8 sm:text-2xl"
                  >
                    {slide.m.caption}
                  </motion.div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* HUD */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
            <div className="rounded-full bg-black/60 px-3 py-1 font-mono text-xs tracking-widest text-white/80 uppercase backdrop-blur">
              🎬 Movie Night · {i + 1}/{reel.length}
            </div>
            <button onClick={stop} className="grid h-11 w-11 place-items-center rounded-full bg-black/60 backdrop-blur hover:bg-white/20" aria-label="Exit movie night">
              <X />
            </button>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent p-4">
            <button onClick={() => setI((x) => Math.max(x - 1, 0))} aria-label="Previous" className="text-white/70 hover:text-white">
              <SkipBack size={20} />
            </button>
            <button
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? 'Play' : 'Pause'}
              className="grid h-10 w-10 place-items-center rounded-full bg-race"
            >
              {paused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
            </button>
            <button onClick={() => setI((x) => Math.min(x + 1, reel.length - 1))} aria-label="Next" className="text-white/70 hover:text-white">
              <SkipForward size={20} />
            </button>
            <div className="flex h-1.5 flex-1 gap-[2px]">
              {reel.map((s, k) => (
                <button
                  key={k}
                  onClick={() => setI(k)}
                  className="relative h-full flex-1 overflow-hidden rounded-full"
                  style={{ background: s.type === 'title' ? '#ffffff55' : '#ffffff22' }}
                  aria-label={`Slide ${k + 1}`}
                >
                  {k < i && <span className="absolute inset-0 bg-white" />}
                  {k === i && (
                    <motion.span
                      key={`${i}-${paused}`}
                      className="absolute inset-y-0 left-0 bg-race"
                      initial={{ width: '0%' }}
                      animate={{ width: paused ? '0%' : '100%' }}
                      transition={{ duration: dur / 1000, ease: 'linear' }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
