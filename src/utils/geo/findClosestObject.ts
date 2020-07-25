import { LatLng } from 'leaflet'

interface Locatable {
  location: LatLng,
}

const loc = <T extends Locatable | LatLng>(o: T) =>
  ((o as Locatable).location || o) as LatLng

export default <T extends Locatable | LatLng>(point: LatLng, objects: T[]): T => {
  const { length } = objects
  if (length < 1) {
    throw new Error('an objects array must contain at least 1 object')
  }
  let closest = objects[0]
  let closestDistance = point.distanceTo(loc(closest))
  for (let i = 1; i < length; ++i) {
    const obj = objects[i]
    const tempDist = point.distanceTo(loc(obj))
    if (tempDist < closestDistance) {
      closest = obj
      closestDistance = tempDist
    }
  }
  return closest
}
