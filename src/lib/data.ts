// Heat 48 — 15' Race at 19:30. Transcribed from the track's results sheet.
// Drivers are listed in official finishing order.

export const RACE = {
  name: 'Heat 48',
  subtitle: "15' Race at 19:30",
}

const RAW: [string, string[]][] = [
  ['Joseph Pitts', ['1:06.934', '1:08.800', '56.579', '54.832', '1:10.278', '1:20.551', '1:15.513', '1:41.628', '50.602', '2:40.175', '2:21.373', '2:32.766', '1:38.829', '1:11.568', '1:40.765', '1:16.887', '59.285', '1:17.589', '1:19.788', '1:32.582']],
  ['Muhamad Hewa Rahim', ['1:10.196', '1:29.905', '1:03.983', '1:02.138', '1:08.169', '56.487', '1:58.351', '52.756', '2:00.461', '3:18.127', '1:32.748', '1:37.410', '1:31.900', '1:57.841', '1:06.019', '1:07.525', '1:15.494', '1:23.963', '52.420', '1:21.743']],
  ['Hollie Pitts', ['1:10.714', '1:10.362', '1:05.011', '1:07.122', '1:05.705', '1:03.045', '2:12.048', '52.799', '2:28.540', '2:50.064', '2:36.630', '1:38.206', '2:00.639', '1:16.718', '1:18.749', '1:22.081', '1:22.029', '1:28.378', '55.926']],
  ['Elliot Haigh', ['1:11.470', '1:11.794', '1:03.720', '1:07.350', '1:05.216', '1:02.301', '2:04.310', '52.675', '2:00.481', '3:25.638', '2:26.682', '1:43.657', '2:05.954', '1:16.939', '1:13.740', '1:23.891', '1:21.610', '1:36.561', '55.699']],
  ['Christian Waters', ['58.354', '1:02.146', '58.678', '57.640', '5:22.433', '45.614', '1:57.986', '3:24.064', '1:26.303', '1:33.721', '1:28.288', '2:04.307', '1:03.550', '1:09.879', '1:12.297', '48.922', '1:17.263', '1:24.735', '1:15.557']],
  ['Joshua Cottrell', ['1:12.873', '1:07.117', '1:02.805', '51.941', '1:10.935', '1:11.228', '1:07.417', '1:46.363', '1:46.701', '1:40.595', '2:22.471', '2:31.380', '1:39.857', '2:02.879', '1:16.887', '1:09.270', '1:25.607', '1:24.224']],
  ['Yo Steve', ['1:10.303', '1:07.782', '1:01.243', '51.537', '1:23.596', '1:03.792', '1:07.554', '1:46.262', '1:43.700', '1:41.292', '2:21.835', '2:32.255', '1:45.071', '3:41.428', '1:11.100', '1:18.283', '1:26.224', '1:29.458']],
  ['Kade Hennessy', ['1:10.262', '1:11.680', '1:04.082', '1:04.739', '1:01.922', '58.543', '1:09.570', '1:49.312', '2:07.316', '3:14.465', '1:38.156', '1:39.537', '1:32.507', '1:57.899', '2:41.169', '1:17.534', '1:26.326', '1:31.785']],
  ['Richard Kelsey', ['1:09.120', '1:09.820', '1:01.790', '50.329', '1:12.519', '1:11.757', '2:18.373', '52.613', '2:02.778', '3:15.568', '4:46.879', '2:00.037', '1:11.909', '1:17.486', '1:20.525', '1:22.306', '1:34.641']],
  ['bogdan', ['1:13.875', '1:09.281', '1:09.361', '1:09.212', '1:10.888', '57.896', '1:59.618', '56.855', '5:30.156', '2:34.756', '1:42.493', '2:02.951', '1:20.482', '1:15.211', '1:23.276', '1:31.183', '1:50.955']],
  ['Sam', ['1:11.864', '1:11.452', '2:42.679', '1:20.517', '1:18.950', '1:49.540', '2:13.256', '3:17.151', '2:30.376', '1:46.827', '2:07.620', '1:15.815', '1:25.425', '1:19.303', '1:18.685', '1:37.162']],
  ['Abbie Heelas', ['1:20.682', '1:15.532', '1:04.479', '1:14.509', '1:22.461', '1:14.369', '1:53.969', '2:07.113', '3:21.563', '2:31.702', '1:44.551', '4:56.413', '1:26.537', '1:27.623', '1:53.740']],
  ['Alex Northam', ['1:12.800', '1:07.613', '1:20.841', '1:09.726', '1:10.209', '58.426', '2:08.113', '51.643', '2:43.987', '2:33.754', '2:39.854', '1:40.909', '7:02.105', '1:31.308', '59.919']],
  ['Tasha', ['1:28.222', '1:03.084', '3:55.111', '5:57.889', '2:49.028', '5:13.095', '1:55.043', '1:36.406', '1:24.140', '1:26.290', '1:31.362', '56.524']],
  ['Alex Radice', ['1:05.465', '1:07.363', '57.300', '53.990', '2:50.938', '2:04.473', '52.088', '2:03.013']],
]

// One identity colour per driver, used for avatars, karts and chart lines.
// Numbers/initials always accompany the colour so it's never the only cue.
const COLORS = [
  '#ff3b3b', '#ffb020', '#3987e5', '#2fd98a', '#e056fd', '#00d8ff', '#ff7a1a',
  '#9085e9', '#f5f542', '#ff5c9a', '#7cff4f', '#4fd1c5', '#c98500', '#b0b0ff', '#ff9e7a',
]

