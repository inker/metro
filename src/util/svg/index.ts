import { Point, point } from 'leaflet'

import { attr } from '../dom'

import * as filters from './filters'
import * as gradients from './gradients'
import * as arc from './arc'
import * as bezier from './bezier'

export {
    filters,
    gradients,
    arc,
    bezier,
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

export function makeTransferArc(start: Point, end: Point, third: Point) {
    const outer = arc.create(start, end, third)
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

export function getCircleOffset(circle: SVGCircleElement): Point {
    const c = point(+attr(circle, 'cx'), +attr(circle, 'cy'))
    const iR = ~~attr(circle, 'r')
    const offset = point(0 + iR, 4 + iR)
    return c.subtract(offset)
}
