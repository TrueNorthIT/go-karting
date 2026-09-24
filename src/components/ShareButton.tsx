import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Check, Share2 } from 'lucide-react'
import { share } from '../lib/url'

export default function ShareButton({ hash, title, label = 'Share' }: { hash: string; title: string; label?: string }) {
  const [done, setDone] = useState<string | null>(null)
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={async (e) => {
        e.stopPropagation()
        const r = await share(hash, title)
        if (r === 'copied') setDone('Link copied!')
        else if (r === 'failed') setDone('Couldn’t copy')
        if (r !== 'shared') setTimeout(() => setDone(null), 1800)
      }}
      className="flex h-11 items-center gap-2 rounded-full bg-white/10 px-4 text-sm backdrop-blur hover:bg-white/20"
      aria-label="Share a link to this"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={done ?? 'idle'}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -8, opacity: 0 }}
          className="flex items-center gap-2"
        >
          {done ? <Check size={16} /> : <Share2 size={16} />}
          {done ?? label}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
