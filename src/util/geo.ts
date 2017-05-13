import { LatLng, latLng } from 'leaflet'
import { meanBy } from 'lodash-es'

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

/** object must contain the 'location' field */
export function findObjectsWithinRadius<T extends Locatable>(
    point: LatLng,
    objects: T[],
    radius: number,
    sortArray = false,
): T[] {
    const arr = objects
        .map(item => ({ item, distance: point.distanceTo(item.location) }))
        .filter(o => o.distance <= radius)
    if (sortArray) {
        arr.sort((a, b) => a.distance - b.distance)
    }
    return arr.map(o => o.item)
}

export function getCenter(points: LatLng[]): LatLng {
    return latLng(meanBy(points, p => p.lat), meanBy(points, p => p.lng))
}

type FitnessFunc = (current: LatLng) => number
type OnClimb = (coordinate: LatLng) => void

export function calculateGeoMean(
    points: LatLng[],
    fitnessFunc: FitnessFunc,
    minStep = 0.00001,
    onClimb?: OnClimb,
): LatLng {
    let point = getCenter(points)
    let fitness = fitnessFunc(point)
    if (onClimb) {
        onClimb(point)
    }
    for (let step = 10; step > minStep; step *= 0.61803398875) {
        const max = step
        for (let lat = -max; lat <= max; lat += step) {
            for (let lng = -max; lng <= max; lng += step) {
                const pt = latLng(point.lat + lat, point.lng + lng)
                const total = fitnessFunc(pt)
                if (total < fitness) {
                    point = pt
                    fitness = total
                    if (onClimb) {
                        onClimb(point)
                    }
                }
            }
        }
    }
    return point
}
