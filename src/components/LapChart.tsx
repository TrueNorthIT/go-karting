import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import { DRIVERS, FASTEST, MAX_LAPS, fmt } from '../lib/data'
import { Chip, Section } from './ui'

type Mode = 'laps' | 'gap'

function Tip({ active, payload, label, mode }: TooltipContentProps<number, string> & { mode: Mode }) {
  if (!active || !payload?.length) return null
  const rows = payload
    .filter((p) => p.value != null && !String(p.dataKey).startsWith('ghost'))
    .sort((a, b) => Number(a.value) - Number(b.value))
  if (!rows.length) return null
  return (
    <div className="rounded-xl border border-line bg-ink/95 px-3 py-2 text-xs shadow-2xl backdrop-blur">
      <div className="mb-1 font-mono text-muted">Lap {label}</div>
      {rows.map((p) => (
        <div key={String(p.dataKey)} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="flex-1">{p.name}</span>
          <span className="font-mono tabular">
            {mode === 'laps' ? fmt(Number(p.value)) : `+${fmt(Number(p.value), 1)}`}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function LapChart() {
  const [selected, setSelected] = useState<number[]>([0, 1, 2])
  const [clip, setClip] = useState(true)
  const [mode, setMode] = useState<Mode>('laps')
  const [hover, setHover] = useState<number | null>(null)
  const winner = DRIVERS[0]

  const data = useMemo(
    () =>
      Array.from({ length: MAX_LAPS }, (_, i) => {
        const row: Record<string, number | undefined> = { lap: i + 1 }
        for (const d of DRIVERS) {
          const v =
            mode === 'laps'
              ? d.laps[i]
              : d.cumulative[i] !== undefined && winner.cumulative[i] !== undefined
                ? d.cumulative[i] - winner.cumulative[i]
                : undefined
          row[`d${d.id}`] = v
          row[`ghost${d.id}`] = v
        }
        return row
      }),
    [mode, winner],
  )

  const toggle = (id: number) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const domain: [number | string, number | string] =
    mode === 'laps' ? (clip ? [45, 150] : [40, 'auto']) : clip ? [-120, 300] : ['auto', 'auto']

  return (
    <Section
      id="laps"
      kicker="Lap by lap"
      title="Pace Chart"
      aside={
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-full border border-line p-1">
            {(['laps', 'gap'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="relative rounded-full px-4 py-1 text-sm"
              >
                {mode === m && (
                  <motion.span layoutId="mode-pill" className="absolute inset-0 rounded-full bg-white" />
                )}
                <span className={`relative ${mode === m ? 'text-ink' : 'text-muted'}`}>
                  {m === 'laps' ? 'Lap times' : `Gap to ${winner.short}`}
                </span>
              </button>
            ))}
          </div>
          <Chip active={clip} onClick={() => setClip((c) => !c)}>
            Hide disaster laps
          </Chip>
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {DRIVERS.map((d) => (
          <Chip key={d.id} active={selected.includes(d.id)} color={d.color} onClick={() => toggle(d.id)}>
            <span onMouseEnter={() => setHover(d.id)} onMouseLeave={() => setHover(null)}>
              {d.name}
            </span>
          </Chip>
        ))}
        <button onClick={() => setSelected(DRIVERS.map((d) => d.id))} className="px-2 text-sm text-muted hover:text-white">
          all
        </button>
        <button onClick={() => setSelected([])} className="px-2 text-sm text-muted hover:text-white">
          none
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass h-[460px] rounded-3xl p-2 pt-6 sm:p-6"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid stroke="#ffffff10" vertical={false} />
            <XAxis dataKey="lap" stroke="#8b8ba3" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis
              stroke="#8b8ba3"
              tickLine={false}
              axisLine={false}
              fontSize={12}
              domain={domain}
              allowDataOverflow
              tickFormatter={(v: number) => (mode === 'laps' ? fmt(v, 0) : `${v > 0 ? '+' : ''}${fmt(v, 0)}`)}
              width={50}
            />
            <Tooltip content={(p) => <Tip {...(p as TooltipContentProps<number, string>)} mode={mode} />} cursor={{ stroke: '#ffffff40' }} />
            {mode === 'laps' && (
              <ReferenceLine
                y={FASTEST.best}
                stroke="#b34dff"
                strokeDasharray="4 4"
                label={{ value: `⚡ ${fmt(FASTEST.best)}`, fill: '#d9a6ff', fontSize: 11, position: 'insideBottomRight' }}
              />
            )}
            {mode === 'gap' && <ReferenceLine y={0} stroke="#ffffff40" />}
            {DRIVERS.filter((d) => !selected.includes(d.id)).map((d) => (
              <Line
                key={`g${d.id}`}
                dataKey={`ghost${d.id}`}
                name={d.name}
                stroke="#ffffff"
                strokeOpacity={hover === d.id ? 0.6 : 0.07}
                strokeWidth={1}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
                connectNulls={false}
              />
            ))}
            {DRIVERS.filter((d) => selected.includes(d.id)).map((d) => (
              <Line
                key={d.id}
                dataKey={`d${d.id}`}
                name={d.name}
                stroke={d.color}
                strokeWidth={hover === d.id ? 4 : 2}
                strokeOpacity={hover === null || hover === d.id ? 1 : 0.3}
                dot={{ r: 3, fill: d.color, strokeWidth: 0 }}
                activeDot={{ r: 6, stroke: '#07070b', strokeWidth: 2 }}
                animationDuration={900}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
      <p className="mt-3 text-xs text-muted">
        {mode === 'laps'
          ? 'Lower is faster. Unselected drivers appear as faint ghost lines; hover a name to light theirs up.'
          : `How far behind ${winner.name} each driver was on the race clock after each lap. Above zero = behind.`}
      </p>
    </Section>
  )
}
