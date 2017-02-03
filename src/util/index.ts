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
import MetroMapEventMap from './MetroMapEventMap'

export {
    algorithm,
    geo,
    math,
    Mediator,
    sfx,
    svg,
    color,
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

export function generateId(collision?: (temp: string) => boolean): string {
    const id = Math.random().toString(36).slice(2)
    return collision && collision(id) ? generateId(collision) : id
}

export function mouseToLatLng(map: L.Map, event: MouseEvent): L.LatLng {
    const { top, left } = map.getContainer().getBoundingClientRect()
    const containerPoint = L.point(event.clientX - left, event.clientY - top)
    return map.containerPointToLatLng(containerPoint)
}

export function callMeMaybe<ReturnType>(func: ((...params: any[]) => ReturnType)|undefined, ...params: any[]) {
    return func ? func(...params) : undefined
}

export const once = <K extends keyof HTMLElementEventMap>(
    el: EventTarget,
    eventType: K,
) => new Promise<HTMLElementEventMap[K]>(resolve => {
    el.addEventListener(eventType, function handler(e) {
        el.removeEventListener(eventType, handler)
        resolve(e as any)
    })
})

export function onceEscapePress(handler: (ev: KeyboardEvent) => any) {
    const keydownListener = (e: KeyboardEvent) => {
        if (e.keyCode !== 27) {
            return
        }
        removeListener()
        handler(e)
    }
    const backbuttonListener = e => {
        removeListener()
        handler(e)
    }
    function removeListener() {
        removeEventListener('keydown', keydownListener)
        removeEventListener('backbutton', backbuttonListener)
    }

    addEventListener('keydown', keydownListener)
    addEventListener('backbutton', backbuttonListener)
    // once(window, 'keydown', (e: KeyboardEvent) => {
    //     if (e.keyCode === 27) handler(e);
    // });
}

export const transitionEnd = (el: Element) => once(el, 'transitionend') as Promise<Event>

export function resetStyle() {
    const els = document.querySelectorAll(RESET_SELECTOR) as any as HTMLElement[]
    for (const el of els) {
        el.style.opacity = null
        if (el.id[1] !== 't') {
            el.style.filter = null
        }
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
    if (altNames['en']) {
        names.push(altNames['en'])
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

export function trim3d<T extends { style: CSSStyleDeclaration }>({ style }: T) {
    const { transform } = style
    if (transform) {
        style.transform = transform.replace(/translate3d\s*\((.+?,\s*.+?),\s*.+?\s*\)/i, 'translate($1)')
    }
}

export function flashTitle(titles: string[], duration: number) {
    let i = 0
    setInterval(() => document.title = titles[++i % titles.length], duration)
}

export const delay = (ms: number) => new Promise((resolve, reject) => setTimeout(resolve, ms))

export async function tryGet<T>(
    fetch: () => T,
    validate?: (val: T) => boolean,
    interval = 100,
    ttl = 100,
) {
    for (let i = 0; i < ttl; ++i) {
        const val = fetch()
        if (!validate || validate(val)) {
            return val
        }
        await delay(interval)
    }
    throw new Error('rejected')
}

export function tryGetElement(query: string, interval = 100, ttl = 100): Promise<Element> {
    const rest = query.slice(1)
    const foo = query[0] === '#' ? (() => document.getElementById(rest)) : () => document.querySelector(query)
    return tryGet(foo, val => val !== null, interval, ttl)
}

export function removeAllChildren(el: Node) {
    let child: Node|null
    while (child = el.firstChild) {
        el.removeChild(child)
    }
}

/**
 * Fixes blurry font due to 'transform3d' CSS property. Changes everything to 'transform' when the map is not moving
 */
export function fixFontRendering(parent: { querySelectorAll } = document) {
    const blurringStuff = parent.querySelectorAll('[style*="translate3d"]') as any as HTMLElement[]
    console.log('fixing font', parent, blurringStuff)
    for (const blurry of blurringStuff) {
        trim3d(blurry)
    }
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
    get: (K) => V|undefined,
}
export function tryGetFromMap<K, V>(map: IMap<K, V>, key: K): V {
    const val = map.get(key)
    if (val === undefined) {
        console.error('in map', map, ':', key, '->', val)
        throw new Error('key or val is undefined')
    }
    return val
}

export function byId(id: string) {
    const el = document.getElementById(id)
    if (!el) {
        throw new Error(`no element with id=${id} exists`)
    }
    return el
}

export function attr(el: Element, attributeName: string) {
    const attribute = el.getAttribute(attributeName)
    if (!attribute) {
        throw new Error(`no attribute ${attributeName} on element with id=${el.id} exists`)
    }
    return attribute
}
