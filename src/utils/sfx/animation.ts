import { Browser } from 'leaflet'
import animateSvg from 'animate-svg'
import { last } from 'lodash'

import { applyDrop } from 'utils/svg/filters'
import { tryGetFromMap } from 'utils/collections'
import { byId } from 'utils/dom'
import { transitionEnd } from 'utils/events'

import pool from '../../ObjectPool'
import {
    Platform,
    Edge,
    Transfer,
} from '../../network'

import { scaleElement } from './scale'

const canPulsate = Browser.webkit && !Browser.mobile

let animationsAllowed = true
let currentAnimation: Promise<boolean> | null = null

const BASE_SPEED = 1
const TRANSFER_SPEED = 0.25

const CIRCLE_SCALE = 1.5
const LAST_CIRCLE_SCALE = 3
const CIRCLE_SCALE_DURATION = 200

export function terminateAnimations() {
    if (currentAnimation === null) {
        return Promise.resolve(true)
    }
    animationsAllowed = false
    return currentAnimation
}

async function animateCurrentRoute(platforms: Platform[], edges: Edge<Platform>[]) {
    const nEdges = edges.length
    const transfersOuter = document.getElementById('transfers-outer')
    for (let i = 0; i < nEdges; ++i) {
        if (!animationsAllowed) {
            return false
        }

        const circle = tryGetFromMap(pool.platformBindings, platforms[i])
        circle.style.opacity = null
        if (canPulsate) {
            pulsateCircle(circle, CIRCLE_SCALE, CIRCLE_SCALE_DURATION)
        }

        const edge = edges[i]
        const isTransfer = edge instanceof Transfer
        const outerOld = pool.outerEdgeBindings.get(edges[i])
        if (!outerOld || isTransfer && ((edge as Transfer).type === 'osi' || outerOld.parentNode !== transfersOuter)) {
            continue
        }
        const innerOld = pool.innerEdgeBindings.get(edges[i])
        const outer = outerOld.cloneNode(true) as typeof outerOld
        const inner = innerOld === undefined ? undefined : innerOld.cloneNode(true) as typeof outer
        const pathsOuter = byId('paths-outer')
        pathsOuter.appendChild(outer)
        const pathsInner = byId('paths-inner')
        if (inner) {
            pathsInner.appendChild(inner)
        }

        applyDrop(outer)
        const speed = isTransfer ? TRANSFER_SPEED : BASE_SPEED
        const reverse = edge.source !== platforms[i]
        const animations = [animateSvg(outer, speed, reverse)]
        if (inner) {
            animations.push(animateSvg(inner, speed, reverse))
        }

        await Promise.all(animations)
        outerOld.style.opacity = null
        applyDrop(outerOld)
        pathsOuter.removeChild(outer)
        if (innerOld) {
            innerOld.style.opacity = null
        }
        if (inner) {
            pathsInner.removeChild(inner)
        }
    }
    const lastCircle = tryGetFromMap(pool.platformBindings, last(platforms))
    lastCircle.style.opacity = null
    if (canPulsate) {
        pulsateCircle(lastCircle, LAST_CIRCLE_SCALE, CIRCLE_SCALE_DURATION)
    }
    return true
}

export function animateRoute(platforms: Platform[], edges: Edge<Platform>[]) {
    currentAnimation = animateCurrentRoute(platforms, edges).then(finished => {
        currentAnimation = null
        animationsAllowed = true
        return finished
    })
    return currentAnimation
}

export async function pulsateCircle(circle: SVGCircleElement | SVGRectElement, scaleFactor: number, duration: number) {
    const { style } = circle
    style.transition = `transform ${duration / 2}ms linear`
    circle.getBoundingClientRect()
    scaleElement(circle, scaleFactor)
    await transitionEnd(circle)
    style.transform = 'scale(1)'
    await transitionEnd(circle)
    style.transition = ''
    style.transform = null
}
