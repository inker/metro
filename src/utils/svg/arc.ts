import { Point } from 'leaflet'

import { getCircumcenter } from 'utils/math'
import { dot, det } from 'utils/math/vector'

import { createSVGElement } from '.'

interface ArcArgs {
    radius: number,
    large?: number,
    clockwise?: number,
}

function getArgs(start: Point, end: Point, third: Point): ArcArgs {
  const center = getCircumcenter([start, end, third])
  if (center === null) {
    return {
      radius: Number.POSITIVE_INFINITY,
    }
  }
  const a = start.subtract(third)
  const b = end.subtract(third)
  const thirdIsBetween = dot(a, b) < 0
  const u = start.subtract(center)
  const v = end.subtract(center)
  // the distance is shorter when moving from start to end clockwise
  const isClockwise = det(u, v) >= 0
  return {
    radius: center.distanceTo(start),
    large: thirdIsBetween ? 1 : 0,
    clockwise: isClockwise && !thirdIsBetween || thirdIsBetween && !isClockwise ? 1 : 0,
  }
}

export function getPath(path: Element) {
  const points: number[] = []
  const re = /\D([\d.]+)/g
  const d = path.getAttribute('d')
  if (!d) {
    return null
  }
  let m: RegExpExecArray | null
  while ((m = re.exec(d)) !== null) {
    points.push(Number(m[1]))
  }
  return points
}

export function setPath(el: Element, start: Point, end: Point, third: Point) {
  const { radius, large, clockwise } = getArgs(start, end, third)
  const d = [
    'M', start.x, start.y,
    ...radius === Number.POSITIVE_INFINITY ? ['L'] : ['A', radius, radius, 0, large, clockwise],
    end.x, end.y,
  ].join(' ')
  el.setAttribute('d', d)
}

export function create(start: Point, end: Point, third: Point): SVGPathElement {
  const path = createSVGElement('path')
  setPath(path, start, end, third)
  return path
}
