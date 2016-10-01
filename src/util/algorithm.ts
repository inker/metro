/// <reference path="../../typings/tsd.d.ts" />
import * as nw from '../network';
import { arraysEquals } from './utilities';
import { timeToTravel } from './math';
import { findClosestObject } from './geo';

export function findCircle(network: nw.Network, station: nw.Station): nw.Platform[] {
    if (station.platforms.length < 3) return [];
    // TODO: if n=3, leave as it is; if n=4, metro has priority
    const stationPlatforms = station.platforms;
    if (stationPlatforms.length === 3) {
        for (var i of station.platforms) {
            if (network.transfers.filter(t => t.has(i)).length !== 2) return [];
        }
        return stationPlatforms;
    }
    if (stationPlatforms.length === 4) {
        const gPls = network.platforms, gTrs = network.transfers;
        const psAndDegs = stationPlatforms
            .map(p => ({platform: p, degree: gTrs.filter(t => t.has(p)).length }))
            .sort((a, b) => a.degree - b.degree);
        const degs = psAndDegs.map(i => i.degree);
        const ps = psAndDegs.map(i => i.platform);
        if (arraysEquals(degs, [2, 2, 3, 3])) {
            return ps;
        }
        if (arraysEquals(degs, [1, 2, 2, 3])) {
            return ps.slice(1);
        }
    }
    return [];
}

const distanceBetween = (a: L.LatLng, b: L.LatLng) => L.LatLng.prototype.distanceTo.call(a, b) as number;

const walkingSpeed = 1.4,
    walkingWithObstacles = 1,
    maxTrainSpeed = 20,
    trainAcceleration = 0.7,
    metroStopTime = 25,
    eLineStopTime = 40,
    // includes escalators
    metroWaitingTime = 240,
    eLineWaitingTime = 360;

