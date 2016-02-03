import * as L from 'leaflet';

interface Locatable { location: L.LatLng };

export function findClosestObject<T extends Locatable>(point: L.LatLng, objects: T[]): T {
    if (objects.length < 1) {
        throw new Error('an objects array must contain at least 1 object');
    }
    let closest = objects[0];
    let closestDistance = point.distanceTo(closest.location);
    for (let i = 1, len = objects.length; i < len; ++i) {
        const tempDist = point.distanceTo(objects[i].location);
        if (tempDist < closestDistance) {
            closest = objects[i];
            closestDistance = tempDist;
        }
    }
    return closest;
}

/** object must contain the 'location' field */
export function findObjectsWithinRadius<T extends Locatable>(point: L.LatLng, objects: T[], radius: number, sortArray = false): T[] {
    const arr = objects.filter(obj => point.distanceTo(obj.location) <= radius);
    if (sortArray) {
        arr.sort((a, b) => point.distanceTo(a.location) - point.distanceTo(b.location));
    }
    return arr;
}

export function getCenter(points: L.LatLng[]): L.LatLng {
    let y = 0, x = 0;
    for (let { lat, lng } of points) {
        y += lat;
        x += lng;
    }
    return new L.LatLng(y / points.length, x / points.length);
}

type FitnessFunction = (coordinates: L.LatLng[], current: L.LatLng) => number;
type OnClimb = (coordinate: L.LatLng) => void;
export function calculateGeoMean(points: L.LatLng[], fitnessFunc: FitnessFunction, onClimb?: OnClimb): L.LatLng {
    console.time('geo mean');
    let point = getCenter(points);
    let fitness = fitnessFunc(points, point);
    function foo() {
        if (onClimb !== undefined) onClimb(point);
    }
    foo();
    for (let step = 10; step > 0.00000001; step *= 0.61803398875) {
        for (let max = step, lat = -max; lat <= max; lat += step) {
            for (let lng = -max; lng <= max; lng += step) {
                const pt = new L.LatLng(point.lat + lat, point.lng + lng);
                const total = fitnessFunc(points, pt);
                if (total < fitness) {
                    point = pt;
                    fitness = total;
                    foo();
                }
            }
        }
    }
    console.timeEnd('geo mean');
    return point;
}