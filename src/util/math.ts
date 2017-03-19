import { Point, point } from 'leaflet'

export type Ray = [Point, Point]

export function isArbitrarilySmall(v: Point): boolean {
    return Math.abs(v.x) < Number.EPSILON || Math.abs(v.y) < Number.EPSILON
}

export function dot(v1: Point, v2: Point): number {
    return v1.x * v2.x + v1.y * v2.y
}

export function det(v1: Point, v2: Point): number {
    return v1.x * v2.y - v2.x * v1.y
}

export function normalize(v: Point): Point {
    return v.divideBy(Math.sqrt(dot(v, v)))
}

export function bisect(v1: Point, v2: Point): Point {
    const v1n = normalize(v1)
    const v2n = normalize(v2)
    const a = v1n.add(v2n)
    return isArbitrarilySmall(a) ? point(0, 0) : normalize(a)
}

export function orthogonal(source: Point, target: Point): Point[] {
    const v = target.subtract(source)
    return [
        point(v.y, -v.x),
        point(-v.y, v.x),
    ]
}

export function wings(a: Point, b: Point, c: Point, length = 1): Point[] {
    const ba = a.subtract(b)
    const bc = c.subtract(b)
    const nBis = bisect(ba, bc)
    const t = det(ba, bc) < 0 ? -length : length
    return orthogonal(b, nBis.multiplyBy(t).add(b))
}

export function intersection([a, u]: Ray, [b, v]: Ray): Point|null {
    const div = det(v, u)
    if (div === 0) {
        return null
    }
    const s = (det(a, v) - det(b, v)) / div
    return u.multiplyBy(s).add(a)
}

export function offsetLine(points: Point[], d: number): Point[] {
    if (points.length !== 2) {
        throw new Error('line must have 2 points')
    }
    if (points[0].equals(points[1])) {
        throw new Error('points are overlapped')
    }
    const o = orthogonal(points[0], points[1])[0]
    const normal = normalize(o)
    const offsetVec = normal.multiplyBy(d)
    return points.map(p => p.add(offsetVec))
}

export function offsetPath(controlPoints: Point[], d: number): Point[] {
    if (controlPoints.length < 2) {
        throw new Error('there should be at least 2 control points for an offset')
    }
    return controlPoints.map((cp, i) => {
        const prev = controlPoints[i - 1]
        const next = controlPoints[i + 1]
        if (!prev) {
            return offsetLine([cp, next], d)[0]
        }
        if (!next) {
            return offsetLine([prev, cp], d)[1]
        }
        const [prevO, cpO] = offsetLine([prev, cp], d)
        const [nextO] = offsetLine([next, cp], -d)
        const ba = prev.subtract(cp)
        const bc = next.subtract(cp)
        return intersection([prevO, ba], [nextO, bc]) || cpO
    })
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
        .divideBy(2 * det(b, c))
        .add(a)
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