export interface ShortestRouteObject<V> {
    platforms?: V[];
    edges?: nw.Edge<V>[];
    time: { walkTo: number, metro?: number, walkFrom?: number, total?: number };
}
export function shortestRoute(objects: nw.Platform[], p1: L.LatLng, p2: L.LatLng): ShortestRouteObject<nw.Platform> {
    // time to travel from station to the p1 location
    const currentTime = new Map<nw.Platform, number>(),
        fromPlatformToDest = new Map<nw.Platform, number>();
    for (let o of objects) {
        const hasE = o.spans.some(s => s.routes[0].line.startsWith('E'));
        let distance = distanceBetween(p1, o.location),
            time = distance / walkingWithObstacles;
        currentTime.set(o, time + (hasE ? eLineWaitingTime : metroWaitingTime));
        // currentTime.push(time + (hasE ? eLineWaitingTime : metroWaitingTime));
        distance = distanceBetween(o.location, p2);
        time = distance / walkingWithObstacles;
        fromPlatformToDest.set(o, time);
        // fromPlatformToDest.push(time);
    }
    // pick the closest one so far
    let currentNode = findClosestObject(p1, objects);
    const objectSet = new Set<nw.Platform>(objects),
        prev = new Map<nw.Platform, nw.Platform>();
    // time on foot between locations

    while (objectSet.size > 0) {
        var minDist = Infinity;
        objectSet.forEach(o => {
            const time = currentTime.get(o);
            if (time < minDist) {
                currentNode = o;
                minDist = time;
            }
        });
        objectSet.delete(currentNode);
        // getting his previous
        var prevNode = prev.get(currentNode);
        const prevSpan = currentNode.spans.find(s => s.has(prevNode));

        const neighborNodes: nw.Platform[] = [],
            timeToNeighbors: number[] = [];
        for (let s of currentNode.spans) {
            const neighborNode = s.other(currentNode);
            if (!objectSet.has(neighborNode)) continue;
            neighborNodes.push(neighborNode);
            const distance = distanceBetween(currentNode.location, neighborNode.location);
            let lineChangePenalty = 0;
            if (prevSpan && prevSpan.routes[0] !== s.routes[0]) {
                // doesn't seem to work
                // lineChangePenalty = metroWaitingTime;
            }
            // TODO: lower priority for E-lines
            const callTime = s.routes[0].line.startsWith('E') ? eLineStopTime : metroStopTime;
            const travelTime = timeToTravel(distance, maxTrainSpeed, trainAcceleration);
            timeToNeighbors.push(travelTime + callTime + lineChangePenalty);
        }
        // TODO: if transferring to an E-line, wait more
        // TODO: penalty for changing lines (cross-platform)
        for (let neighborNode of currentNode.station.platforms) {
            if (!objectSet.has(neighborNode)) continue;
            neighborNodes.push(neighborNode);
            const hasE = neighborNode.spans.some(s => s.routes[0].line.startsWith('E'));
            const distance = distanceBetween(currentNode.location, neighborNode.location) / 2;
            timeToNeighbors.push(distance / walkingWithObstacles + (hasE ? eLineWaitingTime : metroWaitingTime));
        }

        for (let i = 0, nNeighbors = neighborNodes.length; i < nNeighbors; ++i) {
            const neighborNode = neighborNodes[i],
                alt = currentTime.get(currentNode) + timeToNeighbors[i];
            if (alt < currentTime.get(neighborNode)) {
                currentTime.set(neighborNode, alt);
                prev.set(neighborNode, currentNode);
            }
        }
        const alt = currentTime.get(currentNode) + fromPlatformToDest.get(currentNode);
    }
    // find the shortest time & the exit station
    let shortestTime = Infinity;
    currentTime.forEach((t, p) => {
        const alt = currentTime.get(p) + fromPlatformToDest.get(p);
        if (alt < shortestTime) {
            shortestTime = alt;
            currentNode = p;
        }
    });
    // if walking on foot is faster, then why take the underground?
    const onFoot = distanceBetween(p1, p2) / walkingWithObstacles;
    if (onFoot < shortestTime) {
        return { time: { walkTo: onFoot } };
    }
    const path: nw.Edge<nw.Platform>[] = [],
        platformPath = [currentNode];
    // remove later
    for (let prevNode = prev.get(currentNode); prevNode !== undefined; prevNode = prev.get(currentNode)) {
        // console.log('current', currentNode.name);
        // const prevIndex = prev[currentIndex];
        if (prevNode === undefined) break;
        // console.log('prev', objects[prevIndex].name);
        let p: nw.Edge<nw.Platform>;
        for (let s of currentNode.spans) {
            if (s.has(prevNode)) {
                p = s;
                break;
            }
        }
        if (p === undefined) {
            for (let t of currentNode.transfers) {
                if (t.has(prevNode)) {
                    p = t;
                    break;
                }
            }
        }
        if (p === undefined) {
            const { transfers, midPlatforms } = shortestTransfer(prevNode, currentNode);
            path.push(...transfers.reverse());
            platformPath.push(...midPlatforms);
        } else {
            path.push(p);
        }
        platformPath.push(prevNode);
        currentNode = prevNode;
    }
    platformPath.reverse();
    path.reverse();
    const walkFrom = fromPlatformToDest.get(platformPath[platformPath.length - 1]);
    const walkTo = currentTime.get(platformPath[0]);
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

function shortestTransfer(p1: nw.Platform, p2: nw.Platform) {
    if (p1.station !== p2.station) {
        throw new Error(`platforms (${p1.name} & ${p2.name} must be on the same station`);
    }
    const station = p1.station;
    const platforms = station.platforms;
    const platformSet = new Set<nw.Platform>(platforms);
    const dist = new Map<nw.Platform, number>(),
        prev = new Map<nw.Platform, nw.Platform>();
    for (let p of platforms) {
        dist.set(p, Infinity);
    }
    dist.set(p1, 0);
    let currentNode = p1;
    while (platformSet.size > 0) {
        var minDist = Infinity;
        platformSet.forEach(p => {
            const time = dist.get(p);
            if (time < minDist) {
                currentNode = p;
                minDist = time;
            }
        });
        platformSet.delete(currentNode);
        const neighborNodes = currentNode.transfers.map(t => t.other(currentNode));
        for (let neighborNode of neighborNodes) {
            if (!platformSet.has(neighborNode)) continue;
            const distance = distanceBetween(currentNode.location, neighborNode.location),
                alt = dist.get(currentNode) + distance;
            if (alt < dist.get(neighborNode)) {
                dist.set(neighborNode, alt);
                prev.set(neighborNode, currentNode);
            }
        }
    }
    const transfers: nw.Transfer[] = [];
    const midPlatforms: nw.Platform[] = [];
    currentNode = p2;
    for (; ;) {
        var prevNode = prev.get(currentNode);
        if (prevNode === undefined) break;
        const transferNode = currentNode.transfers.find(t => t.has(prevNode));
        transfers.push(transferNode);
        currentNode = prevNode;
        midPlatforms.push(currentNode);
    }
    midPlatforms.pop();
    return {
        transfers: transfers.reverse(),
        midPlatforms: midPlatforms.reverse()
    }
}