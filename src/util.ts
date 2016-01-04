/// <reference path="../typings/tsd.d.ts" />
import * as L from 'leaflet';
import { findClosestObject } from './geo';
import * as po from './plain-objects';
import * as lang from './lang';
const tr = (text: string) => lang.translate(text);
const alertify = require('alertifyjs');

export function arrayEquals<T>(a: T[], b: T[]) {
    const n = a.length;
    if (n !== b.length) return false;
    for (let i = 0; i < n; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
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

export namespace Transform {
    export function parse(val: string): L.Point {
        if (val.length == 0) return new L.Point(0, 0);
        const [m, , x, y] = val.match(/translate(3d)?\((-?\d+).*?,\s?(-?\d+).*?(,\s?(-?\d+).*?)?\)/i);
        return m ? new L.Point(Number(x), Number(y)) : new L.Point(0, 0);
    }

    export function replace(el: HTMLElement) {
        const s = el.style;
        s.transform = s.transform.replace(/translate3d\s*\((.+?,\s*.+?),\s*.+?\s*\)/i, 'translate($1)');
    }
}

export namespace SVGDataset {
    export function get(el: Element): any {
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

    export function set(el: Element, dataset: any): void {
        for (let key of Object.keys(dataset)) {
            el.setAttribute('data-' + key, dataset[key]);
        }
    }
}


export namespace Maths {
    export function dot(v1: L.Point, v2: L.Point): number {
        return v1.x * v2.x + v1.y * v2.y;
    }

    export function angle(v1: L.Point, v2: L.Point): number {
        return dot(v1, v2) / v1.distanceTo(v2);
    }

    export function getCenter(pts: L.Point[]): L.Point {
        return pts.reduce((prev, cur) => prev.add(cur)).divideBy(pts.length);
    }


    export function getCircumcenter(positions: L.Point[]): L.Point {
        if (positions.length !== 3) {
            throw new Error('must have 3 vertices');
        }
        const b = positions[1].subtract(positions[0]);
        const c = positions[2].subtract(positions[0]);
        const bb = Maths.dot(b, b);
        const cc = Maths.dot(c, c);
        return new L.Point((c.y * bb - b.y * cc), (b.x * cc - c.x * bb))
            .divideBy(2.0 * (b.x * c.y - b.y * c.x))
            .add(positions[0]);
    }

    export function polarToCartesian(center: L.Point, radius: number, angle: number) {
        return new L.Point(center.x + radius * Math.cos(angle), center.y + radius * Math.sin(angle));
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
}

export namespace Hints {
    export function verify(graph: po.Graph, hints: po.Hints): Promise<string> {
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
}

export namespace Algorithm {
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


    type shortestRouteObject = {
        platforms?: number[];
        edges?: string[];
        time: { walkTo: number, metro?: number, walkFrom?: number, total?: number };
    }
    export function shortestRoute(graph: po.Graph, p1: L.LatLng, p2: L.LatLng): shortestRouteObject {
        const walkingSpeed = 1.4,
            walkingWithObstacles = 1,
            maxTrainSpeed = 20,
            trainAcceleration = 0.7,
            metroStopTime = 30,
            eLineStopTime = 60,
            // includes escalators
            metroWaitingTime = 240,
            eLineWaitingTime = 360;
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
                const travelTime = Maths.timeToTravel(distance, maxTrainSpeed, trainAcceleration);
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
                const distance = distanceBetweenPoints(currentNode.location, neighbor.location) / 2;
                times.push(distance / walkingWithObstacles + (hasE ? eLineWaitingTime : metroWaitingTime));
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
}

export namespace Color {
    function hexColorToArray(hex: string): number[] {
        return hex.match(/[0-9a-f]{1,2}/ig).map(s => parseInt(s, 16));
    }

    function rgbColorToArray(rgb: string): number[] {
        return rgb.match(/rgb\s*\((\d+),\s*(\d+),\s*(\d+)\s*\)/).slice(1).map(Number);
    }

    export function mean(rgb: string[]): string {
        const reduceFunc = (prev: number[], cur: string) =>
            (cur.startsWith('#') ? hexColorToArray : rgbColorToArray)(cur)
                .map((it, i) => prev[i] + it);
        const [r, g, b] = rgb.reduce(reduceFunc, [0, 0, 0]).map(i => Math.floor(i / rgb.length));
        return `rgb(${r}, ${g}, ${b})`;
    }
}

export function flashTitle(titles: string[], duration: number) {
    let i = 0;
    setInterval(() => document.title = titles[++i % titles.length], duration);
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

export function platformRenameDialog(graph: po.Graph, platform: po.Platform) {
    const ru = platform.name, {fi, en} = platform.altNames;

    const names = en ? [ru, fi, en] : fi ? [ru, fi] : [ru];
    const nameString = names.join('|');
    alertify.prompt(tr('New name'), nameString, (okevt, val: string) => {
        const newNames = val.split('|');
        [platform.name, platform.altNames['fi'], platform.altNames['en']] = newNames;
        if (val === nameString) {
            return alertify.warning(tr('Name was not changed'));
        }
        const oldNamesStr = names.slice(1).join(', '),
            newNamesStr = newNames.slice(1).join(', ');
        alertify.success(`${ru} (${oldNamesStr}) ${tr('renamed to')} ${newNames[0]} (${newNamesStr})`);
        const station = graph.stations[platform.station];
        if (station.platforms.length < 2) return;
        alertify.confirm(tr('Rename the entire station') + '?', () => {
            for (let i of station.platforms) {
                const p = graph.platforms[i];
                [p.name, p.altNames['fi'], p.altNames['en']] = newNames;
            }
            [station.name, station.altNames['fi'], station.altNames['en']] = newNames;
            alertify.success(`${tr('The entire station was renamed to')} ${val}`);
        });

    }, () => alertify.warning(tr('Name change cancelled')));
}