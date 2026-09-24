import { motion, useMotionTemplate, useMotionValue, useScroll, useSpring } from 'motion/react'
import { useEffect, useState } from 'react'
import { closeDriver, openDriver, useOpenDriver } from './lib/nav'
import { startRouter } from './lib/router'
import { LinkedText } from './components/DriverLink'
import Awards from './components/Awards'
import DriverDrawer from './components/DriverDrawer'
import Gallery from './components/Gallery'
import MediaViewer from './components/MediaViewer'
import MovieNight from './components/MovieNight'
import PhotoStrip from './components/PhotoStrip'
import TracksideTV from './components/TracksideTV'
import { MEDIA, withTag } from './lib/media'
import HeadToHead from './components/HeadToHead'
import Heatmap from './components/Heatmap'
import Hero from './components/Hero'
import LapChart from './components/LapChart'
import Leaderboard from './components/Leaderboard'
import Podium from './components/Podium'
import RaceControl from './components/RaceControl'
import RaceRadio from './components/RaceRadio'
import RaceReplay from './components/RaceReplay'
import { DRIVERS, FASTEST, RACE, fmt } from './lib/data'

const NAV = [
  ['podium', 'Podium'],
  ['replay', 'Replay'],
  ['control', 'Flags'],
  ['leaderboard', 'Tower'],
  ['laps', 'Pace'],
  ['heatmap', 'Heat'],
  ['h2h', 'H2H'],
  ['tv', 'TV'],
  ['awards', 'Awards'],
  ['paddock', 'Pics'],
] as const

function Ticker() {
  const items = [
    `⚡ Fastest lap ${FASTEST.name} ${fmt(FASTEST.best)}`,
    '🚩 RED FLAG 🚩 RED FLAG 🚩 RED FLAG',
    ...DRIVERS.slice(0, 5).map((d) => `P${d.position} ${d.name} · best ${fmt(d.best)}`),
    '⚫ BLACK FLAG · pit lane, now please',
    ...DRIVERS.slice(5).map((d) => `P${d.position} ${d.name} · best ${fmt(d.best)}`),
    '🤕 Alex Radice retires, get well soon',
  ]
  return (
    <div className="relative overflow-hidden border-y border-line bg-race py-2 text-sm font-semibold text-white">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap hover:[animation-play-state:paused]">
        {[...items, ...items].map((t, i) => (
          <span key={i} className="flex items-center gap-10">
            <span>
              <LinkedText text={t} />
            </span>
            <span className="checker inline-block h-3 w-6 opacity-60" />
          </span>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const picked = useOpenDriver()
  useEffect(() => startRouter(), [])
  const [active, setActive] = useState<string>('')
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 30 })

  const mx = useMotionValue(-500)
  const my = useMotionValue(-500)
  const spotlight = useMotionTemplate`radial-gradient(500px circle at ${mx}px ${my}px, rgba(255,42,59,0.07), transparent 70%)`

  useEffect(() => {
    const move = (e: PointerEvent) => {
      mx.set(e.clientX)
      my.set(e.clientY)
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [mx, my])

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    NAV.forEach(([id]) => {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  const pick = openDriver
  const close = closeDriver

  return (
    <div className="relative min-h-screen">
      <motion.div className="pointer-events-none fixed inset-0 z-30" style={{ background: spotlight }} />
      <motion.div className="fixed inset-x-0 top-0 z-50 h-1 origin-left bg-race" style={{ scaleX: progress }} />

      <nav className="fixed inset-x-0 top-3 z-40 flex justify-center px-3">
        <div className="glass scrollbar-thin flex max-w-full items-center gap-1 overflow-x-auto rounded-full p-1.5 shadow-2xl">
          <a href="#" className="checker mx-1 h-6 w-6 shrink-0 rounded-md" aria-label="Top" />
          {NAV.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="relative shrink-0 rounded-full px-3 py-1.5 text-sm">
              {active === id && (
                <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-white" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
              )}
              <span className={`relative ${active === id ? 'text-ink' : 'text-muted hover:text-white'}`}>{label}</span>
            </a>
          ))}
        </div>
      </nav>

      <Hero />
      <Ticker />
      <main>
        <Podium onPick={pick} />
        <PhotoStrip items={MEDIA.filter((m) => m.tags.includes('track')).slice(0, 36)} />
        <RaceReplay onPick={pick} />
        <RaceControl onPick={pick} />
        <Leaderboard onPick={pick} />
        <LapChart />
        <Heatmap onPick={pick} />
        <PhotoStrip items={[...withTag('wave'), ...withTag('overview'), ...MEDIA.filter((m) => m.tags.includes('track')).slice(36)]} tilt={2} />
        <HeadToHead />
        <TracksideTV />
        <Awards onPick={pick} />
        <Gallery />
      </main>

      <footer className="relative overflow-hidden border-t border-line">
        <div className="checker h-8 opacity-90" />
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-10 text-sm text-muted">
          <span className="font-display text-2xl text-white uppercase">Lap Legends</span>
          <span>
            {RACE.name} · {RACE.subtitle} · see you on the grid next time 🏎️
          </span>
        </div>
      </footer>

      <DriverDrawer driver={picked} onClose={close} onPick={pick} />
      <RaceRadio />
      <MediaViewer />
      <MovieNight />
    </div>
  )
}
