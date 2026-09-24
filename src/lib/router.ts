// Reads the URL hash and opens whatever it points at. Runs on load and on Back/Forward.
import { closeMedia, openMedia } from '../components/MediaViewer'
import { startMovieNight, stopMovieNight } from '../components/MovieNight'
import { MEDIA } from './media'
import { closeDriver, driverBySlug, openDriver, showDriverPhotos } from './nav'

export function applyHash(hash = location.hash) {
  const [kind, arg] = hash.replace(/^#/, '').split('/')
  const quiet = { silent: true }

  if (kind === 'driver') {
    const d = driverBySlug(arg)
    closeMedia(quiet)
    stopMovieNight(quiet)
    if (d) openDriver(d, quiet)
    return
  }
  if (kind === 'photo') {
    const i = MEDIA.findIndex((m) => m.id === arg)
    stopMovieNight(quiet)
    if (i >= 0) openMedia(MEDIA, i, quiet)
    return
  }
  if (kind === 'photos') {
    const d = driverBySlug(arg)
    closeMedia(quiet)
    if (d) showDriverPhotos(d, quiet)
    return
  }
  if (kind === 'movie') {
    closeMedia(quiet)
    closeDriver(quiet)
    startMovieNight(quiet)
    return
  }
  // anything else (a section anchor or nothing): close overlays, let the browser scroll
  closeMedia(quiet)
  closeDriver(quiet)
  stopMovieNight(quiet)
}

export function startRouter() {
  applyHash()
  const onPop = () => applyHash()
  window.addEventListener('popstate', onPop)
  return () => window.removeEventListener('popstate', onPop)
}
