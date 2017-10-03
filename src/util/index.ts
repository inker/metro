import * as L from 'leaflet'
import delay from 'delay.js'
import {
    zip,
    uniq,
    identity,
} from 'lodash'

import { Platform } from '../network'

import * as algorithm from './algorithm'
import * as geo from './geo'
import * as math from './math'
import Mediator from './Mediator'
import * as sfx from './sfx'
import * as svg from './svg'
import * as color from './color'
import * as dom from './dom'
import * as events from './events'
import * as collections from './collections'
import MetroMapEventMap from './MetroMapEventMap'

export {
    algorithm,
    geo,
    math,
    Mediator,
    sfx,
    svg,
    color,
    dom,
    events,
    collections,
    MetroMapEventMap,
}

const RESET_SELECTOR = [
    'paths-inner',
    'paths-outer',
    'transfers-inner',
    'transfers-outer',
    'station-circles',
].map(i => `#${i} > *`).join(', ')

export const makeLink = (url: string, text: string, newTab = false) =>
    `<a href="${url}" ${newTab ? 'target="_blank"' : ''}>${text}</a>`

export function mouseToLatLng(map: L.Map, event: MouseEvent): L.LatLng {
    const { top, left } = map.getContainer().getBoundingClientRect()
    const containerPoint = L.point(event.clientX - left, event.clientY - top)
    return map.containerPointToLatLng(containerPoint)
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

export function midPointsToEnds(pos: L.Point, midPts: L.Point[]) {
    const lens = midPts.map(midPt => pos.distanceTo(midPt))
    const midOfMidsWeighted = midPts[1]
        .subtract(midPts[0])
        .multiplyBy(lens[0] / (lens[0] + lens[1]))
        .add(midPts[0])
    const offset = pos.subtract(midOfMidsWeighted)
    return midPts.map(v => math.vector.round(v.add(offset), 2))
}

export async function repeatUntil<ReturnValueType>(
    func: () => ReturnValueType,
    validate: (val: ReturnValueType) => boolean,
    interval = 100,
    ttl = 100,
) {
    for (let i = 0; i < ttl; ++i) {
        const val = func()
        if (validate(val)) {
            return val
        }
        await delay(interval)
    }
    throw new Error('rejected')
}

export async function tryRun<ReturnValueType>(
    func: () => ReturnValueType,
    interval = 100,
    ttl = 100,
) {
    for (let i = 0; i < ttl; ++i) {
        try {
            return func()
        } catch (e) {
            await delay(interval)
        }
    }
    throw new Error('rejected')
}

interface CityLang {
    [city: string]: string | undefined,
}
export function getSecondLanguage() {
    const tokens = location.search.match(/city=(\w+)/)
    const city = tokens ? tokens[1] : 'spb'
    const obj: CityLang = {
        spb: 'fi',
        qazan: 'tt',
        helsinki: 'se',
    }
    return obj[city]
}

function inflect(value: number, str: string) {
    return value === 0 ? '' : `${value}${value > 1 ? str + 's' : str}`
}

export function formatTime(time?: number) {
    if (time === undefined) {
        return ''
    }
    if (time < 60) {
        return `${Math.round(time)} seconds`
    }
    if (time < 3570) {
        const mins = Math.round(time / 60)
        return inflect(mins, 'min')
    }
    const hours = Math.floor(time / 3600)
    const mins = Math.floor((time - hours * 3600) / 60)
    return `${hours > 0 ? `${hours}h` : ''} ${inflect(mins, 'min')}`
}

export function drawBezierHints(parent: Element, controlPoints: L.Point[], linesColor?: string) {
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
        line.style.stroke = color.meanColor(arr)
        line.style.strokeOpacity = '0.75'
        line.style.strokeWidth = '1px'
        parent.appendChild(line)
    }
}
