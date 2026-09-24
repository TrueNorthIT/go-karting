// Global "go to a driver" navigation, so any name anywhere can link to the dossier
// or to that driver's photos without threading callbacks through every component.
// Every open/close is mirrored into the URL hash so it can be shared (see url.ts).

import { useSyncExternalStore } from 'react'
import { DRIVERS, type Driver } from './data'
import { slug, writeHash } from './url'

let current: Driver | null = null
let photoFilter: number | null = null
const subs = new Set<() => void>()
const emit = () => subs.forEach((s) => s())
const subscribe = (fn: () => void) => {
  subs.add(fn)
  return () => {
    subs.delete(fn)
  }
}

export const driverHash = (d: Driver) => `driver/${slug(d.name)}`
export const photosHash = (d: Driver) => `photos/${slug(d.name)}`
export const driverBySlug = (s: string) => DRIVERS.find((d) => slug(d.name) === s)
export const currentDriver = () => current

export function openDriver(d: Driver, opts: { silent?: boolean } = {}) {
  const wasOpen = !!current
  current = d
  emit()
  // flipping between drivers replaces the entry so Back still closes the dossier in one go
  if (!opts.silent) writeHash(driverHash(d), wasOpen ? 'replace' : 'push')
}
export function closeDriver(opts: { silent?: boolean } = {}) {
  if (!current) return
  current = null
  emit()
  if (!opts.silent) writeHash(null, 'replace')
}
export const useOpenDriver = () => useSyncExternalStore(subscribe, () => current)

/** Jump to the Paddock filtered to one driver's photos. */
export function showDriverPhotos(d: Driver, opts: { silent?: boolean } = {}) {
  current = null
  photoFilter = d.id
  emit()
  if (!opts.silent) writeHash(photosHash(d), 'replace')
  setTimeout(() => document.getElementById('paddock')?.scrollIntoView({ behavior: 'smooth' }), 50)
}
export function setPhotoFilter(id: number | null) {
  photoFilter = id
  emit()
  const d = DRIVERS.find((x) => x.id === id)
  if (d) writeHash(photosHash(d), 'replace')
  else if (location.hash.startsWith('#photos/')) writeHash(null, 'replace')
}
export const usePhotoFilter = () => useSyncExternalStore(subscribe, () => photoFilter)
