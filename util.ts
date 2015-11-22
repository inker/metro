/// <reference path="./typings/tsd.d.ts" />

'use strict';

import L = require('leaflet');
import * as po from './plain-objects';

export function diffByOne(a: string, b: string): boolean {
    if (a === '' || b === '' || a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0, j = 0, diff = 0; i < a.length && j < b.length; ++i, ++j) {
        if (a[i] != b[j]) {
            if (++diff > 1) return false;
            if (a[i + 1] === b[j]) {
                ++i;
            } else if (a[i] === b[j + 1]) {
                ++j;
            } else if (a[i + 1] === b[j + 1]) {
                ++i; //
                ++j;
            }
        }
    }
    return diff === 1;
}


export function getUserLanguage(): string {
    return (navigator.userLanguage || navigator.language).slice(0, 2).toLowerCase();
}

export function parseTransform(val: string): L.Point {
    const matches = val.match(/translate(3d)?\((-?\d+).*?,\s?(-?\d+).*?(,\s?(-?\d+).*?)?\)/i);
    return matches ? new L.Point(Number(matches[2]), Number(matches[3])) : new L.Point(0, 0);
}

export function replaceTransform(el: HTMLElement) {
    const t3d = parseTransform(el.style.transform);
    el.style.transform = `translate(${t3d.x}px, ${t3d.y}px)`;
}

export function findCircle(graph: po.Graph, station: po.Station): po.Platform[] {
    if (station.platforms.length !== 3) return null;
    const platforms = station.platforms.map(platformNum => graph.platforms[platformNum]);
    return platforms.every(platform => platform.transfers.length === 2) ? platforms : null;
}

export function getCircumcenter(positions: L.Point[]): L.Point {
    if (positions.length !== 3) {
        throw new Error('must have 3 vertices');
    }
    const b = positions[1].subtract(positions[0]);
    const c = positions[2].subtract(positions[0]);
    const bb = dot(b, b);
    const cc = dot(c, c);
    return new L.Point((c.y * bb - b.y * cc), (b.x * cc - c.x * bb))
        .divideBy(2.0 * (b.x * c.y - b.y * c.x))
        .add(positions[0]);
}

export function getSVGDataset(el: Element): any {
    // for webkit-based browsers
    if ('dataset' in el) {
        return el['dataset'];
    }
    // for the rest
    const attrs = el.attributes;
    const dataset = {};
    for (let i = 0; i < attrs.length; ++i) {
        const attr = attrs[i].name;
        if (attr.startsWith('data-')) {
            dataset[attr.slice(5)] = el.getAttribute(attr);
        }
    }
    return dataset;
}

export function setSVGDataset(el: Element, dataset: any): void {
    for (let key of Object.keys(dataset)) {
        el.setAttribute('data-' + key, dataset[key]);
    }
}

export function flashTitle(titles: string[], duration: number) {
    let i = 0;
    setInterval(() => document.title = titles[++i % titles.length], duration);
}

export function dot(a: L.Point, b: L.Point): number {
    return a.x * b.x + a.y * b.y;
}

export function angle(v1: L.Point, v2: L.Point): number {
    return dot(v1, v2) / v1.distanceTo(v2);
}

export function getCenter(pts: L.Point[]): L.Point {
    return pts.reduce((prev, cur) => prev.add(cur)).divideBy(pts.length);
}

export function polarToCartesian(center: L.Point, radius: number, angle: number) {
    return new L.Point(center.x + radius * Math.cos(angle), center.y + radius * Math.sin(angle));
}

export function verifyHints(graph: po.Graph, hints: po.Hints): Promise<string> {
    function checkExistence(val: string) {
        if (graph.platforms.find(el => el.name === val) === undefined) {
            throw new Error(`platform ${val} doesn't exist`);
        }
    }
    function checkPlatformHintObject(obj) {
        for (let line of Object.keys(obj)) {
            const val = obj[line];
            if (typeof val === 'string') {
                checkExistence(val);
            } else {
                val.forEach(checkExistence);
            }
        }
    }
    return new Promise((resolve, reject) => {
        const crossPlatform = hints.crossPlatform;
        Object.keys(crossPlatform).forEach(platformName => {
            if (graph.platforms.find(el => el.name === platformName) === undefined) {
                reject(`platform ${platformName} doesn't exist`);
            }
            const obj = crossPlatform[platformName];
            if ('forEach' in obj) {
                obj.forEach(checkPlatformHintObject);
            } else {
                checkPlatformHintObject(obj);
            }
        });
        resolve('hints json seems okay');
    });
}

/**
 * null: doesn't contain
 * -1: is an object
 * >=0: is an array
 */
export function hintContainsLine(graph: po.Graph, dirHints: any, platform: po.Platform): number {
    const spans = platform.spans.map(i => graph.spans[i]);
    let routes: po.Route[] = [];
    spans.forEach(span => span.routes.forEach(i => routes.push(graph.routes[i])));
    const lines = routes.map(rt => rt.line);
    let platformHints = dirHints[platform.name];
    if (platformHints) {
        if ('forEach' in platformHints) {
            for (let idx = 0; idx < platformHints.length; ++idx) {
                if (Object.keys(platformHints[idx]).some(key => lines.indexOf(key) > -1)) {
                    return idx;
                }
            }
        } else if (Object.keys(platformHints).some(key => lines.indexOf(key) > -1)) {
            return -1;
        }
    }
    return null;
}

export function downloadAsFile(title: string, content: string) {
    const a = document.createElement('a');
    const blob = new Blob([content], {type: "octet/stream"});
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a['download'] = title;
    a.click();
    window.URL.revokeObjectURL(url);
}

export function vectorToGradCoordinates(vector: L.Point) {
    const x = Math.abs(vector.x), y = Math.abs(vector.y);
    return vector.divideBy(x < y ? y : x);
}

export const lineRules = (() => {
    const cssRules = (document.styleSheets[2] as CSSStyleSheet).cssRules,
        lineRules = {};
    for (let i = 0; i < cssRules.length; ++i) {
        const rule = cssRules[i];
        if (rule instanceof CSSStyleRule) {
            const selector = rule.selectorText;
            if (selector === '#paths-outer .E') {
                lineRules['E'] = rule.style.stroke;
            } else {
                const matches = selector.match(/\.(M\d+|L)/);
                if (matches) {
                    lineRules[matches[1]] = rule.style.stroke;
                }
            }
        }
    }
    return lineRules;
})();

/**
 * 
 * @param departure
 * @param arrival
 * @param maxSpeed - m/s
 * @param acceleration - m/s²
 */
export function timeToTravel(distance: number, maxSpeed: number, acceleration: number) {
    const distanceToAccelerate = maxSpeed * maxSpeed / acceleration;
    return distanceToAccelerate < distance
        ? maxSpeed / acceleration * 2 + (distance - distanceToAccelerate) / maxSpeed
        : Math.sqrt(distance / acceleration) * 2;
}