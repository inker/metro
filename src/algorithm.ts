import * as po from './plain-objects';
import * as util from './util';
import * as math from './math';
import { findClosestObject } from './geo';

export function findCircle(graph: po.Graph, station: po.Station): po.Platform[] {
    // TODO: if n=3, leave as it is; if n=4, metro has priority
    const stationPlatforms = station.platforms.map(platformNum => graph.platforms[platformNum]);
    if (stationPlatforms.length === 3) {
        return stationPlatforms.every(p => p.transfers.length === 2) ? stationPlatforms : [];
    }
    if (stationPlatforms.length === 4) {
        const ps = stationPlatforms.slice().sort((a, b) => a.transfers.length - b.transfers.length);
        const degs = ps.map(p => p.transfers.length);
        if (util.arrayEquals(degs, [2, 2, 3, 3])) {
            return ps;
        }
        if (util.arrayEquals(degs, [1, 2, 2, 3])) {
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
            const travelTime = math.timeToTravel(distance, maxTrainSpeed, trainAcceleration);
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