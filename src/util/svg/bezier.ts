import { Point, point } from 'leaflet'
import { createSVGElement } from './index'

export function getPathPoints(path: Element) {
    const points: Point[] = []
    const re = /\D([\d\.]+).*?,.*?([\d\.]+)/g
    const d = path.getAttribute('d')
    if (!d) {
        return null
    }
    let m: RegExpExecArray | null
    while ((m = re.exec(d)) !== null) {
        points.push(point(Number(m[1]), Number(m[2])))
    }
    return points
}

const curveTypeLetters = ['', 'L', 'Q', 'C']

function tailToString(tail: Point[]) {
    const { length } = tail
    if (length > 3) {
        throw new Error(`the tail should consist of 1-3 elements, but got ${length} instead`)
    }
    const letter = curveTypeLetters[length]
    const coords = tail.map(pt => `${pt.x} ${pt.y}`).join(' ')
    return `${letter} ${coords}`
}

export function setPath(el: Element, controlPoints: Point[], ...tails: Point[][]) {
    if (controlPoints.length < 2) {
        throw new Error(`there should be at least 2 control points, but got ${controlPoints.length} instead`)
    }
    const [start, ...tail] = controlPoints
    tails.unshift(tail) // tails can be mutable
    const tailStr = tails.map(tailToString).join(' ')
    el.setAttribute('d', `M ${start.x} ${start.y} ${tailStr}`)
}

export function create(controlPoints: Point[], ...tails: Point[][]): SVGPathElement {
    const path = createSVGElement('path')
    setPath(path, controlPoints, ...tails)
    return path
}
