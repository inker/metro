import React, {
  memo,
  useState,
  useCallback,
  useMemo,
} from 'react'

import {
  Point,
  LatLng,
} from 'leaflet'

import { meanColor } from 'utils/color'

import {
  tryGetFromMap,
} from 'utils/collections'

import Network, {
  Platform,
} from '../network'

import Config from '../Config'

import makeWhiskers from './utils/makeWhiskers'
import makeCircumcircles from './utils/makeCircumcircles'

import PositioningEngine from './PositioningEngine'
import Platforms from './Platforms'
import Transfers from './Transfers'
import Spans from './Spans'

import { Containers as MetroContainers } from '.'

const GRAY = '#999'
const BLACK = '#000'

interface Props {
  config: Config,
  zoom: number,
  lineRules: Map<string, CSSStyleDeclaration>,
  network: Network,
  svgSizes: any,
  containers: MetroContainers,
  featuredPlatforms: Platform[] | null,
  getPlatformPosition: (platform: Platform) => Point,
  setFeaturedPlatforms: (platforms: Platform[] | null) => void,
  latLngToOverlayPoint: (latLng: LatLng) => Point,
}

function linesToColors(lines: Set<string>, lineRules: Map<string, CSSStyleDeclaration>): string[] {
  const rgbs: string[] = []
  for (const line of lines) {
    const { stroke } = tryGetFromMap(lineRules, line[0] === 'M' ? line : line[0])
    if (stroke) {
      rgbs.push(stroke)
    }
  }
  return rgbs
}

const MapContainer = ({
  config,
  zoom,
  network,
  lineRules,
  svgSizes: {
    lineWidth,
    lightLineWidth,
    circleBorder,
    circleRadius,
    transferWidth,
    transferBorder,
    fullCircleRadius,
  },
  getPlatformPosition,
  featuredPlatforms,
  setFeaturedPlatforms,
  containers: {
    dummyTransfers,
    dummyPlatforms,
    defs,
  },
}: Props) => {
  const [pathsInner, setPathsInner] = useState<SVGGElement | null>(null)
  const [transfersInner, setTransfersInner] = useState<SVGGElement | null>(null)

  const isDetailed = useMemo(() => zoom >= config.detailedZoom, [zoom])
  const stationCircumpoints = useMemo(() => makeCircumcircles(network), [zoom])
  const whiskers = useMemo(() => makeWhiskers(network.stations, getPlatformPosition), [zoom])

  const unsetFeaturedPlatforms = useCallback(() => {
    setFeaturedPlatforms(null)
  }, [setFeaturedPlatforms])

  const getPlatformWhiskers = useCallback(
    (platform: Platform) => tryGetFromMap(whiskers, platform),
    [whiskers],
  )

  const getPlatformColor = useCallback(
    (platform: Platform) => {
      const passingLines = platform.passingLines()

      if (!isDetailed) {
        // return BLACK
        return config.detailedE && !platform.passingLines().has('E') ? GRAY : BLACK
      }

      if (!config.detailedE) {
        return meanColor(linesToColors(passingLines, lineRules))
      }
      if (!passingLines.has('E')) {
        return GRAY
      }
      // TODO: temp
      return BLACK
      // const line = passingLines.values().next().value
      // return passingLines.size === 1 && tryGetFromMap(lineRules, line).stroke || BLACK
    },
    [config, lineRules, isDetailed],
  )

  // const lineWidth = 2 ** (zoom / 4 - 1.75);

  const lightRailPathStyle = tryGetFromMap(lineRules, 'L')
  lightRailPathStyle.strokeWidth = `${lightLineWidth}px`

  return (
    <PositioningEngine
      detailedE={config.detailedE}
      lineWidth={lineWidth}
      network={network}
      getPlatformPosition={getPlatformPosition}
      getPlatformWhiskers={getPlatformWhiskers}
    >
      {({
        getSpanSlotsScaled,
        getSpanOffset,
        getPlatformSlotPoints,
      }) => (
        <>
          {pathsInner && network.spans
            && (
            <Spans
              spans={network.spans}
              lineWidth={lineWidth}
              lineRules={lineRules}
              detailedE={config.detailedE}
              pathsInnerWrapper={pathsInner}
              getPlatformPosition={getPlatformPosition}
              getPlatformWhiskers={getPlatformWhiskers}
              getSpanSlotsScaled={getSpanSlotsScaled}
              getSpanOffset={getSpanOffset}
            />
            )}

          <g
            ref={setPathsInner}
          />

          {transfersInner && dummyTransfers && defs && network.transfers
            && (
            <Transfers
              transfers={network.transfers}
              isDetailed={isDetailed}
              stationCircumpoints={stationCircumpoints}
              featuredPlatforms={featuredPlatforms}
              transferWidth={transferWidth}
              transferBorder={transferBorder}
              fullCircleRadius={fullCircleRadius}
              transfersInnerWrapper={transfersInner}
              dummyTransfers={dummyTransfers}
              defs={defs}
              getPlatformPosition={getPlatformPosition}
              getPlatformSlotPoints={getPlatformSlotPoints}
              getPlatformColor={getPlatformColor}
              setFeaturedPlatforms={setFeaturedPlatforms}
              unsetFeaturedPlatforms={unsetFeaturedPlatforms}
            />
            )}

          {dummyPlatforms && network.platforms
            && (
            <Platforms
              platforms={network.platforms}
              isDetailed={isDetailed}
              strokeWidth={circleBorder}
              circleRadius={circleRadius}
              dummyPlatforms={dummyPlatforms}
              featuredPlatforms={featuredPlatforms}
              getPlatformSlotPoints={getPlatformSlotPoints}
              getPlatformColor={getPlatformColor}
              setFeaturedPlatforms={setFeaturedPlatforms}
              unsetFeaturedPlatforms={unsetFeaturedPlatforms}
            />
            )}

          <g
            ref={setTransfersInner}
          />

        </>
      )}
    </PositioningEngine>
  )
}

export default memo(MapContainer)
