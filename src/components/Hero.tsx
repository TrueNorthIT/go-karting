import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react'
import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { DRIVERS, FASTEST, RACE, SLOWEST_LAP, TOTAL_LAPS, fmt } from '../lib/data'
import { Avatar, CountUp } from './ui'
import { HERO_VIDEO, MEDIA, SQUAD } from '../lib/media'
import { startMovieNight } from './MovieNight'
import { Clapperboard } from 'lucide-react'

function StartLights({ onDone }: { onDone: () => void }) {
  const [lit, setLit] = useState(0)
  const [out, setOut] = useState(false)

  useEffect(() => {
    const timers: number[] = []
    for (let i = 1; i <= 5; i++) timers.push(window.setTimeout(() => setLit(i), i * 420))
    timers.push(window.setTimeout(() => setOut(true), 5 * 420 + 700))
    timers.push(window.setTimeout(onDone, 5 * 420 + 1300))
    return () => timers.forEach(clearTimeout)
  }, [onDone])

  return (
    <motion.div
      className="fixed inset-0 z-[100] grid cursor-pointer place-items-center bg-ink"
      exit={{ opacity: 0, scale: 1.2, filter: 'blur(12px)' }}
      transition={{ duration: 0.5 }}
      onClick={onDone}
    >
      <div className="flex flex-col items-center gap-10">
        <div className="flex gap-3 rounded-2xl border border-line bg-black p-4 sm:gap-5 sm:p-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col gap-3 rounded-lg bg-[#15151c] p-2 sm:p-3">
              {[0, 1].map((row) => {
                const on = lit >= i && !out
                return (
                  <motion.div
                    key={row}
                    className="h-9 w-9 rounded-full sm:h-14 sm:w-14"
                    animate={{
                      backgroundColor: on ? '#ff2a3b' : '#2a0a0e',
                      boxShadow: on ? '0 0 30px #ff2a3b, 0 0 60px #ff2a3b88' : '0 0 0 transparent',
                    }}
                    transition={{ duration: 0.08 }}
                  />
                )
              })}
            </div>
          ))}
        </div>
        <motion.p
          className="font-display text-2xl tracking-widest uppercase sm:text-4xl"
          animate={{ color: out ? '#d4ff3a' : '#8b8ba3', scale: out ? 1.3 : 1 }}
        >
          {out ? 'Lights out!' : 'Get ready…'}
        </motion.p>
        <p className="font-mono text-xs text-muted">tap to skip</p>
      </div>
    </motion.div>
  )
}

