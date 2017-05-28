import { Point, point } from 'leaflet'
import { isArbitrarilySmall as isNumberSmall } from './index'

export type Ray = [Point, Point]

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

export function intersection([a, u]: Ray, [b, v]: Ray): Point|null {
    const div = det(u, v)
    if (Math.abs(div) < Number.EPSILON) {
        return null
    }
    const d = b.subtract(a)
    const t = det(d, v) / div
    return u.multiplyBy(t).add(a)
}
