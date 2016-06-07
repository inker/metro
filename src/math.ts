/// <reference path="../typings/tsd.d.ts" />

import * as L from 'leaflet';

export function dot(v1: L.Point, v2: L.Point): number {
    return v1.x * v2.x + v1.y * v2.y;
}

export function angle(v1: L.Point, v2: L.Point): number {
    return dot(v1, v2) / v1.distanceTo(v2);
}

export function getCenter(pts: L.Point[]): L.Point {
    return pts.reduce((prev, cur) => prev.add(cur)).divideBy(pts.length);
}

export function getCircumcenter(positions: L.Point[]): L.Point {
    if (positions.length !== 3) {
        throw new Error('must have 3 vertices');
    }
    const first = positions[0];
    const b = positions[1].subtract(first);
    const c = positions[2].subtract(first);
    const bb = dot(b, b);
    const cc = dot(c, c);
    return new L.Point((c.y * bb - b.y * cc), (b.x * cc - c.x * bb))
        .divideBy(2.0 * (b.x * c.y - b.y * c.x))
        .add(first);
}

export function polarToCartesian(center: L.Point, radius: number, angle: number) {
    return new L.Point(center.x + radius * Math.cos(angle), center.y + radius * Math.sin(angle));
}

export function vectorToGradCoordinates(vector: L.Point) {
    const x = Math.abs(vector.x), y = Math.abs(vector.y);
    return vector.divideBy(x < y ? y : x);
}

/**
 * 
 * @param distance
 * @param maxSpeed - m/s
 * @param acceleration - m/s²
 */
export function timeToTravel(distance: number, maxSpeed: number, acceleration: number) {
    const distanceToAccelerate = maxSpeed * maxSpeed / acceleration;
    return distanceToAccelerate < distance
        ? maxSpeed / acceleration * 2 + (distance - distanceToAccelerate) / maxSpeed
        : Math.sqrt(distance / acceleration) * 2;
}