export default function Hero() {
  const [intro, setIntro] = useState(true)
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 600], [0, 200])
  const opacity = useTransform(scrollY, [0, 500], [1, 0])
  const photoY = useTransform(scrollY, [0, 800], [0, 260])
  const photoScale = useTransform(scrollY, [0, 800], [1.08, 1.25])
  const podium = DRIVERS.slice(0, 3)

  const stats = [
    { label: 'Drivers', value: DRIVERS.length, f: (n: number) => Math.round(n).toString() },
    { label: 'Laps driven', value: TOTAL_LAPS, f: (n: number) => Math.round(n).toString() },
    { label: 'Fastest lap', value: FASTEST.best, f: (n: number) => n.toFixed(3) },
    { label: 'Slowest lap', value: SLOWEST_LAP, f: (n: number) => fmt(n, 1) },
  ]

  return (
    <>
      <AnimatePresence>{intro && <StartLights onDone={() => setIntro(false)} />}</AnimatePresence>

      <header className="relative flex min-h-[100svh] items-center overflow-hidden">
        <motion.div className="absolute inset-0" style={{ y: photoY, scale: photoScale }}>
          <motion.img
            src={SQUAD.src}
            alt=""
            className="h-full w-full object-cover object-[50%_60%] grayscale"
            initial={{ opacity: 0, scale: 1.2 }}
            animate={intro ? {} : { opacity: 0.45, scale: 1 }}
            transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/60" />
        <div className="absolute inset-0 bg-race/10 mix-blend-color" />
        <div className="grid-bg absolute inset-0" />
        <motion.div
          className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-race/30 blur-[140px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-volt/10 blur-[140px]"
          animate={{ scale: [1.2, 1, 1.2] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        {/* speed lines */}
        {Array.from({ length: 14 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
            style={{ top: `${5 + i * 7}%`, width: `${20 + ((i * 37) % 30)}%` }}
            initial={{ x: '-100vw' }}
            animate={{ x: '120vw' }}
            transition={{ duration: 1.2 + ((i * 13) % 10) / 10, repeat: Infinity, delay: (i * 0.37) % 3, ease: 'linear' }}
          />
        ))}

        <motion.div style={{ y, opacity }} className="relative mx-auto w-full max-w-7xl px-4 pt-24 pb-16 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={intro ? {} : { opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 inline-flex items-center gap-3 rounded-full border border-race/40 bg-race/10 px-4 py-1.5 font-mono text-xs tracking-widest text-race uppercase"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-race" />
            Race results · {RACE.name} · {RACE.subtitle}
          </motion.div>

          <h1 className="font-display text-[clamp(3.2rem,13vw,11rem)] leading-[0.85] uppercase">
            {['Lap', 'Legends'].map((word, wi) => (
              <span key={word} className={`block ${wi === 1 ? 'text-stroke' : ''}`}>
                {word.split('').map((ch, i) => (
                  <motion.span
                    key={i}
                    className="inline-block"
                    initial={{ y: '110%', rotate: 12, opacity: 0 }}
                    animate={intro ? {} : { y: 0, rotate: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.15 + wi * 0.25 + i * 0.04 }}
                    whileHover={{ y: -12, color: '#ff2a3b', transition: { duration: 0.15 } }}
                  >
                    {ch}
                  </motion.span>
                ))}
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={intro ? {} : { opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-6 max-w-xl text-lg text-muted"
          >
            Fifteen drivers. {TOTAL_LAPS} laps. Five red flags. A pit lane busier than the track. Less Formula 1, more
            Wacky Races: every lap replayed and dissected.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={intro ? {} : { opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {stats.map((s) => (
              <div key={s.label} className="glass rounded-2xl p-4">
                <div className="font-mono text-2xl font-extrabold sm:text-3xl">
                  {!intro && <CountUp to={s.value} format={s.f} />}
                </div>
                <div className="mt-1 text-xs tracking-widest text-muted uppercase">{s.label}</div>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={intro ? {} : { opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="mt-10 flex items-center gap-4"
          >
            <div className="flex -space-x-3">
              {podium.map((d) => (
                <Avatar key={d.id} d={d} size={44} ring />
              ))}
            </div>
            <div className="text-sm text-muted">
              <span className="text-white">{podium[0].name}</span> takes the win ahead of {podium[1].short} &{' '}
              {podium[2].short}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={intro ? {} : { opacity: 1, y: 0 }}
            transition={{ delay: 1.6 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.05, rotate: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={startMovieNight}
              className="flex items-center gap-2 rounded-full bg-race px-5 py-3 font-display text-lg uppercase shadow-[0_0_40px_#ff2a3b88]"
            >
              <Clapperboard size={20} /> Movie Night
            </motion.button>
            <a
              href="#paddock"
              className="flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-5 py-3 text-sm backdrop-blur hover:border-white/50"
            >
              📸 {MEDIA.length} photos & videos
            </a>
          </motion.div>
        </motion.div>

        {/* phone playing the overhead clip */}
        <motion.div
          className="pointer-events-none absolute top-1/2 right-[6%] hidden -translate-y-1/2 lg:block"
          initial={{ opacity: 0, x: 200, rotate: 25 }}
          animate={intro ? {} : { opacity: 1, x: 0, rotate: 8 }}
          transition={{ type: 'spring', stiffness: 60, damping: 14, delay: 0.8 }}
          style={{ y }}
        >
          <motion.div
            animate={{ rotate: [8, 5, 8], y: [0, -12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="relative h-[520px] w-[270px] overflow-hidden rounded-[2.6rem] border-[8px] border-[#15151d] bg-black shadow-[0_40px_120px_-20px_#ff2a3b66]"
          >
            <video src={HERO_VIDEO.src} poster={HERO_VIDEO.thumb} autoPlay muted loop playsInline className="h-full w-full object-cover" />
            <div className="absolute top-2 left-1/2 h-5 w-20 -translate-x-1/2 rounded-full bg-[#15151d]" />
            <div className="absolute bottom-4 left-3 rounded-full bg-race px-2.5 py-0.5 font-mono text-[10px] font-bold">● REC</div>
          </motion.div>
        </motion.div>

        <motion.a
          href="#podium"
          aria-label="Scroll to results"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-muted hover:text-white"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        >
          <ChevronDown size={32} />
        </motion.a>
      </header>
    </>
  )
}
