import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { AWARDS, DRIVERS, FASTEST, fmt, fmtDelta, type Driver } from '../lib/data'
import { Avatar } from './ui'

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panel-2/60 p-3">
      <div className="text-[10px] tracking-widest text-muted uppercase">{label}</div>
      <div className="font-mono text-xl font-extrabold tabular">{value}</div>
      {sub && <div className="text-xs text-muted">{sub}</div>}
    </div>
  )
}

function vibe(d: Driver): string {
  const trend = d.secondHalfAvg - d.firstHalfAvg
  if (d.id === FASTEST.id) return 'Raw speed merchant. When it clicks, nobody touches them.'
  if (d.position === 1) return 'Race winner. Kept it pinned when it mattered.'
  if (d.chaosLaps >= 5) return 'Chaos enjoyer. Came for the laps, stayed for the drama.'
  if (trend < -10) return 'Slow starter, strong finisher. Found the groove late.'
  if (d.stdDev < 20) return 'Smooth operator. Lap after lap after lap.'
  return 'Solid racer with flashes of real pace.'
}

export default function DriverDrawer({ driver, onClose, onPick }: {
  driver: Driver | null
  onClose: () => void
  onPick: (d: Driver) => void
}) {
  useEffect(() => {
    if (!driver) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onPick(DRIVERS[(driver.id + 1) % DRIVERS.length])
      if (e.key === 'ArrowLeft') onPick(DRIVERS[(driver.id - 1 + DRIVERS.length) % DRIVERS.length])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [driver, onClose, onPick])

  const trophies = driver ? AWARDS.filter((a) => a.driver.id === driver.id) : []
  const maxLap = driver ? Math.min(Math.max(...driver.laps), 200) : 1

  return (
    <AnimatePresence>
      {driver && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="scrollbar-thin fixed inset-y-0 right-0 z-50 w-full max-w-xl overflow-y-auto border-l border-line bg-ink"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            role="dialog"
            aria-label={`${driver.name} stats`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={driver.id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className="relative overflow-hidden p-6 pb-8"
                  style={{ background: `linear-gradient(160deg, ${driver.color}55, transparent 60%)` }}
                >
                  <div className="absolute -right-6 -bottom-10 font-display text-[12rem] leading-none text-white/5">
                    P{driver.position}
                  </div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex gap-1">
                      <button
                        onClick={() => onPick(DRIVERS[(driver.id - 1 + DRIVERS.length) % DRIVERS.length])}
                        className="grid h-9 w-9 place-items-center rounded-full border border-line hover:bg-white/10"
                        aria-label="Previous driver"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={() => onPick(DRIVERS[(driver.id + 1) % DRIVERS.length])}
                        className="grid h-9 w-9 place-items-center rounded-full border border-line hover:bg-white/10"
                        aria-label="Next driver"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                    <button
                      onClick={onClose}
                      className="grid h-9 w-9 place-items-center rounded-full border border-line hover:bg-white/10"
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="relative mt-6 flex items-center gap-5">
                    <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring' }}>
                      <Avatar d={driver} size={84} ring />
                    </motion.div>
                    <div>
                      <div className="font-mono text-xs tracking-widest text-muted uppercase">
                        Finished P{driver.position} of {DRIVERS.length}
                      </div>
                      <h3 className="font-display text-3xl uppercase sm:text-4xl">{driver.name}</h3>
                      <p className="mt-1 text-sm text-white/70">{vibe(driver)}</p>
                    </div>
                  </div>
                  {trophies.length > 0 && (
                    <div className="relative mt-4 flex flex-wrap gap-2">
                      {trophies.map((t) => (
                        <span key={t.title} className="rounded-full bg-black/40 px-3 py-1 text-xs">
                          {t.emoji} {t.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 px-6 sm:grid-cols-3">
                  <Stat label="Best lap" value={fmt(driver.best)} sub={`on lap ${driver.bestLap}`} />
                  <Stat label="Average" value={fmt(driver.avg)} />
                  <Stat label="Median" value={fmt(driver.median)} sub="typical lap" />
                  <Stat label="Laps" value={`${driver.laps.length}`} sub={`${fmt(driver.total, 0)} on track`} />
                  <Stat label="Consistency" value={`σ ${driver.stdDev.toFixed(1)}s`} sub={`${driver.cleanLaps} clean laps`} />
                  <Stat
                    label="Gap to FL"
                    value={driver.id === FASTEST.id ? 'Fastest' : `+${(driver.best - FASTEST.best).toFixed(3)}`}
                    sub={driver.id === FASTEST.id ? '⚡ of the night' : FASTEST.short}
                  />
                  <Stat label="Worst lap" value={fmt(driver.worst)} sub={`lap ${driver.worstLap} 😬`} />
                  <Stat label="Chaos laps" value={`${driver.chaosLaps}`} sub="over 2 minutes" />
                  <Stat
                    label="2nd half"
                    value={`${fmtDelta(driver.secondHalfAvg - driver.firstHalfAvg)}s`}
                    sub={driver.secondHalfAvg < driver.firstHalfAvg ? 'got quicker' : 'faded'}
                  />
                </div>

                <div className="p-6">
                  <h4 className="mb-3 font-display text-lg uppercase">Every lap</h4>
                  <div className="space-y-1.5">
                    {driver.laps.map((l, i) => {
                      const pb = i + 1 === driver.bestLap
                      return (
                        <div key={i} className="flex items-center gap-3 font-mono text-xs">
                          <span className="w-6 text-right text-muted">{i + 1}</span>
                          <div className="relative h-5 flex-1 overflow-hidden rounded-[4px] bg-panel-2">
                            <motion.div
                              className="h-full rounded-[4px]"
                              style={{ background: pb ? '#d4ff3a' : driver.color, opacity: pb ? 1 : 0.75 }}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(l / maxLap, 1) * 100}%` }}
                              transition={{ delay: 0.1 + i * 0.03, type: 'spring', stiffness: 120, damping: 18 }}
                            />
                            {l > maxLap && (
                              <span className="absolute top-0 right-1 leading-5 text-white">off the chart →</span>
                            )}
                          </div>
                          <span className={`w-16 text-right tabular ${pb ? 'font-bold text-volt' : ''}`}>{fmt(l)}</span>
                        </div>
                      )
                    })}
                  </div>
                  <p className="mt-6 text-center font-mono text-[10px] text-muted">← → to flip between drivers · esc to close</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
