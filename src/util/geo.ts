import { LatLng, latLng, latLngBounds } from 'leaflet'
import { meanBy } from 'lodash'

export const getCenter = (points: LatLng[]) => latLng(
    meanBy(points, p => p.lat),
    meanBy(points, p => p.lng),
)

interface Locatable {
    location: LatLng,
}

export function findClosestObject<T extends Locatable | LatLng>(point: LatLng, objects: T[]): T {
    const { length } = objects
    if (length < 1) {
        throw new Error('an objects array must contain at least 1 object')
    }
    let closest = objects[0]
    const loc = (o: T) => (o.location || o) as LatLng
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

const DECREASE_RATE = 2 / (1 + Math.sqrt(5))

export function calculateGeoMedian(
    points: LatLng[],
    fitnessFunc: (current: LatLng) => number,
    minStep = 0.00001,
    onClimb?: (coordinate: LatLng) => void,
): LatLng {
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
