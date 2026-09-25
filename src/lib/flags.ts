// Race control, reconstructed. The timing sheet doesn't record flags, so these are
// inferred from what the laps show:
//
// - Red flags came out all night. The top three never went near the pit lane, so every
//   second their laps ran over pace was spent stopped under red. The windows below are the
//   fit of those three drivers' slow laps, checked against everyone else: nobody who set a
//   clean lap can have been sitting under a red flag at the same time.
// - The lap checker sits on the race lane beside the pit lane, so a kart called in for a
//   black-flag chat misses the timing line and that lap isn't counted. A pit visit shows
//   up as one recorded lap covering two (or more) laps of driving plus the time parked.

import { DRIVERS, RACE_DURATION, type Driver } from './data'

export type FlagKind = 'green' | 'yellow' | 'red' | 'chequered'

export interface FlagWindow {
  kind: 'red' | 'yellow'
  start: number
  end: number
  n?: number
}

const RED_WINDOWS: [number, number][] = [
  [62, 74],
  [464, 514],
  [626, 684],
  [714, 750],
  [780, 872],
  [940, 982],
  [1016, 1060],
  [1126, 1160],
  [1234, 1294],
  [1362, 1378],
  [1488, 1500],
  [1574, 1592],
  [1652, 1680],
]
const YELLOW_AFTER_RED = 22

export const FLAGS: FlagWindow[] = RED_WINDOWS.flatMap(([s, e], i) => [
  { kind: 'red' as const, start: s, end: e, n: i + 1 },
  // the restart runs under yellow until the next red, if that comes first
  { kind: 'yellow' as const, start: e, end: Math.min(e + YELLOW_AFTER_RED, RED_WINDOWS[i + 1]?.[0] ?? Infinity) },
])

export const RED_FLAGS = FLAGS.filter((f) => f.kind === 'red')
export const TIME_UNDER_RED = RED_FLAGS.reduce((s, f) => s + f.end - f.start, 0)

export function flagAt(t: number): { kind: FlagKind; window?: FlagWindow } {
  if (t >= RACE_DURATION - 0.01) return { kind: 'chequered' }
  const w = FLAGS.find((f) => t >= f.start && t < f.end)
  return w ? { kind: w.kind, window: w } : { kind: 'green' }
}

/** Time left over after red flags must cover this share of an extra lap before it counts as a pit visit. */
const PIT_LAP_SHARE = 0.8
/** Rough time parked per chat, used to decide how many visits a long lap held. */
const PIT_DWELL = 12

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
  /** pit visits during this recorded lap, each one a lap the timing line never saw */
  pits: number
  driveTime: number
  /** driving time per lap round the track; the kart pulls into the pits after each one */
  perLap: number
}

export interface BlackFlag {
  driver: Driver
  lap: number
  start: number
  end: number
  duration: number
}

// What the laps can't tell on their own, from people who were there.
// Christian was called in about five times. His 5:22 lap 5 is the only one with room for
// that: four quick visits fit (five laps of driving plus ~9s a chat); no other lap of his
// has room for a whole extra lap on top of the red flags in it.
const KNOWN_PITS: Record<string, Record<number, number>> = {
  'Christian Waters': { 5: 4 },
}
// Tasha wasn't in the pits much, she was just taking it steady early on.
const KNOWN_PACE: Record<string, number> = {
  Tasha: 85,
}

function pace(d: Driver) {
  if (KNOWN_PACE[d.name]) return KNOWN_PACE[d.name]
  // a green-flag lap for this driver: the average of their laps within 15% of their best
  const green = d.laps.filter((l) => l < d.best * 1.15)
  return green.reduce((s, l) => s + l, 0) / green.length
}

/** Lays out a lap: drive, stop for any red flags, and pull into the pit lane after each full lap driven. */
function layout(start: number, end: number, reds: [number, number][], redBudget: number, pits: number, dwell: number, perLap: number) {
  const phases: Phase[] = []
  let cursor = start
  let driven = 0
  let redLeft = redBudget
  let nextPit = pits > 0 ? perLap : Infinity
  let pitsLeft = pits
  const push = (kind: Phase['kind'], s: number, e: number) => {
    if (e - s < 1e-6) return
    const last = phases.at(-1)
    if (last && last.kind === kind) last.end = e
    else phases.push({ kind, start: s, end: e })
  }
  while (cursor < end - 1e-6) {
    const red = redLeft > 1e-6 ? reds.find(([, e]) => e > cursor) : undefined
    const redStart = red ? Math.max(red[0], cursor) : Infinity
    const pitAt = pitsLeft > 0 ? cursor + (nextPit - driven) : Infinity
    const stop = Math.min(redStart, pitAt, end)
    push('drive', cursor, stop)
    driven += stop - cursor
    cursor = stop
    if (cursor >= end - 1e-6) break
    if (pitAt <= redStart) {
      const out = Math.min(end, cursor + dwell)
      push('pit', cursor, out)
      cursor = out
      pitsLeft--
      nextPit += perLap
    } else {
      const out = Math.min(red![1], cursor + redLeft, end)
      push('red', cursor, out)
      redLeft -= out - cursor
      cursor = out
    }
  }
  return phases
}

