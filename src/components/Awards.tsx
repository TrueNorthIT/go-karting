import { motion } from 'motion/react'
import { useState } from 'react'
import { AWARDS, type Driver } from '../lib/data'
import { Avatar, Section } from './ui'

export default function Awards({ onPick }: { onPick: (d: Driver) => void }) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set())
  const flip = (i: number) =>
    setFlipped((s) => {
      const n = new Set(s)
      if (n.has(i)) n.delete(i)
      else n.add(i)
      return n
    })

  return (
    <Section
      id="awards"
      kicker="The unofficial trophies"
      title="Awards Night"
      aside={
        <button
          onClick={() => setFlipped(flipped.size === AWARDS.length ? new Set() : new Set(AWARDS.map((_, i) => i)))}
          className="rounded-full border border-line px-4 py-2 text-sm hover:border-white/30"
        >
          {flipped.size === AWARDS.length ? 'Hide all' : 'Reveal all'}
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AWARDS.map((a, i) => {
          const open = flipped.has(i)
          return (
            <motion.div
              key={a.title}
              initial={{ opacity: 0, y: 60, rotate: -4 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 120, damping: 14 }}
              className="h-56 [perspective:1000px]"
            >
              <motion.button
                onClick={() => flip(i)}
                animate={{ rotateY: open ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 90, damping: 14 }}
                whileHover={{ scale: 1.03 }}
                className="relative h-full w-full [transform-style:preserve-3d]"
                aria-label={open ? `${a.title}: ${a.driver.name}` : `Reveal ${a.title}`}
              >
                {/* front */}
                <div className="glass absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl p-5 [backface-visibility:hidden]">
                  <motion.div
                    className="text-6xl"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2 + i * 0.2, repeat: Infinity }}
                  >
                    {a.emoji}
                  </motion.div>
                  <div className="font-display text-xl uppercase">{a.title}</div>
                  <div className="text-center text-sm text-muted">{a.blurb}</div>
                  <div className="font-mono text-[10px] tracking-widest text-race uppercase">tap to reveal</div>
                </div>
                {/* back */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-hidden rounded-3xl border border-white/10 p-5 [backface-visibility:hidden] [transform:rotateY(180deg)]"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${a.driver.color}55, #101018 70%)` }}
                >
                  <div className="checker absolute inset-x-0 top-0 h-3 opacity-20" />
                  <Avatar d={a.driver} size={64} ring />
                  <div className="text-lg font-semibold">{a.driver.name}</div>
                  <div className="font-mono text-3xl font-extrabold">{a.stat}</div>
                  <span
                    role="link"
                    onClick={(e) => {
                      e.stopPropagation()
                      onPick(a.driver)
                    }}
                    className="text-xs text-muted underline-offset-4 hover:text-white hover:underline"
                  >
                    view dossier →
                  </span>
                </div>
              </motion.button>
            </motion.div>
          )
        })}
      </div>
    </Section>
  )
}
