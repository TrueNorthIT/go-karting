import { motion } from 'motion/react'
import { DRIVERS, FASTEST, RACE_DURATION, fmt, type Driver } from '../lib/data'
import { BLACK_FLAGS, FLAGS, FLAG_STATS, RED_FLAGS, TIME_UNDER_RED } from '../lib/flags'
import { Avatar, CountUp, Section } from './ui'
import { CARNAGE } from '../lib/media'
import { openMedia } from './MediaViewer'

const VERDICTS = [
  ['Fastest lap', `${FASTEST.short} (${fmt(FASTEST.best)})`],
  ['Most common flag', 'Red 🚩'],
  ["Race control's favourite colour", 'Black ⚫'],
  ['Most popular destination', 'The pits'],
  ['Most optimistic activity', 'Overtaking'],
  ['Most misunderstood flag', 'Yellow (ask Christian) 🟨'],
  ['Actual uninterrupted racing', 'Occasionally available'],
]

function Wanted({ d, i, onPick }: { d: Driver; i: number; onPick: (d: Driver) => void }) {
  const s = FLAG_STATS[d.id]
  return (
    <motion.button
      onClick={() => onPick(d)}
      initial={{ opacity: 0, y: 60, rotate: i % 2 ? 8 : -8 }}
      whileInView={{ opacity: 1, y: 0, rotate: i % 2 ? 2 : -2 }}
      viewport={{ once: true }}
      whileHover={{ rotate: 0, scale: 1.05, y: -6 }}
      transition={{ type: 'spring', stiffness: 140, damping: 12, delay: i * 0.08 }}
      className="relative flex flex-col items-center rounded-lg bg-[#f1e4c3] p-4 pt-3 text-[#2b1d0e] shadow-[0_20px_50px_-15px_#000]"
      style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, #fff8, transparent 60%)' }}
    >
      <span className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-race shadow" />
      <div className="font-display text-3xl tracking-widest">WANTED</div>
      <div className="mb-2 font-mono text-[9px] tracking-[0.3em] uppercase">by race control</div>
      <div className="rounded-md bg-[#2b1d0e] p-1.5 grayscale-[30%] sepia-[40%]">
        <Avatar d={d} size={64} />
      </div>
      <div className="mt-2 text-center leading-tight font-semibold">{d.name}</div>
      <div className="text-center font-mono text-[10px] italic">a.k.a. “{d.nickname}”</div>
      <div className="mt-1 font-mono text-xs">
        {s.blackFlags} pit visit{s.blackFlags === 1 ? '' : 's'} · {fmt(s.pitTime, 0)} parked
      </div>
      <div className="mt-2 w-full border-t border-dashed border-[#2b1d0e]/40 pt-2 text-center font-mono text-[10px] uppercase">
        {d.id === FASTEST.id ? 'Crime: overtaking under yellow. Repeatedly.' : 'Reward: a stern talking-to'}
      </div>
    </motion.button>
  )
}

