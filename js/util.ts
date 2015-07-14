/// <reference path="./../typings/tsd.d.ts" />
import L = require('leaflet');
import po = require('../plain-objects');

export function getUserLanguage(): string {
    return (navigator.userLanguage || navigator.language).slice(0, 2).toLowerCase();
}

export function parseTransform(val: string): L.Point {
    const matches = val.match(/translate(3d)?\((-?\d+).*?,\s?(-?\d+).*?(,\s?(-?\d+).*?)?\)/i);
    return matches ? new L.Point(Number(matches[2]), Number(matches[3])) : new L.Point(0, 0);
}

export function findCircle(graph: po.Graph, station: po.Station): po.Platform[] {
    let platforms = station.platforms.map(platformNum => graph.platforms[platformNum]);
    return (platforms.length === 3 && platforms.every(platform => platform.transfers.length === 2)) ? platforms : null;
}

export function getCircumcenter(positions: L.Point[]): L.Point {
    if (positions.length !== 3) {
        throw new Error('must have 3 vertices');
    }
    console.log(positions[1]);
    const b = positions[1].subtract(positions[0]);
    const c = positions[2].subtract(positions[0]);
    const bb = b.x * b.x + b.y * b.y;
    const cc = c.x * c.x + c.y * c.y;
    return new L.Point((c.y * bb - b.y * cc), (b.x * cc - c.x * bb))
        .divideBy(2.0 * (b.x * c.y - b.y * c.x))
        .add(positions[0]);
}

export function getSVGDataset(el: Element): any {
    // for webkit-based browsers
    if (el['dataset']) {
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

export let englishStationNames = {
    'Centraľnyj voxal': 'Central Raiway Station',
    'Aeroport': 'Airport'
}

export function dot(a: L.Point, b: L.Point): number {
    return a.x * b.x + a.y * b.y;
}

export function angle(v1: L.Point, v2: L.Point): number {
    return dot(v1, v2) / v1.distanceTo(v2);
}

//export function getSegmentLength(source: L.Point, target: L.Point): number {
//    const a = target.subtract(source);
//    return Math.sqrt(a.x * a.x + a.y * a.y);
//}