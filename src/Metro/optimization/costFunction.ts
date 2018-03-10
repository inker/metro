import { Point } from 'leaflet'

import {
  sumBy,
} from 'lodash'

import Network, {
  Span,
} from '../../network'

import {
  segmentsIntersect,
} from 'util/math/vector'

import {
  tryGetFromMap,
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

  let sumDistances = 0
  let numCrossings = 0
  let numParallelCrossings = 0

  const numSpans = spans.length
  const numSpansMinusOne = numSpans - 1

  const map = new WeakMap<Span, SlotPoints>()

  for (const span of spans) {
    const slots = getSpanSlotPoints(span)
    map.set(span, slots)
  }

  for (let i = 0; i < numSpansMinusOne; ++i) {
    const span = spans[i]

    const {
      source: sourcePoint,
      target: targetPoint,
    } = tryGetFromMap(map, span)

    sumDistances += sourcePoint.distanceTo(targetPoint)

    const arr = [sourcePoint, targetPoint] as [Point, Point]

    for (let j = i + 1; j < numSpans; ++j) {
      const otherSpan = spans[j]

      const {
        source: otherSourcePoint,
        target: otherTargetPoint,
      } = tryGetFromMap(map, otherSpan)

      const doIntersect = !span.isContinuous(otherSpan)
        && segmentsIntersect(arr, [otherSourcePoint, otherTargetPoint])

      // TODO: intersecting a parallel batch counts as 1?

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
        ++numCrossings
      }
    }
  }

  const parallelBatches = sumBy(parallelSpans, ps => ps.length ** 4)
  // console.log(spans.length, entries.length)

  // TODO: treat only adjacent parallel as parallel

  const totalCost = 20000
    + numParallelCrossings * 500
    + numCrossings * 2
    - parallelBatches * 5
    + sumDistances * 0.001

  if (log) {
    console.log('sum distances', sumDistances)
    console.log('num crossings', numCrossings)
    console.log('num parallel crossings', numParallelCrossings)
  }

  return totalCost
}
