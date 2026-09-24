import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Maximize2, Volume2, VolumeX } from 'lucide-react'
import { VIDEOS } from '../lib/media'
import { openMedia } from './MediaViewer'
import { Section } from './ui'

// A coverflow of every portrait clip. The centre one plays; neighbours fan out in 3D.
export default function TracksideTV() {
  const [i, setI] = useState(0)
  const [muted, setMuted] = useState(true)
  const [inView, setInView] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const vids = useRef<(HTMLVideoElement | null)[]>([])

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // play only the centre clip, and only while on screen
  useEffect(() => {
    vids.current.forEach((v, k) => {
      if (!v) return
      if (k === i && inView) {
        v.muted = muted
        void v.play().catch(() => {})
      } else {
        v.pause()
      }
    })
  }, [i, inView, muted])

  const go = (d: number) => setI((x) => (x + d + VIDEOS.length) % VIDEOS.length)

  return (
    <Section
      id="tv"
      kicker={`${VIDEOS.length} clips, straight off everyone’s phones`}
      title="Trackside TV"
      aside={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMuted((m) => !m)}
            className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm hover:border-white/30"
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />} {muted ? 'Sound off' : 'Sound on'}
          </button>
        </div>
      }
    >
      <div ref={wrap} className="relative h-[560px] select-none [perspective:1400px]">
        {VIDEOS.map((v, k) => {
          let off = k - i
          if (off > VIDEOS.length / 2) off -= VIDEOS.length
          if (off < -VIDEOS.length / 2) off += VIDEOS.length
          const abs = Math.abs(off)
          if (abs > 3) return null
          return (
            <motion.div
              key={v.id}
              className="absolute top-0 left-1/2 h-[520px] w-[292px] cursor-pointer"
              style={{ zIndex: 10 - abs, marginLeft: -146 }}
              animate={{
                x: off * 210,
                rotateY: off * -32,
                scale: 1 - abs * 0.12,
                opacity: abs > 2 ? 0 : 1 - abs * 0.2,
                filter: abs ? 'brightness(0.55)' : 'brightness(1)',
              }}
              transition={{ type: 'spring', stiffness: 160, damping: 22 }}
              onClick={() => (off === 0 ? openMedia(VIDEOS, k) : setI(k))}
              drag={off === 0 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.3}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) go(1)
                else if (info.offset.x > 60) go(-1)
              }}
            >
              <div className="relative h-full w-full overflow-hidden rounded-[2rem] border-[6px] border-[#1a1a24] bg-black shadow-[0_30px_80px_-20px_#000]">
                <video
                  ref={(el) => {
                    vids.current[k] = el
                  }}
                  src={v.src}
                  poster={v.thumb}
                  muted
                  loop
                  playsInline
                  preload={abs <= 1 ? 'auto' : 'none'}
                  className="h-full w-full object-cover"
                />
                {off === 0 && (
                  <>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-16">
                      <div className="font-mono text-[10px] tracking-widest text-race uppercase">
                        ● live-ish · clip {k + 1}/{VIDEOS.length}
                      </div>
                      <div className="mt-1 font-semibold">{v.caption}</div>
                    </div>
                    <span className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-black/60">
                      <Maximize2 size={14} />
                    </span>
                  </>
                )}
              </div>
            </motion.div>
          )
        })}

        <button
          onClick={() => go(-1)}
          className="absolute top-1/2 left-0 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 backdrop-blur hover:bg-white/20 sm:left-4"
          aria-label="Previous clip"
        >
          <ChevronLeft />
        </button>
        <button
          onClick={() => go(1)}
          className="absolute top-1/2 right-0 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 backdrop-blur hover:bg-white/20 sm:right-4"
          aria-label="Next clip"
        >
          <ChevronRight />
        </button>
      </div>

      <div className="scrollbar-thin mt-2 flex gap-2 overflow-x-auto pb-2">
        {VIDEOS.map((v, k) => (
          <button
            key={v.id}
            onClick={() => setI(k)}
            className={`relative h-20 w-12 shrink-0 overflow-hidden rounded-lg transition-all ${k === i ? 'ring-2 ring-race' : 'opacity-50 hover:opacity-100'}`}
            aria-label={`Clip ${k + 1}`}
          >
            <img src={v.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </Section>
  )
}
