import React, { PureComponent } from 'react'
import { Point } from 'leaflet'
import {
  mean,
} from 'lodash'

import {
  zero as zeroVec,
  normalize,
  orthogonal,
} from 'utils/math/vector'

import {
  tryGetFromMap,
} from 'utils/collections'

import Network, {
  Platform,
  Span,
  Route,
} from '../network'

import initSlots from './utils/initSlots'
import getPositions from './utils/getPositions'
import {
  SlotPoints,
} from './utils/types'

import optimizeSlots from './optimization/optimizeSlots'
import sortSpans from './optimization/sortSpans'
import costFunction from './optimization/costFunction'

const GAP_BETWEEN_PARALLEL = 0 // 0 - none, 1 - line width

const SOURCE_TARGET = ['source', 'target'] as const

interface ChildrenFuncParams {
  getSpanSlotsScaled: PositioningEngine['getSpanSlotsScaled'],
  getSpanOffset: PositioningEngine['getSpanOffset'],
  getPlatformSlotPoints: PositioningEngine['getPlatformSlotPoints'],
}

export type ChildrenFunc = (o: ChildrenFuncParams) => React.ReactNode

interface Props {
  children: ChildrenFunc,
  detailedE: boolean,
  lineWidth: number,
  network: Network,
  getPlatformPosition: (platform: Platform) => Point,
  getPlatformWhiskers: (platform: Platform) => Map<Span, Point>,
}

class PositioningEngine extends PureComponent<Props> {
  private readonly platformSlots: WeakMap<Platform, Route[]>

  private readonly spanBatches = new Map<Span, number>()
  private readonly parallelSpans: Span[][] = []

  constructor(props: Props) {
    super(props)

    this.platformSlots = initSlots(props.network.platforms)
    this.updateBatches()
    this.optimize()
  }

  // center is 0, (-1, 0, 1 or -0.5, 0.5 ...)
  private getPlatformSlotPosition(platform: Platform, route: Route) {
    const map = this.platformSlots.get(platform)
    if (!map) {
      return 0
    }

    const index = map.indexOf(route)
    if (index < 0) {
      return 0
    }

    const routes = platform.passingRoutes()

    const leftShift = (routes.size - 1) / 2
    return index - leftShift
  }

  private getSpanSlots = (span: Span) => {
    const {
      source,
      target,
      routes,
    } = span

    if (this.props.detailedE && routes.length > 1) {
      throw new Error('more routes per span than 1')
    }

    const firstRoute = routes[0]

    return {
      source: this.getPlatformSlotPosition(source, firstRoute),
      target: this.getPlatformSlotPosition(target, firstRoute),
    }
  }

  private getSpanSlotPoints = (span: Span): SlotPoints => {
    const {
      getPlatformWhiskers,
    } = this.props

    const slots = this.getSpanSlotsScaled(span)

    const [source, target] = SOURCE_TARGET.map((prop, i) => {
      const platform = span[prop]

      const pos = this.props.getPlatformPosition(platform)
      const controlPoint = tryGetFromMap(getPlatformWhiskers(platform), span)
      const vec = controlPoint.subtract(pos)

      const ortho = orthogonal(vec)[i]
      const normal = ortho.equals(zeroVec) ? ortho : normalize(ortho)
      return normal.multiplyBy(slots[prop]).add(pos)
    })

    return {
      source,
      target,
    }
  }

