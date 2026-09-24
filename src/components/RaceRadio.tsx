import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Music, Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import { SONG_LIST, radio } from '../lib/radio'

const BARS = 14

function useRadio() {
  return useSyncExternalStore(
    (fn) => radio.subscribe(fn),
    () => `${radio.playing}|${radio.song}|${radio.mood}|${radio.beat}`,
  )
}

const MOOD_LABEL = {
  green: { text: 'on the gas', color: '#1faa59' },
  yellow: { text: 'yellow · easing off', color: '#ffc53d' },
  red: { text: 'red flag · everyone stop', color: '#ff2a3b' },
  chequered: { text: 'chequered!', color: '#ffffff' },
}

export default function RaceRadio() {
  useRadio()
  const [open, setOpen] = useState(false)
  const barsRef = useRef<HTMLDivElement>(null)

  // visualiser: drive bar heights straight from the analyser
  useEffect(() => {
    if (!radio.playing) return
    const buf = new Uint8Array(32)
    let raf = 0
    const draw = () => {
      radio.levels(buf)
      const el = barsRef.current
      if (el) {
        for (let i = 0; i < BARS; i++) {
          const v = buf[i + 1] / 255
          ;(el.children[i] as HTMLElement).style.transform = `scaleY(${0.08 + v * 0.92})`
        }
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [radio.playing])

  const song = SONG_LIST[radio.song]
  const mood = MOOD_LABEL[radio.mood]

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="glass mb-3 w-72 rounded-3xl p-4 shadow-2xl"
            style={{ transformOrigin: 'bottom left' }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-[0.3em] text-race uppercase">Race Radio FM</span>
              <span className="flex items-center gap-1.5 font-mono text-[10px]" style={{ color: mood.color }}>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: mood.color }} />
                {mood.text}
              </span>
            </div>

            <div ref={barsRef} className="mb-3 flex h-14 items-end gap-1">
              {Array.from({ length: BARS }).map((_, i) => (
                <div
                  key={i}
                  className="h-full flex-1 origin-bottom rounded-t-sm transition-transform duration-75"
                  style={{
                    transform: 'scaleY(0.08)',
                    background: `linear-gradient(to top, #ff2a3b, ${i > BARS * 0.6 ? '#d4ff3a' : '#ffb020'})`,
                  }}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={song.title} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                <div className="font-display text-xl uppercase">{song.title}</div>
                <div className="font-mono text-xs text-muted">{song.vibe} · original, extremely cheesy</div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-4 flex items-center justify-center gap-4">
              <button onClick={() => radio.setSong(radio.song - 1)} className="text-muted hover:text-white" aria-label="Previous tune">
                <SkipBack size={20} />
              </button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => radio.toggle()}
                className="grid h-12 w-12 place-items-center rounded-full bg-race text-white shadow-[0_0_24px_#ff2a3b88]"
                aria-label={radio.playing ? 'Pause music' : 'Play music'}
              >
                {radio.playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
              </motion.button>
              <button onClick={() => radio.setSong(radio.song + 1)} className="text-muted hover:text-white" aria-label="Next tune">
                <SkipForward size={20} />
              </button>
            </div>
            <p className="mt-3 text-center text-[10px] text-muted">Tip: the music reacts to flags in the race replay 🚩</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => {
          if (!open && !radio.playing) radio.play()
          setOpen((o) => !o)
        }}
        animate={radio.playing ? { scale: radio.beat % 2 ? 1.08 : 1, rotate: radio.beat % 2 ? -6 : 6 } : { scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 600, damping: 15 }}
        className="relative grid h-14 w-14 place-items-center rounded-full bg-white text-ink shadow-[0_10px_40px_-5px_#ff2a3b99]"
        aria-label="Race Radio"
      >
        <Music size={24} />
        {radio.playing && (
          <span className="absolute -top-1 -right-1 h-4 w-4 animate-ping rounded-full bg-race" />
        )}
        {!radio.playing && !open && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 4 }}
            className="absolute left-16 rounded-full bg-white px-3 py-1 text-xs font-semibold whitespace-nowrap text-ink"
          >
            🎵 cheesy race tunes?
          </motion.span>
        )}
      </motion.button>
    </div>
  )
}
