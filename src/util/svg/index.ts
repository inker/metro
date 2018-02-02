import { Point, point } from 'leaflet'

import { orthogonal } from '../math/vector'

import { create as createArc } from './arc'

export const createSVGElement = <K extends keyof ElementTagNameMap>(tagName: K): ElementTagNameMap[K] =>
    document.createElementNS('http://www.w3.org/2000/svg', tagName)

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
    circle.style.transformOrigin = `${center.x}px ${center.y}px`
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
    const startPoints = orthogonal(vec.multiplyBy(-1)).map(i => i.add(start))
    const endPoints = orthogonal(vec).map(i => i.add(end))
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
    const outer = createArc(start, end, third)
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

function getCircleOffset(circle: SVGCircleElement): Point {
    const cx = circle.getAttribute('cx')
    if (cx === null) {
        throw new Error('cx does not exist on a circle')
    }
    // @ts-ignore
    const c = point(+cx, +circle.getAttribute('cy'))
    // @ts-ignore
    const iR = ~~circle.getAttribute('r')
    const offset = point(0 + iR, 4 + iR)
    return c.subtract(offset)
}

function getStadiumOffset(stadium: SVGRectElement): Point {
    // @ts-ignore
    const x = +stadium.getAttribute('x') + +stadium.getAttribute('width') / 2
    // @ts-ignore
    const y = +stadium.getAttribute('y') + +stadium.getAttribute('height') / 2
    const c = point(x, y)
    // @ts-ignore
    const r = ~~+stadium.getAttribute('rx')
    const offset = point(0 + r, 4 + r)
    return c.subtract(offset)
}

export const getElementOffset = (oval: SVGCircleElement | SVGRectElement) =>
    oval instanceof SVGRectElement ? getStadiumOffset(oval) : getCircleOffset(oval)
