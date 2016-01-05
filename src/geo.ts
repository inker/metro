import * as L from 'leaflet';

interface Locatable { location: L.LatLng };

export function findClosestObject<T extends Locatable>(point: L.LatLng, objects: T[]): T {
    if (objects.length < 1) {
        throw new Error('an objects array must contain at least 1 object');
    }
    let closest = objects[0];
    let closestDistance = point.distanceTo(closest.location);
    for (let i = 1; i < objects.length; ++i) {
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
    const nPoints = points.length;
    let cLat = 0, cLon = 0;
    for (let i = 0; i < nPoints; ++i) {
        cLat += points[i].lat;
        cLon += points[i].lng;
    }
    return new L.LatLng(cLat / nPoints, cLon / nPoints);
}

export function geoMean(points: L.LatLng[], lossFunction: (pts: L.LatLng[], cur: L.LatLng) => number): L.LatLng {
    let avg = getCenter(points);
    let totalDistance = Infinity;
    for (let step = 1; step > 0.00000001; step *= 0.5) {
        for (let max = step * 5, lat = -max; lat <= max; lat += step) {
            for (let lng = -5 * step; lng <= 5 * step; lng += step) {
                const pt = new L.LatLng(avg.lat + lat, avg.lng + lng);
                const total = lossFunction(points, pt);
                if (total < totalDistance) {
                    avg = pt;
                    totalDistance = total;
                }
            }
        }

    }
    return avg;
}