export default function RaceControl({ onPick }: { onPick: (d: Driver) => void }) {
  const mostWanted = [...DRIVERS]
    .filter((d) => FLAG_STATS[d.id].blackFlags > 0)
    .sort((a, b) => FLAG_STATS[b.id].pitTime - FLAG_STATS[a.id].pitTime)
    .slice(0, 5)
  // Christian always makes the board: fastest, and the boldest overtaker
  if (!mostWanted.some((d) => d.id === FASTEST.id)) mostWanted[mostWanted.length - 1] = FASTEST

  const stats = [
    { label: 'Red flags', value: RED_FLAGS.length, f: (n: number) => Math.round(n).toString(), color: 'text-race' },
    { label: 'Time under red', value: TIME_UNDER_RED, f: (n: number) => fmt(n, 0), color: 'text-race' },
    { label: 'Pit-lane chats', value: BLACK_FLAGS.length, f: (n: number) => Math.round(n).toString(), color: 'text-white' },
    {
      label: 'Racing actually racing',
      value: 100 * (1 - TIME_UNDER_RED / RACE_DURATION),
      f: (n: number) => `${Math.round(n)}%`,
      color: 'text-[#1faa59]',
    },
  ]

  return (
    <Section id="control" kicker="Less Formula 1, more Wacky Races" title="Race Control">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        {/* the rundown */}
        <motion.article
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="glass relative overflow-hidden rounded-3xl p-6 sm:p-8"
        >
          <div className="absolute -top-6 -right-4 rotate-12 font-display text-[8rem] leading-none text-race/10">🚩</div>
          <h3 className="relative font-display text-2xl uppercase sm:text-3xl">The rundown</h3>
          <div className="relative mt-4 space-y-4 text-white/80">
            <p>
              <b className="text-white">{FASTEST.name}</b> takes the fastest lap of the night with a blistering{' '}
              <b className="font-mono text-[#d9a6ff]">{fmt(FASTEST.best)}</b>. Small problem: he also seemed determined to
              overtake anything that moved, gap or no gap. 😂 Fastest driver? Yes. Quietest night? Absolutely not.
            </p>
            <p>
              The twist: Christian had a <b className="text-[#ffc53d]">creative reading of the yellow flag</b>. Yellow means
              slow down, no overtaking. Christian took it as more of a suggestion, and passing under yellow is what sent him
              down the pit lane most of the times he went. 🟨➡️⚫
            </p>
            <p>
              Look down the timing sheet and laps suddenly take two minutes… three… five… even seven. No, the karts didn't
              turn into mobility scooters. <b className="text-race">We had a LOT of red flags.</b> Every time things got
              flowing, someone had an incident, everything stopped, and another enormous lap time landed on the board. In the
              end the race was stopped early.
            </p>
            <p>
              Race control wasn't idle either. Bad driving or over-ambitious overtakes earned a{' '}
              <b className="text-white">⚫ black flag</b> and a trip down the pit lane for a word. For some, the evening went:
            </p>
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              {['Race', 'ambitious overtake', '⚫ black flag', 'pit-lane telling-off', 'rejoin', 'plot next overtake'].map((s, i, a) => (
                <motion.span
                  key={s}
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.15 }}
                  className="flex items-center gap-2"
                >
                  <span className={`rounded-full px-2.5 py-1 ${i === 2 ? 'bg-black text-white ring-1 ring-white/40' : 'bg-white/10'}`}>{s}</span>
                  {i < a.length - 1 ? <span className="text-race">→</span> : <span className="text-race">↺</span>}
                </motion.span>
              ))}
            </div>
            <p>
              And spare a thought for <b className="text-white">Alex Radice</b>, who hurt his back and stepped out after 8 laps. 🤕
            </p>
          </div>
        </motion.article>

        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="glass rounded-2xl p-4">
                <div className={`font-mono text-3xl font-extrabold ${s.color}`}>
                  <CountUp to={s.value} format={s.f} />
                </div>
                <div className="mt-1 text-xs tracking-widest text-muted uppercase">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="glass rounded-2xl p-5">
            <h4 className="mb-4 font-display text-lg uppercase">The final verdict</h4>
            <dl className="space-y-2">
              {VERDICTS.map(([k, v], i) => (
                <motion.div
                  key={k}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-baseline justify-between gap-4 border-b border-line/60 pb-2 text-sm last:border-0"
                >
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-semibold">{v}</dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* the whole race as a flag strip */}
      <div className="mt-10">
        <div className="mb-2 flex justify-between font-mono text-[10px] tracking-widest text-muted uppercase">
          <span>lights out</span>
          <span>the race, as race control saw it</span>
          <span>{fmt(RACE_DURATION, 0)}</span>
        </div>
        <div className="relative h-14 overflow-hidden rounded-2xl bg-[#1faa59]/30">
          {FLAGS.map((f, i) => (
            <motion.div
              key={i}
              className="absolute inset-y-0 origin-left"
              style={{
                left: `${(f.start / RACE_DURATION) * 100}%`,
                width: `${((f.end - f.start) / RACE_DURATION) * 100}%`,
                background: f.kind === 'red' ? 'repeating-linear-gradient(45deg,#ff2a3b 0 10px,#d91e2e 10px 20px)' : '#ffc53d',
              }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.5 }}
              title={f.kind === 'red' ? `Red flag #${f.n}: ${fmt(f.end - f.start, 0)}` : 'Yellow'}
            >
              {f.kind === 'red' && (
                <span className="absolute inset-0 grid place-items-center font-display text-xs text-white">#{f.n}</span>
              )}
            </motion.div>
          ))}
          {BLACK_FLAGS.map((b, i) => (
            <motion.div
              key={`${b.driver.id}-${b.lap}`}
              className="absolute bottom-1 h-3 w-3 -translate-x-1/2 rounded-full border border-white/70 bg-black"
              style={{ left: `${(b.start / RACE_DURATION) * 100}%` }}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 + i * 0.04, type: 'spring' }}
              title={`${b.driver.name}: pit visit on lap ${b.lap} (${fmt(b.duration, 0)})`}
            />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-[#1faa59]/60" /> green</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-race" /> red flag</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-[#ffc53d]" /> yellow restart</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border border-white/70 bg-black" /> someone off to the pits</span>
        </div>
      </div>

      {/* most wanted */}
      <h3 className="mt-14 mb-6 font-display text-2xl uppercase sm:text-3xl">Most wanted by race control</h3>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
        {mostWanted.map((d, i) => (
          <Wanted key={d.id} d={d} i={i} onPick={onPick} />
        ))}
      </div>
      {/* photographic evidence */}
      <h3 className="mt-14 mb-2 font-display text-2xl uppercase sm:text-3xl">Carnage cam 📸</h3>
      <p className="mb-6 text-sm text-muted">Exhibit A through {String.fromCharCode(64 + CARNAGE.length)}: why the red flag kept coming out.</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {CARNAGE.map((m, i) => (
          <motion.button
            key={m.id}
            onClick={() => openMedia(CARNAGE, i)}
            initial={{ opacity: 0, scale: 0.6, rotate: i % 2 ? 6 : -6 }}
            whileInView={{ opacity: 1, scale: 1, rotate: i % 2 ? 1.5 : -1.5 }}
            whileHover={{ scale: 1.08, rotate: 0, zIndex: 10 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 160, damping: 14, delay: i * 0.05 }}
            className="relative aspect-[3/4] overflow-hidden rounded-xl ring-2 ring-race/40"
          >
            <img src={m.thumb} alt={m.caption} loading="lazy" className="h-full w-full object-cover" />
            <span className="absolute top-1.5 left-1.5 rounded bg-race px-1.5 font-mono text-[10px] font-bold">
              {m.kind === 'video' ? '▶ ' : ''}EXHIBIT {String.fromCharCode(65 + i)}
            </span>
          </motion.button>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted">
        The timing sheet doesn't record flags, so these are reconstructed. Red flags are the five moments almost the whole field
        slowed at once; pit visits are laps still way off the pace once red-flag time is removed (black-flag chats, plus the
        odd spin).
      </p>
    </Section>
  )
}
