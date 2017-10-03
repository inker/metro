import { Point, point } from 'leaflet'

import { attr } from '../dom'
import { vector } from '../math'

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
    return document.createElementNS('http://www.w3.org/2000/svg', tagName)
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

export function makeStadium(center: Point, distance: number, radius: number) {
    const rect = createSVGElement('rect')
    rect.setAttribute('x', (center.x - distance * 0.5 - radius).toString())
    rect.setAttribute('y', (center.y - radius).toString())
    const diameter = radius * 2
    rect.setAttribute('width', (distance + diameter).toString())
    rect.setAttribute('height', diameter.toString())
    rect.setAttribute('rx', radius.toString())
    rect.setAttribute('ry', radius.toString())
    rect.style.transformOrigin = '50% 50%'
    return rect
}

export function makeOvalStartEnd(start: Point, end: Point, radius: number): SVGPathElement {
    const vec = end.subtract(start)
    const startPoints = vector.orthogonal(vec.multiplyBy(-1)).map(i => i.add(start))
    const endPoints = vector.orthogonal(vec).map(i => i.add(end))
    const arr = [
        'M',
        startPoints[0].x,
        startPoints[0].y,
        'A',
        radius,
        radius,
        '0 0 1',
        startPoints[1].x,
        startPoints[1].y,
        'L',
        endPoints[0].x,
        endPoints[0].y,
        'A',
        radius,
        radius,
        '0 0 1',
        endPoints[1].x,
        endPoints[1].y,
        'L',
        startPoints[0].x,
        startPoints[0].y,
        'Z',
    ]
    const path = createSVGElement('path')
    path.setAttribute('d', arr.join(' '))
    path.style.fillOpacity = '1'
    return path
}

export function makeTransferArc(start: Point, end: Point, third: Point) {
    const outer = arc.create(start, end, third)
    const inner = outer.cloneNode(true) as typeof outer
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

export function getElementOffset(circle: SVGCircleElement | SVGRectElement): Point {
    const cx = circle.getAttribute('cx')
    if (cx === null) {
        const x = +attr(circle, 'x') + +attr(circle, 'width') / 2
        const y = +attr(circle, 'y') + +attr(circle, 'height') / 2
        const c = point(x, y)
        const r = ~~attr(circle, 'rx')
        const offset = point(0 + r, 4 + r)
        return c.subtract(offset)
    }
    const c = point(+cx, +attr(circle, 'cy'))
    const iR = ~~attr(circle, 'r')
    const offset = point(0 + iR, 4 + iR)
    return c.subtract(offset)
}
