import React, { PureComponent } from 'react'
import { Point, LatLng } from 'leaflet'
import {
  mean,
  xor,
} from 'lodash'

import { meanColor } from 'util/color'
import findCycle from 'util/algorithm/findCycle'
import { makeWings } from 'util/math'
import {
  mean as meanPoint,
  zero as zeroVec,
  normalize,
  orthogonal,
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

import optimizeSlots from './optimization/optimizeSlots'
import sortSpans from './optimization/sortSpans'
import costFunction from './optimization/costFunction'

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

  private getSpanSlotPoints = (span: Span): SlotPoints => {
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
      const areSameBound = xor(inboundSpan.routes, outboundSpan.routes).length > 0
      if (!areSameBound) {
        const prevPos = this.getPlatformPosition(inboundSpan.other(platform))
        const nextPos = this.getPlatformPosition(outboundSpan.other(platform))
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
        const neighborPos = this.getPlatformPosition(neighbor)
        const normal = normalize(neighborPos.subtract(pos))
        normals.push(normal)
        distances.set(span, pos.distanceTo(neighborPos))
      }
      positions[bound] = normals.length > 0 ? meanPoint(normals).add(pos) : (() => {
        const neighbors = platform.adjacentPlatformsBySpans()
        const poss = neighbors.map(p => this.getPlatformPosition(p))
        const cofficient = -0.1 // somehow any negative number works
        return meanPoint(poss).subtract(pos).multiplyBy(cofficient).add(pos)
      })()
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
    const {
      network,
    } = props

    const {
      parallelSpans,
      getSpanSlotPoints,
    } = this

    return costFunction({
      network,
      parallelSpans,
      getSpanSlotPoints,
      log,
    })
  }

  optimize(props: Props) {
    const {
      platformSlots,
      spanBatches,
      parallelSpans,
    } = this

    const { network } = props

    console.time('loops')

    optimizeSlots({
      network,
      platformSlots,
      spanBatches,
      costFunc: () => this.costFunction(props),
      updateBatches: () => this.updateBatches(props),
    })

    console.timeEnd('loops')

    console.log('batches', spanBatches)
    console.log('slots', platformSlots)

    // TODO: how to save optimized state?

    console.log('total cost', this.costFunction(props, true))

    sortSpans(network.spans, parallelSpans)
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
