import { LatLng } from 'leaflet'
import { last } from 'lodash'

import { timeToTravel } from 'utils/math/phys'
import findClosestObject from 'utils/geo/findClosestObject'
import { tryGetFromMap } from 'utils/collections'

import {
    Platform,
    Edge,
    Transfer,
} from '../../network'

const distanceBetween = (a: LatLng, b: LatLng) => LatLng.prototype.distanceTo.call(a, b) as number

// const WALKING_SPEED = 1.4
const WALKING_WITH_OBSTACLES = 1
const MAX_TRAIN_SPEED = 20
const TRAIN_ACCELERATION = 0.7
const METRO_STOP_TIME = 25
const E_LINE_STOP_TIME = 40
// includes escalators
const METRO_WAITING_TIME = 240
const E_LINE_WAITING_TIME = 360

export interface ShortestRouteObject<V> {
    platforms?: V[],
    edges?: Edge<V>[],
    time: {
        walkTo: number,
        metro?: number,
        walkFrom?: number,
        total?: number,
    },
}

export default (objects: Platform[], p1: LatLng, p2: LatLng): ShortestRouteObject<Platform> => {
    // time to travel from station to the p1 location
    const currentTime = new Map<Platform, number>()
    const fromPlatformToDest = new Map<Platform, number>()
    for (const o of objects) {
        const hasE = o.spans.some(s => s.routes[0].line.startsWith('E'))
        let distance = distanceBetween(p1, o.location)
        let time = distance / WALKING_WITH_OBSTACLES
        const waitingTime = hasE ? E_LINE_WAITING_TIME : METRO_WAITING_TIME
        currentTime.set(o, time + waitingTime)
        distance = distanceBetween(o.location, p2)
        time = distance / WALKING_WITH_OBSTACLES
        if (o.type !== 'dummy') {
            fromPlatformToDest.set(o, time)
        }
    }
    // pick the closest one so far
    let currentNode = findClosestObject(p1, objects)
    const objectSet = new Set(objects)
    const prev = new Map<Platform, Platform>()
    // time on foot between locations

    while (objectSet.size > 0) {
        let minDist = Infinity
        for (const o of objectSet) {
            const time = tryGetFromMap(currentTime, o)
            if (time < minDist) {
                currentNode = o
                minDist = time
            }
        }
        objectSet.delete(currentNode)

        // // getting his previous
        // var prevNode = prev.get(currentNode)
        // const prevSpan = currentNode.spans.find(s => s.has(prevNode))

        const neighborNodes: Platform[] = []
        const timeToNeighbors: number[] = []
        for (const s of currentNode.spans) {
            const neighborNode = s.other(currentNode)
            if (!objectSet.has(neighborNode)) {
                continue
            }
            neighborNodes.push(neighborNode)
            const distance = distanceBetween(currentNode.location, neighborNode.location)
            let lineChangePenalty = 0
            // if (prevSpan && prevSpan.routes[0] !== s.routes[0]) {
            //     // doesn't seem to work
            //     // lineChangePenalty = metroWaitingTime;
            // }
            // TODO: lower priority for E-lines
            const callTime = s.routes[0].line.startsWith('E') ? E_LINE_STOP_TIME : METRO_STOP_TIME
            const travelTime = timeToTravel(distance, MAX_TRAIN_SPEED, TRAIN_ACCELERATION)
            timeToNeighbors.push(travelTime + callTime + lineChangePenalty)
        }
        // TODO: if transferring to an E-line, wait more
        // TODO: penalty for changing lines (cross-platform)
        for (const neighborNode of currentNode.station.platforms) {
            if (!objectSet.has(neighborNode)) {
                continue
            }
            neighborNodes.push(neighborNode)
            const hasE = neighborNode.spans.some(s => s.routes[0].line.startsWith('E'))
            const distance = distanceBetween(currentNode.location, neighborNode.location) / 2
            timeToNeighbors.push(distance / WALKING_WITH_OBSTACLES + (hasE ? E_LINE_WAITING_TIME : METRO_WAITING_TIME))
        }

        for (let i = 0, nNeighbors = neighborNodes.length; i < nNeighbors; ++i) {
            const neighborNode = neighborNodes[i]
            const alt = tryGetFromMap(currentTime, currentNode) + timeToNeighbors[i]
            if (alt < tryGetFromMap(currentTime, neighborNode)) {
                currentTime.set(neighborNode, alt)
                prev.set(neighborNode, currentNode)
            }
        }
        // const alt = currentTime.get(currentNode) + fromPlatformToDest.get(currentNode)
    }
    // find the shortest time & the exit station
    let shortestTime = Infinity
    for (const [p] of currentTime) {
        if (p.type === 'dummy') {
            continue
        }
        const alt = tryGetFromMap(currentTime, p) + tryGetFromMap(fromPlatformToDest, p)
        if (alt < shortestTime) {
            shortestTime = alt
            currentNode = p
        }
    }
    // if walking on foot is faster, then why take the underground?
    const onFoot = distanceBetween(p1, p2) / WALKING_WITH_OBSTACLES
    if (onFoot < shortestTime) {
        return { time: { walkTo: onFoot } }
    }
    const path: Edge<Platform>[] = []
    const platformPath = [currentNode]
    // remove later
    for (let prevNode = prev.get(currentNode); prevNode !== undefined; prevNode = prev.get(currentNode)) {
        // console.log('current', currentNode.name);
        // const prevIndex = prev[currentIndex];
        if (prevNode === undefined) {
            break
        }
        // console.log('prev', objects[prevIndex].name);
        let p: Edge<Platform> | undefined
        for (const s of currentNode.spans) {
            if (s.has(prevNode)) {
                p = s
                break
            }
        }
        if (p === undefined) {
            for (const t of currentNode.transfers) {
                if (t.has(prevNode)) {
                    p = t
                    break
                }
            }
        }
        if (p === undefined) {
            const { transfers, midPlatforms } = shortestTransfer(prevNode, currentNode)
            path.push(...transfers.reverse())
            platformPath.push(...midPlatforms)
        } else {
            path.push(p)
        }
        platformPath.push(prevNode)
        currentNode = prevNode
    }
    platformPath.reverse()
    path.reverse()
    const walkFrom = tryGetFromMap(fromPlatformToDest, last(platformPath))
    const walkTo = tryGetFromMap(currentTime, platformPath[0])
    return {
        platforms: platformPath,
        edges: path,
        time: {
            walkTo,
            metro: shortestTime - walkFrom - walkTo,
            walkFrom,
            total: shortestTime,
        },
    }
}

