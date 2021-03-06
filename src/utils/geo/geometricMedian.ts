import { LatLng, latLng, latLngBounds } from 'leaflet'

import getCenter from './getCenter'

const DECREASE_RATE = 2 / (1 + Math.sqrt(5))

export default (
  points: LatLng[],
  fitnessFunc: (current: LatLng) => number,
  minStep = 0.00001,
  onClimb?: (coordinate: LatLng) => void,
): LatLng => {
  let point = getCenter(points)
  let fitness = fitnessFunc(point)
  const bounds = latLngBounds(points)
  const initialStep = Math.max(
    bounds.getEast() - bounds.getWest(),
    bounds.getNorth() - bounds.getSouth(),
  )
  if (onClimb) {
    onClimb(point)
  }
  for (let step = initialStep; step > minStep; step *= DECREASE_RATE) {
    const max = step
    let candidatePoint = point
    let candidateFitness = fitness
    for (let y = -max; y <= max; y += step) {
      for (let x = -max; x <= max; x += step) {
        const pt = latLng(point.lat + y, point.lng + x)
        const ft = fitnessFunc(pt)
        if (ft < candidateFitness) {
          candidatePoint = pt
          candidateFitness = ft
        }
      }
    }
    point = candidatePoint
    fitness = candidateFitness
    if (onClimb) {
      onClimb(point)
    }
  }
  return point
}
