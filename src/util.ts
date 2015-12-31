/// <reference path="../typings/tsd.d.ts" />
import * as L from 'leaflet';
import { findClosestObject } from './geo';
import * as po from './plain-objects';
const alertify = require('alertifyjs');

export const userLanguage = (navigator.userLanguage || navigator.language).slice(0, 2).toLowerCase();

export function translate(text: string) {
    // function will be replaced when a different primary language other than English is detected
    return text;
}

export function parseTransform(val: string): L.Point {
    const matches = val.match(/translate(3d)?\((-?\d+).*?,\s?(-?\d+).*?(,\s?(-?\d+).*?)?\)/i);
    return matches ? new L.Point(Number(matches[2]), Number(matches[3])) : new L.Point(0, 0);
}

export function replaceTransform(el: HTMLElement) {
    const t3d = parseTransform(el.style.transform);
    el.style.transform = `translate(${t3d.x}px, ${t3d.y}px)`;
}

export function arrayEquals<T>(a: T[], b: T[]) {
    const n = a.length;
    if (n !== b.length) return false;
    for (let i = 0; i < n; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

export function findCircle(graph: po.Graph, station: po.Station): po.Platform[] {
    // TODO: if n=3, leave as it is; if n=4, metro has priority
    const stationPlatforms = station.platforms.map(platformNum => graph.platforms[platformNum]);
    if (stationPlatforms.length === 3) {
        return stationPlatforms.every(p => p.transfers.length === 2) ? stationPlatforms : [];
    }
    if (stationPlatforms.length === 4) {
        const ps = stationPlatforms.slice().sort((a, b) => a.transfers.length - b.transfers.length);
        const degs = ps.map(p => p.transfers.length);
        if (arrayEquals(degs, [2, 2, 3, 3])) {
            return ps;
        }
        if (arrayEquals(degs, [1, 2, 2, 3])) {
            return ps.slice(1);
        }
    }
    return [];
}

export function mouseToLatLng(map: L.Map, event: MouseEvent): L.LatLng {
    const clientPos = new L.Point(event.clientX, event.clientY);
    const rect = map.getContainer().getBoundingClientRect();
    const containerPos = new L.Point(rect.left, rect.top);
    const coors = map.containerPointToLatLng(clientPos.subtract(containerPos));
    return coors;
}

export function once(el: EventTarget, eventType: string, listener: (e: KeyboardEvent) => any) {
    const handler: typeof listener = e => {
        el.removeEventListener(eventType, handler);
        listener(e);
    }
    el.addEventListener(eventType, handler);
}

export function onceEscapePress(handler: (ev: KeyboardEvent) => any) {
    once(window, 'keydown', e => {
        if (e.keyCode === 27) handler(e);
    });
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

export function resetStyle() {
    const selector = '#paths-inner *, #paths-outer *, #transfers-inner *, #transfers-outer *, #station-circles *';
    const els = document.querySelectorAll(selector);
    for (let i = 0; i < els.length; ++i) {
        const el: HTMLElement = els[i] as any;
        el.style.opacity = null;
        if (el.id.charAt(1) !== 't') {
            el.style.filter = null;
        }
    }
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

export function dot(v1: L.Point, v2: L.Point): number {
    return v1.x * v2.x + v1.y * v2.y;
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
    return new Promise<string>((resolve, reject) => {
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
    const routes: po.Route[] = [];
    spans.forEach(span => span.routes.forEach(i => routes.push(graph.routes[i])));
    const lines = routes.map(rt => rt.line);
    const platformHints = dirHints[platform.name];
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
    const blob = new Blob([content], { type: "octet/stream" });
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

/**
 * 
 * @param distance
 * @param maxSpeed - m/s
 * @param acceleration - m/s²
 */
export function timeToTravel(distance: number, maxSpeed: number, acceleration: number) {
    const distanceToAccelerate = maxSpeed * maxSpeed / acceleration;
    return distanceToAccelerate < distance
        ? maxSpeed / acceleration * 2 + (distance - distanceToAccelerate) / maxSpeed
        : Math.sqrt(distance / acceleration) * 2;
}

type ShortestPathObject = {
    platforms?: number[];
    edges?: string[];
    time: { walkTo: number, metro?: number, walkFrom?: number, total?: number };
}
export function shortestPath(graph: po.Graph, p1: L.LatLng, p2: L.LatLng): ShortestPathObject {
    const walkingSpeed = 1.4,
        walkingWithObstacles = 1,
        maxTrainSpeed = 20,
        trainAcceleration = 0.7,
        metroStopTime = 30,
        eLineStopTime = 60,
        metroWaitingTime = 180,
        eLineWaitingTime = 300;
    const distanceBetweenPoints = (a: L.LatLng, b: L.LatLng) => L.LatLng.prototype.distanceTo.call(a, b) as number;
    const objects = graph.platforms;
    // time to travel from station to the p1 location
    const dist: number[] = [],
        timesOnFoot: number[] = [];
    for (let o of objects) {
        const hasE = o.spans.map(i => graph.spans[i].routes[0])
            .map(i => graph.routes[i].line)
            .some(l => l.startsWith('E'));
        let distance = distanceBetweenPoints(p1, o.location),
            time = distance / walkingWithObstacles
        dist.push(time + (hasE ? eLineWaitingTime : metroWaitingTime));
        distance = distanceBetweenPoints(o.location, p2);
        time = distance / walkingWithObstacles;
        timesOnFoot.push(time);
    }
    // pick the closest one so far
    let currentIndex = objects.indexOf(findClosestObject(p1, objects));
    const objectSet = new Set<number>(objects.map((o, i) => i)),
        prev: number[] = objects.map(i => null);
    // time on foot between locations
    const onFoot = distanceBetweenPoints(p1, p2) / walkingWithObstacles;
    while (objectSet.size > 0) {
        var minDist = Infinity;
        objectSet.forEach(i => {
            if (dist[i] < minDist) {
                currentIndex = i;
                minDist = dist[i];
            }
        });
        const currentNode = objects[currentIndex];
        objectSet.delete(currentIndex);
        //console.log('current:', currentIndex, currentNode.name);
        // getting his previous
        var prevIndex = prev[currentIndex];
        const previous = objects[prevIndex];
        const prevSpan = graph.spans.find(s => s.source === currentIndex && s.target === prevIndex || s.source === prevIndex && s.target === currentIndex);

        const neighborIndices: number[] = [],
            times: number[] = [];
        for (let i of currentNode.spans) {
            const s = graph.spans[i];
            const neighborIndex = currentIndex === s.source ? s.target : s.source;
            if (!objectSet.has(neighborIndex)) continue;
            neighborIndices.push(neighborIndex);
            const neighbor = objects[neighborIndex];
            const distance = distanceBetweenPoints(currentNode.location, neighbor.location);
            let lineChangePenalty = 0;
            if (prevSpan && graph.routes[prevSpan.routes[0]] !== graph.routes[s.routes[0]]) {
                // doesn't seem to work
                //lineChangePenalty = metroWaitingTime;
            }
            // TODO: lower priority for E-lines
            const callTime = graph.routes[s.routes[0]].line.startsWith('E') ? eLineStopTime : metroStopTime;
            const travelTime = timeToTravel(distance, maxTrainSpeed, trainAcceleration);
            times.push(travelTime + callTime + lineChangePenalty);
        }
        // TODO: if transferring to an E-line, wait more
        // TODO: penalty for changing lines (cross-platform)
        for (let neighborIndex of graph.stations[currentNode.station].platforms) {
            if (!objectSet.has(neighborIndex)) continue;
            neighborIndices.push(neighborIndex);
            const neighbor = objects[neighborIndex];
            const hasE = neighbor.spans
                .map(i => graph.spans[i].routes[0])
                .map(i => graph.routes[i].line)
                .some(l => l.startsWith('E'));
            const distance = distanceBetweenPoints(currentNode.location, neighbor.location);
            times.push(distance / walkingSpeed + (hasE ? eLineWaitingTime : metroWaitingTime));
        }

        for (let i = 0; i < neighborIndices.length; ++i) {
            const neighborIndex = neighborIndices[i],
                alt = dist[currentIndex] + times[i];
            if (alt < dist[neighborIndex]) {
                dist[neighborIndex] = alt;
                prev[neighborIndex] = currentIndex;
            }
        }
        const alt = dist[currentIndex] + timesOnFoot[currentIndex];
    }
    // find the shortest time & the exit station
    let shortestTime = Infinity;
    for (let i = 0; i < dist.length; ++i) {
        const alt = dist[i] + timesOnFoot[i];
        if (alt < shortestTime) {
            shortestTime = alt;
            currentIndex = i;
        }
    }
    // if walking on foot is faster, then why take the underground?
    if (onFoot < shortestTime) {
        return { time: { walkTo: onFoot } };
    }
    const path: string[] = [],
        platformPath = [currentIndex];
    // remove later
    for (; ;) {
        const currentNode = objects[currentIndex];
        //console.log('current', currentNode.name);
        const prevIndex = prev[currentIndex];
        if (prevIndex === null) break;
        //console.log('prev', objects[prevIndex].name);
        let p = '';
        for (let i of currentNode.spans) {
            const s = graph.spans[i];
            if (s.source === currentIndex && s.target === prevIndex || s.target === currentIndex && s.source === prevIndex) {
                p = 'p-' + i;
                break;
            }
        }
        if (p === '') {
            for (let i = 0; i < graph.transfers.length; ++i) {
                const t = graph.transfers[i];
                if (t.source === currentIndex && t.target === prevIndex || t.target === currentIndex && t.source === prevIndex) {
                    p = 't-' + i;
                    break;
                }
            }
        }
        if (p === '') {
            const { transfers, midPlatforms } = shortestTransfer(graph, prevIndex, currentIndex);
            path.push(...transfers.reverse().map(i => 't-' + i));
            platformPath.push(...midPlatforms);
        } else {
            path.push(p);
        }
        platformPath.push(prevIndex);
        currentIndex = prevIndex;
    }
    platformPath.reverse();
    path.reverse();
    const walkFromTime = timesOnFoot[platformPath[platformPath.length - 1]];
    const walkToTime = dist[platformPath[0]];
    const metroTime = shortestTime - walkFromTime - walkToTime;
    return {
        platforms: platformPath,
        edges: path,
        time: {
            walkTo: walkToTime,
            metro: metroTime,
            walkFrom: walkFromTime,
            total: shortestTime
        }
    };
}

function shortestTransfer(graph: po.Graph, p1i: number, p2i: number) {
    const p1 = graph.platforms[p1i],
        p2 = graph.platforms[p2i];
    if (p1.station !== p2.station) {
        throw new Error(`platforms (${p1.name} & ${p2.name} must be on the same station`);
    }
    const distanceBetweenPoints = (a: L.LatLng, b: L.LatLng) => L.LatLng.prototype.distanceTo.call(a, b) as number;
    const station = graph.stations[p1.station];
    const platforms = station.platforms;
    const platformSet = new Set<number>(platforms);
    const dist: number[] = [],
        prev: number[] = [];
    for (let i of platforms) {
        dist[i] = Infinity;
        prev[i] = null;
    }
    dist[p1i] = 0;
    let currentIndex = p1i;
    while (platformSet.size > 0) {
        var minDist = Infinity;
        platformSet.forEach(i => {
            if (dist[i] < minDist) {
                currentIndex = i;
                minDist = dist[i];
            }
        });
        platformSet.delete(currentIndex);
        const platform = graph.platforms[currentIndex];
        const neighborIndices = platform.transfers;
        for (let neighborIndex of neighborIndices) {
            if (!platformSet.has(neighborIndex)) continue;
            const distance = distanceBetweenPoints(platform.location, graph.platforms[neighborIndex].location),
                alt = dist[currentIndex] + distance;
            if (alt < dist[neighborIndex]) {
                dist[neighborIndex] = alt;
                prev[neighborIndex] = currentIndex;
            }
        }
    }
    const transfers: number[] = [];
    const midPlatforms: number[] = [];
    currentIndex = p2i;
    for (; ;) {
        var prevIndex = prev[currentIndex];
        if (prevIndex === null) break;
        const transferIndex = graph.transfers.findIndex(t => t.source === currentIndex && t.target === prevIndex || t.source === prevIndex && t.target === currentIndex);
        transfers.push(transferIndex);
        currentIndex = prevIndex;
        midPlatforms.push(currentIndex);
    }
    midPlatforms.pop();
    return {
        transfers: transfers.reverse(),
        midPlatforms: midPlatforms.reverse()
    }
}

export function meanColor(rgb: string[]): string {
    var re = /rgb\s*\((\d+),\s*(\d+),\s*(\d+)\s*\)/,
        n = rgb.length;
    var [r, g, b] = rgb
        .reduce((prev, cur) => cur.match(re).splice(1).map((it, i) => prev[i] + parseInt(it)), [0, 0, 0])
        .map(i => Math.floor(i / n));
    return `rgb(${r}, ${g}, ${b})`;
}

function inflect(value: number, str: string) {
    return value === 0 ? '' : `${value} ${value > 1 && userLanguage === 'en' ? str + 's' : str}`;
}

export function formatTime(time: number) {
    if (time < 60) {
        return Math.round(time) + ' seconds';
    }
    if (time < 3570) {
        const mins = Math.round(time / 60);
        return inflect(mins, 'min');
    }
    const hours = Math.floor(time / 3600);
    const mins = Math.floor((time - hours * 3600) / 60);
    return `${inflect(hours, 'hour')} ${inflect(mins, 'min')}`;
}

export function platformRenameDialog(graph: po.Graph, platform: po.Platform) {
    const ru = platform.name, {fi, en} = platform.altNames;

    const names = en ? [ru, fi, en] : fi ? [ru, fi] : [ru];
    const nameString = names.join('|');
    alertify.prompt('New name', nameString, (okevt, val: string) => {
        const newNames = val.split('|');
        [platform.name, platform.altNames['fi'], platform.altNames['en']] = newNames;
        if (val === nameString) {
            return alertify.warning('Name was not changed');
        }
        const oldNamesStr = names.slice(1).join(', '),
            newNamesStr = newNames.slice(1).join(', ');
        alertify.success(`${ru} (${oldNamesStr}) renamed to ${newNames[0]} (${newNamesStr})`);
        const station = graph.stations[platform.station];
        if (station.platforms.length < 2) return;
        alertify.confirm('Rename the entire station?', () => {
            for (let i of station.platforms) {
                const p = graph.platforms[i];
                [p.name, p.altNames['fi'], p.altNames['en']] = newNames;
            }
            [station.name, station.altNames['fi'], station.altNames['en']] = newNames;
            alertify.success(`The entire station was renamed to ${val}`);
        });

    }, () => alertify.warning('Name change cancelled'));
}

import * as geo from './geo';
export function geoMean(points: L.LatLng[], lossFunction: (pts: L.LatLng[], cur: L.LatLng) => number): L.LatLng {
    let avg = geo.getCenter(points);
    let step = 1;
    let totalDistance = Infinity;
    for (; step > 0.00000001; step *= 0.5) {
        for (let i = -5 * step; i <= 5 * step; i += step) {
            for (let j = -5 * step; j <= 5 * step; j += step) {
                var pt = new L.LatLng(avg.lat + i, avg.lng + j);
                const total = lossFunction(points, pt);
                if (total < totalDistance) {
                    avg = pt;
                    totalDistance = total;
                }
            }
        }

    }
    return avg;
}
