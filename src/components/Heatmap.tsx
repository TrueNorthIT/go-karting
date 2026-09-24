import { motion } from 'motion/react'
import { useState } from 'react'
import { DRIVERS, FASTEST, MAX_LAPS, fmt, type Driver } from '../lib/data'
import { Chip, Section } from './ui'

type Scale = 'own' | 'field'

// Single-hue sequential ramp: hot & bright = quick, dark = slow.
function cellColor(ratio: number) {
  // ratio 0 = fastest, 1 = slowest (clamped)
  const r = Math.min(1, Math.max(0, ratio))
  const l = 68 - r * 52
  const c = 0.2 - r * 0.13
  return `oklch(${l}% ${c} 35)`
}

export default function Heatmap({ onPick }: { onPick: (d: Driver) => void }) {
  const [scale, setScale] = useState<Scale>('own')
  const [tip, setTip] = useState<{ d: Driver; i: number; x: number; y: number } | null>(null)

  const ratio = (d: Driver, v: number) =>
    scale === 'own' ? (v - d.best) / (d.best * 1.2) : (v - FASTEST.best) / (150 - FASTEST.best)

  return (
    <Section
      id="heatmap"
      kicker="Where it went right (and very wrong)"
      title="Heat Map"
      aside={
        <div className="flex gap-2">
          <Chip active={scale === 'own'} onClick={() => setScale('own')}>
            vs own best
          </Chip>
          <Chip active={scale === 'field'} onClick={() => setScale('field')}>
            vs whole field
          </Chip>
        </div>
      }
    >
      <div className="glass scrollbar-thin relative overflow-x-auto rounded-3xl p-4" onMouseLeave={() => setTip(null)}>
        <table className="border-separate border-spacing-[3px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-panel" />
              {Array.from({ length: MAX_LAPS }, (_, i) => (
                <th key={i} className="w-12 font-mono text-[10px] font-normal text-muted">
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DRIVERS.map((d, ri) => (
              <tr key={d.id}>
                <th className="sticky left-0 z-10 bg-panel pr-3 text-left">
                  <button
                    onClick={() => onPick(d)}
                    className="flex items-center gap-2 text-sm font-medium whitespace-nowrap hover:underline"
                  >
                    <span className="h-3 w-1 rounded-full" style={{ background: d.color }} />
                    {d.name}
                  </button>
                </th>
                {Array.from({ length: MAX_LAPS }, (_, i) => {
                  const v = d.laps[i]
                  if (v === undefined) return <td key={i} />
                  const isPB = i + 1 === d.bestLap
                  const isFL = isPB && d.id === FASTEST.id
                  return (
                    <motion.td
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: (i + ri) * 0.012, type: 'spring', stiffness: 300, damping: 20 }}
                      whileHover={{ scale: 1.35, zIndex: 5 }}
                      onMouseEnter={(e) => {
                        const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
                        setTip({ d, i, x: r.left + r.width / 2, y: r.top })
                      }}
                      className="relative h-8 w-12 cursor-default rounded-[4px] text-center font-mono text-[9px] tabular"
                      style={{
                        background: cellColor(ratio(d, v)),
                        color: ratio(d, v) < 0.45 ? '#07070b' : '#ffffffb0',
                        outline: isFL ? '2px solid #d9a6ff' : isPB ? '2px solid #d4ff3a' : undefined,
                        outlineOffset: 1,
                      }}
                    >
                      {v >= 100 ? fmt(v, 0) : v.toFixed(1)}
                    </motion.td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-6 text-xs text-muted">
        <div className="flex items-center gap-2">
          quick
          <span
            className="h-2.5 w-32 rounded-full"
            style={{ background: `linear-gradient(90deg, ${[0, 0.25, 0.5, 0.75, 1].map(cellColor).join(',')})` }}
          />
          slow
        </div>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm outline-2 outline-volt" /> personal best
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm outline-2 outline-[#d9a6ff]" /> fastest lap overall
        </span>
      </div>

      {tip && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-xl border border-line bg-ink/95 px-3 py-2 text-xs shadow-2xl"
          style={{ left: tip.x, top: tip.y - 8 }}
        >
          <div className="font-semibold">
            {tip.d.name} · Lap {tip.i + 1}
          </div>
          <div className="font-mono text-lg">{fmt(tip.d.laps[tip.i])}</div>
          <div className="font-mono text-muted">
            {tip.i + 1 === tip.d.bestLap ? 'personal best!' : `+${(tip.d.laps[tip.i] - tip.d.best).toFixed(3)} off PB`}
          </div>
        </div>
      )}
    </Section>
  )
}
