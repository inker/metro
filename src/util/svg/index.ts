import { Point, point } from 'leaflet'

import { vector, getCircumcenter } from '../math'
import { attr } from '../dom'

import * as filters from './filters'
import * as gradients from './gradients'

export {
    filters,
    gradients,
}

export function createSVGElement<K extends keyof ElementTagNameMap>(tagName: K): ElementTagNameMap[K] {
    return document.createElementNS('http://www.w3.org/2000/svg', tagName) as any
}

export function makePolygon(points: Point[]): SVGPolygonElement {
    const polygon = createSVGElement('polygon')
    const pointsString = points.map(pt => `${pt.x},${pt.y}`).join(' ')
    polygon.setAttribute('points', pointsString)
    return polygon
}

export function makeCircle(center: Point, radius: number): SVGCircleElement {
    const circle = createSVGElement('circle')
    circle.setAttribute('r', radius.toString())
    circle.setAttribute('cy', center.y.toString())
    circle.setAttribute('cx', center.x.toString())
    return circle
}

export function makeLine(start: Point, end: Point): SVGLineElement {
    const line = createSVGElement('line')
    line.setAttribute('x1', start.x.toString())
    line.setAttribute('y1', start.y.toString())
    line.setAttribute('x2', end.x.toString())
    line.setAttribute('y2', end.y.toString())
    return line
}

export function makeArc(start: Point, end: Point, third: Point): SVGPathElement {
    const path = createSVGElement('path')
    setCircularPath(path, start, end, third)
    return path
}

export function getBezierPathPoints(path: Element) {
    const points: Point[] = []
    const re = /\D([\d\.]+).*?,.*?([\d\.]+)/g
    const d = path.getAttribute('d')
    if (!d) {
        return null
    }
    let m: RegExpExecArray|null
    while ((m = re.exec(d)) !== null) {
        points.push(point(Number(m[1]), Number(m[2])))
    }
    return points
}

export function setBezierPath(el: Element, controlPoints: Point[]) {
    if (controlPoints.length === 4) {
        const s = ['M'].concat(controlPoints.map(pt => `${pt.x},${pt.y}`))
        s.splice(2, 0, 'C')
        el.setAttribute('d', s.join(' '))
        return
    }
    if (controlPoints.length === 3) {
        const [a, b, c] = controlPoints
        el.setAttribute('d', `M ${a.x} ${a.y} Q ${b.x} ${b.y} ${c.x} ${c.y}`)
        return
    }
    throw new Error('there should be 3 or 4 points')
}

export function getCircularPath(path: Element) {
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

const xor = (a: boolean, b: boolean) => a && !b || b && !a

interface ArcArgs {
    radius: number,
    large?: number,
    clockwise?: number,
}

function getArcArgs(start: Point, end: Point, third: Point): ArcArgs {
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
    const isRight = vector.det(u, v) >= 0
    return {
        radius: center.distanceTo(start),
        large: isOpposite ? 1 : 0,
        clockwise: xor(isRight, isOpposite) ? 1 : 0,
    }
}

export function setCircularPath(el: Element, start: Point, end: Point, third: Point) {
    const { radius, large, clockwise } = getArcArgs(start, end, third)
    const d = [
        'M', start.x, start.y,
        ...(radius === Infinity ? ['L'] : ['A', radius, radius, 0, large, clockwise]),
        end.x, end.y,
    ].join(' ')
    el.setAttribute('d', d)
}

export function makeCubicBezier(controlPoints: Point[]): SVGPathElement {
    const path = createSVGElement('path')
    setBezierPath(path, controlPoints)
    return path
}

export function makeTransferArc(start: Point, end: Point, third: Point) {
    const outer = makeArc(start, end, third)
    const inner: typeof outer = outer.cloneNode(true) as any
    return [outer, inner]
}

export function makeTransferLine(start: Point, end: Point): SVGLineElement[] {
    // gradient disappearing fix (maybe use rectangle?)
    const tg = end.clone()
    if (start.x === end.x) {
        tg.x += 0.01
    } else if (start.y === end.y) {
        tg.y += 0.01
    }
    return [makeLine(start, tg), makeLine(start, tg)]
}

export function circleOffset(circle: SVGCircleElement): Point {
    const c = point(+attr(circle, 'cx'), +attr(circle, 'cy'))
    const iR = ~~attr(circle, 'r')
    const offset = point(0 + iR, 4 + iR)
    return c.subtract(offset)
}
