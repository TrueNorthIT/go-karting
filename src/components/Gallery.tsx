import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { GALLERY, type Photo } from '../lib/photos'
import { Section } from './ui'

const TILTS = [-3, 2, -1.5, 3, -2, 1.5, -2.5, 2]

function TiltCard({ p, i, onOpen }: { p: Photo; i: number; onOpen: () => void }) {
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const rx = useSpring(useTransform(my, [0, 1], [10, -10]), { stiffness: 200, damping: 20 })
  const ry = useSpring(useTransform(mx, [0, 1], [-12, 12]), { stiffness: 200, damping: 20 })
  const glareX = useTransform(mx, (v) => `${v * 100}%`)
  const glareY = useTransform(my, (v) => `${v * 100}%`)
  const glare = useTransform([glareX, glareY], ([x, y]) => `radial-gradient(circle at ${x} ${y}, #ffffff40, transparent 50%)`)

  return (
    <motion.div
      initial={{ opacity: 0, y: 80, rotate: TILTS[i % TILTS.length] * 3 }}
      whileInView={{ opacity: 1, y: 0, rotate: TILTS[i % TILTS.length] }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ type: 'spring', stiffness: 90, damping: 14, delay: (i % 4) * 0.08 }}
      className="mb-5 break-inside-avoid [perspective:900px]"
    >
      <motion.button
        onClick={onOpen}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          mx.set((e.clientX - r.left) / r.width)
          my.set((e.clientY - r.top) / r.height)
        }}
        onPointerLeave={() => {
          mx.set(0.5)
          my.set(0.5)
        }}
        style={{ rotateX: rx, rotateY: ry }}
        whileHover={{ scale: 1.04, rotate: 0, zIndex: 10 }}
        className="group relative block w-full rounded-2xl bg-white p-2.5 pb-12 text-left shadow-[0_20px_60px_-15px_#000] [transform-style:preserve-3d]"
      >
        <img
          src={p.src}
          alt={p.alt}
          loading="lazy"
          className="w-full rounded-lg object-cover"
          style={{ aspectRatio: p.ratio }}
        />
        <motion.div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100" style={{ background: glare }} />
        <div className="absolute inset-x-3 bottom-3 truncate font-[cursive] text-base text-ink/80 italic">{p.caption}</div>
      </motion.button>
    </motion.div>
  )
}

function Lightbox({ index, onClose, onNav }: { index: number | null; onClose: () => void; onNav: (d: number) => void }) {
  useEffect(() => {
    if (index === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNav(1)
      if (e.key === 'ArrowLeft') onNav(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, onClose, onNav])

  const p = index !== null ? GALLERY[index] : null
  return (
    <AnimatePresence>
      {p && index !== null && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={index}
              src={p.src}
              alt={p.alt}
              className="max-h-[80vh] max-w-full cursor-grab rounded-2xl shadow-2xl active:cursor-grabbing"
              initial={{ opacity: 0, scale: 0.85, rotate: -3 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotate: 3 }}
              transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(_, info) => {
                if (info.offset.x < -80) onNav(1)
                else if (info.offset.x > 80) onNav(-1)
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </AnimatePresence>
          <p className="mt-4 text-center text-lg">{p.caption}</p>
          <p className="font-mono text-xs text-muted">
            {index + 1} / {GALLERY.length} · swipe or ← →
          </p>
          <button onClick={onClose} className="absolute top-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Close">
            <X />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onNav(-1)
            }}
            className="absolute top-1/2 left-3 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20 sm:grid"
            aria-label="Previous photo"
          >
            <ChevronLeft />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onNav(1)
            }}
            className="absolute top-1/2 right-3 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20 sm:grid"
            aria-label="Next photo"
          >
            <ChevronRight />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function Gallery() {
  const [open, setOpen] = useState<number | null>(null)
  const nav = (d: number) => setOpen((i) => (i === null ? i : (i + d + GALLERY.length) % GALLERY.length))

  return (
    <Section id="paddock" kicker="Evidence from the night" title="The Paddock">
      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
        {GALLERY.map((p, i) => (
          <TiltCard key={p.src} p={p} i={i} onOpen={() => setOpen(i)} />
        ))}
      </div>
      <Lightbox index={open} onClose={() => setOpen(null)} onNav={nav} />
    </Section>
  )
}