function planLap(d: Driver, i: number, base: number): LapPlan {
  const start = i === 0 ? 0 : d.cumulative[i - 1]
  const end = d.cumulative[i]
  const L = end - start

  const reds = RED_WINDOWS.map(([s, e]) => [Math.max(s, start), Math.min(e, end)] as [number, number]).filter(([s, e]) => e > s)
  // never leave less than a physically possible lap of driving
  const redTime = Math.min(
    reds.reduce((s, [a, b]) => s + b - a, 0),
    Math.max(0, L - d.best * 0.97),
  )

  // anything still left over that's worth another lap or more was a pit visit (or several)
  const excess = L - redTime - base
  const known = KNOWN_PITS[d.name]?.[i + 1]
  const pits = known ?? (excess > base * PIT_LAP_SHARE ? Math.max(1, Math.floor(excess / (base + PIT_DWELL))) : 0)

  // the pit visits land after each full lap of driving, but how long a lap of driving is
  // depends on how much red-flag time the pit stops swallow, so search for the lap length
  // that makes the driving add up
  const driveOf = (phases: Phase[]) => phases.filter((p) => p.kind === 'drive').reduce((s, p) => s + p.end - p.start, 0)
  const fit = (dwell: number) => {
    let lo = 0
    let hi = L
    let perLap = L
    for (let k = 0; k < 40; k++) {
      perLap = (lo + hi) / 2
      if (driveOf(layout(start, end, reds, redTime, pits, dwell, perLap)) > (pits + 1) * perLap) lo = perLap
      else hi = perLap
    }
    return perLap
  }
  let dwell = pits ? Math.max(5, (excess - pits * base) / pits) : 0
  if (known) {
    // a known visit that overlapped a red flag: pick the stop length that keeps the driving at their usual pace
    let bestErr = Infinity
    for (let w = 5; w <= 120; w++) {
      const err = Math.abs(fit(w) - base)
      if (err < bestErr) [bestErr, dwell] = [err, w]
    }
  }
  const perLap = pits ? fit(dwell) : L
  const phases = layout(start, end, reds, redTime, pits, dwell, perLap)
  const driveTime = driveOf(phases)

  const sum = (kind: Phase['kind']) => phases.filter((p) => p.kind === kind).reduce((s, p) => s + p.end - p.start, 0)
  return {
    lap: i + 1,
    start,
    end,
    phases,
    redTime: sum('red'),
    pitTime: sum('pit'),
    pits: phases.filter((p) => p.kind === 'pit').length,
    driveTime,
    perLap: pits ? perLap : driveTime,
  }
}

export const PLANS: LapPlan[][] = DRIVERS.map((d) => {
  const base = pace(d)
  return d.laps.map((_, i) => planLap(d, i, base))
})

export const BLACK_FLAGS: BlackFlag[] = DRIVERS.flatMap((d) =>
  PLANS[d.id].flatMap((p) =>
    p.phases
      .filter((ph) => ph.kind === 'pit')
      .map((ph) => ({ driver: d, lap: p.lap, start: ph.start, end: ph.end, duration: ph.end - ph.start })),
  ),
).sort((a, b) => a.start - b.start)

export interface DriverFlagStats {
  blackFlags: number
  pitTime: number
  redTime: number
}

export const FLAG_STATS: DriverFlagStats[] = DRIVERS.map((d) => ({
  blackFlags: PLANS[d.id].reduce((s, p) => s + p.pits, 0),
  pitTime: PLANS[d.id].reduce((s, p) => s + p.pitTime, 0),
  redTime: PLANS[d.id].reduce((s, p) => s + p.redTime, 0),
}))

export type KartState =
  | { status: 'finished'; lap: number; progress: number; pos: number }
  | { status: 'drive' | 'red' | 'pit'; lap: number; progress: number; pos: number }

/**
 * Where a driver is at race time t, respecting red-flag stops and pit visits.
 * `progress` counts recorded laps (for running order); `pos` is where the kart physically
 * is around the track (0–1), which differs when a pit visit hid a lap from the timing line.
 */
export function kartAt(d: Driver, t: number): KartState {
  const k = d.cumulative.findIndex((c) => c > t)
  if (k === -1) return { status: 'finished', lap: d.laps.length, progress: d.laps.length, pos: 0 }
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
  // which trip round the track this is: one per pit visit, then the one to the line
  const seg = Math.min(Math.floor(driven / plan.perLap), plan.pits)
  const segLen = seg < plan.pits ? plan.perLap : plan.driveTime - plan.pits * plan.perLap
  const pos = segLen > 0 ? Math.min((driven - seg * plan.perLap) / segLen, 0.9999) : 0
  return { status, lap: k, progress: k + frac, pos }
}
