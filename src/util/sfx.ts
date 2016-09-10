/// <reference path="../../typings/tsd.d.ts" />
const alertify = require('alertifyjs');
import pool from '../objectpool';
import * as nw from '../network';
import { Filters } from './svg';
import { ShortestRouteObject } from '../util/algorithm';
import { tr, formatTime as ft } from '../i18n';

export namespace Scale {

    const initialCircles = new Set<SVGCircleElement>();
    const initialTransfers = new Set<SVGPathElement | SVGLineElement>();

    export function scaleCircle(circle: SVGCircleElement, scaleFactor: number, asAttribute = false) {
        if (!asAttribute) {
            circle.style.transform = `scale(${scaleFactor})`;
            return;
        }
        initialCircles.add(circle);
        // const t = scaleFactor - 1,
        //     tx = -circle.getAttribute('cx') * t,
        //     ty = -circle.getAttribute('cy') * t;
        // circle.setAttribute('transform', `matrix(${scaleFactor}, 0, 0, ${scaleFactor}, ${tx}, ${ty})`);
        const oldR = circle.getAttribute('r');
        circle.setAttribute('data-r', oldR);
        circle.setAttribute('r', (+oldR * scaleFactor).toString());
    }

    export function scaleStation(station: nw.Station, scaleFactor: number, nwTransfers?: nw.Transfer[]) {
        const transferOuterStrokeWidth = parseFloat(document.getElementById('transfers-outer').style.strokeWidth),
            transferInnerStrokeWidth = parseFloat(document.getElementById('transfers-inner').style.strokeWidth)
        for (let p of station.platforms) {
            const circle = pool.platformBindings.get(p);
            scaleCircle(circle, scaleFactor, true);
            if (nwTransfers === undefined || station.platforms.length < 2) continue;
            for (let tr of nwTransfers) {
                if (tr.has(p)) {
                    const outer = pool.outerEdgeBindings.get(tr);
                    const inner = pool.innerEdgeBindings.get(tr);
                    initialTransfers.add(outer);
                    initialTransfers.add(inner);
                    outer.style.strokeWidth = transferOuterStrokeWidth * scaleFactor + 'px';
                    inner.style.strokeWidth = transferInnerStrokeWidth * scaleFactor + 'px';
                }
            }
        }
    }

    export function unscaleAll() {
        initialCircles.forEach(circle => circle.setAttribute('r', circle.getAttribute('data-r')));
        //initialCircles.forEach(circle => circle.removeAttribute('transform'));
        initialTransfers.forEach(tr => tr.style.strokeWidth = null);
        initialTransfers.clear();
        initialCircles.clear();
    }
}

export namespace Animation {
    let animationsAllowed = true;
    let currentAnimation: Promise<boolean> = null;

    export function terminateAnimations() {
        if (currentAnimation === null) {
            return Promise.resolve(true);
        }
        animationsAllowed = false;
        return currentAnimation;
    }

