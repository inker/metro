import React, { PureComponent } from 'react'
import { Point, LatLng } from 'leaflet'
import {
  clamp,
  meanBy,
  orderBy,
  xor,
  sample,
} from 'lodash'

import { meanColor } from 'util/color'
import findCycle from 'util/algorithm/findCycle'
import * as math from 'util/math'
import {
  mean,
  zero as zeroVec,
  normalize,
  orthogonal,
  segmentsIntersect,
} from 'util/math/vector'

import {
  tryGetFromMap,
} from 'util/collections'

import Network, {
  Platform,
  Station,
  Span,
  Route,
} from '../network'

import Config from '../Config'

import getPositions from './utils/getPositions'
import getPlatformPatches from './utils/getPlatformPatches'
import getPlatformBranches from './utils/getPlatformBranches'
import makeShouldSwapFunc from './utils/makeShouldSwapFunc'
import optimize from './utils/optimize'

import { Containers as MetroContainers } from './index'
import Platforms from './Platforms'
import Transfers from './Transfers'
import Spans from './Spans'

const GAP_BETWEEN_PARALLEL = 0 // 0 - none, 1 - line width

const GRAY = '#999'
const BLACK = '#000'

type SourceOrTarget = 'source' | 'target'
const SOURCE_TARGET = Object.freeze(['source', 'target'] as SourceOrTarget[])

type Bound = 'inbound' | 'outbound'
const SPAN_PROPS = Object.freeze(['inbound', 'outbound'] as Bound[])

type SlotPoints = {
  [P in SourceOrTarget]: Point
}

type Positions = {
  [P in Bound]: Point
}

interface Containers {
  transfersInner?: SVGGElement,
  pathsInner?: SVGGElement,
}

interface Props {
  config: Config,
  zoom: number,
  lineRules: Map<string, CSSStyleDeclaration>,
  network: Network,
  platformsOnSVG: WeakMap<Platform, Point>,
  svgSizes: any,
  containers: MetroContainers,
  featuredPlatforms: Platform[] | null,
  setFeaturedPlatforms: (platforms: Platform[] | null) => void,
  latLngToOverlayPoint: (latLng: LatLng) => Point,
}

interface State {
  containers: Containers,
}

class MapContainer extends PureComponent<Props> {
  constructor(props) {
    super(props)
    this.updateParameters(props)
  }

  state: State = {
    containers: {},
  }

  private isDetailed: boolean
  private readonly whiskers = new WeakMap<Platform, Map<Span, Point>>()
  private readonly platformSlots = new WeakMap<Platform, Map<Route, number>>()
  private readonly spanBatches = new Map<Span, number>()
  private readonly stationCircumpoints = new WeakMap<Station, Platform[]>()

  componentWillReceiveProps(props: Props) {
    const oldProps = this.props
    if (props.zoom === oldProps.zoom) {
      return
    }

    this.updateParameters(props)
  }

  private updateParameters(props: Props) {
    this.isDetailed = props.zoom >= props.config.detailedZoom
    this.updateWhiskers(props)
    this.updateSlots(props)
    this.updateBatches(props)
    this.updateCircumcircles(props)
    this.optimize(props)
    this.updateBatches(props) // may be redundant
  }

  private mountTransfersInner = (g: SVGGElement) => {
    console.info('mounting transfers inner', g)
    this.setState((state: State) => ({
      containers: {
        ...state.containers,
        transfersInner: g,
      },
    }))
  }

  private mountPathsInner = (g: SVGGElement) => {
    console.info('mounting paths inner', g)
    this.setState((state: State) => ({
      containers: {
        ...state.containers,
        pathsInner: g,
      },
    }))
  }

  private getPlatformPosition = (platform: Platform) =>
    tryGetFromMap(this.props.platformsOnSVG, platform)

  private getPlatformWhiskers = (platform: Platform) =>
    tryGetFromMap(this.whiskers, platform)

  private getPlatformSlot = (platform: Platform) =>
    this.platformSlots.get(platform) || null

  private getSpanOffset = (span: Span) =>
    this.spanBatches.get(span) || 0

  private getFirstWhisker = (platform: Platform) =>
    this.getPlatformWhiskers(platform).values().next().value