  private updateBatches = () => {
    // console.time('batches')

    const {
      platformSlots,
    } = this

    const {
      network,
    } = this.props

    this.spanBatches.clear()
    this.parallelSpans.length = 0

    const remainingSpans = new Set(network.spans)
    for (const span of network.spans) {
      if (!remainingSpans.has(span)) {
        continue
      }

      const sourceMap = platformSlots.get(span.source)
      const targetMap = platformSlots.get(span.target)

      const parallelSpans = span.parallelSpans()
      parallelSpans.push(span)

      const spanToSourceSlot = new Map<Span, number>()

      const sameDiffSpans = new Map<number, Span[]>()
      for (const s of parallelSpans) {
        remainingSpans.delete(s)

        const route = s.routes[0]
        // TODO: check this shit
        const sourceSlot = sourceMap ? sourceMap.indexOf(route) : 0
        const targetSlot = targetMap ? targetMap.indexOf(route) : 0

        if (sourceSlot < 0 || targetSlot < 0) {
          console.error('in span:', span)
          throw new Error('route not found')
        }

        const diff = targetSlot - sourceSlot

        spanToSourceSlot.set(s, sourceSlot)

        const ss = sameDiffSpans.get(diff)
        if (ss) {
          ss.push(s)
        } else {
          sameDiffSpans.set(diff, [s])
        }
      }

      const entries = Array.from(sameDiffSpans.values())

      for (const ss of entries) {
        if (ss.length < 2) {
          continue
        }
        const sourceSlots = ss.map(s => tryGetFromMap(spanToSourceSlot, s))
        const avgSourceSlot = mean(sourceSlots)
        for (const [i, s] of ss.entries()) {
          // normalize
          this.spanBatches.set(s, sourceSlots[i] - avgSourceSlot)
        }
        this.parallelSpans.push(ss)
      }
    }

    // console.timeEnd('batches')
  }

  private costFunction = (log = false) => {
    const {
      parallelSpans,
      getSpanSlots,
      getSpanSlotPoints,
    } = this

    const {
      network,
    } = this.props

    return costFunction({
      network,
      parallelSpans,
      getSpanSlots,
      getSpanSlotPoints,
      log,
    })
  }

  private optimize() {
    const {
      platformSlots,
      spanBatches,
      parallelSpans,
    } = this

    const {
      network,
    } = this.props

    console.time('loops')
    const cost = this.costFunction()
    console.log('initial cost', cost)

    optimizeSlots({
      network,
      platformSlots,
      costFunc: this.costFunction,
      updateBatches: this.updateBatches,
    })

    console.timeEnd('loops')

    console.log('batches', spanBatches)
    console.log('slots', platformSlots)

    // TODO: how to save optimized state?

    console.log('total cost', this.costFunction(true))

    sortSpans(network.spans, parallelSpans)

    this.updateBatches() // may be redundant
  }

  private getSpanSlotsScaled = (span: Span) => {
    const { lineWidth } = this.props
    const lineWidthPlusGapPx = (GAP_BETWEEN_PARALLEL + 1) * lineWidth
    const slots = this.getSpanSlots(span)
    return {
      source: slots.source * lineWidthPlusGapPx,
      target: slots.target * lineWidthPlusGapPx,
    }
  }

  private getSpanOffset = (span: Span) => {
    const offset = this.spanBatches.get(span)
    if (!offset) {
      return 0
    }

    const { lineWidth } = this.props
    const lineWidthPlusGapPx = (GAP_BETWEEN_PARALLEL + 1) * lineWidth
    return offset * lineWidthPlusGapPx
  }

  private getPlatformSlotPoints = (platform: Platform) => {
    const pos = this.props.getPlatformPosition(platform)
    // get first whisker
    const { value } = this.props.getPlatformWhiskers(platform).values().next()
    if (!value || pos.equals(value)) {
      // TODO WTF
      return pos
    }

    const slots = this.platformSlots.get(platform)
    if (!slots) {
      return pos
    }

    const { lineWidth } = this.props
    const lineWidthPlusGapPx = (GAP_BETWEEN_PARALLEL + 1) * lineWidth
    const leftShift = (slots.length - 1) / 2
    const maxSlot = leftShift * lineWidthPlusGapPx

    return getPositions(pos, value, -maxSlot, maxSlot)
  }

  render() {
    const {
      getSpanSlotsScaled,
      getSpanOffset,
      getPlatformSlotPoints,
    } = this

    return this.props.children({
      getSpanSlotsScaled,
      getSpanOffset,
      getPlatformSlotPoints,
    })
  }
}

export default PositioningEngine