    export function animateRoute(platforms: nw.Platform[], edges: nw.Edge<nw.Platform>[], speed = 1) {
        const pulsate = L.Browser.webkit && !L.Browser.mobile;
        currentAnimation = terminateAnimations().then(current => new Promise<boolean>((resolve, reject) => (function animateSpan(i: number) {
            if (!animationsAllowed) {
                return resolve(false);
            }
            const circle = pool.platformBindings.get(platforms[i]);
            circle.style.opacity = null;
            if (pulsate) {
                pulsateCircle(circle, i < edges.length ? 1.5 : 3, 200);
            }
            if (i === edges.length) {
                return resolve(true);
            }
            const outerOld = pool.outerEdgeBindings.get(edges[i]);
            if (outerOld === undefined) {
                return animateSpan(i + 1);
            }
            const innerOld = pool.innerEdgeBindings.get(edges[i]);
            const outer: typeof outerOld = outerOld.cloneNode(true) as any;
            const inner: typeof outer = innerOld === undefined ? undefined : innerOld.cloneNode(true) as any;
            document.getElementById('paths-outer').appendChild(outer);
            if (inner) {
                document.getElementById('paths-inner').appendChild(inner);
            }

            let length: number;
            if (outer instanceof SVGPathElement) {
                length = outer.getTotalLength();
            } else {
                const from = new L.Point(+outer.getAttribute('x1'), +outer.getAttribute('y1')),
                    to = new L.Point(+outer.getAttribute('x2'), +outer.getAttribute('y2'));
                length = from.distanceTo(to);
            }

            const edge = edges[i];
            const initialOffset = edge.source === platforms[i] ? length : -length;
            const duration = length / speed;
            Filters.applyDrop(outer);
            for (let path of (inner === undefined ? [outer] : [outer, inner])) {
                const pathStyle = path.style;
                pathStyle.transition = null;
                pathStyle.opacity = null;
                pathStyle.strokeDasharray = length + ' ' + length;
                pathStyle.strokeDashoffset = initialOffset.toString();
                path.getBoundingClientRect();
                pathStyle.transition = `stroke-dashoffset ${duration}ms linear`;
                pathStyle.strokeDashoffset = '0';
            }
            outer.addEventListener('transitionend', e => {
                outerOld.style.opacity = null;
                if (outer.id.charAt(1) !== 't') {
                    Filters.applyDrop(outerOld);
                }
                outer.parentNode.removeChild(outer);
                if (inner) {
                    innerOld.style.opacity = null;
                    inner.parentNode.removeChild(inner);
                }
                animateSpan(i + 1);
            });
            //console.log(outer);
        })(0)).then(finished => {
            currentAnimation = null;
            animationsAllowed = true;
            return finished;
        }));
        return currentAnimation;
    }

    export function pulsateCircle(circle: SVGCircleElement, scaleFactor: number, duration: number) {
        circle.getBoundingClientRect();
        circle.style.transition = `transform ${duration / 2}ms linear`;
        Scale.scaleCircle(circle, scaleFactor);
        circle.addEventListener('transitionend', function foo(e) {
            this.removeEventListener('transitionend', foo);
            this.style.transform = 'scale(1)';
            this.addEventListener('transitionend', function bar(e) {
                this.removeEventListener('transitionend', bar);
                this.style.transition = null;
                this.style.transform = null;
            });
        });
    }
}

export function visualizeRoute(obj: ShortestRouteObject<nw.Platform>, animate = true) {
    const { platforms, edges, time } = obj;
    const walkTo = ft(time.walkTo);
    if (edges === undefined) {
        return alertify.success(tr`${walkTo} on foot!`);
    }
    const selector = '#paths-inner *, #paths-outer *, #transfers-inner *, #transfers-outer *, #station-circles *';
    Animation.terminateAnimations().then(() => {
        for (let { style } of document.querySelectorAll(selector) as any) {
            //style['-webkit-filter'] = 'grayscale(1)';
            style.filter = null;
            style.opacity = '0.25';
        }
        if (animate) {
            return Animation.animateRoute(platforms, edges, 1);
        }
        rehighlightEdges(edges);
        rehighlightPlatforms(platforms);   
    }).then(finished => {
        // finished is undefined if not animated, false if animation is still running or true if otherwise
        if (!finished) return;
        alertify.message(tr`TIME:<br>${walkTo} on foot<br>${ft(time.metro)} by metro<br>${ft(time.walkFrom)} on foot<br>TOTAL: ${ft(time.total)}`, 10)
    });
}

export function rehighlightEdges(edges: nw.Edge<nw.Platform>[]) {
    for (let edge of edges) {
        const outer = pool.outerEdgeBindings.get(edge);
        if (outer === undefined) continue;
        outer.style.opacity = null;
        const inner = pool.innerEdgeBindings.get(edge);
        if (inner !== undefined) {
            inner.style.opacity = null;
        }
        if (edge instanceof nw.Span) {
            Filters.applyDrop(outer);
        }
    }
}

export function rehighlightPlatforms(platforms: nw.Platform[]) {
    for (let platform of platforms) {
        pool.platformBindings.get(platform).style.opacity = null;
    }
}