  private getSpanSlots = (span: Span) => {
    const {
      source,
      target,
      routes,
    } = span
    if (this.props.config.detailedE && routes.length > 1) {
      throw new Error('more routes per span than 1')
    }
    const firstRoute = routes[0]
    const sourceMap = this.getPlatformSlot(source)
    const targetMap = this.getPlatformSlot(target)
    return {
      source: sourceMap && sourceMap.get(firstRoute) || 0,
      target: targetMap && targetMap.get(firstRoute) || 0,
    }
  }

  private getPlatformPositions = (platform: Platform) => {
    const pos = this.getPlatformPosition(platform)
    const slotsMap = this.getPlatformSlot(platform)
    if (!slotsMap) {
      return pos
    }

    const slots = Array.from(slotsMap.values())
    const value = this.getFirstWhisker(platform)
    if (pos.equals(value)) {
      // TODO WTF
      return pos
    }
    const minSlot = Math.min(...slots)
    const maxSlot = Math.max(...slots)
    return getPositions(pos, value, minSlot, maxSlot)
  }

  private getPlatformColor = (platform: Platform) => {
    const {
      config,
      lineRules,
    } = this.props

    const passingLines = platform.passingLines()

    if (!this.isDetailed) {
      // return BLACK
      return config.detailedE && !platform.passingLines().has('E') ? GRAY : BLACK
    }

    if (!config.detailedE) {
      return meanColor(this.linesToColors(passingLines))
    }
    if (!passingLines.has('E')) {
      return GRAY
    }
    // TODO: temp
    return BLACK
    // const line = passingLines.values().next().value
    // return passingLines.size === 1 && tryGetFromMap(lineRules, line).stroke || BLACK
  }

  private unsetFeaturedPlatforms = () => {
    this.props.setFeaturedPlatforms(null)
  }

  private linesToColors(lines: Set<string>): string[] {
    const { lineRules } = this.props
    const rgbs: string[] = []
    for (const line of lines) {
      const { stroke } = tryGetFromMap(lineRules, line[0] === 'M' ? line : line[0])
      if (stroke) {
        rgbs.push(stroke)
      }
    }
    return rgbs
  }

