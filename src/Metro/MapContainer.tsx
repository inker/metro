import React, { PureComponent } from 'react'
import { Point, LatLng } from 'leaflet'
import {
  clamp,
  mean,
  xor,
  intersection,
  random,
  sample,
  shuffle,
  sumBy,
} from 'lodash'

import { meanColor } from 'util/color'
import findCycle from 'util/algorithm/findCycle'
import * as math from 'util/math'
import {
  mean as meanPoint,
  zero as zeroVec,
  normalize,
  orthogonal,
  segmentsIntersect,
} from 'util/math/vector'

import {
  tryGetFromMap,
  swapArrayElements,
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

const simpleShouldSwapFunc = (newCost: number, prevCost: number) => newCost <= prevCost

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
  private isOptimized = false

  private readonly whiskers = new WeakMap<Platform, Map<Span, Point>>()
  private readonly platformSlots = new WeakMap<Platform, Route[]>()
  private readonly spanBatches = new Map<Span, number>()
  private readonly parallelSpans: Span[][] = []
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
    this.updateCircumcircles(props)

    if (!this.isOptimized) {
      this.updateSlots(props)
      this.updateBatches(props)
      this.optimize(props)
      this.updateBatches(props) // may be redundant
      this.isOptimized = true
    }
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

  private getSpanOffset = (span: Span) => {
    const offset = this.spanBatches.get(span)
    if (!offset) {
      return 0
    }

    const { svgSizes } = this.props
    const lineWidthPlusGapPx = (GAP_BETWEEN_PARALLEL + 1) * svgSizes.lineWidth
    return offset * lineWidthPlusGapPx
  }

  private getFirstWhisker = (platform: Platform) =>
    this.getPlatformWhiskers(platform).values().next().value

  private getPlatformSlotPosition = (platform: Platform, route: Route) => {
    const map = this.getPlatformSlot(platform)
    if (!map) {
      return 0
    }

    const index = map.indexOf(route)
    if (index < 0) {
      return 0
    }

    const { svgSizes } = this.props
    const routes = platform.passingRoutes()

    const lineWidthPlusGapPx = (GAP_BETWEEN_PARALLEL + 1) * svgSizes.lineWidth
    const leftShift = (routes.size - 1) / 2
    return (index - leftShift) * lineWidthPlusGapPx
  }

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

    return {
      source: this.getPlatformSlotPosition(source, firstRoute),
      target: this.getPlatformSlotPosition(target, firstRoute),
    }
  }

  private getPlatformPositions = (platform: Platform) => {
    const pos = this.getPlatformPosition(platform)
    const value = this.getFirstWhisker(platform)
    if (pos.equals(value)) {
      // TODO WTF
      return pos
    }

    const slots = this.getPlatformSlot(platform)
    if (!slots) {
      return pos
    }

    const { svgSizes } = this.props
    const lineWidthPlusGapPx = (GAP_BETWEEN_PARALLEL + 1) * svgSizes.lineWidth
    const leftShift = (slots.length - 1) / 2
    const maxSlot = leftShift * lineWidthPlusGapPx

    return getPositions(pos, value, -maxSlot, maxSlot)
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
      positions[bound] = meanPoint(normals).add(pos)
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

  private updateWhiskers(props: Props) {
    const { network } = this.props

    for (const station of network.stations) {
      for (const platform of station.platforms) {
        const wh = this.makeWhiskers(platform)
        this.whiskers.set(platform, wh)
      }
    }
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

  private updateSlots(props: Props) {
    const {
      network,
      config,
    } = props

    const {
      platformSlots,
    } = this

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

      platformSlots.set(platform, routes)
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
    this.parallelSpans.length = 0

    const remainingSpans = new Set<Span>(network.spans)
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
        for (let i = 0; i < ss.length; ++i) {
          // normalize
          spanBatches.set(ss[i], sourceSlots[i] - avgSourceSlot)
        }
        this.parallelSpans.push(ss)
      }
    }

    // console.timeEnd('batches')
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

      const arr = [sourcePoint, targetPoint] as [Point, Point]

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

    function powerOf4(n: number) {
      const quadratic = n * n
      return quadratic * quadratic
    }

    const parallelBatches = sumBy(this.parallelSpans, ps => powerOf4(ps.length))
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
      const slots = tryGetFromMap(platformSlots, firstPlatform)
      for (const p of patch) {
        const pSlots = tryGetFromMap(platformSlots, p)
        pSlots.splice(0, pSlots.length, ...slots)
      }
    }
    this.updateBatches(props) // TODO: optimize

    console.time('loops')
    let cost = this.costFunction(props)
    console.log('initial cost', cost)
    const TOTAL_ITERATIONS = 500

    const costFunc = () => this.costFunction(props)

    const onSwap = (newCost: number, prevCost: number, iteration: number) => {
      if (newCost !== prevCost) {
        console.log(iteration, newCost)
      }
    }

    const swapFooOptions = {
      costFunc,
      shouldSwap: makeShouldSwapFunc(TOTAL_ITERATIONS, 20, 50),
      onSwap,
      before: () => {
        const patch = sample(patches) as Platform[]
        const firstPlatform = patch[0]
        const routes = tryGetFromMap(platformSlots, firstPlatform)
        const max = routes.length - 1
        const slot1 = random(0, max)
        const slot2 = random(0, max)
        for (const p of patch) {
          const slots = tryGetFromMap(platformSlots, p)
          swapArrayElements(slots, slot1, slot2)
        }
        this.updateBatches(props) // TODO: optimize
        return { patch, slot1, slot2 }
      },
      after: ({ patch, slot1, slot2 }) => {
        for (const p of patch) {
          const slots = tryGetFromMap(platformSlots, p)
          swapArrayElements(slots, slot1, slot2)
        }
        this.updateBatches(props) // TODO: optimize
      },
    }

    cost = optimize(TOTAL_ITERATIONS, cost, swapFooOptions)

    // move whole routes around
    const platformBranches = getPlatformBranches(platforms)
    const routeEntries = shuffle(Array.from(platformBranches))

    console.log('swap routes')

    cost = optimize(TOTAL_ITERATIONS / 3, cost, {
      costFunc,
      shouldSwap: simpleShouldSwapFunc,
      onSwap,
      before: (i) => {
        const [r1, ps1] = sample(routeEntries) as [Route, Platform[]]
        const [r2, ps2] = sample(routeEntries) as [Route, Platform[]]
        const commonPlatforms = intersection(ps1, ps2)
        for (const p of commonPlatforms) {
          const slots = tryGetFromMap(platformSlots, p)
          const slot1 = slots.indexOf(r1)
          const slot2 = slots.indexOf(r2)
          swapArrayElements(slots, slot1, slot2)
        }
        this.updateBatches(props) // TODO: optimize
        return { commonPlatforms, r1, r2 }
      },
      after: ({ commonPlatforms, r1, r2 }) => {
        for (const p of commonPlatforms) {
          const slots = tryGetFromMap(platformSlots, p)
          const slot1 = slots.indexOf(r1)
          const slot2 = slots.indexOf(r2)
          swapArrayElements(slots, slot1, slot2)
        }
        this.updateBatches(props) // TODO: optimize
      },
    })

    console.log('bro', routeEntries)

    cost = optimize(TOTAL_ITERATIONS / 3, cost, {
      costFunc,
      shouldSwap: simpleShouldSwapFunc,
      onSwap,
      before: (i) => {
        const [route, ps] = routeEntries[i % routeEntries.length]
        const down = Math.random() < 0.5
        const swappedPlatforms = new Map<Platform, Route>()
        for (const p of ps) {
          const slots = tryGetFromMap(platformSlots, p)
          const slot = slots.indexOf(route)
          const newSlot = slot + (down ? 1 : -1)
          const otherSlot = clamp(newSlot, 0, slots.length - 1)
          if (slot === otherSlot) {
            continue
          }
          const otherRoute = slots[otherSlot]
          swapArrayElements(slots, slot, otherSlot)
          swappedPlatforms.set(p, otherRoute)
        }
        this.updateBatches(props) // TODO: optimize
        return { route, swappedPlatforms }
      },
      after: ({ route, swappedPlatforms }) => {
        for (const [p, otherRoute] of swappedPlatforms) {
          const slots = tryGetFromMap(platformSlots, p)
          const slot = slots.indexOf(otherRoute)
          const otherSlot = slots.indexOf(route)
          swapArrayElements(slots, slot, otherSlot)
        }
        this.updateBatches(props) // TODO: optimize
      },
    })

    console.log('rotation')
    const minThreeRoutePlatforms = patches.filter(pa => pa[0].passingRoutes().size > 2)

    cost = optimize(TOTAL_ITERATIONS / 3, cost, {
      costFunc,
      shouldSwap: simpleShouldSwapFunc,
      onSwap,
      before: (i) => {
        const down = Math.random() < 0.5
        const patch = sample(minThreeRoutePlatforms) as Platform[]

        // rotate
        for (const p of patch) {
          const slots = tryGetFromMap(platformSlots, p)
          if (down) {
            const last = slots.pop() as Route
            slots.unshift(last)
          } else {
            const first = slots.shift() as Route
            slots.push(first)
          }
        }
        this.updateBatches(props)
        return { patch, down }
      },
      after: ({ patch, down }) => {
        for (const p of patch) {
          const slots = tryGetFromMap(platformSlots, p)
          if (!down) {
            const last = slots.pop() as Route
            slots.unshift(last)
          } else {
            const first = slots.shift() as Route
            slots.push(first)
          }
        }
        this.updateBatches(props) // TODO: optimize
      },
    })

    console.log('finally')

    cost = optimize(TOTAL_ITERATIONS / 2, cost, {
      ...swapFooOptions,
      shouldSwap: simpleShouldSwapFunc,
    })

    console.log('cost', cost)

    console.log('batches', this.spanBatches)
    console.log('slots', this.platformSlots)

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
