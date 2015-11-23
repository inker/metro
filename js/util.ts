import * as L from 'leaflet';
import { findClosestObject } from './geo';
import * as po from './plain-objects';

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

export function resetStyle() {
    const selector = '#paths-inner *, #paths-outer *, #transfers-inner *, #transfers-outer *, #station-circles *';
    const els = document.querySelectorAll(selector);
    for (let i = 0; i < els.length; ++i) {
        const el: HTMLElement = els[i] as any;
        el.style.opacity = null;
        if (el.id.charAt(1) !== 't') {
            el.removeAttribute('filter');
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

export const lineRulesPromise = new Promise<{}>(resolve => {
    const url = 'css/style.css',
        link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = url;
    link.onload = e => {
        //const styleSheet: CSSStyleSheet = [].find.call(document.styleSheets, ss => ss.href.endsWith(url));
        const styleSheet: CSSStyleSheet = link.sheet as any;
        const cssRules = styleSheet.cssRules,
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
        resolve(lineRules);
    };
    document.head.appendChild(link);
});

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

export function shortestPath(graph: po.Graph, p1: L.LatLng, p2: L.LatLng): any {
    const objects = graph.platforms;
    // time to travel from station to the p1 location
    const dist: number[] = [], timesOnFoot: number[] = [];
    for (let o of objects) {
        const distance = L.LatLng.prototype.distanceTo.call(p1, o.location);
        const time = distance / (1.3 * 1.4);
        dist.push(time);
        timesOnFoot.push(L.LatLng.prototype.distanceTo.call(o.location, p2) / (1.3 * 1.4));
    }
    // pick the closest one so far
    let currentIndex = objects.indexOf(findClosestObject(p1, objects));
    const objectSet = new Set<number>(objects.map((o, i) => i)),
        prev = objects.map(i => null);
    // time on foot between locations
    const onFoot =  L.LatLng.prototype.distanceTo.call(p1, p2) / (1.3 * 1.4);
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
        const neighborIndices: number[] = [],
            neighbors: po.Platform[] = [],
            times: number[] = [];
        for (let i of currentNode.spans) {
            const s = graph.spans[i];
            const neighborIndex = currentIndex === s.source ? s.target : s.source;
            if (!objectSet.has(neighborIndex)) continue;
            const neighbor = objects[neighborIndex];
            neighborIndices.push(neighborIndex);
            neighbors.push(neighbor);
            const distance = L.LatLng.prototype.distanceTo.call(currentNode.location, neighbor.location);
            // TODO: lower priority for E-lines
            const callTime = graph.routes[s.routes[0]].line.startsWith('E') ? 90 : 45;
            times.push(timeToTravel(distance, 18, 1.4) + callTime);
        }
        // pain in the ass
        const transferIndices = graph.transfers
            .map((t, i) => i)
            .filter(t => graph.transfers[t].source === currentIndex || graph.transfers[t].target === currentIndex);
        for (let i of transferIndices) {
            // TODO: make ALL platforms from the junction visible, not just the neighbors
            // TODO: if transferring to an E-line, wait more
            const t = graph.transfers[i];
            const neighborIndex = currentIndex === t.source ? t.target : t.source;
            if (!objectSet.has(neighborIndex)) continue;
            const neighbor = objects[neighborIndex];
            neighborIndices.push(neighborIndex);
            neighbors.push(neighbor);
            const distance = L.LatLng.prototype.distanceTo.call(currentNode.location, neighbor.location);
            times.push(distance / (1.3 * 1.4) + 60); // variable time depending on the transfer's length
        }
        //console.log('neighbors: ', neighborIndices);
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
        return onFoot;
    }
    const path: string[] = [],
        platformPath = [currentIndex];
    console.log('making path');
    console.log(prev);
    // remove later
    let euristics = 0;
    while (true) {
        const currentNode = objects[currentIndex];
        console.log('current', currentNode.name);
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
        path.push(p);
        platformPath.push(prevIndex);
        if (++euristics > objects.length) throw new Error('overflow!');
        currentIndex = prevIndex;
    }
    console.log('returning');
    platformPath.reverse();
    path.reverse();
    const walkFromTime = timesOnFoot[platformPath[platformPath.length - 1]];
    const walkToTime = dist[platformPath[0]];
    const metroTime = shortestTime - walkFromTime - walkToTime;
    return {
        platforms: platformPath,
        path: path,
        time: {
            walkTo: walkToTime,
            metro: metroTime,
            walkFrom: walkFromTime,
            total: shortestTime
        }
    };
}