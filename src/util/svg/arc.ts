import { Point } from 'leaflet'
import { createSVGElement } from './index'
import { vector, getCircumcenter } from '../math'

interface ArcArgs {
    radius: number,
    large?: number,
    clockwise?: number,
}

function getArgs(start: Point, end: Point, third: Point): ArcArgs {
    const center = getCircumcenter([start, end, third])
    if (center === null) {
        return {
            radius: Infinity,
        }
    }
    const a = start.subtract(third)
    const b = end.subtract(third)
    const isOpposite = vector.dot(a, b) < 0
    const u = start.subtract(center)
    const v = end.subtract(center)
    const isLeft = vector.det(u, v) <= 0
    return {
        radius: center.distanceTo(start),
        large: isOpposite ? 1 : 0,
        clockwise: isLeft === isOpposite ? 1 : 0,
    }
}

export function getPath(path: Element) {
    const points: number[] = []
    const re = /\D([\d\.]+)/g
    const d = path.getAttribute('d')
    if (!d) {
        return null
    }
    let m: RegExpExecArray|null
    while ((m = re.exec(d)) !== null) {
        points.push(Number(m[1]))
    }
    return points
}

export function setPath(el: Element, start: Point, end: Point, third: Point) {
    const { radius, large, clockwise } = getArgs(start, end, third)
    const d = [
        'M', start.x, start.y,
        ...(radius === Infinity ? ['L'] : ['A', radius, radius, 0, large, clockwise]),
        end.x, end.y,
    ].join(' ')
    el.setAttribute('d', d)
}

export function create(start: Point, end: Point, third: Point): SVGPathElement {
    const path = createSVGElement('path')
    setPath(path, start, end, third)
    return path
}
