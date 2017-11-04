import { Point } from 'leaflet'
import {
    zip,
    uniq,
    identity,
} from 'lodash'

import { Platform } from '../network'
import { meanColor } from './color'
import { getSecondLanguage } from './lang'

import * as math from './math'
import * as svg from './svg'
import * as dom from './dom'

export {
    math,
    svg,
    dom,
}

const RESET_SELECTOR = [
    'paths-inner',
    'paths-outer',
    'transfers-inner',
    'transfers-outer',
    'station-circles',
].map(i => `#${i} > *`).join(', ')

export const makeLink = (url: string, text: string, newTab = false) =>
    `<a href="${url}" ${newTab ? 'target="_blank" rel="noopener"' : ''}>${text}</a>`

export function getCity() {
    const tokens = location.search.match(/city=(\w+)/)
    return tokens ? tokens[1] : 'spb'
}

export function resetStyle() {
    const els = document.querySelectorAll(RESET_SELECTOR) as any as HTMLElement[]
    for (const { style } of els) {
        style.opacity = null
        style.filter = null
    }
}

export function getPlatformNames(platform: Platform): string[] {
    const { name, altNames } = platform
    const second = getSecondLanguage()
    const names = [name]
    if (second && altNames[second]) {
        names.push(altNames[second])
    }
    if (altNames.en) {
        names.push(altNames.en)
    }
    return names
}

export function getPlatformNamesZipped(platforms: Platform[]) {
    const platformNames = platforms.map(getPlatformNames)
    return zip(...platformNames)
        .map(arr => uniq(arr).join(' / '))
        .filter(identity)
}

export function midPointsToEnds(pos: Point, midPts: Point[]) {
    const lens = midPts.map(midPt => pos.distanceTo(midPt))
    const midOfMidsWeighted = midPts[1]
        .subtract(midPts[0])
        .multiplyBy(lens[0] / (lens[0] + lens[1]))
        .add(midPts[0])
    const offset = pos.subtract(midOfMidsWeighted)
    return midPts.map(v => math.vector.round(v.add(offset), 2))
}

export function drawBezierHints(parent: Element, controlPoints: Point[], linesColor?: string) {
    for (let i = 1; i < controlPoints.length; ++i) {
        const line = svg.createSVGElement('line')
        line.setAttribute('x1', controlPoints[i - 1].x.toString())
        line.setAttribute('y1', controlPoints[i - 1].y.toString())
        line.setAttribute('x2', controlPoints[i].x.toString())
        line.setAttribute('y2', controlPoints[i].y.toString())
        const arr = ['#000']
        if (linesColor) {
            arr.push(linesColor)
        }
        line.style.stroke = meanColor(arr)
        line.style.strokeOpacity = '0.75'
        line.style.strokeWidth = '1px'
        parent.appendChild(line)
    }
}
