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

const GAP_BETWEEN_PARALLEL = 0.25 // 0 - none, 1 - line width

type Bound = 'inbound' | 'outbound'
const SPAN_PROPS = Object.freeze(['inbound', 'outbound'] as Bound[])

interface Normals {
  inbound: Point[],
  outbound: Point[],
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

  private readonly whiskers = new WeakMap<Platform, Map<Span, Point>>()
  private readonly platformOffsets = new WeakMap<Platform, Map<Span, number>>()
  private readonly stationCircumpoints = new WeakMap<Station, Platform[]>()

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

  private getPlatformOffset = (platform: Platform) =>
    this.platformOffsets.get(platform) || null

  private getFirstWhisker = (platform: Platform) =>
    tryGetFromMap(this.whiskers, platform).values().next().value

  private unsetFeaturedPlatforms = () => {
    this.props.setFeaturedPlatforms(null)
  }

  private getPlatformColor = (platform: Platform) => {
    const {
      config,
      lineRules,
    } = this.props

    const passingLines = platform.passingLines()
    if (!config.detailedE) {
      return meanColor(this.linesToColors(passingLines))
    }
    const line = passingLines.values().next().value
    if (line !== 'E') {
      return '#999'
    }
    return passingLines.size === 1 && tryGetFromMap(lineRules, line).stroke || '#000'
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

  protected makeWhiskers(platform: Platform): Map<Span, Point> {
    const PART = 0.5
    const pos = this.getPlatformPosition(platform)
    const whiskers = new Map<Span, Point>()
    const { spans } = platform
    const allSpans = platform.getAllSpans()

    if (allSpans.length === 0) {
      return whiskers
    }

    if (allSpans.length === 1) {
      return whiskers.set(allSpans[0], pos)
    }

    if (allSpans.length === 2) {
      const { inbound, outbound } = spans
      const boundSpans = inbound.length === 2 ? inbound : outbound.length === 2 ? outbound : null
      if (boundSpans) {
          return whiskers.set(boundSpans[0], pos).set(boundSpans[1], pos)
      }

      const prevPos = this.getPlatformPosition(inbound[0].other(platform))
      const nextPos = this.getPlatformPosition(outbound[0].other(platform))
      const wings = math.wings(prevPos, pos, nextPos, 1)
      const t = Math.min(pos.distanceTo(prevPos), pos.distanceTo(nextPos)) * PART
      whiskers.set(spans.inbound[0], wings[0].multiplyBy(t).add(pos))
      whiskers.set(spans.outbound[0], wings[1].multiplyBy(t).add(pos))
      return whiskers
    }

    const normals: Normals = {
      inbound: [],
      outbound: [],
    }

    const distances = new WeakMap<Span, number>()

    for (const bound of SPAN_PROPS) {
      const boundSpans = platform.spans[bound]
      for (const span of boundSpans) {
        const neighbor = span.other(platform)
        const neighborPos = this.getPlatformPosition(neighbor)
        normals[bound].push(normalize(neighborPos.subtract(pos)))
        distances.set(span, pos.distanceTo(neighborPos))
      }
    }

    const prevPos = mean(normals.inbound).add(pos)
    const nextPos = mean(normals.outbound).add(pos)
    const wings = math.wings(prevPos, pos, nextPos, 1)
    const wObj = {
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

  private updateOffsets(props: Props) {
    const {
      network,
      svgSizes,
    } = props

    const { platformOffsets } = this
    const lineWidthPlusGapPx = (GAP_BETWEEN_PARALLEL + 1) * svgSizes.lineWidth

    for (const platform of network.platforms) {
      for (const bound of SPAN_PROPS) {
        const boundSpans = platform.spans[bound]
        if (boundSpans.length < 2) {
          continue
        }
        const leftShift = (boundSpans.length - 1) / 2
        for (let i = 0; i < boundSpans.length; ++i) {
          const totalOffset = (i - leftShift) * lineWidthPlusGapPx
          const map = getOrMakeInMap(platformOffsets, platform, () => new Map<Span, number>())
          const span = boundSpans[i]
          map.set(span, totalOffset)
        }
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
            detailedE={config.detailedE}
            pathsInnerWrapper={pathsInner}
            getPlatformPosition={this.getPlatformPosition}
            getPlatformOffset={this.getPlatformOffset}
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
            getPlatformOffset={this.getPlatformOffset}
            getFirstWhisker={this.getFirstWhisker}
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
            getPlatformOffset={this.getPlatformOffset}
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
