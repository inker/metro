import * as alertify from 'alertifyjs'
import { Browser } from 'leaflet'
import { last } from 'lodash'

import pool from '../ObjectPool'
import { getLength, Filters } from './svg'
import { ShortestRouteObject } from './algorithm'
import { tr, formatTime as ft } from '../i18n'
import { tryGetFromMap, byId, transitionEnd } from './index'

import {
    Platform,
    Station,
    Edge,
    Transfer,
    Span,
} from '../network'

const ANIMATION_GREYING_SELECTOR = [
    'paths-inner',
    'paths-outer',
    'transfers-inner',
    'transfers-outer',
    'station-circles',
].map(s => `#${s} *`).join(', ')

export namespace Scale {

    const initialCircles = new Set<SVGCircleElement>()
    const initialTransfers = new Set<SVGPathElement | SVGLineElement>()

    export function scaleCircle(circle: SVGCircleElement, scaleFactor: number, asAttribute = false) {
        if (!asAttribute) {
            circle.style.transform = `scale(${scaleFactor})`
            return
        }
        initialCircles.add(circle)
        // const t = scaleFactor - 1,
        //     tx = -circle.getAttribute('cx') * t,
        //     ty = -circle.getAttribute('cy') * t;
        // circle.setAttribute('transform', `matrix(${scaleFactor}, 0, 0, ${scaleFactor}, ${tx}, ${ty})`);
        const oldR = circle.getAttribute('r')
        if (oldR) {
            circle.setAttribute('data-r', oldR)
        }
        circle.setAttribute('r', (+oldR * scaleFactor).toString())
    }

    export function scaleStation(station: Station, scaleFactor: number, nwTransfers?: Transfer[]) {
        const transferOuterStrokeWidth = parseFloat(byId('transfers-outer').style.strokeWidth || '')
        const transferInnerStrokeWidth = parseFloat(byId('transfers-inner').style.strokeWidth || '')
        for (const p of station.platforms) {
            const circle = tryGetFromMap(pool.platformBindings, p)
            scaleCircle(circle, scaleFactor, true)
            if (!nwTransfers || station.platforms.length < 2) {
                continue
            }
            for (const tr of nwTransfers) {
                if (tr.has(p)) {
                    const outer = pool.outerEdgeBindings.get(tr)
                    const inner = pool.innerEdgeBindings.get(tr)
                    initialTransfers.add(outer)
                    initialTransfers.add(inner)
                    outer.style.strokeWidth = transferOuterStrokeWidth * scaleFactor + 'px'
                    inner.style.strokeWidth = transferInnerStrokeWidth * scaleFactor + 'px'
                }
            }
        }
    }

    export function unscaleAll() {
        initialCircles.forEach(circle => {
            const initialRadius = circle.getAttribute('data-r')
            if (initialRadius !== null) {
                circle.setAttribute('r', initialRadius)
            }
        })
        // initialCircles.forEach(circle => circle.removeAttribute('transform'));
        initialTransfers.forEach(tr => tr.style.strokeWidth = null)
        initialTransfers.clear()
        initialCircles.clear()
    }
}

const pulsate = Browser.webkit && !Browser.mobile

export namespace Animation {
    let animationsAllowed = true
    let currentAnimation: Promise<boolean>|null = null

    export function terminateAnimations() {
        if (currentAnimation === null) {
            return Promise.resolve(true)
        }
        animationsAllowed = false
        return currentAnimation
    }

    function animatePathElement(path: SVGPathElement|SVGLineElement, speed: number, reverse = false) {
        const length = getLength(path)
        const initialOffset = reverse ? -length : length
        const duration = length / speed

        const transitionEndPromise = transitionEnd(path)

        const { style } = path
        style.transition = null
        style.opacity = null
        style.strokeDasharray = `${length} ${length}`
        style.strokeDashoffset = initialOffset.toString()
        path.getBoundingClientRect()
        style.transition = `stroke-dashoffset ${duration}ms linear`
        style.strokeDashoffset = '0'
        return transitionEndPromise
    }

