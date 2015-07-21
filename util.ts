/// <reference path="./typings/tsd.d.ts" />

'use strict';

import L = require('leaflet');
import po = require('./plain-objects');

export function diffByOne(a: string, b: string): boolean {
    let diff = 0;
    if (a !== '' && b !== '' && a.length === b.length) {
        for (let i = 0, j = 0; i < a.length && j < b.length; ++i, ++j) {
            if (a[i] != b[j]) {
                ++diff;
                if (a[i + 1] == b[j]) {
                    ++i;
                } else if (a[i] == b[j + 1]) {
                    ++j;
                } else if (a[i + 1] == b[j + 1]) {
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
    if (pts.length === 0) {
        return new L.Point(0, 0);
    }
    let sum = new L.Point(0, 0);
    for (let i = 0; i < pts.length; ++i) {
        sum = sum.add(pts[i]);
    }
    return sum.divideBy(pts.length);
}

export function verifyHints(graph: po.Graph, hints: po.Hints): Promise<string> {
    return new Promise((resolve, reject) => {
        const crossPlatform = hints.crossPlatform;
        Object.keys(crossPlatform).forEach(platformName => {
            if (graph.platforms.find(el => el.name === platformName) === undefined) {
                throw new Error('platform ' + platformName + " doesn't exist");
            }
            const obj = crossPlatform[platformName];
            Object.keys(obj).forEach(line => {
                const val = obj[line];
                if (typeof val === 'string') {
                    if (graph.platforms.find(el => el.name === val) === undefined) {
                        throw new Error('platform ' + val + " doesn't exist");
                    }
                } else {
                    val.forEach(item => {
                        if (graph.platforms.find(el => el.name === item) === undefined) {
                            throw new Error('platform ' + item + " doesn't exist");
                        }
                    });
                }
            });
        });
        Object.keys(hints.englishNames).forEach(platformName => {
            if (graph.platforms.find(el => el.name === platformName) === undefined) {
                throw new Error('platform ' + platformName + " doesn't exist");
            }
        });
        resolve('hints json seems okay');
    });
}

