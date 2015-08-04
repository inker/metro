/// <reference path="./typings/tsd.d.ts" />
'use strict';

import L = require('leaflet');
import Yadapter from './fetch-adapters/yadapter';

/** object must contain the 'location' field */
type HasLocation = {
    location: L.LatLng;
}

export function findClosestObject<T extends HasLocation>(point: L.LatLng, objects: T[]): T {
    if (objects.length < 1) {
        throw new Error('an objects array must contain at least 1 object');
    }
    let closest = objects[0];
    let closestDistance = point.distanceTo(closest.location);
    for (let i = 1; i < objects.length; ++i) {
        let tempDist = point.distanceTo(objects[i].location);
        if (tempDist < closestDistance) {
            closest = objects[i];
            closestDistance = tempDist;
        }
    }
    return closest;
}

/** object must contain the 'location' field */
export function findObjectsWithinRadius<T extends HasLocation>(point: L.LatLng, objects: T[], radius: number, sortArray = false): T[] {
    let arr = objects.filter(obj => point.distanceTo(obj.location) <= radius);
    if (sortArray) {
        arr.sort((a, b) => point.distanceTo(a.location) - point.distanceTo(b.location));
    }
    return arr;
}

export function getCenter(points: L.LatLng[]): L.LatLng {
    let cLat = 0, cLon = 0;
    for (var i = 0; i < points.length; ++i) {
        cLat += points[i].lat;
        cLon += points[i].lng;
    }
    return new L.LatLng(cLat / points.length, cLon / points.length);
}