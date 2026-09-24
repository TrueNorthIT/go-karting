import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FastForward, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { DRIVERS, FASTEST, RACE_DURATION, fmt, type Driver } from '../lib/data'
import { BLACK_FLAGS, FLAGS, RED_FLAGS, flagAt, kartAt, type FlagKind, type KartState } from '../lib/flags'
import { Section } from './ui'
import { radio } from '../lib/radio'

// Centre line traced from the venue's track map (1482×1061 image space), starting at the
// start/finish line on the pit straight and running in race direction.
const TRACK_PARTS = [
  'M 560 210 L 1080 210 C 1150 210 1170 125 1250 125', // pit straight, kink past pit exit
  'C 1430 125 1430 320 1250 320 L 720 320', // top-right hairpin, back along the top
  'C 610 320 575 360 575 440 L 575 540 C 575 600 600 615 670 615', // drop down, turn onto the bridge
  'L 1150 615 C 1300 615 1300 770 1150 770 L 1010 770', // over the bridge, right-hand hairpin
  'C 890 770 890 900 1010 900 L 1230 900', // left-hand hairpin, down the bottom
  'C 1420 900 1420 490 1200 490 L 960 490', // big right sweeper up and over the top
  'C 860 490 830 540 810 600 L 725 830', // diagonal down, under the bridge
  'C 700 890 660 900 600 900 L 520 900 C 450 900 420 870 420 800', // bottom-left, turn up
  'L 420 440 A 67.5 67.5 0 0 0 285 440', // hairpin over the top
  'L 285 790 A 77.5 77.5 0 0 1 130 790', // hairpin round the bottom
  'L 130 320 C 130 245 175 210 255 210 Z', // up the left side, onto the pit straight
]
const TRACK = TRACK_PARTS.join(' ')

// The bridge deck: the section of the lap that crosses over the diagonal.
const BRIDGE = 'M 670 615 L 930 615'
const BRIDGE_LEN = 260
const KART_SCALE = 2
const PIT_SLOTS_X = (i: number) => 500 + i * 64

const SPEEDS = [10, 20, 40, 80]

interface Live {
  d: Driver
  k: KartState
  lastLap?: number
}

interface Toast {
  key: string
  tone: 'pb' | 'fl' | 'black' | 'retire'
  text: string
}

const FLAG_UI: Record<FlagKind, { label: string; sub: string; bg: string; fg: string }> = {
  green: { label: 'GREEN', sub: 'racing', bg: '#1faa59', fg: '#fff' },
  yellow: { label: 'YELLOW', sub: 'slow down · no overtaking', bg: '#ffc53d', fg: '#07070b' },
  red: { label: 'RED FLAG', sub: 'everybody stop', bg: '#ff2a3b', fg: '#fff' },
  chequered: { label: 'RACE STOPPED', sub: 'that’s enough chaos for one night', bg: '#ffffff', fg: '#07070b' },
}

// Tiny synthesized race-control beeps (no audio files). Browsers only allow audio after
// the visitor interacts, so one shared context is unlocked on their first click/tap/key.
let beepCtx: AudioContext | null = null
function audio() {
  beepCtx ??= new AudioContext()
  return beepCtx
}
if (typeof window !== 'undefined') {
  const unlock = () => {
    void audio().resume()
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
  }
  window.addEventListener('pointerdown', unlock)
  window.addEventListener('keydown', unlock)
}

function beep(kind: FlagKind) {
  try {
    const ctx = audio()
    if (ctx.state !== 'running') return
    const tones = kind === 'red' ? [880, 660, 880, 660] : kind === 'chequered' ? [523, 659, 784, 1046] : [700]
    tones.forEach((f, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = kind === 'red' ? 'square' : 'triangle'
      o.frequency.value = f
      g.gain.setValueAtTime(0.06, ctx.currentTime + i * 0.16)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.16 + 0.15)
      o.connect(g).connect(ctx.destination)
      o.start(ctx.currentTime + i * 0.16)
      o.stop(ctx.currentTime + i * 0.16 + 0.16)
    })
  } catch {
    /* audio not available */
  }
}

