import { Point, point } from 'leaflet'
import { isArbitrarilySmall as isNumberSmall } from './index'

export type Ray = [Point, Point]
type Segment = [Point, Point]

enum Orientation {
    COLLINEAR,
    CLOCKWISE,
    ANTICLOCKWISE,
}

export const unit = Object.freeze(point(1, 0))

export const isArbitrarilySmall = (v: Point) =>
    isNumberSmall(v.x) && isNumberSmall(v.y)

export const round = (p: Point, precision: number) =>
    point(+p.x.toFixed(precision), +p.y.toFixed(precision))

export const mean = (pts: Point[]) => pts
    .reduce((prev, cur) => prev.add(cur))
    .divideBy(pts.length)

export const dot = (v1: Point, v2: Point) =>
    v1.x * v2.x + v1.y * v2.y

export const det = (v1: Point, v2: Point) =>
    v1.x * v2.y - v2.x * v1.y

export const hypot = (v: Point) =>
    Math.sqrt(dot(v, v))

export const normalize = (v: Point) =>
    v.divideBy(hypot(v))

export const angle = (v1: Point, v2: Point) =>
    dot(v1, v2) / v1.distanceTo(v2)

export const orthogonal = (v: Point) => [
    point(v.y, -v.x),
    point(-v.y, v.x),
]

export function bisect(v1: Point, v2: Point): Point {
    const v1n = normalize(v1)
    const v2n = normalize(v2)
    const sum = v1n.add(v2n)
    return isArbitrarilySmall(sum) ? point(0, 0) : normalize(sum)
}

export function intersection([a, u]: Ray, [b, v]: Ray): Point | null {
    const div = det(u, v)
    if (Math.abs(div) < Number.EPSILON) {
        return null
    }
    const d = b.subtract(a)
    const t = det(d, v) / div
    return u.multiplyBy(t).add(a)
}

const onSegment = (p: Point, q: Point, r: Point) =>
    q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
    q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y)

function orientation(p: Point, q: Point, r: Point): Orientation {
    const pq = q.subtract(p)
    const qr = r.subtract(q)
    const val = det(qr, pq)
    return Math.abs(val) < Number.EPSILON
        ? Orientation.COLLINEAR
        : val > 0 ? Orientation.CLOCKWISE : Orientation.ANTICLOCKWISE
}

export function segmentsIntersect([p1, q1]: Segment, [p2, q2]: Segment): boolean {
    const o1 = orientation(p1, q1, p2)
    const o2 = orientation(p1, q1, q2)
    const o3 = orientation(p2, q2, p1)
    const o4 = orientation(p2, q2, q1)

    return o1 !== o2 && o3 !== o4
        || o1 === Orientation.COLLINEAR && onSegment(p1, p2, q1)
        || o2 === Orientation.COLLINEAR && onSegment(p1, q2, q1)
        || o3 === Orientation.COLLINEAR && onSegment(p2, p1, q2)
        || o4 === Orientation.COLLINEAR && onSegment(p2, q1, q2)
}
