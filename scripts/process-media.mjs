// Turns the raw phone media in ./media into web-sized assets in ./public/media and
// writes src/lib/media.json (chronological). Run: node scripts/process-media.mjs
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import exifReader from 'exif-reader'
import ffmpeg from 'ffmpeg-static'
import ffprobe from '@ffprobe-installer/ffprobe'

const SRC = 'media'
const OUT = 'public/media'
for (const d of ['photos', 'thumbs', 'videos', 'posters']) mkdirSync(join(OUT, d), { recursive: true })

const files = readdirSync(SRC).filter((f) => /\.(jpe?g|png|mp4|mov)$/i.test(f))
const items = []

for (const f of files) {
  const src = join(SRC, f)
  const isVideo = /\.(mp4|mov)$/i.test(f)
  let taken = statSync(src).mtime.toISOString()
  if (isVideo) {
    const probe = JSON.parse(
      execFileSync(ffprobe.path, ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', src]).toString(),
    )
    taken = probe.format.tags?.creation_time ?? taken
    items.push({ kind: 'video', src, taken, duration: Number(probe.format.duration) })
  } else {
    const meta = await sharp(src).metadata()
    if (meta.exif) {
      try {
        const ex = exifReader(meta.exif)
        const d = ex.Photo?.DateTimeOriginal ?? ex.Image?.DateTime
        if (d instanceof Date) taken = d.toISOString()
      } catch {}
    }
    // WhatsApp images carry the time in their name
    const m = /(\d{4}-\d{2}-\d{2}) at (\d{2})\.(\d{2})\.(\d{2})/.exec(f)
    if (m) taken = new Date(`${m[1]}T${m[2]}:${m[3]}:${m[4]}`).toISOString()
    items.push({ kind: 'photo', src, taken })
  }
}

items.sort((a, b) => a.taken.localeCompare(b.taken) || a.src.localeCompare(b.src))

const manifest = []
let n = 0
for (const it of items) {
  const id = `m${String(++n).padStart(3, '0')}`
  if (it.kind === 'photo') {
    const photo = join(OUT, 'photos', `${id}.webp`)
    const thumb = join(OUT, 'thumbs', `${id}.webp`)
    const info = await sharp(it.src).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 72 }).toFile(photo)
    await sharp(it.src).rotate().resize({ width: 480, height: 480, fit: 'inside' }).webp({ quality: 62 }).toFile(thumb)
    manifest.push({ id, kind: 'photo', src: `/media/photos/${id}.webp`, thumb: `/media/thumbs/${id}.webp`, w: info.width, h: info.height, taken: it.taken, original: it.src.replace(/^media[\/]/, '') })
  } else {
    const video = join(OUT, 'videos', `${id}.mp4`)
    const poster = join(OUT, 'posters', `${id}.webp`)
    if (!existsSync(video)) {
      // 540px-wide portrait, H.264 + AAC, web-optimised
      execFileSync(ffmpeg, ['-y', '-v', 'error', '-i', it.src, '-vf', 'scale=540:-2', '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart', video])
    }
    const frame = join(OUT, 'posters', `${id}.jpg`)
    execFileSync(ffmpeg, ['-y', '-v', 'error', '-ss', String(Math.min(1, it.duration / 3)), '-i', video, '-frames:v', '1', frame])
    const buf = readFileSync(frame)
    unlinkSync(frame)
    const info = await sharp(buf).webp({ quality: 65 }).toFile(poster)
    manifest.push({ id, kind: 'video', src: `/media/videos/${id}.mp4`, thumb: `/media/posters/${id}.webp`, w: info.width, h: info.height, duration: Math.round(it.duration * 10) / 10, taken: it.taken, original: it.src.replace(/^media[\/]/, '') })
  }
  process.stdout.write(`${id} ${it.kind} ${it.taken}\n`)
}

writeFileSync('src/lib/media.json', JSON.stringify(manifest, null, 1))
console.log(`done: ${manifest.length} items`)
