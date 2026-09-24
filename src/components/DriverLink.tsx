import { Fragment, type ReactNode } from 'react'
import type React from 'react'
import { DRIVERS, type Driver } from '../lib/data'
import { mediaFor } from '../lib/media'
import { openDriver } from '../lib/nav'

/** A driver's name as a link to their dossier, with a 📸 badge when they're in photos. */
export function DriverLink({
  d,
  children,
  photos = true,
  className = '',
  nested = false,
}: {
  d: Driver
  children?: ReactNode
  photos?: boolean
  className?: string
  /** render as a span with link semantics, for use inside another button */
  nested?: boolean
}) {
  const n = photos ? mediaFor(d).length : 0
  const Tag = nested ? 'span' : 'button'
  return (
    <Tag
      {...(nested ? { role: 'link', tabIndex: 0 } : { type: 'button' as const })}
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation()
        openDriver(d)
      }}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (nested && e.key === 'Enter') {
          e.stopPropagation()
          openDriver(d)
        }
      }}
      className={`group/dl inline-flex items-baseline gap-1 rounded font-semibold text-white decoration-dotted underline-offset-4 hover:underline ${className}`}
      style={{ textDecorationColor: d.color }}
      title={`Open ${d.name}'s dossier${n ? ` · ${n} photo${n === 1 ? '' : 's'}` : ''}`}
    >
      <span className="inline-block h-2 w-2 shrink-0 translate-y-[-1px] self-center rounded-full" style={{ background: d.color }} />
      {children ?? d.name}
      {n > 0 && (
        <span className="self-center rounded-full bg-white/10 px-1.5 font-mono text-[10px] font-normal text-white/80 group-hover/dl:bg-white/20">
          📸{n}
        </span>
      )}
    </Tag>
  )
}

// Every way a driver gets written in the copy, longest first so "Alex Radice" wins over "Alex".
const ALIASES: [string, Driver][] = (() => {
  const out: [string, Driver][] = []
  const firstCounts = new Map<string, number>()
  DRIVERS.forEach((d) => firstCounts.set(d.short, (firstCounts.get(d.short) ?? 0) + 1))
  for (const d of DRIVERS) {
    out.push([d.name, d])
    const parts = d.name.split(' ')
    if (parts.length > 1) out.push([`${parts[0]} ${parts.at(-1)![0]}.`, d])
    if (firstCounts.get(d.short) === 1) out.push([d.short, d])
  }
  return out.sort((a, b) => b[0].length - a[0].length)
})()

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Renders plain text with every driver name turned into a DriverLink.
 * `self` lets an ambiguous first name ("Alex") resolve to the driver the text is about.
 */
export function LinkedText({ text, self, nested = false }: { text: string; self?: Driver; nested?: boolean }) {
  const aliases = self && !ALIASES.some(([a]) => a === self.short) ? [...ALIASES, [self.short, self] as [string, Driver]] : ALIASES
  const sorted = [...aliases].sort((a, b) => b[0].length - a[0].length)
  const re = new RegExp(`\\b(${sorted.map(([a]) => escape(a)).join('|')})(?![\\w])`, 'g')
  const lookup = new Map(sorted)
  const parts: ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(re)) {
    const d = lookup.get(m[0])!
    // a driver's own name in their own story stays plain text
    if (self && d.id === self.id) continue
    parts.push(text.slice(last, m.index))
    parts.push(
      <DriverLink key={m.index} d={d} photos={false} nested={nested}>
        {m[0]}
      </DriverLink>,
    )
    last = m.index! + m[0].length
  }
  parts.push(text.slice(last))
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>{p}</Fragment>
      ))}
    </>
  )
}
