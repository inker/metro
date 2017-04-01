import { Point, point } from 'leaflet'

import * as vector from './vector'
import * as phys from './phys'

export {
  vector,
  phys,
}

const {
  bisect,
  dot,
  det,
  intersection,
  orthogonal,
  normalize,
} = vector

export function wings(a: Point, b: Point, c: Point, length = 1): Point[] {
    const ba = a.subtract(b)
    const bc = c.subtract(b)
    const bis = bisect(ba, bc)
    const t = det(ba, bc) < 0 ? -length : length
    return orthogonal(bis.multiplyBy(t))
}

export function offsetLine(points: Point[], d: number): Point[] {
    if (points.length !== 2) {
        throw new Error('line must have 2 points')
    }
    if (points[0].equals(points[1])) {
        throw new Error('points are overlapped')
    }
    const vec = points[1].subtract(points[0])
    const [o] = orthogonal(vec)
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

export function getCircumcenter(positions: Point[]): Point|null {
    if (positions.length !== 3) {
        throw new Error('must have 3 vertices')
    }
    const a = positions[0]
    const b = positions[1].subtract(a)
    const c = positions[2].subtract(a)
    const bb = dot(b, b)
    const cc = dot(c, c)
    const bxc = det(b, c)
    if (Math.abs(bxc) < Number.EPSILON) {
      return null
    }
    return point(c.y * bb - b.y * cc, b.x * cc - c.x * bb)
        .divideBy(2 * det(b, c))
        .add(a)
}

export function vectorToGradCoordinates(vec: Point) {
    const x = Math.abs(vec.x)
    const y = Math.abs(vec.y)
    return vec.divideBy(x < y ? y : x)
}
