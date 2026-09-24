// Race Radio: a tiny WebAudio sequencer playing original, deliberately cheesy race tunes.
// No audio files; everything is synthesized. The replay nudges the "mood" so the
// music reacts to flags (red flag = muffled, slowed, pitched down).

export type Mood = 'green' | 'yellow' | 'red' | 'chequered'

interface Song {
  title: string
  vibe: string
  bpm: number
  /** 16 steps per bar; one entry per bar: [root midi, 'maj' | 'min'] */
  chords: [number, 'maj' | 'min'][]
  /** semitone offsets from the bar's root per 16th ('.' rest) */
  bass: string
  /** melody tokens per 16th: note name, '-' hold, '.' rest; loops over the chord bars */
  lead: string
  leadWave: OscillatorType
  kick: string
  snare: string
  hat: string
  stabs: string
}

const SONGS: Song[] = [
  {
    title: 'Turbo Cheese',
    vibe: 'Eurobeat · 156 bpm',
    bpm: 156,
    chords: [[45, 'min'], [41, 'maj'], [43, 'maj'], [40, 'min']],
    bass: '0 12 0 12 0 12 0 12 0 12 0 12 0 12 0 12',
    lead:
      'A5 - E5 - A5 - B5 C6 - B5 A5 - G5 - E5 - ' +
      'F5 - A5 - C6 - A5 G5 - F5 - E5 - C5 - ' +
      'G5 - B5 - D6 - B5 G5 - A5 - B5 - D6 - ' +
      'E6 - - - D6 - C6 - B5 - - - G#5 - - - ',
    leadWave: 'sawtooth',
    kick: 'x . . . x . . . x . . . x . . .',
    snare: '. . . . x . . . . . . . x . . .',
    hat: '. . x . . . x . . . x . . . x .',
    stabs: '. . x . . x . . . . x . . x . .',
  },
  {
    title: 'Pit Lane Boogie',
    vibe: 'Disco · 124 bpm',
    bpm: 124,
    chords: [[48, 'maj'], [45, 'min'], [41, 'maj'], [43, 'maj']],
    bass: '0 . 12 . 0 . 12 7 0 . 12 . 10 . 12 .',
    lead:
      'E5 - - G5 - - C6 - B5 - A5 - G5 - - - ' +
      'E5 - - A5 - - C6 - E6 - D6 - C6 - - - ' +
      'F5 - - A5 - - C6 - D6 - C6 - A5 - - - ' +
      'G5 - B5 - D6 - F6 - E6 - D6 - B5 - - - ',
    leadWave: 'square',
    kick: 'x . . . x . . . x . . . x . . .',
    snare: '. . . . x . . . . . . . x . . x',
    hat: '. . x . . . x . . . x . . . x x',
    stabs: '. . . x . . x . . . . x . . x .',
  },
  {
    title: 'Chequered Chiptune',
    vibe: '8-bit · 172 bpm',
    bpm: 172,
    chords: [[40, 'min'], [36, 'maj'], [38, 'maj'], [35, 'maj']],
    bass: '0 . 0 12 0 . 0 12 0 . 0 12 0 7 5 3',
    lead:
      'E5 G5 B5 E6 B5 G5 E5 G5 B5 E6 G6 E6 D6 B5 G5 B5 ' +
      'C5 E5 G5 C6 G5 E5 C5 E5 G5 C6 E6 C6 B5 G5 E5 G5 ' +
      'D5 F#5 A5 D6 A5 F#5 D5 F#5 A5 D6 F#6 D6 C#6 A5 F#5 A5 ' +
      'B4 D#5 F#5 B5 F#5 D#5 B4 D#5 F#5 B5 D#6 B5 A5 F#5 D#5 F#5',
    leadWave: 'square',
    kick: 'x . . x x . . . x . . x x . . .',
    snare: '. . . . x . . . . . . . x . x .',
    hat: 'x . x . x . x . x . x . x . x .',
    stabs: '. . . . . . . . . . . . . . . .',
  },
]

