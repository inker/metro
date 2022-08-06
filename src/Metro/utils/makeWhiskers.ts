import { Point } from 'leaflet'
import {
  xor,
} from 'lodash'

import { tryGetFromMap } from 'utils/collections'
import { makeWings } from 'utils/math'
import {
  mean as meanPoint,
  normalize,
} from 'utils/math/vector'

import {
  Station,
  Platform,
  Span,
} from '../../network'

type Bound = 'inbound' | 'outbound'
const SPAN_PROPS = ['inbound', 'outbound'] as const

type Positions = {
  [P in Bound]: Point
}

// for termini with multiple converging routes
function getImaginaryPosition(
  platform: Platform,
  getPlatformPosition: (platform: Platform) => Point,
) {
  const pos = getPlatformPosition(platform)
  const neighbors = platform.adjacentPlatformsBySpans()
  const neighborsPositions = neighbors.map(getPlatformPosition)
  const cofficient = -0.1 // somehow any negative number works
  return meanPoint(neighborsPositions)
    .subtract(pos)
    .multiplyBy(cofficient)
    .add(pos)
}

function makeWhiskersForPlatform(
  platform: Platform,
  getPlatformPosition: (platform: Platform) => Point,
): Map<Span, Point> {
  const PART = 0.5
  const pos = getPlatformPosition(platform)
  const whiskers = new Map<Span, Point>()
  const allSpans = platform.getAllSpans()

  if (allSpans.length === 0) {
    return whiskers
  }

  if (allSpans.length === 1) {
    return whiskers.set(allSpans[0], pos)
  }

  if (allSpans.length === 2) {
    // TODO: fix source/target in graph
    // const { inbound, outbound } = spans
    // const boundSpans = inbound.length === 2 ? inbound : outbound.length === 2 ? outbound : null
    // if (boundSpans) {
    //   return whiskers.set(boundSpans[0], pos).set(boundSpans[1], pos)
    // }

    // const inboundSpan = inbound[0]
    // const outboundSpan = outbound[0]

    const [inboundSpan, outboundSpan] = allSpans
    const areSameBound = xor(inboundSpan.routes, outboundSpan.routes).length > 0
    if (!areSameBound) {
      const prevPos = getPlatformPosition(inboundSpan.other(platform))
      const nextPos = getPlatformPosition(outboundSpan.other(platform))
      const wings = makeWings(prevPos, pos, nextPos, 1)
      const t = Math.min(pos.distanceTo(prevPos), pos.distanceTo(nextPos)) * PART
      whiskers.set(inboundSpan, wings[0].multiplyBy(t).add(pos))
      whiskers.set(outboundSpan, wings[1].multiplyBy(t).add(pos))
      return whiskers
    }
  }

  const positions: Positions = {} as any
  const distances = new WeakMap<Span, number>()

  for (const bound of SPAN_PROPS) {
    const boundSpans = platform.spans[bound]
    const normals: Point[] = []
    for (const span of boundSpans) {
      const neighbor = span.other(platform)
      const neighborPos = getPlatformPosition(neighbor)
      const normal = normalize(neighborPos.subtract(pos))
      normals.push(normal)
      distances.set(span, pos.distanceTo(neighborPos))
    }
    positions[bound] = normals.length > 0
      ? meanPoint(normals).add(pos)
      : getImaginaryPosition(platform, getPlatformPosition)
  }

  const wings = makeWings(positions.inbound, pos, positions.outbound, 1)
  const wObj: Positions = {
    inbound: wings[0],
    outbound: wings[1],
  }

  for (const bound of SPAN_PROPS) {
    const boundSpans = platform.spans[bound]
    const wing = wObj[bound]
    for (const span of boundSpans) {
      const t = tryGetFromMap(distances, span) * PART
      const end = wing.multiplyBy(t).add(pos)
      whiskers.set(span, end)
    }
  }
  return whiskers
}

export default (
  stations: Iterable<Station>,
  getPlatformPosition: (platform: Platform) => Point,
) => {
  const whiskers = new WeakMap<Platform, Map<Span, Point>>()

  for (const station of stations) {
    for (const platform of station.platforms) {
      const wh = makeWhiskersForPlatform(platform, getPlatformPosition)
      whiskers.set(platform, wh)
    }
  }

  return whiskers
}
