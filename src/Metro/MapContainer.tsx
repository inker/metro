import React, { PureComponent } from 'react'
import { uniq } from 'lodash'

import SvgOverlay from 'ui/SvgOverlay'

import { meanColor } from 'util/color'
import findCycle from 'util/algorithm/findCycle'
import * as math from 'util/math'
import {
  mean,
  normalize,
} from 'util/math/vector'

import {
  tryGetFromMap,
} from 'util/collections'

import Network, {
  Platform,
  Station,
  Span,
  Transfer,
} from '../network'

import { Containers as MetroContainers } from './index'
import Platforms from './Platforms'
import Transfers from './Transfers'
import PathsContainer from './Paths'

interface Containers {
  transfersInner?: SVGGElement,
  pathsInner?: SVGGElement,
}

interface Props {
  config: any,
  zoom: number,
  lineRules: Map<string, CSSStyleDeclaration>,
  network: Network,
  overlay: SvgOverlay,
  platformsOnSVG: WeakMap<Platform, L.Point>,
  platformOffsets: Map<L.Point, Map<Span, number>>,
  svgSizes: any,
  containers: MetroContainers,
  featuredPlatforms: Platform[] | null,
  setFeaturedPlatforms: (platforms: Platform[] | null) => void,
}

interface State {
  containers: Containers,
}

class MapContainer extends PureComponent<Props> {
  state: State = {
    containers: {},
  }

  whiskers: WeakMap<Platform, Map<Span, L.Point>>

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

  private getPosOffset = (pos: L.Point) =>
    this.props.platformOffsets.get(pos) || null

  private getFirstWhisker = (platform: Platform) =>
    tryGetFromMap(this.whiskers, platform).values().next().value

  private setFeaturedPlatformsByPlatform = (platform: Platform) => {
    const { name } = platform
    const featuredPlatforms = platform.station.platforms.filter(p => p.name === name)
    this.props.setFeaturedPlatforms(featuredPlatforms)
  }

  private setFeaturedPlatformsByTransfer = (transfer: Transfer) => {
    const { source, target } = transfer
    const sourceName = source.name
    const targetName = target.name
    const sourceFeaturedPlatforms = source.station.platforms.filter(p => p.name === sourceName)
    const targetFeaturedPlatforms = target.station.platforms.filter(p => p.name === targetName)
    const featuredPlatforms = uniq([...sourceFeaturedPlatforms, ...targetFeaturedPlatforms])
    this.props.setFeaturedPlatforms(featuredPlatforms)
  }

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

  protected makeWhiskers(platform: Platform): Map<Span, L.Point> {
    const {
      platformsOnSVG,
    } = this.props

    const PART = 0.5
    const pos = tryGetFromMap(platformsOnSVG, platform)
    const whiskers = new Map<Span, L.Point>()
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

    const normals: [L.Point[], L.Point[]] = [[], []]
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

  render() {
    const {
      config,
      zoom,
      network,
      lineRules,
      platformsOnSVG,
      svgSizes,
      featuredPlatforms,
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
      dummyCircleRadius,
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

    this.whiskers = new WeakMap<Platform, Map<Span, L.Point>>()
    const stationCircumpoints = new Map<Station, Platform[]>()

    for (const station of network.stations) {
      const circumpoints: L.Point[] = []
      // const stationMeanColor: string
      // if (zoom < 12) {
      //     stationMeanColor = color.mean(this.linesToColors(this.passingLinesStation(station)));
      // }
      for (const platform of station.platforms) {
        const pos = tryGetFromMap(platformsOnSVG, platform)
        // const posOnSVG = this.overlay.latLngToSvgPoint(platform.location);
        const wh = this.makeWhiskers(platform)
        this.whiskers.set(platform, wh)
      }

      const circular = findCycle(network, station)
      if (circular.length > 0) {
        for (const platform of station.platforms) {
          if (circular.includes(platform)) {
            const pos = tryGetFromMap(platformsOnSVG, platform)
            circumpoints.push(pos)
          }
        }
        stationCircumpoints.set(station, circular)
      }
    }

    return (
      <>
        {pathsInner && network.spans &&
          <PathsContainer
            spans={network.spans}
            outerStrokeWidth={lineWidth}
            innerStrokeWidth={lineWidth / 2}
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
            stationCircumpoints={stationCircumpoints}
            featuredPlatforms={featuredPlatforms}
            outerStrokeWidth={transferWidth + transferBorder / 2}
            innerStrokeWidth={transferWidth - transferBorder / 2}
            fullCircleRadius={fullCircleRadius}
            transfersInnerWrapper={transfersInner}
            dummyTransfers={dummyTransfers}
            defs={defs}
            getPlatformPosition={this.getPlatformPosition}
            getPlatformColor={this.getPlatformColor}
            setFeaturedPlatformsByTransfer={this.setFeaturedPlatformsByTransfer}
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
            setFeaturedPlatformsByPlatform={this.setFeaturedPlatformsByPlatform}
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
