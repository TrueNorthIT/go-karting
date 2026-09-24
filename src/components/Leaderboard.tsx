import { LayoutGroup, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { ArrowDownUp, Zap } from 'lucide-react'
import { DRIVERS, FASTEST, fmt, type Driver } from '../lib/data'
import { Avatar, Chip, Section } from './ui'

type SortKey = 'position' | 'best' | 'avg' | 'laps' | 'stdDev'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'position', label: 'Finish' },
  { key: 'best', label: 'Best lap' },
  { key: 'avg', label: 'Average' },
  { key: 'laps', label: 'Laps' },
  { key: 'stdDev', label: 'Consistency' },
]

const value = (d: Driver, k: SortKey) => (k === 'laps' ? -d.laps.length : d[k])

export default function Leaderboard({ onPick }: { onPick: (d: Driver) => void }) {
  const [sort, setSort] = useState<SortKey>('position')
  const rows = useMemo(() => [...DRIVERS].sort((a, b) => value(a, sort) - value(b, sort)), [sort])
  const slowestBest = Math.max(...DRIVERS.map((d) => d.best))

  return (
    <Section
      id="leaderboard"
      kicker="Everyone, ranked"
      title="Timing Tower"
      aside={
        <div className="flex flex-wrap items-center gap-2">
          <ArrowDownUp size={16} className="text-muted" />
          {SORTS.map((s) => (
            <Chip key={s.key} active={sort === s.key} onClick={() => setSort(s.key)}>
              {s.label}
            </Chip>
          ))}
        </div>
      }
    >
      <div className="glass overflow-hidden rounded-3xl">
        <div className="hidden grid-cols-[3rem_1fr_9rem_6rem_6rem_4rem] gap-4 border-b border-line px-5 py-3 font-mono text-[11px] tracking-widest text-muted uppercase md:grid">
          <span>Pos</span>
          <span>Driver</span>
          <span>Best lap</span>
          <span>Avg</span>
          <span>Gap</span>
          <span className="text-right">Laps</span>
        </div>
        <LayoutGroup>
          {rows.map((d, i) => {
            const pct = 1 - (d.best - FASTEST.best) / (slowestBest - FASTEST.best)
            return (
              <motion.button
                layout
                key={d.id}
                onClick={() => onPick(d)}
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ layout: { type: 'spring', stiffness: 300, damping: 30 }, delay: i * 0.03 }}
                className="group relative grid w-full grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b border-line/60 px-4 py-3 text-left last:border-0 hover:bg-white/[0.04] md:grid-cols-[3rem_1fr_9rem_6rem_6rem_4rem] md:gap-4 md:px-5"
              >
                <span
                  className="absolute inset-y-0 left-0 w-1 origin-left scale-y-0 transition-transform group-hover:scale-y-100"
                  style={{ background: d.color }}
                />
                <span className="font-display text-2xl text-muted group-hover:text-white">{i + 1}</span>
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar d={d} size={36} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{d.name}</span>
                    <span className="block font-mono text-xs text-muted md:hidden">
                      best {fmt(d.best)} · avg {fmt(d.avg)}
                    </span>
                  </span>
                  {d.id === FASTEST.id && (
                    <span className="flex items-center gap-1 rounded-full bg-[#b34dff]/20 px-2 py-0.5 font-mono text-[10px] text-[#d9a6ff]">
                      <Zap size={10} fill="currentColor" /> FL
                    </span>
                  )}
                </span>
                <span className="hidden items-center gap-2 md:flex">
                  <span className="font-mono text-sm tabular">{fmt(d.best)}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                    <motion.span
                      className="block h-full rounded-full"
                      style={{ background: d.color }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${10 + pct * 90}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.2 + i * 0.04 }}
                    />
                  </span>
                </span>
                <span className="hidden font-mono text-sm text-muted tabular md:block">{fmt(d.avg)}</span>
                <span className="hidden font-mono text-sm text-muted tabular md:block">
                  {d.id === FASTEST.id ? '—' : `+${(d.best - FASTEST.best).toFixed(3)}`}
                </span>
                <span className="text-right font-mono text-sm tabular">
                  {d.laps.length}
                  <span className="text-muted md:hidden"> laps</span>
                </span>
              </motion.button>
            )
          })}
        </LayoutGroup>
      </div>
      <p className="mt-3 text-xs text-muted">
        Consistency = standard deviation of lap times (lower is steadier). Gap is to the fastest lap of the night.
      </p>
    </Section>
  )
}