function shortestTransfer(p1: Platform, p2: Platform) {
    if (p1.station !== p2.station) {
        throw new Error(`platforms (${p1.name} & ${p2.name} must be on the same station`)
    }
    const { platforms } = p1.station
    const platformSet = new Set(platforms)
    const dist = new Map<Platform, number>()
    const prev = new Map<Platform, Platform>()
    for (const p of platforms) {
        dist.set(p, Infinity)
    }
    dist.set(p1, 0)
    let currentNode = p1
    while (platformSet.size > 0) {
        let minDist = Infinity
        for (const platform of platformSet) {
            const time = tryGetFromMap(dist, platform)
            if (time < minDist) {
                currentNode = platform
                minDist = time
            }
        }
        platformSet.delete(currentNode)
        const neighborNodes = currentNode.transfers.map(t => t.other(currentNode))
        for (const neighborNode of neighborNodes) {
            if (!neighborNode || !platformSet.has(neighborNode)) {
                continue
            }
            const distance = distanceBetween(currentNode.location, neighborNode.location)
            const alt = tryGetFromMap(dist, currentNode) + distance
            if (alt < tryGetFromMap(dist, neighborNode)) {
                dist.set(neighborNode, alt)
                prev.set(neighborNode, currentNode)
            }
        }
    }
    const transfers: Transfer[] = []
    const midPlatforms: Platform[] = []
    currentNode = p2
    for (; ;) {
        const prevNode = prev.get(currentNode)
        if (!prevNode) {
            break
        }
        const transferNode = currentNode.transfers.find(t => t.has(prevNode))
        if (!transferNode) {
            console.error('cannot find transfer node')
            continue
        }
        transfers.push(transferNode)
        currentNode = prevNode
        midPlatforms.push(currentNode)
    }
    midPlatforms.pop()
    return {
        transfers: transfers.reverse(),
        midPlatforms: midPlatforms.reverse(),
    }
}
