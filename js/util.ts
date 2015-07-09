/// <reference path="./../typings/tsd.d.ts" />
import L = require('leaflet');

export function getUserLanguage(): string {
    return (navigator.userLanguage || navigator.language).slice(0, 2).toLowerCase();
}

export function parseTransform(val: string): L.Point {
    const matches = val.match(/translate3d\((-?\d+)px,\s?(-?\d+)px,\s?(-?\d+)px\)/i);
    return (matches) ? new L.Point(Number(matches[1]), Number(matches[2])) : new L.Point(0, 0);
}

export function findCircle(graph: {platforms: {transfers: number[]}[]}, station: {platforms: number[]}): {transfers: number[]}[] {
    let platforms = [];
    station.platforms.forEach(platformNum => platforms.push(graph.platforms[platformNum]));
    if (platforms.length === 3 && platforms.every(platform => platform.transfers.length === 2)) {
        return platforms;
    }
    return null;
}

export function getCircumcenter(positions: L.Point[]): L.Point {
    if (positions.length !== 3) {
        throw new Error('must have 3 vertices');
    }
    console.log(positions[1]);
    const b = positions[1].subtract(positions[0]);
    const c = positions[2].subtract(positions[0]);
    const bDot = b.x * b.x + b.y * b.y;
    const cDot = c.x * c.x + c.y * c.y;
    return new L.Point((c.y * bDot - b.y * cDot), (b.x * cDot - c.x * bDot))
        .divideBy(2.0 * (b.x * c.y - b.y * c.x))
        .add(positions[0]);
}

export function getSVGDataset(el: Element): any {
    if (el['dataset']) {
        return el['dataset'];
    }
    const attrs = el.attributes;
    let dataset = {};
    for (let i = 0; i < attrs.length; ++i) {
        let attr = attrs[i].value
        if (attr.startsWith('data-')) {
            dataset[attr.slice(5)] = el.getAttribute(attr);
        }
    }
    return dataset;
}

export function setSVGDataset(el: Element, dataset: any): void {
    Object.keys(dataset).forEach(key => el.setAttribute('data-' + key, dataset[key]));
}

//export function getSegmentLength(source: L.Point, target: L.Point): number {
//    const a = target.subtract(source);
//    return Math.sqrt(a.x * a.x + a.y * a.y);
//}