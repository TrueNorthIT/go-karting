import squad from '../assets/photos/squad.webp'
import photobomb from '../assets/photos/photobomb.webp'
import postRace from '../assets/photos/post-race.webp'
import trophy from '../assets/photos/trophy.webp'
import podiumHug from '../assets/photos/podium-hug.webp'
import podiumHug2 from '../assets/photos/podium-hug-2.webp'
import podiumPose from '../assets/photos/podium-pose.webp'
import podiumFlex from '../assets/photos/podium-flex.webp'

export interface Photo {
  src: string
  alt: string
  caption: string
  /** width / height */
  ratio: number
}

export const PHOTOS = {
  squad: { src: squad, alt: 'The whole crew in race suits in the paddock corridor', caption: 'The grid. Fifteen suits, one helmet.', ratio: 4 / 3 },
  photobomb: { src: photobomb, alt: 'A bald racer glaring menacingly between two grinning drivers', caption: 'Photobomb of the night. We are all a little scared.', ratio: 2048 / 946 },
  postRace: { src: postRace, alt: 'Sweaty drivers chatting straight after the race', caption: 'Helmet hair, adrenaline, excuses already loading.', ratio: 4 / 3 },
  trophy: { src: trophy, alt: 'The winner beaming while holding the winner trophy', caption: 'Pure, unfiltered joy. Deserved.', ratio: 3 / 4 },
  podiumHug: { src: podiumHug, alt: 'Top three hugging with their trophies in front of a chequered wall', caption: 'Top three, trophies in hand.', ratio: 4 / 3 },
  podiumHug2: { src: podiumHug2, alt: 'Top three hugging, second take', caption: 'Take two. Same grins.', ratio: 4 / 3 },
  podiumPose: { src: podiumPose, alt: 'Winner striking a pose on the top step of the podium', caption: 'The pose. Practised? Absolutely.', ratio: 4 / 3 },
  podiumFlex: { src: podiumFlex, alt: 'Top three flexing on the podium steps', caption: 'Flex on the steps.', ratio: 4 / 3 },
} satisfies Record<string, Photo>

export const PODIUM_PHOTOS: Photo[] = [PHOTOS.podiumFlex, PHOTOS.podiumPose, PHOTOS.podiumHug, PHOTOS.trophy]

export const GALLERY: Photo[] = [
  PHOTOS.squad,
  PHOTOS.photobomb,
  PHOTOS.trophy,
  PHOTOS.postRace,
  PHOTOS.podiumFlex,
  PHOTOS.podiumHug,
  PHOTOS.podiumPose,
  PHOTOS.podiumHug2,
]
