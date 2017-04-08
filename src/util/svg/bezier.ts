import { flatten } from 'lodash'
import { Point, point } from 'leaflet'
import { createSVGElement } from './index'

export function getPathPoints(path: Element) {
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

const curveTypeLetters = ['', 'L', 'Q', 'C']

function tailsToStrings(tails: Point[][]) {
    const deepArray = tails.map(t => {
        if (t.length > 3) {
            throw new Error('the tail should consist of 1-3 elements')
        }
        return [curveTypeLetters[t.length], ...t.map(p => `${p.x} ${p.y}`)]
    })
    return flatten(deepArray)
}

export function setPath(el: Element, controlPoints: Point[], ...tails: Point[][]) {
    const [start, ...tail] = controlPoints
    const str = [
        'M',
        start.x,
        start.y,
        ...tailsToStrings([tail, ...tails]),
    ]
    el.setAttribute('d', str.join(' '))
}

export function create(controlPoints: Point[], ...tails: Point[][]): SVGPathElement {
    const path = createSVGElement('path')
    setPath(path, controlPoints, ...tails)
    return path
}
