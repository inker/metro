import { Point, point } from 'leaflet'

export function dot(v1: Point, v2: Point): number {
    return v1.x * v2.x + v1.y * v2.y
}

export function det(v1: Point, v2: Point): number {
    return v1.x * v2.y - v2.x * v1.y
}

export function normalize(v: Point): Point {
    return v.divideBy(Math.sqrt(dot(v, v)))
}

export function bisectrix(v1: Point, v2: Point): Point {
    const v1n = normalize(v1)
    const v2n = normalize(v2)
    return normalize(v1n.add(v2n))
}

export function orthogonal(source: Point, target: Point): Point[] {
    const v = target.subtract(source)
    return [
        point(-v.y, v.x).add(source),
        point(v.y, -v.x).add(source),
    ]
}

export function wings(a: Point, b: Point, c: Point, length = 1): Point[] {
    const ba = a.subtract(b)
    const bc = c.subtract(b)
    const s = det(ba, bc)
    const bis = bisectrix(ba, bc).multiplyBy(s > 0 ? -length : length)
    if (Number.isNaN(bis.x) || Number.isNaN(bis.y)) {
        return [
            b.add(a).divideBy(2),
            b.add(c).divideBy(2),
        ]
    }
    return orthogonal(b, b.add(bis))
}

export function angle(v1: Point, v2: Point): number {
    return dot(v1, v2) / v1.distanceTo(v2)
}

export function mean(pts: Point[]): Point {
    return pts.reduce((prev, cur) => prev.add(cur)).divideBy(pts.length)
}

export function getCircumcenter(positions: Point[]): Point {
    if (positions.length !== 3) {
        throw new Error('must have 3 vertices')
    }
    const a = positions[0]
    const b = positions[1].subtract(a)
    const c = positions[2].subtract(a)
    const bb = dot(b, b)
    const cc = dot(c, c)
    return point((c.y * bb - b.y * cc), (b.x * cc - c.x * bb))
        .divideBy(2.0 * (b.x * c.y - b.y * c.x))
        .add(a)
}

export function polarToCartesian(center: Point, radius: number, angle: number) {
    return point(center.x + radius * Math.cos(angle), center.y + radius * Math.sin(angle))
}

export function vectorToGradCoordinates(vector: Point) {
    const x = Math.abs(vector.x)
    const y = Math.abs(vector.y)
    return vector.divideBy(x < y ? y : x)
}

/**
 * 
 * @param distance
 * @param maxSpeed - m/s
 * @param acceleration - m/s²
 */
export function timeToTravel(distance: number, maxSpeed: number, acceleration: number) {
    const distanceToAccelerate = maxSpeed * maxSpeed / acceleration
    return distanceToAccelerate < distance
        ? maxSpeed / acceleration * 2 + (distance - distanceToAccelerate) / maxSpeed
        : Math.sqrt(distance / acceleration) * 2
}
