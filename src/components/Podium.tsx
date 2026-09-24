import confetti from 'canvas-confetti'
import { AnimatePresence, motion, useInView } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { PODIUM_PHOTOS } from '../lib/photos'
import { Crown } from 'lucide-react'
import { DRIVERS, fmt, type Driver } from '../lib/data'
import { Avatar, Section } from './ui'

const STEPS = [
  { idx: 1, h: 150, medal: 'var(--color-silver)', label: '2nd' },
  { idx: 0, h: 210, medal: 'var(--color-gold)', label: '1st' },
  { idx: 2, h: 110, medal: 'var(--color-bronze)', label: '3rd' },
]

export default function Podium({ onPick }: { onPick: (d: Driver) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })

  useEffect(() => {
    if (!inView) return
    const t = setTimeout(() => {
      const rect = ref.current?.getBoundingClientRect()
      const y = rect ? (rect.top + rect.height * 0.4) / window.innerHeight : 0.5
      confetti({ particleCount: 140, spread: 90, origin: { y }, colors: ['#ff2a3b', '#ffffff', '#ffc53d', '#d4ff3a'] })
    }, 1100)
    return () => clearTimeout(t)
  }, [inView])

  const fire = (d: Driver, e: React.MouseEvent) => {
    confetti({
      particleCount: 60,
      spread: 70,
      startVelocity: 35,
      origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
      colors: [d.color, '#ffffff'],
    })
    onPick(d)
  }

  return (
    <Section id="podium" kicker="Final classification" title="The Podium">
      <div ref={ref} className="flex items-end justify-center gap-2 sm:gap-6">
        {STEPS.map(({ idx, h, medal, label }, i) => {
          const d = DRIVERS[idx]
          return (
            <motion.button
              key={d.id}
              onClick={(e) => fire(d, e)}
              className="group flex w-28 flex-col items-center sm:w-56"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.2 + i * 0.15 }}
            >
              <motion.div
                className="relative mb-4 flex flex-col items-center"
                initial={{ y: -80, opacity: 0 }}
                animate={inView ? { y: 0, opacity: 1 } : {}}
                transition={{ type: 'spring', stiffness: 160, damping: 11, delay: 0.7 + (2 - idx) * 0.25 }}
                whileHover={{ y: -8, rotate: [-2, 2, 0] }}
              >
                {idx === 0 && (
                  <motion.div
                    className="absolute -top-9 text-gold"
                    animate={{ rotate: [-8, 8, -8], y: [0, -4, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Crown size={34} fill="currentColor" />
                  </motion.div>
                )}
                <div className="hidden sm:block">
                  <Avatar d={d} size={idx === 0 ? 96 : 76} ring />
                </div>
                <div className="sm:hidden">
                  <Avatar d={d} size={idx === 0 ? 60 : 48} ring />
                </div>
                <div className="mt-3 text-center text-sm leading-tight font-semibold sm:text-lg">{d.name}</div>
                <div className="font-mono text-xs text-muted">best {fmt(d.best)}</div>
              </motion.div>
              <motion.div
                className="relative w-full overflow-hidden rounded-t-xl border-t-4"
                style={{ borderColor: medal, background: `linear-gradient(180deg, ${d.color}33, #101018 70%)` }}
                initial={{ height: 0 }}
                animate={inView ? { height: h } : {}}
                transition={{ type: 'spring', stiffness: 70, damping: 14, delay: 0.3 + i * 0.1 }}
              >
                <div className="checker absolute inset-x-0 top-0 h-4 opacity-10" />
                <div className="grid h-full place-items-center font-display text-4xl sm:text-6xl" style={{ color: medal }}>
                  {label}
                </div>
                <div className="absolute inset-0 bg-white/0 transition-colors group-hover:bg-white/5" />
              </motion.div>
            </motion.button>
          )
        })}
      </div>
      <p className="mt-6 text-center font-mono text-xs text-muted">click a driver for confetti + their full dossier</p>
      <RealPodium />
    </Section>
  )
}

function RealPodium() {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setI((x) => (x + 1) % PODIUM_PHOTOS.length), 3800)
    return () => clearInterval(t)
  }, [paused])
  const p = PODIUM_PHOTOS[i]

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotateX: 25 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 70, damping: 16 }}
      className="mx-auto mt-16 max-w-4xl [perspective:1200px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-xs tracking-[0.3em] text-race uppercase">Meanwhile, in real life</span>
        <span className="font-mono text-xs text-muted tabular">
          {String(i + 1).padStart(2, '0')} / {String(PODIUM_PHOTOS.length).padStart(2, '0')}
        </span>
      </div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 bg-panel shadow-[0_40px_120px_-30px_#ff2a3b55]">
        <AnimatePresence mode="popLayout">
          <motion.img
            key={p.src}
            src={p.src}
            alt={p.alt}
            className="absolute inset-0 h-full w-full"
            style={{ objectFit: p.ratio < 1 ? 'contain' : 'cover' }}
            initial={{ opacity: 0, scale: 1.15, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1.02, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          />
        </AnimatePresence>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-5 pt-16">
          <AnimatePresence mode="wait">
            <motion.p
              key={p.caption}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="font-display text-xl uppercase sm:text-3xl"
            >
              {p.caption}
            </motion.p>
          </AnimatePresence>
        </div>
        {!paused && (
          <motion.div
            key={i}
            className="absolute top-0 left-0 h-1 bg-race"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 3.8, ease: 'linear' }}
          />
        )}
      </div>
      <div className="mt-3 flex gap-2">
        {PODIUM_PHOTOS.map((ph, k) => (
          <button
            key={ph.src}
            onClick={() => setI(k)}
            aria-label={`Show photo ${k + 1}`}
            className={`h-16 flex-1 overflow-hidden rounded-xl border-2 transition-all ${k === i ? 'border-race opacity-100' : 'border-transparent opacity-40 hover:opacity-80'}`}
          >
            <img src={ph.src} alt="" className="h-full w-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>
    </motion.div>
  )
}
