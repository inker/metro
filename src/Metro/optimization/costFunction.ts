import { Point } from 'leaflet'

import {
  sumBy,
  meanBy,
  castArray,
} from 'lodash'

import Network, {
  Span,
} from '../../network'

import {
  segmentsIntersect,
} from 'util/math/vector'

import {
  tryGetFromMap,
  iteratePairwise,
} from 'util/collections'

type SourceOrTarget = 'source' | 'target'

type SlotPoints = {
  [P in SourceOrTarget]: Point
}

interface Options {
  network: Network,
  parallelSpans: Span[][],
  getSpanSlotPoints: (span: Span) => SlotPoints,
  log: boolean,
}

export default ({
  network,
  parallelSpans,
  getSpanSlotPoints,
  log,
}: Options) => {
  // distances (less)
  // crossings (less)

  const spans = network.spans.filter(s => s.routes[0].line === 'E')

  let numCrossings = 0
  let numParallelCrossings = 0

  const numSpans = spans.length

  const map = new WeakMap<Span, SlotPoints>()

  for (const span of spans) {
    const slots = getSpanSlotPoints(span)
    map.set(span, slots)
  }

  const intersections: { [key: string]: boolean | undefined } = {}
  const distances: { [id: string]: number } = {}

  for (let i = 0; i < numSpans; ++i) {
    const span = spans[i]

    const {
      source: sourcePoint,
      target: targetPoint,
    } = tryGetFromMap(map, span)

    distances[span.id] = sourcePoint.distanceTo(targetPoint)

    const arr = [sourcePoint, targetPoint] as [Point, Point]

    for (let j = i + 1; j < numSpans; ++j) {
      const otherSpan = spans[j]

      const {
        source: otherSourcePoint,
        target: otherTargetPoint,
      } = tryGetFromMap(map, otherSpan)

      const doIntersect = !span.isContinuous(otherSpan)
        && segmentsIntersect(arr, [otherSourcePoint, otherTargetPoint])

      if (doIntersect) {
        const isParallelCrossing = span.isParallel(otherSpan)
        // console.log('intersection')
        // console.log(span.source.name, span.target.name, span.routes[0].branch)
        // console.log(otherSpan.source.name, otherSpan.target.name, otherSpan.routes[0].branch)
        if (isParallelCrossing) {
          if (log) {
            console.log('intersection')
            console.log(span.source.name, span.target.name, span.routes[0].branch)
            console.log(otherSpan.source.name, otherSpan.target.name, otherSpan.routes[0].branch)
          }
          ++numParallelCrossings
        }
        intersections[`${span.id}:${otherSpan.id}`] = doIntersect
        intersections[`${otherSpan.id}:${span.id}`] = doIntersect
      }
    }
  }

  const remaining = new Set(spans)
  for (const parallels of parallelSpans) {
    for (const s of parallels) {
      remaining.delete(s)
    }
  }
  const augmentedParallelSpans = [...parallelSpans, ...Array.from(remaining).map(castArray)]

  iteratePairwise(augmentedParallelSpans, (a, b) => {
    for (const s1 of a) {
      for (const s2 of b) {
        const doIntersect = intersections[`${s1.id}:${s2.id}`]
        if (doIntersect) {
          numCrossings += (a.length * b.length) ** 0.1
          return
        }
      }
    }
  })

  const avgDist = meanBy(spans, s => distances[s.id])

  const parallelBatches = sumBy(parallelSpans, ps => ps.length ** 4 * meanBy(ps, s => distances[s.id]) / avgDist) / numSpans
  // console.log(spans.length, entries.length)

  // TODO: treat only adjacent parallel as parallel

  const totalCost = 35000
    + numParallelCrossings * 500
    + numCrossings * 2
    - parallelBatches * 1000
    + avgDist * 0.2

  if (log) {
    console.log('avg distance', avgDist)
    console.log('num crossings', numCrossings)
    console.log('num parallel crossings', numParallelCrossings)
  }

  return totalCost
}
