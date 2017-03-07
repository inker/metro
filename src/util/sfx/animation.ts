import { Browser } from 'leaflet'
import animateSvg from 'animate-svg'
import { last } from 'lodash'

import pool from '../../ObjectPool'
import { filters } from '../svg'
import { tryGetFromMap } from '../index'
import { byId } from '../dom'
import { transitionEnd } from '../events'

import { Platform, Edge } from '../../network'

import { scaleCircle } from './scale'

const canPulsate = Browser.webkit && !Browser.mobile

let animationsAllowed = true
let currentAnimation: Promise<boolean>|null = null

export function terminateAnimations() {
    if (currentAnimation === null) {
        return Promise.resolve(true)
    }
    animationsAllowed = false
    return currentAnimation
}

async function animateCurrentRoute(platforms: Platform[], edges: Edge<Platform>[], speed = 1) {
    const nEdges = edges.length
    for (let i = 0; i < nEdges; ++i) {
        if (!animationsAllowed) {
            return false
        }

        const circle = tryGetFromMap(pool.platformBindings, platforms[i])
        circle.style.opacity = null
        if (canPulsate) {
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

        filters.applyDrop(outer)
        const reverse = edge.source !== platforms[i]
        const animations = [animateSvg(outer, speed, reverse)]
        if (inner) {
            animations.push(animateSvg(inner, speed, reverse))
        }

        await Promise.all(animations)
        outerOld.style.opacity = null
        if (outer.id.charAt(1) !== 't') {
            filters.applyDrop(outerOld)
        }
        pathsOuter.removeChild(outer)
        if (inner) {
            innerOld.style.opacity = null
            pathsInner.removeChild(inner)
        }
    }
    const lastCircle = tryGetFromMap(pool.platformBindings, last(platforms))
    lastCircle.style.opacity = null
    if (canPulsate) {
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
    scaleCircle(circle, scaleFactor)
    await transitionEnd(circle)
    style.transform = 'scale(1)'
    await transitionEnd(circle)
    style.transition = null
    style.transform = null
}