    async function animateCurrentRoute(platforms: Platform[], edges: Edge<Platform>[], speed = 1) {
        const nEdges = edges.length
        for (let i = 0; i < nEdges; ++i) {
            if (!animationsAllowed) {
                return false
            }

            const circle = tryGetFromMap(pool.platformBindings, platforms[i])
            circle.style.opacity = null
            if (pulsate) {
                pulsateCircle(circle, 1.5, 200)
            }

            const edge = edges[i]
            const outerOld = pool.outerEdgeBindings.get(edges[i]) as SVGPathElement|SVGLineElement|undefined
            if (!outerOld) {
                continue
            }
            const innerOld = pool.innerEdgeBindings.get(edges[i])
            const outer: typeof outerOld = outerOld.cloneNode(true) as any
            const inner: typeof outer = innerOld === undefined ? undefined : innerOld.cloneNode(true) as any
            const pathsOuter = byId('paths-outer')
            pathsOuter.appendChild(outer)
            const pathsInner = byId('paths-inner')
            if (inner) {
                pathsInner.appendChild(inner)
            }

            Filters.applyDrop(outer)
            const reverse = edge.source !== platforms[i]
            const animations = [animatePathElement(outer, speed, reverse)]
            if (inner) {
                animations.push(animatePathElement(inner, speed, reverse))
            }

            await Promise.all(animations)
            outerOld.style.opacity = null
            if (outer.id.charAt(1) !== 't') {
                Filters.applyDrop(outerOld)
            }
            pathsOuter.removeChild(outer)
            if (inner) {
                innerOld.style.opacity = null
                pathsInner.removeChild(inner)
            }
        }
        const lastCircle = tryGetFromMap(pool.platformBindings, last(platforms))
        lastCircle.style.opacity = null
        if (pulsate) {
            pulsateCircle(lastCircle, 3, 200)
        }
        return true
    }

    export function animateRoute(platforms: Platform[], edges: Edge<Platform>[], speed = 1) {
        currentAnimation = animateCurrentRoute(platforms, edges, speed).then(finished => {
            currentAnimation = null
            animationsAllowed = true
            return finished
        })
        return currentAnimation
    }

    export async function pulsateCircle(circle: SVGCircleElement, scaleFactor: number, duration: number) {
        circle.getBoundingClientRect()
        const { style } = circle
        style.transition = `transform ${duration / 2}ms linear`
        Scale.scaleCircle(circle, scaleFactor)
        await transitionEnd(circle)
        style.transform = 'scale(1)'
        await transitionEnd(circle)
        style.transition = null
        style.transform = null
    }
}

export async function visualizeRoute(obj: ShortestRouteObject<Platform>, animate = true) {
    const { platforms = [], edges, time } = obj
    const walkTo = ft(time.walkTo)
    if (edges === undefined) {
        return alertify.success(tr`${walkTo} on foot!`)
    }

    await Animation.terminateAnimations()
    for (const { style } of document.querySelectorAll(ANIMATION_GREYING_SELECTOR) as any as HTMLElement[]) {
        //style['-webkit-filter'] = 'grayscale(1)';
        style.filter = null
        style.opacity = '0.25'
    }
    if (!animate) {
        rehighlightEdges(edges)
        rehighlightPlatforms(platforms)
        return
    }

    const finished = await Animation.animateRoute(platforms, edges, 1)
    // finished is undefined if not animated, false if animation is still running or true if otherwise
    if (finished) {
        alertify.message(tr`TIME:<br>${walkTo} on foot<br>${ft(time.metro)} by metro<br>${ft(time.walkFrom)} on foot<br>TOTAL: ${ft(time.total)}`, 10)
    }
}

export function rehighlightEdges(edges: Edge<Platform>[]) {
    for (const edge of edges) {
        const outer = pool.outerEdgeBindings.get(edge)
        if (outer === undefined) {
            continue
        }
        outer.style.opacity = null
        const inner = pool.innerEdgeBindings.get(edge)
        if (inner !== undefined) {
            inner.style.opacity = null
        }
        if (edge instanceof Span) {
            Filters.applyDrop(outer)
        }
    }
}

export function rehighlightPlatforms(platforms: Platform[]) {
    for (const platform of platforms) {
        const circle = pool.platformBindings.get(platform)
        if (circle) {
            circle.style.opacity = null
        }
    }
}
