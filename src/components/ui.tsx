import { animate, motion, useInView, useMotionValue, useTransform } from 'motion/react'
import { useEffect, useRef, type ReactNode } from 'react'
import type { Driver } from '../lib/data'

export function Avatar({ d, size = 40, ring = false }: { d: Driver; size?: number; ring?: boolean }) {
  return (
    <div
      className="relative grid shrink-0 place-items-center rounded-full font-display text-ink"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 25%, #fff8, transparent 55%), ${d.color}`,
        fontSize: size * 0.36,
        boxShadow: ring ? `0 0 0 3px #07070b, 0 0 0 5px ${d.color}, 0 0 24px ${d.color}88` : undefined,
      }}
    >
      {d.initials}
    </div>
  )
}

export function Section({
  id,
  kicker,
  title,
  children,
  aside,
}: {
  id: string
  kicker: string
  title: string
  children: ReactNode
  aside?: ReactNode
}) {
  return (
    <section id={id} className="relative mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="mb-2 flex items-center gap-3 font-mono text-xs font-semibold tracking-[0.3em] text-race uppercase"
          >
            <span className="h-px w-10 bg-race" />
            {kicker}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 120, damping: 16 }}
            className="font-display text-4xl uppercase sm:text-6xl"
          >
            {title}
          </motion.h2>
        </div>
        {aside}
      </div>
      {children}
    </section>
  )
}

export function CountUp({ to, format = (n) => Math.round(n).toString(), duration = 1.6 }: {
  to: number
  format?: (n: number) => string
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const mv = useMotionValue(0)
  const text = useTransform(mv, format)
  useEffect(() => {
    if (!inView) return
    const c = animate(mv, to, { duration, ease: [0.16, 1, 0.3, 1] })
    return () => c.stop()
  }, [inView, to, duration, mv])
  return <motion.span ref={ref} className="tabular">{text}</motion.span>
}

export function Chip({ active, color, onClick, children }: {
  active: boolean
  color?: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
        active ? 'border-white/30 bg-white/10 text-white' : 'border-line text-muted hover:border-white/20 hover:text-white'
      }`}
    >
      {color && (
        <span
          className="h-2.5 w-2.5 rounded-full transition-opacity"
          style={{ background: color, opacity: active ? 1 : 0.35 }}
        />
      )}
      {children}
    </motion.button>
  )
}
