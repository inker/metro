import * as L from 'leaflet'
import {
    last,
    uniq,
    zip,
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
    MetroMapEventMap,
}

const RESET_SELECTOR = [
    'paths-inner',
    'paths-outer',
    'transfers-inner',
    'transfers-outer',
    'station-circles',
].map(i => `#${i} > *`).join(', ')

export function intersection<T>(a: Set<T>, b: Set<T>) {
    const isn = new Set<T>()
    a.forEach(item => {
        if (b.has(item)) {
            isn.add(item)
        }
    })
    return isn
}

export function deleteFromArray<T>(arr: T[], el: T) {
    const pos = arr.indexOf(el)
    if (pos < 0) {
        return
    }
    arr[pos] = last(arr)
    arr.pop()
}

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

export function triggerMouseEvent(target: Node, eventType: string) {
    const e = document.createEvent('MouseEvents')
    e.initEvent(eventType, true, true)
    target.dispatchEvent(e)
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

interface IMap<K, V> {
    get: (key: K) => V|undefined,
}
export function tryGetFromMap<K, V>(map: IMap<K, V>, key: K): V {
    const val = map.get(key)
    if (val === undefined) {
        console.error('in map', map, ':', key, '->', val)
        throw new Error('key or val is undefined')
    }
    return val
}

interface IBiMap<K, V> {
    getKey: (val: V) => K|undefined,
}
export function tryGetKeyFromBiMap<K, V>(map: IBiMap<K, V>, val: V): K {
    const key = map.getKey(val)
    if (key === undefined) {
        console.error('in map', map, ':', val, '->', key)
        throw new Error('key or val is undefined')
    }
    return key
}