export function parseTime(t: string): number {
  const parts = t.split(':')
  return parts.length === 2 ? Number(parts[0]) * 60 + Number(parts[1]) : Number(parts[0])
}

export function fmt(s: number, digits = 3): string {
  if (!isFinite(s)) return '—'
  const m = Math.floor(s / 60)
  const rest = s - m * 60
  const r = rest.toFixed(digits).padStart(digits > 0 ? digits + 3 : 2, '0')
  return m > 0 ? `${m}:${r}` : rest.toFixed(digits)
}

export function fmtDelta(s: number): string {
  return `${s >= 0 ? '+' : '−'}${Math.abs(s).toFixed(3)}`
}

export interface Driver {
  id: number
  name: string
  short: string
  initials: string
  color: string
  position: number
  laps: number[]
  cumulative: number[]
  best: number
  bestLap: number
  worst: number
  worstLap: number
  avg: number
  median: number
  stdDev: number
  total: number
  /** laps within 110% of the driver's own best — "clean" laps */
  cleanLaps: number
  /** laps over 2 minutes — spins, crashes, pit adventures */
  chaosLaps: number
  firstHalfAvg: number
  secondHalfAvg: number
  /** stepped out before the end */
  retired?: string
}

const RETIRED: Record<string, string> = {
  'Alex Radice': 'Hurt his back and stepped out after 8 laps. Get well soon, Alex 🤕',
}

const median = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export const DRIVERS: Driver[] = RAW.map(([name, times], i) => {
  const laps = times.map(parseTime)
  const cumulative = laps.reduce<number[]>((acc, l) => [...acc, (acc.at(-1) ?? 0) + l], [])
  const best = Math.min(...laps)
  const worst = Math.max(...laps)
  const total = cumulative.at(-1)!
  const avg = total / laps.length
  const stdDev = Math.sqrt(laps.reduce((s, l) => s + (l - avg) ** 2, 0) / laps.length)
  const half = Math.ceil(laps.length / 2)
  const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length
  const parts = name.split(' ')
  return {
    id: i,
    name,
    short: parts[0],
    initials: (parts.length > 1 ? parts[0][0] + parts.at(-1)![0] : name.slice(0, 2)).toUpperCase(),
    color: COLORS[i],
    position: i + 1,
    laps,
    cumulative,
    best,
    bestLap: laps.indexOf(best) + 1,
    worst,
    worstLap: laps.indexOf(worst) + 1,
    avg,
    median: median(laps),
    stdDev,
    total,
    cleanLaps: laps.filter((l) => l <= best * 1.1).length,
    chaosLaps: laps.filter((l) => l > 120).length,
    firstHalfAvg: mean(laps.slice(0, half)),
    secondHalfAvg: mean(laps.slice(half)),
    retired: RETIRED[name],
  }
})

export const MAX_LAPS = Math.max(...DRIVERS.map((d) => d.laps.length))
export const FASTEST = DRIVERS.reduce((a, b) => (b.best < a.best ? b : a))
export const TOTAL_LAPS = DRIVERS.reduce((s, d) => s + d.laps.length, 0)
export const RACE_DURATION = Math.max(...DRIVERS.map((d) => d.total))
export const ALL_LAPS = DRIVERS.flatMap((d) => d.laps)
export const SLOWEST_LAP = Math.max(...ALL_LAPS)

export interface Award {
  emoji: string
  title: string
  blurb: string
  driver: Driver
  stat: string
}

const by = <T,>(arr: T[], f: (x: T) => number) => arr.reduce((a, b) => (f(b) < f(a) ? b : a))

export const AWARDS: Award[] = (() => {
  const rocket = FASTEST
  const metronome = by(DRIVERS, (d) => d.stdDev)
  const scenic = by(DRIVERS, (d) => -d.worst)
  const ironman = by(DRIVERS, (d) => -d.laps.length)
  const chaos = by(DRIVERS, (d) => -d.chaosLaps)
  const improver = by(DRIVERS, (d) => d.secondHalfAvg - d.firstHalfAvg)
  const clean = by(DRIVERS, (d) => -d.cleanLaps)
  const quickstart = by(DRIVERS, (d) => d.laps[0])
  return [
    { emoji: '🚀', title: 'The Rocket', blurb: 'Fastest lap of the night. Absolute send.', driver: rocket, stat: fmt(rocket.best) },
    { emoji: '⏱️', title: 'The Metronome', blurb: 'Most consistent lap times. Robot-like.', driver: metronome, stat: `σ ${metronome.stdDev.toFixed(1)}s` },
    { emoji: '🌄', title: 'Scenic Route', blurb: 'Longest single lap. Took in the views.', driver: scenic, stat: fmt(scenic.worst) },
    { emoji: '🦾', title: 'Iron Legs', blurb: 'Most laps completed. Never stopped.', driver: ironman, stat: `${ironman.laps.length} laps` },
    { emoji: '💥', title: 'Agent of Chaos', blurb: 'Most laps over 2 minutes. Pure entertainment.', driver: chaos, stat: `${chaos.chaosLaps} laps` },
    { emoji: '📈', title: 'Second Wind', blurb: 'Biggest improvement from first half to second.', driver: improver, stat: `${Math.abs(improver.secondHalfAvg - improver.firstHalfAvg).toFixed(1)}s quicker` },
    { emoji: '🧼', title: 'Squeaky Clean', blurb: 'Most laps within 10% of their own best.', driver: clean, stat: `${clean.cleanLaps} laps` },
    { emoji: '🏁', title: 'Hole Shot', blurb: 'Quickest opening lap off the line.', driver: quickstart, stat: fmt(quickstart.laps[0]) },
  ]
})()