function WavingFlag({ kind }: { kind: FlagKind }) {
  const fill = kind === 'chequered' ? 'url(#chk-flag)' : FLAG_UI[kind].bg
  return (
    <svg viewBox="0 0 60 44" className="h-9 w-12">
      <defs>
        <pattern id="chk-flag" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="#fff" />
          <rect width="5" height="5" fill="#000" />
          <rect x="5" y="5" width="5" height="5" fill="#000" />
        </pattern>
      </defs>
      <rect x="2" y="2" width="3" height="42" rx="1.5" fill="#ddd" />
      <motion.path
        fill={fill}
        animate={{
          d: [
            'M5 4 C 20 0, 35 8, 58 4 L 58 26 C 35 30, 20 22, 5 26 Z',
            'M5 4 C 20 8, 35 0, 58 6 L 58 28 C 35 22, 20 30, 5 26 Z',
            'M5 4 C 20 0, 35 8, 58 4 L 58 26 C 35 30, 20 22, 5 26 Z',
          ],
        }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  )
}

export default function RaceReplay({ onPick }: { onPick: (d: Driver) => void }) {
  const pathRef = useRef<SVGPathElement>(null)
  const [len, setLen] = useState(0)
  const [bridgeAt, setBridgeAt] = useState(0)
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(40)
  const [sound, setSound] = useState(true)
  const [focus, setFocus] = useState<number | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const last = useRef(0)
  const prevT = useRef(0)
  const trackRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!pathRef.current) return
    setLen(pathRef.current.getTotalLength())
    // distance along the lap where the bridge deck starts
    const probe = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    probe.setAttribute('d', TRACK_PARTS.slice(0, 3).join(' '))
    setBridgeAt(probe.getTotalLength())
  }, [])

  // Only run while the track is actually on screen: start when it scrolls into view,
  // pause when it leaves, resume on return (unless the viewer paused it themselves).
  const userPaused = useRef(false)
  const tRef = useRef(0)
  tRef.current = t
  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (!userPaused.current && tRef.current < RACE_DURATION) setPlaying(true)
          radio.setMood(flagAt(tRef.current).kind)
        } else {
          setPlaying(false)
          // the rest of the site shouldn't be stuck with red-flag music
          radio.setMood('green')
        }
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!playing) return
    let raf = 0
    last.current = performance.now()
    const tick = (now: number) => {
      // clamp so a throttled/background tab doesn't teleport the race forward
      const dt = Math.min((now - last.current) / 1000, 0.1)
      last.current = now
      setT((prev) => {
        const next = Math.min(prev + dt * speed, RACE_DURATION)
        if (next >= RACE_DURATION) setPlaying(false)
        return next
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed])

  const flag = flagAt(t)

  // Race-control beeps when the flag changes.
  const prevFlag = useRef<FlagKind>('green')
  useEffect(() => {
    if (flag.kind !== prevFlag.current) {
      if (sound && playing && flag.kind !== 'green') beep(flag.kind)
      radio.setMood(flag.kind)
      prevFlag.current = flag.kind
    }
  }, [flag.kind, sound, playing])

  // Events that happened between the last frame and this one → toasts.
  useEffect(() => {
    const from = prevT.current
    prevT.current = t
    if (t <= from || t - from > 30) return
    const fresh: Toast[] = []
    let overallBest = Infinity
    for (const d of DRIVERS) d.cumulative.forEach((c, i) => c <= from && (overallBest = Math.min(overallBest, d.laps[i])))
    for (const d of DRIVERS) {
      d.cumulative.forEach((c, i) => {
        if (c > from && c <= t) {
          const lapTime = d.laps[i]
          const pbSoFar = Math.min(...d.laps.slice(0, i))
          // lap 2 is almost always a "PB" off a standing start, so only celebrate from lap 3
          if (i > 1 && lapTime < pbSoFar) {
            const fl = lapTime < overallBest
            fresh.push({ key: `pb-${d.id}-${i}`, tone: fl ? 'fl' : 'pb', text: `${fl ? '⚡ FASTEST LAP' : 'PB'} · ${d.short} · ${fmt(lapTime)}` })
          }
          if (d.retired && i === d.laps.length - 1) {
            fresh.push({ key: `ret-${d.id}`, tone: 'retire', text: `🤕 ${d.name} retires, hurt back` })
          }
        }
      })
    }
    for (const b of BLACK_FLAGS) {
      if (b.start > from && b.start <= t) {
        const text =
          b.driver.id === FASTEST.id
            ? `⚫ ${b.driver.short} → pits. Yellow means SLOW, Christian 🟨`
            : `⚫ ${b.driver.short} → pit lane for a word`
        fresh.push({ key: `bf-${b.driver.id}-${b.lap}`, tone: 'black', text })
      }
    }
    if (fresh.length) {
      setToasts((f) => [...fresh, ...f].slice(0, 5))
      fresh.forEach((fl) => setTimeout(() => setToasts((f) => f.filter((x) => x.key !== fl.key)), 2800))
    }
  }, [t])

  const live: Live[] = useMemo(
    () =>
      DRIVERS.map((d) => {
        const k = kartAt(d, t)
        return { d, k, lastLap: k.lap > 0 ? d.laps[k.lap - 1] : undefined }
      }),
    [t],
  )
  const order = useMemo(
    () =>
      [...live].sort((a, b) => {
        const ar = a.d.retired && a.k.status === 'finished'
        const br = b.d.retired && b.k.status === 'finished'
        if (ar !== br) return ar ? 1 : -1
        if (a.k.status === 'finished' && b.k.status === 'finished') return b.k.lap - a.k.lap || a.d.total - b.d.total
        return b.k.progress - a.k.progress
      }),
    [live],
  )
  const leader = order[0]
  const pitting = live.filter((s) => s.k.status === 'pit')
  const redsSoFar = RED_FLAGS.filter((f) => f.start <= t).length
  const blacksSoFar = BLACK_FLAGS.filter((b) => b.start <= t).length

  const point = (progress: number, lane: number) => {
    const p = pathRef.current
    if (!p || !len) return { x: 560, y: 210 }
    const l = (progress % 1) * len
    const a = p.getPointAtLength(l)
    const b = p.getPointAtLength((l + 1) % len)
    const dx = b.x - a.x
    const dy = b.y - a.y
    const n = Math.hypot(dx, dy) || 1
    return { x: a.x + (-dy / n) * lane, y: a.y + (dx / n) * lane }
  }

  const onBridge = (progress: number) => {
    const l = (progress % 1) * len
    return l >= bridgeAt && l <= bridgeAt + BRIDGE_LEN
  }

  const kart = (s: Live, x: number, y: number) => {
    const dim = focus !== null && focus !== s.d.id
    const inPit = s.k.status === 'pit'
    const stopped = s.k.status === 'red'
    return (
      <g
        key={s.d.id}
        transform={`translate(${x} ${y}) scale(${KART_SCALE})`}
        style={{ cursor: 'pointer', opacity: dim ? 0.2 : 1, transition: 'opacity .3s' }}
        onClick={() => onPick(s.d)}
        onMouseEnter={() => setFocus(s.d.id)}
        onMouseLeave={() => setFocus(null)}
      >
        <circle r="13" fill="transparent" />
        {inPit && <circle r="12.5" fill="none" stroke="#000" strokeWidth="3" />}
        {inPit && <circle r="12.5" fill="none" stroke="#fff" strokeWidth="1" strokeDasharray="2 2" />}
        {stopped && <circle r="12" fill="none" stroke="#ff2a3b" strokeWidth="1.5" opacity="0.8" />}
        <circle r="9" fill={s.d.color} stroke="#07070b" strokeWidth="2" filter={focus === s.d.id ? 'url(#glow)' : undefined} />
        <text textAnchor="middle" dy="3" fontSize="7" fontWeight="700" fill="#07070b" fontFamily="Space Grotesk">
          {s.d.initials}
        </text>
        {inPit && (
          <g transform="translate(9 -12)">
            <rect x="-2" y="-8" width="16" height="11" rx="4" fill="#fff" />
            <text x="6" y="0" textAnchor="middle" fontSize="7">🗣️</text>
          </g>
        )}
        {(focus === s.d.id || (s === leader && !inPit)) && (
          <g transform="translate(0 -18)">
            <rect x="-34" y="-9" width="68" height="14" rx="7" fill="#07070b" stroke={s.d.color} />
            <text textAnchor="middle" dy="2" fontSize="8" fill="#fff" fontFamily="Space Grotesk">
              {s === leader ? '👑 ' : ''}
              {s.d.short}
            </text>
          </g>
        )}
      </g>
    )
  }

  const trackKarts = (bridgeLayer: boolean) =>
    live.map((s) => {
      if (s.k.status === 'finished' || s.k.status === 'pit' || onBridge(s.k.progress) !== bridgeLayer) return null
      const { x, y } = point(s.k.progress, ((s.d.id % 5) - 2) * 14)
      return kart(s, x, y)
    })

  const reset = () => {
    userPaused.current = false
    setT(0)
    prevT.current = 0
    setToasts([])
    setPlaying(true)
  }

  const seek = (v: number) => {
    prevT.current = v
    setT(v)
  }

  const ui = FLAG_UI[flag.kind]

  return (
    <Section
      id="replay"
      kicker="Every lap, re-run from real timings"
      title="Race Replay"
      aside={
        <div className="flex items-center gap-5 font-mono text-sm text-muted">
          <span>
            🚩 <b className="text-white tabular">{redsSoFar}</b>/{RED_FLAGS.length}
          </span>
          <span>
            ⚫ <b className="text-white tabular">{blacksSoFar}</b>
          </span>
          <span>
            Clock <span className="text-2xl font-extrabold text-white tabular">{fmt(t, 1)}</span>
          </span>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <motion.div
          animate={flag.kind === 'red' ? { x: [0, -10, 9, -6, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.45 }}
          className="glass relative overflow-hidden rounded-3xl transition-shadow duration-500"
          style={{
            boxShadow:
              flag.kind === 'red'
                ? '0 0 0 2px #ff2a3b, 0 0 80px #ff2a3b66'
                : flag.kind === 'yellow'
                  ? '0 0 0 2px #ffc53d, 0 0 60px #ffc53d44'
                  : undefined,
          }}
        >
          <div className="grid-bg absolute inset-0 opacity-60" />

          {/* flag status pill */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2 rounded-full bg-black/70 py-1 pr-3 pl-1 backdrop-blur">
            <WavingFlag kind={flag.kind} />
            <div className="leading-tight">
              <div className="font-display text-sm" style={{ color: flag.kind === 'chequered' ? '#fff' : ui.bg }}>
                {ui.label}
                {flag.kind === 'red' && flag.window?.n ? ` #${flag.window.n}` : ''}
              </div>
              <div className="font-mono text-[10px] text-muted">{ui.sub}</div>
            </div>
          </div>

          <svg ref={trackRef} viewBox="40 40 1420 960" className="relative w-full" role="img" aria-label="Animated race replay on the real track layout">
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <pattern id="chk" width="6" height="6" patternUnits="userSpaceOnUse">
                <rect width="6" height="6" fill="#fff" />
                <rect width="3" height="3" fill="#000" />
                <rect x="3" y="3" width="3" height="3" fill="#000" />
              </pattern>
            </defs>
            {/* pit lane */}
            <path
              d="M 440 125 L 1120 125"
              stroke={pitting.length ? '#3a3a4c' : '#2a2a38'}
              strokeWidth="70"
              strokeLinecap="round"
              style={{ transition: 'stroke .3s' }}
            />
            <text x="1100" y="98" textAnchor="end" fontSize="20" letterSpacing="5" fill="#8b8ba3" fontFamily="JetBrains Mono">
              PIT LANE{pitting.length ? ` · ${pitting.length} IN FOR A CHAT` : ''}
            </text>
            {/* kerbs, asphalt, centre line */}
            <path d={TRACK} fill="none" stroke="#ff2a3b" strokeWidth="112" strokeDasharray="18 18" strokeLinejoin="round" opacity="0.85" />
            <path d={TRACK} fill="none" stroke="#fff" strokeWidth="112" strokeDasharray="18 18" strokeDashoffset="18" strokeLinejoin="round" opacity="0.15" />
            <path
              d={TRACK}
              fill="none"
              stroke={flag.kind === 'red' ? '#3a1017' : flag.kind === 'yellow' ? '#2e2712' : '#1d1d27'}
              strokeWidth="100"
              strokeLinejoin="round"
              style={{ transition: 'stroke .4s' }}
            />
            <path ref={pathRef} d={TRACK} fill="none" stroke="#ffffff22" strokeWidth="3" strokeDasharray="16 20" />
            {/* start / finish */}
            <rect x="548" y="160" width="24" height="100" fill="url(#chk)" />
            <text x="560" y="290" textAnchor="middle" fontSize="18" fill="#8b8ba3" fontFamily="JetBrains Mono">
              START / FINISH
            </text>

            {trackKarts(false)}

            {/* the bridge deck sits over the diagonal */}
            <path d={BRIDGE} stroke="#000" strokeOpacity="0.6" strokeWidth="140" filter="url(#glow)" />
            <path d={BRIDGE} stroke="#8b8ba3" strokeWidth="118" />
            <path d={BRIDGE} stroke={flag.kind === 'red' ? '#3a1017' : '#26263a'} strokeWidth="100" style={{ transition: 'stroke .4s' }} />
            <path d={BRIDGE} stroke="#ffffff22" strokeWidth="3" strokeDasharray="16 20" />
            <text x="800" y="680" textAnchor="middle" fontSize="16" letterSpacing="4" fill="#8b8ba3" fontFamily="JetBrains Mono">
              BRIDGE
            </text>

            {trackKarts(true)}

            {/* the naughty step */}
            {pitting.map((s, i) => kart(s, PIT_SLOTS_X(i), 125))}
          </svg>

          {/* giant red flag takeover */}
          <AnimatePresence>
            {flag.kind === 'red' && (
              <motion.div
                key={`red-${flag.window?.n}`}
                className="pointer-events-none absolute inset-0 grid place-items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="absolute inset-0 bg-race/15"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.7, repeat: Infinity }}
                />
                <motion.div
                  className="relative -rotate-6 rounded-2xl bg-race px-6 py-3 text-center shadow-[0_0_80px_#ff2a3b]"
                  initial={{ scale: 3, rotate: -20 }}
                  animate={{ scale: 1, rotate: -6 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                >
                  <div className="font-display text-4xl sm:text-6xl">🚩 RED FLAG</div>
                  <div className="font-mono text-xs tracking-widest sm:text-sm">
                    #{flag.window?.n} of {RED_FLAGS.length} · everyone stop · again
                  </div>
                </motion.div>
              </motion.div>
            )}
            {flag.kind === 'chequered' && (
              <motion.div
                key="cheq"
                className="pointer-events-none absolute inset-0 grid place-items-center bg-black/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  initial={{ scale: 0, rotate: 30 }}
                  animate={{ scale: 1, rotate: -4 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                  className="rounded-2xl bg-white px-6 py-3 text-center text-ink"
                >
                  <div className="font-display text-3xl sm:text-5xl">🏁 RACE STOPPED</div>
                  <div className="font-mono text-xs">five red flags later…</div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* retired / finished drivers */}
          <div className="absolute top-3 left-3 flex max-w-[60%] flex-wrap gap-1">
            <AnimatePresence>
              {live
                .filter((s) => s.k.status === 'finished')
                .map((s) => (
                  <motion.span
                    key={s.d.id}
                    initial={{ scale: 0, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    className="flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 font-mono text-[10px]"
                  >
                    {s.d.retired ? '🤕' : '🏁'} <span style={{ color: s.d.color }}>●</span> {s.d.short}
                  </motion.span>
                ))}
            </AnimatePresence>
          </div>

          {/* toasts */}
          <div className="pointer-events-none absolute right-3 bottom-24 flex flex-col items-end gap-2 sm:bottom-28">
            <AnimatePresence>
              {toasts.map((f) => (
                <motion.div
                  key={f.key}
                  layout
                  initial={{ x: 80, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 80, opacity: 0 }}
                  className={`rounded-lg px-3 py-1.5 font-mono text-xs font-semibold ${
                    f.tone === 'fl'
                      ? 'bg-[#b34dff] text-white'
                      : f.tone === 'pb'
                        ? 'bg-volt text-ink'
                        : f.tone === 'black'
                          ? 'border border-white/30 bg-black text-white'
                          : 'bg-[#4fd1c5] text-ink'
                  }`}
                >
                  {f.text}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* controls */}
          <div className="relative border-t border-line bg-black/40 px-4 pt-3 pb-3">
            {/* flag timeline: click anywhere to jump */}
            <div
              className="relative mb-3 h-5 cursor-pointer rounded-full bg-[#1faa59]/25"
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect()
                seek(((e.clientX - r.left) / r.width) * RACE_DURATION)
              }}
              role="presentation"
            >
              {FLAGS.map((f, i) => (
                <div
                  key={i}
                  className="absolute inset-y-0"
                  title={f.kind === 'red' ? `Red flag #${f.n}` : 'Yellow'}
                  style={{
                    left: `${(f.start / RACE_DURATION) * 100}%`,
                    width: `${((f.end - f.start) / RACE_DURATION) * 100}%`,
                    background: f.kind === 'red' ? '#ff2a3b' : '#ffc53d',
                  }}
                />
              ))}
              {BLACK_FLAGS.map((b) => (
                <div
                  key={`${b.driver.id}-${b.lap}`}
                  className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60 bg-black"
                  style={{ left: `${(b.start / RACE_DURATION) * 100}%` }}
                  title={`${b.driver.name} pit visit`}
                />
              ))}
              <div className="absolute inset-y-[-3px] w-0.5 bg-white" style={{ left: `${(t / RACE_DURATION) * 100}%` }} />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (t >= RACE_DURATION) return reset()
                  userPaused.current = playing
                  setPlaying(!playing)
                }}
                className="grid h-10 w-10 place-items-center rounded-full bg-race text-white shadow-[0_0_20px_#ff2a3b88]"
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
              </motion.button>
              <button onClick={reset} className="text-muted hover:text-white" aria-label="Restart">
                <RotateCcw size={18} />
              </button>
              <button
                onClick={() => setSound((s) => !s)}
                className={sound ? 'text-white' : 'text-muted hover:text-white'}
                aria-label={sound ? 'Mute race control' : 'Unmute race control'}
                title="Race control beeps"
              >
                {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              <input
                type="range"
                min={0}
                max={RACE_DURATION}
                step={0.1}
                value={t}
                onChange={(e) => seek(Number(e.target.value))}
                className="min-w-32 flex-1"
                aria-label="Scrub race time"
              />
              <div className="flex items-center gap-1">
                <FastForward size={14} className="text-muted" />
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`rounded-md px-2 py-1 font-mono text-xs ${speed === s ? 'bg-white text-ink' : 'text-muted hover:text-white'}`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {RED_FLAGS.map((f) => (
                <button
                  key={f.n}
                  onClick={() => {
                    seek(f.start - 8)
                    userPaused.current = false
                    setPlaying(true)
                  }}
                  className="rounded-full border border-race/40 px-2.5 py-0.5 font-mono text-[11px] text-race hover:bg-race hover:text-white"
                >
                  🚩 jump to red #{f.n}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* live timing tower */}
        <div className="glass scrollbar-thin max-h-[640px] overflow-y-auto rounded-3xl p-3">
          <div className="mb-2 flex items-center justify-between px-2 font-mono text-[10px] tracking-widest text-muted uppercase">
            <span>Live order</span>
            <span>Lap · Last</span>
          </div>
          <LayoutGroup>
            {order.map((s, i) => {
              const st = s.k.status
              const badge =
                st === 'finished'
                  ? s.d.retired
                    ? { t: 'RET', c: 'bg-[#4fd1c5] text-ink' }
                    : { t: '🏁', c: '' }
                  : st === 'pit'
                    ? { t: 'PIT', c: 'bg-black text-white border border-white/40' }
                    : st === 'red'
                      ? { t: 'STOP', c: 'bg-race text-white' }
                      : { t: `L${s.k.lap + 1}`, c: 'text-muted' }
              return (
                <motion.button
                  layout
                  key={s.d.id}
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  onMouseEnter={() => setFocus(s.d.id)}
                  onMouseLeave={() => setFocus(null)}
                  onClick={() => onPick(s.d)}
                  className={`flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm ${
                    focus === s.d.id ? 'bg-white/10' : 'hover:bg-white/5'
                  } ${st === 'finished' && s.d.retired ? 'opacity-60' : ''}`}
                >
                  <span className="w-5 text-right font-mono text-xs text-muted">{i + 1}</span>
                  <span className="h-5 w-1 rounded-full" style={{ background: s.d.color }} />
                  <span className="flex-1 truncate">{s.d.name}</span>
                  <span className={`rounded px-1.5 font-mono text-[10px] tabular ${badge.c}`}>{badge.t}</span>
                  <span className="w-14 text-right font-mono text-xs tabular">{s.lastLap ? fmt(s.lastLap) : '—'}</span>
                </motion.button>
              )
            })}
          </LayoutGroup>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">
        The timing sheet doesn't record flags, so race control is reconstructed: red flags are the moments almost the whole
        field's laps balloon together, and ⚫ pit visits are laps still way off the pace once red-flag time is removed (the
        black-flag chats, plus the odd incident). Karts drive at their real pace, stop on reds, and sit on the naughty step in
        the pit lane.
      </p>
    </Section>
  )
}
