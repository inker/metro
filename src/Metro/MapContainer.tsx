import React, { PureComponent } from 'react'
import { Point, LatLng } from 'leaflet'
import {
  intersection,
} from 'lodash'

import { meanColor } from 'util/color'
import findCycle from 'util/algorithm/findCycle'
import * as math from 'util/math'
import {
  mean,
  normalize,
} from 'util/math/vector'

import {
  tryGetFromMap,
  getOrMakeInMap,
} from 'util/collections'

import Network, {
  Platform,
  Station,
  Span,
} from '../network'

import Config from '../Config'

import { Containers as MetroContainers } from './index'
import Platforms from './Platforms'
import Transfers from './Transfers'
import Spans from './Spans'

const GAP_BETWEEN_PARALLEL = 0 // 0 - none, 1 - line width

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

  private whiskers = new WeakMap<Platform, Map<Span, Point>>()
  private readonly platformOffsets = new Map<L.Point, Map<Span, number>>()
  private readonly stationCircumpoints = new Map<Station, Platform[]>()

  componentWillReceiveProps(props: Props) {
    const oldProps = this.props
    if (props.zoom === oldProps.zoom) {
      return
    }

    this.updateParameters(props)
  }

  private updateParameters(props: Props) {
    this.updateWhiskers(props)
    this.updateOffsets(props)
    this.updateCircumcircles(props)
  }

  private mountTransfersInner = (g: SVGGElement) => {
    console.log('mounting transfers inner', g)
    this.setState(state => ({
      containers: {
        ...state.containers,
        transfersInner: g,
      },
    }))
  }

  private mountPathsInner = (g: SVGGElement) => {
    console.log('mounting paths inner', g)
    this.setState(state => ({
      containers: {
        ...state.containers,
        pathsInner: g,
      },
    }))
  }

  private getPlatformPosition = (platform: Platform) =>
    tryGetFromMap(this.props.platformsOnSVG, platform)

  private getPosOffset = (pos: Point) =>
    this.platformOffsets.get(pos) || null

  private getFirstWhisker = (platform: Platform) =>
    tryGetFromMap(this.whiskers, platform).values().next().value

  private unsetFeaturedPlatforms = () => {
    this.props.setFeaturedPlatforms(null)
  }

  private getPlatformColor = (platform: Platform) =>
    meanColor(this.linesToColors(platform.passingLines()))

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

  protected makeWhiskers(platform: Platform): Map<Span, Point> {
    const {
      platformsOnSVG,
    } = this.props

    const PART = 0.5
    const pos = tryGetFromMap(platformsOnSVG, platform)
    const whiskers = new Map<Span, Point>()
    const { spans } = platform
    if (spans.length === 0) {
      return whiskers
    }
    if (spans.length === 1) {
      return whiskers.set(spans[0], pos)
    }
    if (spans.length === 2) {
      if (platform.passingLines().size === 2) {
          return whiskers.set(spans[0], pos).set(spans[1], pos)
      }
      const neighborPositions = spans.map(span => tryGetFromMap(platformsOnSVG, span.other(platform)))
      const [prevPos, nextPos] = neighborPositions
      const wings = math.wings(prevPos, pos, nextPos, 1)
      const t = Math.min(pos.distanceTo(prevPos), pos.distanceTo(nextPos)) * PART
      for (let i = 0; i < 2; ++i) {
          // const t = pos.distanceTo(neighborPositions[i]) * PART
          const end = wings[i].multiplyBy(t).add(pos)
          whiskers.set(spans[i], end)
      }
      return whiskers
    }

    const normals: [Point[], Point[]] = [[], []]
    const sortedSpans: [Span[], Span[]] = [[], []]
    const distances = new WeakMap<Span, number>()
    for (const span of spans) {
      const neighbor = span.other(platform)
      const neighborPos = tryGetFromMap(platformsOnSVG, neighbor)
      const dirIdx = span.source === platform ? 0 : 1
      normals[dirIdx].push(normalize(neighborPos.subtract(pos)))
      sortedSpans[dirIdx].push(span)
      distances.set(span, pos.distanceTo(neighborPos))
    }
    const [prevPos, nextPos] = normals.map(ns => mean(ns).add(pos))
    const wings = math.wings(prevPos, pos, nextPos, 1)
    for (let i = 0; i < 2; ++i) {
      const wing = wings[i]
      for (const span of sortedSpans[i]) {
        const t = tryGetFromMap(distances, span) * PART
        const end = wing.multiplyBy(t).add(pos)
        whiskers.set(span, end)
      }
    }
    return whiskers
  }

  private updateOffsets(props: Props) {
    const {
      network,
      platformsOnSVG,
      svgSizes,
    } = props

    this.platformOffsets.clear()
    const lineWidthPlusGapPx = (GAP_BETWEEN_PARALLEL + 1) * svgSizes.lineWidth

    for (const span of network.spans) {
      const { source, target, routes } = span
      const parallel = network.spans.filter(s => s.isOf(source, target))
      if (parallel.length === 1) {
        continue
      }
      if (parallel.length === 0) {
        throw new Error(`some error with span ${source.name}-${target.name}: it probably does not exist`)
      }

      const i = parallel.indexOf(span)
      if (i === -1) {
        throw new Error(`some error with span ${source.name}-${target.name}`)
      }
      const leftShift = (parallel.length - 1) / 2
      const totalOffset = (i - leftShift) * lineWidthPlusGapPx
      for (const p of [source, target]) {
        const pos = tryGetFromMap(platformsOnSVG, p)
        const spanRouteSpans = p.spans.filter(s => intersection(s.routes, routes).length > 0)
        for (const s of spanRouteSpans) {
          const map = getOrMakeInMap(this.platformOffsets, pos, () => new Map<Span, number>())
          map.set(s, totalOffset)
        }
      }
    }
  }

  private updateCircumcircles(props: Props) {
    const {
      network,
      platformsOnSVG,
    } = props

    this.stationCircumpoints.clear()

    for (const station of network.stations) {
      const circumpoints: Point[] = []

      const circular = findCycle(network, station)
      if (circular.length > 0) {
        for (const platform of station.platforms) {
          if (circular.includes(platform)) {
            const pos = tryGetFromMap(platformsOnSVG, platform)
            circumpoints.push(pos)
          }
        }
        this.stationCircumpoints.set(station, circular)
      }
    }
  }

  private updateWhiskers(props: Props) {
    const { network } = this.props

    for (const station of network.stations) {
      // const stationMeanColor: string
      // if (zoom < 12) {
      //     stationMeanColor = color.mean(this.linesToColors(this.passingLinesStation(station)));
      // }
      for (const platform of station.platforms) {
        // const posOnSVG = this.overlay.latLngToSvgPoint(platform.location);
        const wh = this.makeWhiskers(platform)
        this.whiskers.set(platform, wh)
      }
    }
  }

  render() {
    const {
      config,
      zoom,
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

    const isDetailed = zoom >= config.detailedZoom

    // const lineWidth = 2 ** (zoom / 4 - 1.75);

    const lightRailPathStyle = tryGetFromMap(lineRules, 'L')
    lightRailPathStyle.strokeWidth = `${lightLineWidth}px`

    return (
      <>
        {pathsInner && network.spans &&
          <Spans
            spans={network.spans}
            lineWidth={lineWidth}
            whiskers={this.whiskers}
            lineRules={lineRules}
            pathsInnerWrapper={pathsInner}
            getPlatformPosition={this.getPlatformPosition}
            getPlatformOffset={this.getPosOffset}
          />
        }

        <g
          ref={this.mountPathsInner}
        />

        {transfersInner && dummyTransfers && defs && network.transfers &&
          <Transfers
            transfers={network.transfers}
            isDetailed={isDetailed}
            stationCircumpoints={this.stationCircumpoints}
            featuredPlatforms={featuredPlatforms}
            transferWidth={transferWidth}
            transferBorder={transferBorder}
            fullCircleRadius={fullCircleRadius}
            transfersInnerWrapper={transfersInner}
            dummyTransfers={dummyTransfers}
            defs={defs}
            getPlatformPosition={this.getPlatformPosition}
            getPlatformColor={this.getPlatformColor}
            setFeaturedPlatforms={setFeaturedPlatforms}
            unsetFeaturedPlatforms={this.unsetFeaturedPlatforms}
          />
        }

        {dummyPlatforms && network.platforms &&
          <Platforms
            platforms={network.platforms}
            isDetailed={isDetailed}
            strokeWidth={circleBorder}
            circleRadius={circleRadius}
            dummyPlatforms={dummyPlatforms}
            featuredPlatforms={featuredPlatforms}
            getPlatformPosition={this.getPlatformPosition}
            getPlatformOffset={this.getPosOffset}
            getFirstWhisker={this.getFirstWhisker}
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
