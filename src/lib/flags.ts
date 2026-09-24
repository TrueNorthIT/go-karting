// Race control, reconstructed. The timing sheet doesn't record flags, so these are
// inferred: a red flag is a window where almost the whole field's laps balloon at the
// same moment; a black flag is a lap that's still way off the pace once any red-flag
// time is taken out (i.e. that driver was parked in the pit lane getting a talking-to).

import { DRIVERS, RACE_DURATION, type Driver } from './data'

export type FlagKind = 'green' | 'yellow' | 'red' | 'chequered'

export interface FlagWindow {
  kind: 'red' | 'yellow'
  start: number
  end: number
  n?: number
}

const RED_WINDOWS: [number, number][] = [
  [475, 525],
  [620, 675],
  [765, 890],
  [960, 1040],
  [1210, 1265],
]
const YELLOW_AFTER_RED = 22

export const FLAGS: FlagWindow[] = RED_WINDOWS.flatMap(([s, e], i) => [
  { kind: 'red' as const, start: s, end: e, n: i + 1 },
  { kind: 'yellow' as const, start: e, end: e + YELLOW_AFTER_RED },
])

export const RED_FLAGS = FLAGS.filter((f) => f.kind === 'red')
export const TIME_UNDER_RED = RED_FLAGS.reduce((s, f) => s + f.end - f.start, 0)

export function flagAt(t: number): { kind: FlagKind; window?: FlagWindow } {
  if (t >= RACE_DURATION - 0.01) return { kind: 'chequered' }
  const w = FLAGS.find((f) => t >= f.start && t < f.end)
  return w ? { kind: w.kind, window: w } : { kind: 'green' }
}

/** Anything left over after red-flag time beyond this is treated as a pit visit. */
const PIT_THRESHOLD = 28

export interface Phase {
  kind: 'drive' | 'red' | 'pit'
  start: number
  end: number
}

export interface LapPlan {
  lap: number
  start: number
  end: number
  phases: Phase[]
  redTime: number
  pitTime: number
  driveTime: number
}

export interface BlackFlag {
  driver: Driver
  lap: number
  start: number
  end: number
  duration: number
}

function pace(d: Driver) {
  // a "normal" racing lap for this driver: lower quartile of their laps
  return [...d.laps].sort((a, b) => a - b)[Math.floor(d.laps.length * 0.25)]
}

function planLap(d: Driver, i: number, base: number): LapPlan {
  const start = i === 0 ? 0 : d.cumulative[i - 1]
  const end = d.cumulative[i]
  const L = end - start

  const reds = RED_WINDOWS.map(([s, e]) => [Math.max(s, start), Math.min(e, end)] as const).filter(([s, e]) => e > s)
  let redTime = reds.reduce((s, [a, b]) => s + b - a, 0)
  // never leave less than a physically possible lap of driving
  const minDrive = Math.min(L, base * 0.8)
  if (L - redTime < minDrive) redTime = L - minDrive

  const excess = L - redTime - base
  const pitTime = excess > PIT_THRESHOLD ? excess : 0

  const phases: Phase[] = []
  let cursor = start
  // pit lane is right after the start/finish line, so a pit visit comes first
  if (pitTime > 0) {
    phases.push({ kind: 'pit', start: cursor, end: cursor + pitTime })
    cursor += pitTime
  }
  let redLeft = redTime
  for (const [s, e] of reds) {
    if (redLeft <= 0) break
    const rs = Math.max(s, cursor)
    const re = Math.min(e, rs + redLeft)
    if (re <= rs) continue
    if (rs > cursor) phases.push({ kind: 'drive', start: cursor, end: rs })
    phases.push({ kind: 'red', start: rs, end: re })
    redLeft -= re - rs
    cursor = re
  }
  if (cursor < end) phases.push({ kind: 'drive', start: cursor, end })

  const driveTime = phases.filter((p) => p.kind === 'drive').reduce((s, p) => s + p.end - p.start, 0)
  return { lap: i + 1, start, end, phases, redTime, pitTime, driveTime }
}

export const PLANS: LapPlan[][] = DRIVERS.map((d) => {
  const base = pace(d)
  return d.laps.map((_, i) => planLap(d, i, base))
})

export const BLACK_FLAGS: BlackFlag[] = DRIVERS.flatMap((d) =>
  PLANS[d.id]
    .filter((p) => p.pitTime > 0)
    .map((p) => ({ driver: d, lap: p.lap, start: p.start, end: p.start + p.pitTime, duration: p.pitTime })),
).sort((a, b) => a.start - b.start)

export interface DriverFlagStats {
  blackFlags: number
  pitTime: number
  redTime: number
}

export const FLAG_STATS: DriverFlagStats[] = DRIVERS.map((d) => ({
  blackFlags: PLANS[d.id].filter((p) => p.pitTime > 0).length,
  pitTime: PLANS[d.id].reduce((s, p) => s + p.pitTime, 0),
  redTime: PLANS[d.id].reduce((s, p) => s + p.redTime, 0),
}))

export type KartState =
  | { status: 'finished'; lap: number; progress: number }
  | { status: 'drive' | 'red' | 'pit'; lap: number; progress: number }

/** Where a driver is on the lap at race time t, respecting red-flag stops and pit visits. */
export function kartAt(d: Driver, t: number): KartState {
  const k = d.cumulative.findIndex((c) => c > t)
  if (k === -1) return { status: 'finished', lap: d.laps.length, progress: d.laps.length }
  const plan = PLANS[d.id][k]
  let driven = 0
  let status: 'drive' | 'red' | 'pit' = 'drive'
  for (const ph of plan.phases) {
    if (t < ph.start) break
    const upto = Math.min(t, ph.end)
    if (ph.kind === 'drive') driven += upto - ph.start
    if (t < ph.end) {
      status = ph.kind
      break
    }
  }
  const frac = plan.driveTime > 0 ? Math.min(driven / plan.driveTime, 0.9999) : 0
  return { status, lap: k, progress: k + frac }
}
