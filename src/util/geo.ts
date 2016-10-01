/// <reference path="../../typings/tsd.d.ts" />
import * as L from 'leaflet';
import { time } from './decorators';
import { callMeMaybe } from './utilities';

interface Locatable { location: L.LatLng };

export function findClosestObject<T extends Locatable|L.LatLng>(point: L.LatLng, objects: T[]): T {
    if (objects.length < 1) {
        throw new Error('an objects array must contain at least 1 object');
    }
    let closest = objects[0];
    let closestDistance = point.distanceTo(closest['location'] || closest);
    for (let i = 1, len = objects.length; i < len; ++i) {
        const obj = objects[i];
        const tempDist = point.distanceTo(obj['location'] || obj);
        if (tempDist < closestDistance) {
            closest = objects[i];
            closestDistance = tempDist;
        }
    }
    return closest;
}

/** object must contain the 'location' field */
export function findObjectsWithinRadius<T extends Locatable>(point: L.LatLng, objects: T[], radius: number, sortArray = false): T[] {
    const arr = objects
        .map(item => ({ object: item, distance: point.distanceTo(item.location) }))
        .filter(o => o.distance <= radius);
    return (sortArray ? arr.sort((a, b) => a.distance - b.distance) : arr).map(o => o.object);
}

export function getCenter(points: L.LatLng[]): L.LatLng {
    let y = 0, x = 0;
    for (let { lat, lng } of points) {
        y += lat;
        x += lng;
    }
    return new L.LatLng(y / points.length, x / points.length);
}

type FitnessFunc = (current: L.LatLng) => number;
type OnClimb = (coordinate: L.LatLng) => void;

export function calculateGeoMean(points: L.LatLng[], fitnessFunc: FitnessFunc, minStep = 0.00001, onClimb?: OnClimb): L.LatLng {
    let point = getCenter(points);
    let fitness = fitnessFunc(point);
    callMeMaybe(onClimb, point);
    for (let step = 10; step > minStep; step *= 0.61803398875) {
        for (let max = step, lat = -max; lat <= max; lat += step) {
            for (let lng = -max; lng <= max; lng += step) {
                const pt = new L.LatLng(point.lat + lat, point.lng + lng);
                const total = fitnessFunc(pt);
                if (total < fitness) {
                    point = pt;
                    fitness = total;
                    callMeMaybe(onClimb, point);
                }
            }
        }
    }
    return point;
}