  private getSpanSlotPoints(span: Span): SlotPoints {
    const slots = this.getSpanSlots(span)

    const [source, target] = SOURCE_TARGET.map((prop, i) => {
      const platform = span[prop]

      const pos = this.getPlatformPosition(platform)
      const controlPoint = tryGetFromMap(this.getPlatformWhiskers(platform), span)
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

  private makeWhiskers(platform: Platform): Map<Span, Point> {
    const PART = 0.5
    const pos = this.getPlatformPosition(platform)
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
      if (xor(inboundSpan.routes, outboundSpan.routes).length > 0) {
        return whiskers.set(inboundSpan, pos).set(outboundSpan, pos)
      }

      const prevPos = this.getPlatformPosition(inboundSpan.other(platform))
      const nextPos = this.getPlatformPosition(outboundSpan.other(platform))
      const wings = math.wings(prevPos, pos, nextPos, 1)
      const t = Math.min(pos.distanceTo(prevPos), pos.distanceTo(nextPos)) * PART
      whiskers.set(inboundSpan, wings[0].multiplyBy(t).add(pos))
      whiskers.set(outboundSpan, wings[1].multiplyBy(t).add(pos))
      return whiskers
    }

    const positions: Positions = {} as any
    const distances = new WeakMap<Span, number>()

    for (const bound of SPAN_PROPS) {
      const boundSpans = platform.spans[bound]
      const normals: Point[] = []
      for (const span of boundSpans) {
        const neighbor = span.other(platform)
        const neighborPos = this.getPlatformPosition(neighbor)
        const normal = normalize(neighborPos.subtract(pos))
        normals.push(normal)
        distances.set(span, pos.distanceTo(neighborPos))
      }
      positions[bound] = mean(normals).add(pos)
    }

    const wings = math.wings(positions.inbound, pos, positions.outbound, 1)
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

  private updateSlots(props: Props) {
    const {
      network,
      svgSizes,
      config,
    } = props

    const {
      platformSlots,
    } = this

    const lineWidthPlusGapPx = (GAP_BETWEEN_PARALLEL + 1) * svgSizes.lineWidth

    for (const platform of network.platforms) {
      const routeSet = platform.passingRoutes()
      if (routeSet.size === 1) {
        continue
      }
      const routes = Array.from(routeSet)

      // if (!config.detailedE) {
      //   const lineSet = platform.passingLines()
      //   if (lineSet.size === 1) {
      //     continue
      //   }
      //   const lines = Array.from(lineSet)
      //   const leftShift = (routes.length - 1) / 2

      //   for (let i = 0; i < lines.length; ++i) {
      //     const slot = (i - leftShift) * lineWidthPlusGapPx
      //     const map = getOrMakeInMap(platformSlots, platform, () => new Map<Route, number>())
      //     const line = lines[i]
      //     for (const route of routes) {
      //       if (route.line !== line) {
      //         continue
      //       }
      //       map.set(route, slot)
      //     }
      //     const route = routes[i]
      //     map.set(route, slot)
      //   }
      //   return
      // }

      const leftShift = (routes.length - 1) / 2
      const map = new Map<Route, number>()

      for (let i = 0; i < routes.length; ++i) {
        const slot = (i - leftShift) * lineWidthPlusGapPx
        const route = routes[i]
        map.set(route, slot)
      }

      platformSlots.set(platform, map)
    }
  }

  private updateBatches(props: Props) {
    // console.time('batches')

    const {
      network,
    } = props

    const {
      platformSlots,
      spanBatches,
    } = this

    spanBatches.clear()

    const remainingSpans = new Set<Span>(network.spans)
    for (const span of network.spans) {
      if (!remainingSpans.has(span)) {
        continue
      }
      remainingSpans.delete(span)

      const sourceMap = platformSlots.get(span.source)
      const targetMap = platformSlots.get(span.target)

      const slots = (() => {
        const route = span.routes[0]
        const sourceSlot = sourceMap && sourceMap.get(route) || 0
        const targetSlot = targetMap && targetMap.get(route) || 0
        return [sourceSlot, targetSlot]
      })()

      const diff = slots[1] - slots[0]

      const entries: [Span, number][] = [
        [span, slots[0]],
      ]

      const parallelSpans = span.parallelSpans()
      for (const ps of parallelSpans) {
        if (!remainingSpans.has(ps)) {
          throw new Error('span was deleted!')
        }
        remainingSpans.delete(ps)
        if (ps.source === span.target) {
          throw new Error('inverted!')
        }
        const route = ps.routes[0]
        const sourceSlot = sourceMap && sourceMap.get(route) || 0
        const targetSlot = targetMap && targetMap.get(route) || 0
        const d = targetSlot - sourceSlot
        if (d === diff) {
          entries.push([ps, sourceSlot])
        }
      }

      // normalize
      const avg = meanBy(entries, pair => pair[1])
      for (const [s, d] of entries) {
        spanBatches.set(s, d - avg)
      }
    }

    // console.timeEnd('batches')
  }

  private updateCircumcircles(props: Props) {
    const {
      network,
    } = props

    for (const station of network.stations) {
      const circular = findCycle(network, station)
      if (circular.length > 0) {
        this.stationCircumpoints.set(station, circular)
      }
    }
  }

  private updateWhiskers(props: Props) {
    const { network } = this.props

    for (const station of network.stations) {
      for (const platform of station.platforms) {
        const wh = this.makeWhiskers(platform)
        this.whiskers.set(platform, wh)
      }
    }
  }

  private costFunction(props: Props, log = false) {
    // distances (less)
    // crossings (less)

    const {
      network,
    } = props

    const spans = network.spans.filter(s => s.routes[0].line === 'E')

    let sumDistances = 0
    let numCrossings = 0
    let numParallelCrossings = 0

    const numSpans = spans.length
    const numSpansMinusOne = numSpans - 1

    const map = new WeakMap<Span, SlotPoints>()

    for (const span of spans) {
      const slots = this.getSpanSlotPoints(span)
      map.set(span, slots)
    }

    for (let i = 0; i < numSpansMinusOne; ++i) {
      const span = spans[i]

      const {
        source: sourcePoint,
        target: targetPoint,
      } = tryGetFromMap(map, span)

      sumDistances += sourcePoint.distanceTo(targetPoint)

      const arr = [sourcePoint, targetPoint]

      for (let j = i + 1; j < numSpans; ++j) {
        const otherSpan = spans[j]

        const {
          source: otherSourcePoint,
          target: otherTargetPoint,
        } = tryGetFromMap(map, otherSpan)

        // if (
        //   !span.isContinuous(otherSpan)
        //   && (span.source === otherSpan.target || span.target === otherSpan.source)
        //   && segmentsIntersect(arr, [otherSourcePoint, otherTargetPoint])
        // ) {
        //   debugger
        // }

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
          ++numCrossings
        }
      }
    }

    const { spanBatches } = this
    const batchedSpans = Array.from(spanBatches.keys()).filter(s => s.routes[0].line === 'E')
    const numNonBatchedSpans = spans.length - batchedSpans.length
    // console.log(spans.length, entries.length)

    // TODO: treat only adjacent parallel as parallel

    const totalCost = 1000
      + numParallelCrossings * 100
      + numCrossings * 2
      - numNonBatchedSpans * 5
      + sumDistances * 0.001

    if (log) {
      console.log('sum distances', sumDistances)
      console.log('num crossings', numCrossings)
      console.log('num parallel crossings', numParallelCrossings)
    }

    return totalCost
  }

  optimize(props: Props) {
    const {
      network,
    } = props

    const {
      platformSlots,
    } = this

    const platforms = network.platforms.filter(p => platformSlots.has(p))
    const patches = getPlatformPatches(platforms)
    console.log('patches', patches)

    // initial primitive optimization (straigtening of patches)
    for (const patch of patches) {
      const firstPlatform = patch[0]
      const routes = Array.from(firstPlatform.passingRoutes())
      const slotsMap = tryGetFromMap(platformSlots, firstPlatform)
      const slots = Array.from(slotsMap.values())
      for (const p of patch) {
        const map = tryGetFromMap(platformSlots, p)
        for (let i = 0; i < routes.length; ++i) {
          map.set(routes[i], slots[i])
        }
      }
    }
    this.updateBatches(props) // TODO: optimize

    console.time('loops')
    let cost = this.costFunction(props)
    console.log('initial cost', cost)
    const TOTAL_ITERATIONS = 1000

    const costFunc = () => this.costFunction(props)

    const onSwap = (iteration: number, newCost: number, prevCost: number) => {
      if (newCost !== prevCost) {
        console.log(iteration, newCost)
      }
    }

    const swapFooOptions = {
      costFunc,
      shouldSwap: makeShouldSwapFunc(TOTAL_ITERATIONS, 10, 100),
      before: () => {
        const patch = sample(patches) as Platform[]
        const firstPlatform = patch[0]
        const slotsMap = tryGetFromMap(platformSlots, firstPlatform)
        const entries = Array.from(slotsMap)
        const a = sample(entries) as [Route, number]
        const b = sample(entries) as [Route, number]
        for (const p of patch) {
          const map = tryGetFromMap(platformSlots, p)
          map.set(a[0], b[1])
          map.set(b[0], a[1])
        }
        this.updateBatches(props) // TODO: optimize
        return { patch, a, b }
      },
      after: ({ patch, a, b }) => {
        for (const p of patch) {
          const map = tryGetFromMap(platformSlots, p)
          map.set(a[0], a[1])
          map.set(b[0], b[1])
        }
        this.updateBatches(props) // TODO: optimize
      },
      onSwap,
    }

    cost = optimize(TOTAL_ITERATIONS, cost, swapFooOptions)

    // move whole routes around
    const platformBranches = getPlatformBranches(platforms)
    const fooarr = Array.from(platformBranches)
    console.log('bro', fooarr)

    const nextShouldSwapFunc = (newCost: number, prevCost: number) => newCost <= prevCost

    cost = optimize(TOTAL_ITERATIONS / 3, cost, {
      costFunc,
      shouldSwap: nextShouldSwapFunc,
      before: () => {
        const [route, ps] = sample(fooarr) as [Route, Platform[]]
        const down = Math.random() < 0.5
        const swappedPlatforms = new Map<Platform, Route>()
        for (const p of ps) {
          const slotsMap = tryGetFromMap(platformSlots, p)
          const entries = orderBy(Array.from(slotsMap), ([k, v]) => v)
          const posIndex = entries.findIndex(([k, v]) => k === route)
          const newPosIndex = posIndex + (down ? 1 : -1)
          const otherPosIndex = clamp(newPosIndex, 0, entries.length - 1)
          if (posIndex === otherPosIndex) {
            continue
          }
          const [otherRoute] = entries[otherPosIndex]
          const pos = entries[posIndex][1]
          const otherPos = entries[otherPosIndex][1]
          slotsMap.set(route, otherPos)
          slotsMap.set(otherRoute, pos)
          swappedPlatforms.set(p, otherRoute)
        }
        this.updateBatches(props) // TODO: optimize
        return { route, swappedPlatforms }
      },
      after: ({ route, swappedPlatforms }) => {
        for (const [p, otherRoute] of swappedPlatforms) {
          const slotsMap = tryGetFromMap(platformSlots, p)
          const pos = tryGetFromMap(slotsMap, otherRoute)
          const otherPos = tryGetFromMap(slotsMap, route)
          slotsMap.set(route, pos)
          slotsMap.set(otherRoute, otherPos)
        }
        this.updateBatches(props) // TODO: optimize
      },
      onSwap,
    })

    console.log('finally')

    cost = optimize(TOTAL_ITERATIONS / 2, cost, {
      ...swapFooOptions,
      shouldSwap: nextShouldSwapFunc,
    })

    console.log('cost', cost)

    // TODO: how to save optimized state?

    console.timeEnd('loops')
    console.log('total cost', this.costFunction(props, true))
  }

  render() {
    const {
      config,
      network,
      lineRules,
      svgSizes,
      featuredPlatforms,
      setFeaturedPlatforms,
      containers: {
        dummyTransfers,
        dummyPlatforms,
        defs,
      },
    } = this.props

    const {
      lineWidth,
      lightLineWidth,
      circleBorder,
      circleRadius,
      transferWidth,
      transferBorder,
      fullCircleRadius,
    } = svgSizes

    const {
      containers: {
        transfersInner,
        pathsInner,
      },
    } = this.state

    // const lineWidth = 2 ** (zoom / 4 - 1.75);

    const lightRailPathStyle = tryGetFromMap(lineRules, 'L')
    lightRailPathStyle.strokeWidth = `${lightLineWidth}px`

    return (
      <>
        {pathsInner && network.spans &&
          <Spans
            spans={network.spans}
            lineWidth={lineWidth}
            getPlatformWhiskers={this.getPlatformWhiskers}
            lineRules={lineRules}
            detailedE={config.detailedE}
            pathsInnerWrapper={pathsInner}
            getPlatformPosition={this.getPlatformPosition}
            getSpanSlots={this.getSpanSlots}
            getSpanOffset={this.getSpanOffset}
          />
        }

        <g
          ref={this.mountPathsInner}
        />

        {transfersInner && dummyTransfers && defs && network.transfers &&
          <Transfers
            transfers={network.transfers}
            isDetailed={this.isDetailed}
            stationCircumpoints={this.stationCircumpoints}
            featuredPlatforms={featuredPlatforms}
            transferWidth={transferWidth}
            transferBorder={transferBorder}
            fullCircleRadius={fullCircleRadius}
            transfersInnerWrapper={transfersInner}
            dummyTransfers={dummyTransfers}
            defs={defs}
            getPlatformPosition={this.getPlatformPosition}
            getPlatformPositions={this.getPlatformPositions}
            getPlatformColor={this.getPlatformColor}
            setFeaturedPlatforms={setFeaturedPlatforms}
            unsetFeaturedPlatforms={this.unsetFeaturedPlatforms}
          />
        }

        {dummyPlatforms && network.platforms &&
          <Platforms
            platforms={network.platforms}
            isDetailed={this.isDetailed}
            strokeWidth={circleBorder}
            circleRadius={circleRadius}
            dummyPlatforms={dummyPlatforms}
            featuredPlatforms={featuredPlatforms}
            getPlatformPositions={this.getPlatformPositions}
            getPlatformColor={this.getPlatformColor}
            setFeaturedPlatforms={setFeaturedPlatforms}
            unsetFeaturedPlatforms={this.unsetFeaturedPlatforms}
          />
        }

        <g
          ref={this.mountTransfersInner}
        />

      </>
    )
  }
}

export default MapContainer
