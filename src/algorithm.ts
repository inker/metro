/// <reference path="../typings/tsd.d.ts" />
import * as g from './graph';
import { arrayEquals } from './util';
import * as math from './math';
import { findClosestObject } from './geo';

export function findCircle(graph: g.Graph, station: g.Station): g.Platform[] {
    if (station.platforms.length < 3) return [];
    // TODO: if n=3, leave as it is; if n=4, metro has priority
    const stationPlatforms = station.platforms.map(platformNum => graph.platforms[platformNum]);
    if (stationPlatforms.length === 3) {
        for (var i of station.platforms) {
            if (graph.transfers.filter(t => t.source === i || t.target === i).length !== 2) return [];
        }
        return stationPlatforms;
    }
    if (stationPlatforms.length === 4) {
        const gPls = graph.platforms, gTrs = graph.transfers;
        const hasPlatform = (t: g.Transfer, p: number) => t.source === p || t.target === p;
        const toTuple = (i: number) => ({platform: gPls[i], degree: gTrs.filter(t => hasPlatform(t, i)).length});
        const psAndDegs = station.platforms.map(toTuple).sort((a, b) => a.degree - b.degree);
        const degs = psAndDegs.map(i => i.degree);
        const ps = psAndDegs.map(i => i.platform);
        if (arrayEquals(degs, [2, 2, 3, 3])) {
            return ps;
        }
        if (arrayEquals(degs, [1, 2, 2, 3])) {
            return ps.slice(1);
        }
    }
    return [];
}

const distanceBetween = (a: L.LatLng, b: L.LatLng) => L.LatLng.prototype.distanceTo.call(a, b) as number;

export type ShortestRouteObject = {
    platforms?: number[];
    edges?: string[];
    time: { walkTo: number, metro?: number, walkFrom?: number, total?: number };
}
export function shortestRoute(graph: g.Graph, p1: L.LatLng, p2: L.LatLng): ShortestRouteObject {
    const walkingSpeed = 1.4,
        walkingWithObstacles = 1,
        maxTrainSpeed = 20,
        trainAcceleration = 0.7,
        metroStopTime = 25,
        eLineStopTime = 40,
        // includes escalators
        metroWaitingTime = 240,
        eLineWaitingTime = 360;
    const objects = graph.platforms;
    // time to travel from station to the p1 location
    const currentTime: number[] = [],
        fromPlatformToDest: number[] = [];
    for (let o of objects) {
        const hasE = o.spans.map(i => graph.spans[i].routes[0])
            .map(i => graph.routes[i].line)
            .some(l => l.startsWith('E'));
        let distance = distanceBetween(p1, o.location),
            time = distance / walkingWithObstacles
        currentTime.push(time + (hasE ? eLineWaitingTime : metroWaitingTime));
        distance = distanceBetween(o.location, p2);
        time = distance / walkingWithObstacles;
        fromPlatformToDest.push(time);
    }
    // pick the closest one so far
    let currentIndex = objects.indexOf(findClosestObject(p1, objects));
    const objectSet = new Set<number>(objects.map((o, i) => i)),
        prev: number[] = objects.map(i => null);
    // time on foot between locations

    while (objectSet.size > 0) {
        var minDist = Infinity;
        objectSet.forEach(i => {
            if (currentTime[i] < minDist) {
                currentIndex = i;
                minDist = currentTime[i];
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
            timeToNeighbors: number[] = [];
        for (let i of currentNode.spans) {
            const s = graph.spans[i];
            const neighborIndex = currentIndex === s.source ? s.target : s.source;
            if (!objectSet.has(neighborIndex)) continue;
            neighborIndices.push(neighborIndex);
            const neighbor = objects[neighborIndex];
            const distance = distanceBetween(currentNode.location, neighbor.location);
            let lineChangePenalty = 0;
            if (prevSpan && graph.routes[prevSpan.routes[0]] !== graph.routes[s.routes[0]]) {
                // doesn't seem to work
                //lineChangePenalty = metroWaitingTime;
            }
            // TODO: lower priority for E-lines
            const callTime = graph.routes[s.routes[0]].line.startsWith('E') ? eLineStopTime : metroStopTime;
            const travelTime = math.timeToTravel(distance, maxTrainSpeed, trainAcceleration);
            timeToNeighbors.push(travelTime + callTime + lineChangePenalty);
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
            const distance = distanceBetween(currentNode.location, neighbor.location) / 2;
            timeToNeighbors.push(distance / walkingWithObstacles + (hasE ? eLineWaitingTime : metroWaitingTime));
        }

        for (let i = 0, nNeighbors = neighborIndices.length; i < nNeighbors; ++i) {
            const neighborIndex = neighborIndices[i],
                alt = currentTime[currentIndex] + timeToNeighbors[i];
            if (alt < currentTime[neighborIndex]) {
                currentTime[neighborIndex] = alt;
                prev[neighborIndex] = currentIndex;
            }
        }
        const alt = currentTime[currentIndex] + fromPlatformToDest[currentIndex];
    }
    // find the shortest time & the exit station
    let shortestTime = Infinity;
    for (let i = 0; i < currentTime.length; ++i) {
        const alt = currentTime[i] + fromPlatformToDest[i];
        if (alt < shortestTime) {
            shortestTime = alt;
            currentIndex = i;
        }
    }
    // if walking on foot is faster, then why take the underground?
    const onFoot = distanceBetween(p1, p2) / walkingWithObstacles;
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
            for (let i = 0, len = graph.transfers.length; i < len; ++i) {
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
    const walkFrom = fromPlatformToDest[platformPath[platformPath.length - 1]];
    const walkTo = currentTime[platformPath[0]];
    return {
        platforms: platformPath,
        edges: path,
        time: {
            walkTo,
            metro: shortestTime - walkFrom - walkTo,
            walkFrom,
            total: shortestTime
        }
    };
}

function shortestTransfer(graph: g.Graph, p1i: number, p2i: number) {
    const p1 = graph.platforms[p1i],
        p2 = graph.platforms[p2i];
    if (p1.station !== p2.station) {
        throw new Error(`platforms (${p1.name} & ${p2.name} must be on the same station`);
    }
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
        const neighborIndices: number[] = [];
        for (let t of graph.transfers) {
            if (t.source === currentIndex) neighborIndices.push(t.target);
            else if (t.target === currentIndex) neighborIndices.push(t.source);
        }
        for (let neighborIndex of neighborIndices) {
            if (!platformSet.has(neighborIndex)) continue;
            const distance = distanceBetween(platform.location, graph.platforms[neighborIndex].location),
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