export const SONG_LIST = SONGS.map((s) => ({ title: s.title, vibe: s.vibe }))

const NOTE: Record<string, number> = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 }
const midi = (name: string) => {
  const m = /^([A-G]#?)(\d)$/.exec(name)
  return m ? NOTE[m[1]] + (Number(m[2]) + 1) * 12 : null
}
const hz = (m: number) => 440 * 2 ** ((m - 69) / 12)
const steps = (s: string) => s.trim().split(/\s+/)

type Listener = () => void

class RaceRadio {
  ctx: AudioContext | null = null
  master!: GainNode
  filter!: BiquadFilterNode
  analyser!: AnalyserNode
  noise!: AudioBuffer
  playing = false
  song = 0
  mood: Mood = 'green'
  private step = 0
  private nextTime = 0
  private timer = 0
  private listeners = new Set<Listener>()
  beat = 0

  subscribe(fn: Listener) {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }
  private emit() {
    this.listeners.forEach((l) => l())
  }

  private init() {
    if (this.ctx) return
    const ctx = new AudioContext()
    this.ctx = ctx
    this.master = ctx.createGain()
    this.master.gain.value = 0.32
    this.filter = ctx.createBiquadFilter()
    this.filter.type = 'lowpass'
    this.filter.frequency.value = 18000
    this.analyser = ctx.createAnalyser()
    this.analyser.fftSize = 64
    this.master.connect(this.filter).connect(this.analyser).connect(ctx.destination)
    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = this.noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }

  play() {
    this.init()
    void this.ctx!.resume()
    if (this.playing) return
    this.playing = true
    this.step = 0
    this.nextTime = this.ctx!.currentTime + 0.06
    this.timer = window.setInterval(() => this.schedule(), 25)
    this.emit()
  }

  stop() {
    this.playing = false
    clearInterval(this.timer)
    this.emit()
  }

  toggle() {
    if (this.playing) this.stop()
    else this.play()
  }

  setSong(i: number) {
    this.song = (i + SONGS.length) % SONGS.length
    this.step = 0
    this.emit()
  }

  setMood(m: Mood) {
    if (m === this.mood) return
    const prev = this.mood
    this.mood = m
    if (this.ctx) {
      const now = this.ctx.currentTime
      const f = m === 'red' ? 380 : m === 'yellow' ? 1400 : 18000
      this.filter.frequency.cancelScheduledValues(now)
      this.filter.frequency.setTargetAtTime(f, now, m === 'green' ? 0.15 : 0.08)
      if (this.playing && m === 'red' && prev !== 'red') this.scratch()
      if (this.playing && m === 'chequered') this.fanfare()
    }
    this.emit()
  }

  private get tempoScale() {
    return this.mood === 'red' ? 0.62 : 1
  }
  private get pitch() {
    return this.mood === 'red' ? 0.9 : 1
  }

  private schedule() {
    const ctx = this.ctx!
    const song = SONGS[this.song]
    while (this.nextTime < ctx.currentTime + 0.12) {
      this.playStep(song, this.step, this.nextTime)
      const sixteenth = 60 / (song.bpm * this.tempoScale) / 4
      this.nextTime += sixteenth
      this.step++
    }
  }

  private playStep(song: Song, step: number, t: number) {
    const s16 = step % 16
    const bar = Math.floor(step / 16) % song.chords.length
    const [root, quality] = song.chords[bar]
    const sixteenth = 60 / (song.bpm * this.tempoScale) / 4

    if (s16 % 4 === 0) {
      this.beat++
      const delay = Math.max(0, (t - this.ctx!.currentTime) * 1000)
      setTimeout(() => this.emit(), delay)
    }

    if (steps(song.kick)[s16] === 'x') this.kick(t)
    if (steps(song.snare)[s16] === 'x') this.snare(t)
    if (steps(song.hat)[s16] === 'x') this.hat(t)

    const b = steps(song.bass)[s16]
    if (b && b !== '.') this.bass(hz(root - 12 + Number(b)) * this.pitch, t, sixteenth * 0.9)

    if (steps(song.stabs)[s16] === 'x') {
      const third = quality === 'maj' ? 4 : 3
      ;[0, third, 7].forEach((iv) => this.stab(hz(root + 12 + iv) * this.pitch, t, sixteenth * 0.8))
    }

    const lead = steps(song.lead)
    const li = step % lead.length
    const n = midi(lead[li])
    if (n !== null) {
      let len = 1
      while (lead[(li + len) % lead.length] === '-') len++
      this.leadNote(hz(n) * this.pitch, t, sixteenth * len * 0.95, song.leadWave)
    }
  }

  private env(t: number, peak: number, decay: number) {
    const g = this.ctx!.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(peak, t + 0.005)
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay)
    g.connect(this.master)
    return g
  }

  private kick(t: number) {
    const o = this.ctx!.createOscillator()
    o.frequency.setValueAtTime(150, t)
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12)
    o.connect(this.env(t, 0.9, 0.25))
    o.start(t)
    o.stop(t + 0.3)
  }

  private noiseHit(t: number, type: BiquadFilterType, freq: number, peak: number, decay: number) {
    const src = this.ctx!.createBufferSource()
    src.buffer = this.noise
    const f = this.ctx!.createBiquadFilter()
    f.type = type
    f.frequency.value = freq
    src.connect(f).connect(this.env(t, peak, decay))
    src.start(t)
    src.stop(t + decay + 0.02)
  }

  private snare(t: number) {
    this.noiseHit(t, 'bandpass', 1800, 0.5, 0.16)
  }
  private hat(t: number) {
    this.noiseHit(t, 'highpass', 8000, 0.14, 0.05)
  }

  private bass(f: number, t: number, d: number) {
    const o = this.ctx!.createOscillator()
    o.type = 'sawtooth'
    o.frequency.value = f
    const lp = this.ctx!.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(1600, t)
    lp.frequency.exponentialRampToValueAtTime(200, t + d)
    o.connect(lp).connect(this.env(t, 0.35, d))
    o.start(t)
    o.stop(t + d + 0.02)
  }

  private stab(f: number, t: number, d: number) {
    const o = this.ctx!.createOscillator()
    o.type = 'sawtooth'
    o.frequency.value = f
    o.connect(this.env(t, 0.06, d))
    o.start(t)
    o.stop(t + d + 0.02)
  }

  private leadNote(f: number, t: number, d: number, wave: OscillatorType) {
    // two slightly detuned oscillators = instant cheese
    ;[-7, 7].forEach((cents) => {
      const o = this.ctx!.createOscillator()
      o.type = wave
      o.frequency.value = f
      o.detune.value = cents
      const g = this.ctx!.createGain()
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.07, t + 0.01)
      g.gain.setValueAtTime(0.07, t + Math.max(0.02, d - 0.05))
      g.gain.exponentialRampToValueAtTime(0.0001, t + d)
      o.connect(g).connect(this.master)
      o.start(t)
      o.stop(t + d + 0.02)
    })
  }

  /** the classic "record scratch / tape stop" when the red flag comes out */
  private scratch() {
    const ctx = this.ctx!
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(900, t)
    o.frequency.exponentialRampToValueAtTime(60, t + 0.45)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.18, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
    o.connect(g).connect(ctx.destination)
    o.start(t)
    o.stop(t + 0.55)
  }

  private fanfare() {
    const t = this.ctx!.currentTime + 0.05
    ;[
      [72, 0, 0.18],
      [76, 0.18, 0.18],
      [79, 0.36, 0.18],
      [84, 0.54, 0.7],
    ].forEach(([n, at, d]) => this.leadNote(hz(n), t + at, d, 'square'))
  }

  levels(out: Uint8Array<ArrayBuffer>) {
    if (!this.ctx) return out.fill(0)
    this.analyser.getByteFrequencyData(out)
    return out
  }
}

export const radio = new RaceRadio()
