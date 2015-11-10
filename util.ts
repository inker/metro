/// <reference path="./typings/tsd.d.ts" />

'use strict';

import L = require('leaflet');
import * as po from './plain-objects';

export function diffByOne(a: string, b: string): boolean {
    let diff = 0;
    if (a !== '' && b !== '' && a.length === b.length) {
        for (let i = 0, j = 0; i < a.length && j < b.length; ++i, ++j) {
            if (a[i] != b[j]) {
                ++diff;
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

export function findCircle(graph: po.Graph, station: po.Station): po.Platform[] {
    if (station.platforms.length !== 3) return null;
    let platforms = station.platforms.map(platformNum => graph.platforms[platformNum]);
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
    let dataset = {};
    for (let i = 0; i < attrs.length; ++i) {
        let attr = attrs[i].name;
        if (attr.startsWith('data-')) {
            dataset[attr.slice(5)] = el.getAttribute(attr);
        }
    }
    return dataset;
}

export function setSVGDataset(el: Element, dataset: any): void {
    Object.keys(dataset).forEach(key => el.setAttribute('data-' + key, dataset[key]));
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

export function verifyHints(graph: po.Graph, hints: po.Hints): Promise<string> {
    function checkPlatformHintObject(obj) {
        Object.keys(obj).forEach(line => {
            const val = obj[line];
            if (typeof val === 'string') {
                if (graph.platforms.find(el => el.name === val) === undefined) {
                    throw new Error(`platform ${val} doesn't exist`);
                }
            } else {
                val.forEach(item => {
                    if (graph.platforms.find(el => el.name === item) === undefined) {
                        throw new Error(`platform ${item} doesn't exist`);
                    }
                });
            }
        });
    }
    return new Promise((resolve, reject) => {
        const crossPlatform = hints.crossPlatform;
        Object.keys(crossPlatform).forEach(platformName => {
            if (graph.platforms.find(el => el.name === platformName) === undefined) {
                reject(`platform ${platformName} doesn't exist`);
            }
            const obj = crossPlatform[platformName];
            if ('forEach' in obj) {
                obj.forEach(o => checkPlatformHintObject);
            } else {
                checkPlatformHintObject(obj);
            }
        });
        Object.keys(hints.englishNames).forEach(platformName => {
            if (graph.platforms.find(el => el.name === platformName) === undefined) {
                reject(`platform ${platformName} doesn't exist`);
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