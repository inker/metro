import React, {
  memo,
  useState,
  useMemo,
} from 'react'

import {
  Point,
  point,
  LatLng,
} from 'leaflet'

import {
  maxBy,
  meanBy,
} from 'lodash'

import TooltipReact from 'components/Tooltip'

import ShadowFilter from 'components/filters/Shadow'
import BlackGlowFilter from 'components/filters/BlackGlow'
import GrayFilter from 'components/filters/Gray'
import OpacityFilter from 'components/filters/Opacity'

import getSvgSizesByZoom from 'ui/getSvgSizesByZoom'

import memoizeObject from 'utils/memoizeObject'
import { getPlatformNamesZipped } from 'utils/misc'

import Network, {
  Platform,
} from '../network'

import Config from '../Config'

import makeGetPlatformPositionFunc from './utils/makeGetPlatformPositionFunc'
import { SvgGContainer } from './utils/types'

import DummyContainer from './DummyContainer'
import MapContainer from './MapContainer'

export type Containers = SvgGContainer<'defs' | 'dummyTransfers' | 'dummyPlatforms'>

interface Props {
  config: Config,
  zoom: number,
  lineRules: Map<string, CSSStyleDeclaration>,
  network: Network,
  latLngToOverlayPoint: (latLng: LatLng) => Point,
}

const memoMapContainers = memoizeObject()

function getTooltipPosition(featuredPlatforms: Platform[] | null, getPlatformPosition: (platform: Platform) => Point) {
  if (!featuredPlatforms || featuredPlatforms.length === 0) {
    return null
  }

  const topmostPlatform = maxBy(featuredPlatforms, p => p.location.lat)
  const topmostPosition = topmostPlatform && getPlatformPosition(topmostPlatform)

  const x = meanBy(featuredPlatforms, p => getPlatformPosition(p).x)
  return topmostPosition ? point(x, topmostPosition.y) : null
}

const Metro = ({
  config,
  zoom,
  lineRules,
  network,
  latLngToOverlayPoint,
}: Props) => {
  const [defs, setDefs] = useState<SVGDefsElement | null>(null)
  const [dummyTransfers, setDummyTransfers] = useState<SVGGElement | null>(null)
  const [dummyPlatforms, setDummyPlatforms] = useState<SVGGElement | null>(null)
  const [featuredPlatforms, setFeaturedPlatforms] = useState<Platform[] | null>(null)

  const getPlatformPosition = useMemo(() => makeGetPlatformPositionFunc(
    zoom >= config.detailedZoom,
    network,
    latLngToOverlayPoint,
  ), [zoom])

  const tooltipPos = getTooltipPosition(featuredPlatforms, getPlatformPosition)
  const tooltipStrings = featuredPlatforms && getPlatformNamesZipped(featuredPlatforms)

  const svgSizes = getSvgSizesByZoom(zoom, config.detailedZoom)

  const {
    circleBorder,
    transferWidth,
    transferBorder,
  } = svgSizes

  return (
    <>
      <defs ref={setDefs}>
        <ShadowFilter />
        <BlackGlowFilter />
        <OpacityFilter />
        <GrayFilter />
      </defs>

      <MapContainer
        config={config}
        zoom={zoom}
        lineRules={lineRules}
        network={network}
        svgSizes={svgSizes}
        containers={memoMapContainers({
          defs,
          dummyTransfers,
          dummyPlatforms,
        })}
        featuredPlatforms={featuredPlatforms}
        getPlatformPosition={getPlatformPosition}
        setFeaturedPlatforms={setFeaturedPlatforms}
        latLngToOverlayPoint={latLngToOverlayPoint}
      />

      <TooltipReact
        position={tooltipPos}
        names={tooltipStrings || null}
        fontSize={Math.max((zoom + 10) * 0.5, 11)}
      />

      <DummyContainer
        dummyTransfersStrokeWidth={transferWidth * 2 + transferBorder}
        dummyPlatformsStrokeWidth={circleBorder * 2}
        mountDummyTransfers={setDummyTransfers}
        mountDummyPlatforms={setDummyPlatforms}
      />
    </>
  )
}

export default memo(Metro)
