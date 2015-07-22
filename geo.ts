/// <reference path="./typings/tsd.d.ts" />
'use strict';

//import L = require('leaflet');
import Yadapter = require('./fetch-adapters/yadapter');
import MetroGraph = require('./metro-graph');

//export class Coordinates {
//    private _lat: number;
//    private _lon: number;
//
//    constructor(latitude: number, longitude: number) {
//        if (latitude > 90 || latitude < -90) throw new Error('latitude (' + latitude + ') cannot exceed the -90 ~ 90 bounds');
//        if (longitude > 180 || longitude < -180) throw new Error('longitude cannot exceed the -180 ~ 180 bounds');
//        this._lat = latitude;
//        this._lon = longitude;
//    }
//
//    get lat(): number {
//        return this._lat;
//    }
//
//    get lng(): number {
//        return this._lon;
//    }
//
//    set lat(latitude: number) {
//        if (latitude > 90 || latitude < -90) throw new Error('latitude cannot exceed the -90 ~ 90 bounds');
//        this._lat = latitude;
//    }
//
//    set lng(longitude: number) {
//        if (longitude > 180 || longitude < -180) throw new Error('longitude cannot exceed the -180 ~ 180 bounds');
//        this._lon = longitude;
//    }
//
//    toString() {
//        return '{' + this._lat + ', ' + this._lon + '}';
//    }
//}

//export class LocationRad {
//    lat: number;
//    lng: number;
//
//    constructor(coors: L.LatLng) {
//        this.lat = coors.lat * Math.PI / 180;
//        this.lng = coors.lng * Math.PI / 180;
//    }
//}

//export function getDistance(start: L.LatLng, end: L.LatLng): number {
//    const p1 = new LocationRad(start), p2 = new LocationRad(end);
//    return Math.acos(
//            Math.sin(p1.lat) * Math.sin(p2.lat) +
//            Math.cos(p1.lat) * Math.cos(p2.lat) * Math.cos(p1.lng - p2.lng)
//        ) * 6378137;
//}

/** object must contain the 'location' field */
interface HasLocation extends MetroGraph.Platform {
    location: L.LatLng;
    name: string;
    description?: string
}

//type HasLocation = {location: L.LatLng;};

export function findClosestObject(point: L.LatLng, objects: HasLocation[]): HasLocation {
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
export function findObjectsInRadius(point: L.LatLng, objects: HasLocation[], radius: number, sortArray = false): HasLocation[] {
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