import { applyDrop } from 'utils/svg/filters'
import { ShortestRouteObject } from 'utils/algorithm/shortestRoute'
import formatTime from 'utils/lang/formatTime'

import {
    Platform,
    Edge,
    Span,
    Transfer,
} from '../../network'
import pool from '../../ObjectPool'

import * as animation from './animation'

const alertifyPromise = import(/* webpackChunkName: "alertify" */ 'ui/alertify')

const ANIMATION_GREYING_SELECTOR = [
    'paths-inner',
    'paths-outer',
    'transfers-inner',
    'transfers-outer',
    'station-circles',
].map(s => `#${s} *`).join(', ')

export async function visualizeRoute(obj: ShortestRouteObject<Platform>, shouldAnimate = true) {
    const { platforms = [], edges, time } = obj
    const walkTo = formatTime(time.walkTo)
    const alertify = (await alertifyPromise).default
    if (edges === undefined) {
        return alertify.success(`${walkTo} on foot!`)
    }

    await animation.terminateAnimations()
    for (const { style } of document.querySelectorAll(ANIMATION_GREYING_SELECTOR) as any as HTMLElement[]) {
        //style['-webkit-filter'] = 'grayscale(1)';
        style.filter = 'initial'
        style.opacity = '0.25'
    }
    if (!shouldAnimate) {
        rehighlightEdges(edges)
        rehighlightPlatforms(platforms)
        return
    }

    const finished = await animation.animateRoute(platforms, edges)
    // finished is undefined if not animated, false if animation is still running or true if otherwise
    if (finished) {
        const lines = [
            'TIME',
            `${walkTo} on foot`,
            `${formatTime(time.metro)} by metro`,
            `${formatTime(time.walkFrom)} on foot`,
            `TOTAL: ${formatTime(time.total)}`,
        ]
        alertify.message(lines.join('<br>'), 10)
    }
}

export function rehighlightEdges(edges: Edge<Platform>[]) {
    for (const edge of edges) {
        if (edge instanceof Transfer && edge.type === 'osi') {
            continue
        }
        const outer = pool.outerEdgeBindings.get(edge)
        if (outer === undefined) {
            continue
        }
        outer.style.opacity = ''
        const inner = pool.innerEdgeBindings.get(edge)
        if (inner !== undefined) {
            inner.style.opacity = ''
        }
        if (edge instanceof Span) {
            applyDrop(outer)
        }
    }
}

export function rehighlightPlatforms(platforms: Platform[]) {
    for (const platform of platforms) {
        const circle = pool.platformBindings.get(platform)
        if (circle) {
            circle.style.opacity = ''
        }
    }
}
