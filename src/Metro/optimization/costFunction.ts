import { Point } from 'leaflet'

import {
  sumBy,
  meanBy,
  castArray,
} from 'lodash'

import {
  segmentsIntersect,
} from 'utils/math/vector'

import {
  tryGetFromMap,
  iteratePairwise,
} from 'utils/collections'

import Network, {
  Span,
} from '../../network'

import {
  Slots,
  SlotPoints,
} from '../utils/types'

interface Options {
  network: Network,
  parallelSpans: Span[][],
  getSpanSlots: (span: Span) => Slots,
  getSpanSlotPoints: (span: Span) => SlotPoints,
  log: boolean,
}

export default ({
  network,
  parallelSpans,
  getSpanSlots,
  getSpanSlotPoints,
  log,
}: Options) => {
  // distances (less)
  // crossings (less)

  const spans = network.spans.filter(s => s.routes[0].line === 'E')

  let numCrossings = 0
  let numParallelCrossings = 0
  let numParallelMisallignments = 0

  const misalignments: string[] = []

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

    const arr = [sourcePoint, targetPoint] as const

    for (let j = i + 1; j < numSpans; ++j) {
      const otherSpan = spans[j]

      const areParallel = span.isParallel(otherSpan)

      if (areParallel) {
        const pt1 = getSpanSlots(span)
        const pt2 = getSpanSlots(otherSpan)
        const sourceDiff = pt2.source - pt1.source
        const targetDiff = pt2.target - pt1.target
        const diff = Math.abs(targetDiff - sourceDiff)
        if (diff > Number.EPSILON) {
          ++numParallelMisallignments
          if (log) {
            misalignments.push([span.source.name, span.target.name, span.routes[0].branch, otherSpan.routes[0].branch, +sourceDiff.toFixed(3), +targetDiff.toFixed(3)])
          }
        }
      }

      const {
        source: otherSourcePoint,
        target: otherTargetPoint,
      } = tryGetFromMap(map, otherSpan)

      const doIntersect = !span.isContinuous(otherSpan)
        && segmentsIntersect(arr, [otherSourcePoint, otherTargetPoint])

      if (doIntersect) {
        // console.log('intersection')
        // console.log(span.source.name, span.target.name, span.routes[0].branch)
        // console.log(otherSpan.source.name, otherSpan.target.name, otherSpan.routes[0].branch)
        if (areParallel) {
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

  const sum = sumBy(
    parallelSpans,
    ps => ps.length ** 8 * meanBy(ps, s => distances[s.id]) / avgDist,
  )
  const parallelBatches = sum / numSpans
  // console.log(spans.length, entries.length)

  // TODO: treat only adjacent parallel as parallel

  const totalCost = 150000
    + numParallelCrossings * 2000
    + numParallelMisallignments * 500
    // - neighborPoints * 300
    + numCrossings * 1
    - parallelBatches * 10
    + avgDist * 0

  if (log) {
    console.log('avg distance', avgDist)
    console.log('num crossings', numCrossings)
    console.log('num parallel crossings', numParallelCrossings)
    console.log('misallignments', numParallelMisallignments, misalignments)
  }

  return totalCost
}
