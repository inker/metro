import * as L from 'leaflet'
import { uniq } from 'lodash'

import { Platform } from '../network'

import * as algorithm from './algorithm'
import * as decorators from './decorators'
import * as geo from './geo'
import * as math from './math'
import Mediator from './Mediator'
import * as polyfills from './polyfills'
import * as sfx from './sfx'
import * as svg from './svg'
import * as file from './file'
import * as color from './color'

export {
    algorithm,
    decorators,
    geo,
    math,
    Mediator,
    polyfills,
    sfx,
    svg,
    file,
    color,
}

const RESET_SELECTOR = [
    'paths-inner',
    'paths-outer',
    'transfers-inner',
    'transfers-outer',
    'station-circles',
].map(i => `#${i} > *`).join(', ')

export function setsEqual<T>(a: Set<T>, b: Set<T>) {
    const n = a.size
    if (n !== b.size) {
        return false
    }
    for (let vals = a.values(), el = vals.next(); !el.done; el = vals.next()) {
        if (!b.has(el.value)) {
            return false
        }
    }
    return true
}

export function intersection<T>(a: Set<T>, b: Set<T>) {
    const isn = new Set<T>()
    a.forEach(item => {
        if (b.has(item)) isn.add(item)
    })
    return isn
}

export function deleteFromArray<T>(arr: T[], el: T) {
    const pos = arr.indexOf(el)
    if (pos < 0) {
        return
    }
    arr[pos] = arr[arr.length - 1]
    arr.pop()
}

export function formatInteger(integer: number): string {
    const s = integer.toString()
    console.log(s)
    const start = s.length % 3
    const arr = start > 0 ? [s.slice(0, start)] : []
    for (let i = s.length % 3; i < s.length; i += 3) {
        arr.push(s.substr(i, 3))
    }
    console.log(arr)
    return arr.join("'")
}

export function roundPoint(point: L.Point, precision: number): L.Point {
    return L.point(+point.x.toFixed(precision), +point.y.toFixed(precision))
}

export function getFraction(num: number, radix = 10): string {
    return num.toString(radix).split('.')[1] || '0'
}

export function generateId(collision?: (temp: string) => boolean): string {
    const id = Math.random().toString(36).slice(2)
    return collision && collision(id) ? generateId(collision) : id
}

export function mouseToLatLng(map: L.Map, event: MouseEvent): L.LatLng {
    const rect = map.getContainer().getBoundingClientRect()
    const containerPoint = L.point(event.clientX - rect.left, event.clientY - rect.top)
    return map.containerPointToLatLng(containerPoint)
}

export function callMeMaybe<ReturnType>(func: ((...params: any[]) => ReturnType)|undefined, ...params: any[]) {
    return func ? func(...params) : undefined
}

export function once(el: EventTarget, eventType: string, listener: EventListener) {
    el.addEventListener(eventType, function handler(e: Event) {
        el.removeEventListener(eventType, handler)
        listener(e)
    })
}

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

export function resetStyle() {
    const els = document.querySelectorAll(RESET_SELECTOR)
    for (let i = 0; i < els.length; ++i) {
        const el = els[i] as HTMLElement
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
    const platformNames = platforms.map(getPlatformNames)
    return [0, 1, 2]
        .map(no => platforms.map((p, i) => platformNames[i][no]))
        .map(uniq)
        .map(arr => arr.reduce((prev, cur) => `${prev} / ${cur}`))
        .filter(s => s !== undefined)
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

export function scaleOverlay(overlay: Element&{ style: CSSStyleDeclaration }, scaleFactor: number, mousePos?: L.Point) {
    const box = overlay.getBoundingClientRect()
    if (!mousePos) {
        const el = document.documentElement
        mousePos = L.point(el.clientWidth / 2, el.clientHeight / 2)
    }
    const clickOffset = L.point(mousePos.x - box.left, mousePos.y - box.top)
    const ratio = L.point(clickOffset.x / box.width, clickOffset.y / box.height)
    const overlayStyle = overlay.style
    // overlayStyle.left = '0';
    // overlayStyle.top = '0';
    overlayStyle.transformOrigin = `${ratio.x * 100}% ${ratio.y * 100}%`
    overlayStyle.transform = `scale(${scaleFactor})`
}

export function tryGet<T>(fetch: () => T, validate: (val: T) => boolean, interval = 100, ttl = 100) {
    return new Promise<T>((resolve, reject) => setTimeout(function bar() {
        console.log(ttl)
        if (--ttl <= 0) {
            console.error('rejected', bar)
            reject()
        }
        const val = fetch()
        if (validate(val)) {
            return resolve(val)
        }
        setTimeout(bar, interval)
    }))
}

export function tryGetElement(query: string, interval = 100, ttl = 100) {
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
export function fixFontRendering(parent: { querySelectorAll } = document): void {
    const blurringStuff = parent.querySelectorAll('[style*="translate3d"]')
    console.log('fixing font', parent, blurringStuff)
    for (let i = 0; i < blurringStuff.length; ++i) {
        trim3d(blurringStuff[i] as HTMLElement & SVGStylable)
    }
}

export function getSecondLanguage() {
    const tokens = window.location.search.match(/city=(\w+)/)
    const city = tokens ? tokens[1] : 'spb'
    return city === 'spb' ? 'fi' : city === 'helsinki' ? 'se' : undefined
}

export function tryGetFromMap<K, V>(map: Map<K, V>|WeakMap<K, V>, key: K) {
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