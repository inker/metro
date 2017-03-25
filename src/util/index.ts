import * as L from 'leaflet'
import { uniq, zip, identity } from 'lodash'

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

export function roundPoint(point: L.Point, precision: number): L.Point {
    return L.point(+point.x.toFixed(precision), +point.y.toFixed(precision))
}

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
    return zip(...platforms.map(getPlatformNames))
        .map(arr => uniq(arr).join(' / '))
        .filter(identity)
}

export function midPointsToEnds(posOnSVG: L.Point, midPts: L.Point[]) {
    const lens = midPts.map(midPt => posOnSVG.distanceTo(midPt))
    const midOfMidsWeighted = midPts[1]
        .subtract(midPts[0])
        .multiplyBy(lens[0] / (lens[0] + lens[1]))
        .add(midPts[0])
    const offset = posOnSVG.subtract(midOfMidsWeighted)
    return midPts.map(v => roundPoint(v.add(offset), 2))
}

export const delay = (ms: number) => new Promise<void>((resolve, reject) => setTimeout(resolve, ms))

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

export function getSecondLanguage() {
    const tokens = location.search.match(/city=(\w+)/)
    const city = tokens ? tokens[1] : 'spb'
    const obj = {
        spb: 'fi',
        qazan: 'tt',
        helsinki: 'se',
    } as {
        [city: string]: string|undefined,
    }
    return obj[city]
}
