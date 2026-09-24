// Shareable deep links, kept in the hash so a static host needs no rewrites:
//   #driver/<slug>   a driver's dossier
//   #photo/<id>      one photo or video in the viewer
//   #photos/<slug>   the Paddock filtered to one driver
//   #movie           Movie Night
// Plain section anchors (#podium, #replay…) keep working as normal.

export const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export const DEEP_LINK = /^#(driver\/|photo\/|photos\/|movie$)/

export function writeHash(h: string | null, mode: 'push' | 'replace' = 'push') {
  const next = h ? `#${h}` : ''
  if (next === location.hash) return
  const url = h ? next : location.pathname + location.search
  // pushState doesn't fire hashchange/popstate, so this never loops back into the router
  if (mode === 'push') history.pushState(null, '', url)
  else history.replaceState(null, '', url)
}

export const shareUrl = (h: string) => `${location.origin}${location.pathname}#${h}`

/** Native share sheet where available (phones), otherwise copy to clipboard. */
export async function share(h: string, title: string): Promise<'shared' | 'copied' | 'failed'> {
  const url = shareUrl(h)
  try {
    if (navigator.share) {
      await navigator.share({ title, url })
      return 'shared'
    }
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    try {
      await navigator.clipboard.writeText(url)
      return 'copied'
    } catch {
      return 'failed'
    }
  }
}
