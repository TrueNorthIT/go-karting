import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Shuffle, Swords } from 'lucide-react'
import { DRIVERS, fmt, type Driver } from '../lib/data'
import { Avatar, Section } from './ui'
import { FLAG_STATS } from '../lib/flags'
import { DriverLink, LinkedText } from './DriverLink'

function Picker({ value, onChange, other }: { value: Driver; onChange: (d: Driver) => void; other: Driver }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <AnimatePresence mode="wait">
        <motion.div
          key={value.id}
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 90 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        >
          <Avatar d={value} size={88} ring />
        </motion.div>
      </AnimatePresence>
      <select
        value={value.id}
        onChange={(e) => onChange(DRIVERS[Number(e.target.value)])}
        className="max-w-full rounded-xl border border-line bg-panel px-3 py-2 text-center font-semibold"
      >
        {DRIVERS.map((d) => (
          <option key={d.id} value={d.id} disabled={d.id === other.id}>
            P{d.position} · {d.name}
          </option>
        ))}
      </select>
      <span className="text-center text-xs italic" style={{ color: value.color }}>
        “{value.nickname}”
      </span>
      <DriverLink d={value} className="text-xs">
        dossier →
      </DriverLink>
    </div>
  )
}

function verdict(a: Driver, b: Driver): string {
  const [fast, slow] = a.best < b.best ? [a, b] : [b, a]
  const [ahead, behind] = a.position < b.position ? [a, b] : [b, a]
  const gap = (slow.best - fast.best).toFixed(3)
  const pits = (d: Driver) => FLAG_STATS[d.id].blackFlags
  if (fast.id === ahead.id) {
    return `${fast.short} wins this one outright: quicker by ${gap}s over a lap and ahead at the flag (P${ahead.position} vs P${behind.position}). ${
      pits(slow) > pits(fast) ? `The pit lane didn't help ${slow.short} either.` : `${slow.short} will want a rematch.`
    }`
  }
  return `Proper argument material. ${fast.short} had the raw pace, ${gap}s quicker on the best lap, but ${ahead.short} finished ahead (P${ahead.position} vs P${behind.position})${
    pits(fast) > pits(ahead) ? ` while ${fast.short} was busy visiting the pit lane` : ''
  }. Speed vs staying on track: pick your side.`
}

export default function HeadToHead() {
  const [a, setA] = useState(DRIVERS[0])
  const [b, setB] = useState(DRIVERS[4])

  const shuffle = () => {
    const pool = [...DRIVERS].sort(() => Math.random() - 0.5)
    setA(pool[0])
    setB(pool[1])
  }

  // lower-is-better metrics except laps
  const metrics: { label: string; av: number; bv: number; f: (n: number) => string; higher?: boolean }[] = [
    { label: 'Best lap', av: a.best, bv: b.best, f: (n) => fmt(n) },
    { label: 'Average lap', av: a.avg, bv: b.avg, f: (n) => fmt(n) },
    { label: 'Median lap', av: a.median, bv: b.median, f: (n) => fmt(n) },
    { label: 'Consistency σ', av: a.stdDev, bv: b.stdDev, f: (n) => `${n.toFixed(1)}s` },
    { label: 'Laps', av: a.laps.length, bv: b.laps.length, f: (n) => `${n}`, higher: true },
    { label: 'Clean laps', av: a.cleanLaps, bv: b.cleanLaps, f: (n) => `${n}`, higher: true },
  ]
  let aWins = 0
  let bWins = 0
  metrics.forEach((m) => {
    const aBetter = m.higher ? m.av > m.bv : m.av < m.bv
    const bBetter = m.higher ? m.bv > m.av : m.bv < m.av
    if (aBetter) aWins++
    if (bBetter) bWins++
  })

  const shared = Math.min(a.laps.length, b.laps.length)
  const deltas = Array.from({ length: shared }, (_, i) => a.laps[i] - b.laps[i])
  const maxAbs = Math.max(...deltas.map(Math.abs), 1)
  const aLapWins = deltas.filter((d) => d < 0).length

  return (
    <Section
      id="h2h"
      kicker="Settle the argument"
      title="Head to Head"
      aside={
        <motion.button
          whileTap={{ scale: 0.9, rotate: 180 }}
          onClick={shuffle}
          className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm hover:border-white/30"
        >
          <Shuffle size={16} /> Random rivalry
        </motion.button>
      }
    >
      <div className="glass rounded-3xl p-5 sm:p-8">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <Picker value={a} onChange={setA} other={b} />
          <div className="flex flex-col items-center gap-2">
            <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
              <Swords className="text-race" size={36} />
            </motion.div>
            <div className="font-display text-3xl tabular sm:text-5xl">
              <span style={{ color: a.color }}>{aWins}</span>
              <span className="text-muted"> – </span>
              <span style={{ color: b.color }}>{bWins}</span>
            </div>
          </div>
          <Picker value={b} onChange={setB} other={a} />
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={`${a.id}-${b.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-auto mt-6 max-w-2xl text-center text-white/80"
          >
            <LinkedText text={verdict(a, b)} />
          </motion.p>
        </AnimatePresence>

        <div className="mt-8 space-y-4">
          {metrics.map((m) => {
            const total = m.av + m.bv
            // share of the bar each side "owns" — the better one gets more
            const aShare = m.higher ? m.av / total : m.bv / total
            const aBetter = m.higher ? m.av > m.bv : m.av < m.bv
            const bBetter = m.higher ? m.bv > m.av : m.bv < m.av
            return (
              <div key={m.label}>
                <div className="mb-1 flex justify-between font-mono text-sm tabular">
                  <span className={aBetter ? 'font-bold text-white' : 'text-muted'}>{m.f(m.av)}</span>
                  <span className="text-xs tracking-widest text-muted uppercase">{m.label}</span>
                  <span className={bBetter ? 'font-bold text-white' : 'text-muted'}>{m.f(m.bv)}</span>
                </div>
                <div className="flex h-3 gap-[2px] overflow-hidden rounded-full">
                  <motion.div
                    className="h-full rounded-l-full"
                    style={{ background: a.color, opacity: aBetter ? 1 : 0.35 }}
                    animate={{ width: `${aShare * 100}%` }}
                    transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                  />
                  <motion.div
                    className="h-full flex-1 rounded-r-full"
                    style={{ background: b.color, opacity: bBetter ? 1 : 0.35 }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-10">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-xl uppercase">Lap-by-lap duel</h3>
            <span className="text-sm text-muted">
              <DriverLink d={a} photos={false}>{a.short}</DriverLink> won <b className="text-white">{aLapWins}</b> of {shared} shared laps
            </span>
          </div>
          <div className="relative flex h-52 items-center gap-[3px]">
            <div className="absolute inset-x-0 top-1/2 h-px bg-white/20" />
            {deltas.map((d, i) => {
              const h = (Math.abs(d) / maxAbs) * 48
              const aFaster = d < 0
              return (
                <div key={i} className="group relative flex h-full flex-1 flex-col justify-center">
                  <motion.div
                    className="absolute left-0 w-full rounded-[4px]"
                    style={{
                      background: aFaster ? a.color : b.color,
                      ...(aFaster ? { bottom: '50%' } : { top: '50%' }),
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(h, 1)}%` }}
                    transition={{ delay: i * 0.03, type: 'spring', stiffness: 140, damping: 16 }}
                  />
                  <div className="pointer-events-none absolute -top-2 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-ink px-2 py-1 text-center font-mono text-[11px] whitespace-nowrap group-hover:block">
                    L{i + 1}: {(aFaster ? a : b).short} by {Math.abs(d).toFixed(3)}s
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted">
            <span>↑ {a.short} faster</span>
            <span>↓ {b.short} faster</span>
          </div>
        </div>
      </div>
    </Section>
  )
}
