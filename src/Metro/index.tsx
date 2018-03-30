import React, { PureComponent } from 'react'
import { Point, point, LatLng } from 'leaflet'
import { maxBy, meanBy } from 'lodash'

import TooltipReact from 'components/Tooltip'

import ShadowFilter from 'components/filters/Shadow'
import BlackGlowFilter from 'components/filters/BlackGlow'
import GrayFilter from 'components/filters/Gray'
import OpacityFilter from 'components/filters/Opacity'

import getSvgSizesByZoom from 'ui/getSvgSizesByZoom'

import { getPlatformNamesZipped } from 'util/index'
import getCenter from 'util/geo/getCenter'
import {
  tryGetFromMap,
} from 'util/collections'

import Network, {
  Platform,
} from '../network'

import Config from '../Config'

import DummyContainer from './DummyContainer'
import MapContainer from './MapContainer'

export interface Containers {
  defs?: SVGDefsElement,
  dummyTransfers?: SVGGElement,
  dummyPlatforms?: SVGGElement,
}

interface Props {
  config: Config,
  zoom: number,
  lineRules: Map<string, CSSStyleDeclaration>,
  network: Network,
  latLngToOverlayPoint: (latLng: LatLng) => Point,
}

interface State {
  containers: Containers,
  featuredPlatforms: Platform[] | null,
}

class Metro extends PureComponent<Props, State> {
  private platformsOnSVG = new WeakMap<Platform, Point>()

  constructor(props) {
    super(props)
    this.updatePlatformsPositionOnOverlay(props)
  }

  state: State = {
    containers: {},
    featuredPlatforms: null,
  }

  UNSAFE_componentWillReceiveProps(props: Props) {
    const oldProps = this.props
    if (props.zoom === oldProps.zoom) {
      return
    }

    this.updatePlatformsPositionOnOverlay(props)
  }

  private mountDummyTransfers = (g: SVGGElement) => {
    console.info('mounting dummy transfers', g)
    this.setState(state => ({
      containers: {
        ...state.containers,
        dummyTransfers: g,
      },
    }))
  }

  private mountDummyPlatforms = (g: SVGGElement) => {
    console.info('mounting dummy platforms')
    this.setState(state => ({
      containers: {
        ...state.containers,
        dummyPlatforms: g,
      },
    }))
  }

  private mountDefs = (defs: SVGDefsElement) => {
    console.info('mounting dummy platforms')
    this.setState(state => ({
      containers: {
        ...state.containers,
        defs,
      },
    }))
  }

  private setFeaturedPlatforms = (featuredPlatforms: Platform[] | null) => {
    this.setState({
      featuredPlatforms,
    })
  }

  private updatePlatformsPositionOnOverlay(nextProps: Props) {
    const { platformsOnSVG } = this
    const {
      config,
      zoom,
      network,
      latLngToOverlayPoint,
    } = nextProps

    // all platforms are in their place
    if (zoom >= config.detailedZoom) {
      for (const station of network.stations) {
        for (const platform of station.platforms) {
          const pos = latLngToOverlayPoint(platform.location)
          platformsOnSVG.set(platform, pos)
        }
      }
      return
    }
    for (const station of network.stations) {
      const nameSet = new Set<string>()
      const center = latLngToOverlayPoint(station.getCenter())
      const { platforms } = station
      for (const platform of platforms) {
        nameSet.add(platform.name)
        platformsOnSVG.set(platform, center)
      }
      if (nameSet.size === 1) {
        continue
      }
      // unless...
      if (nameSet.size < 1) {
        console.error(station)
        throw new Error(`station has no names`)
      }
      const posByName = new Map<string, Point>()
      for (const name of nameSet) {
        const locations = platforms.filter(p => p.name === name).map(p => p.location)
        const geoCenter = getCenter(locations)
        posByName.set(name, latLngToOverlayPoint(geoCenter))
      }
      for (const platform of platforms) {
        const pos = tryGetFromMap(posByName, platform.name)
        platformsOnSVG.set(platform, pos)
      }
    }
  }

  private getTooltipPosition() {
    const { featuredPlatforms } = this.state
    if (!featuredPlatforms || featuredPlatforms.length === 0) {
      return null
    }

    const { platformsOnSVG } = this

    const topmostPlatform = maxBy(featuredPlatforms, p => p.location.lat)
    const topmostPosition = tryGetFromMap(platformsOnSVG, topmostPlatform)

    const x = meanBy(featuredPlatforms, p => tryGetFromMap(platformsOnSVG, p).x)
    return topmostPosition ? point(x, topmostPosition.y) : null
  }

  private getSvgSizes() {
    const { props } = this
    return getSvgSizesByZoom(props.zoom, props.config.detailedZoom)
  }

  render() {
    const {
      config,
      zoom,
      lineRules,
      network,
      latLngToOverlayPoint,
    } = this.props

    const svgSizes = this.getSvgSizes()

    const {
      circleBorder,
      transferWidth,
      transferBorder,
    } = svgSizes

    const {
      featuredPlatforms,
      containers,
    } = this.state

    const tooltipPos = this.getTooltipPosition()
    const tooltipStrings = featuredPlatforms && getPlatformNamesZipped(featuredPlatforms)

    return (
      <>
        <defs ref={this.mountDefs}>
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
          platformsOnSVG={this.platformsOnSVG}
          svgSizes={svgSizes}
          containers={containers}
          featuredPlatforms={featuredPlatforms}
          setFeaturedPlatforms={this.setFeaturedPlatforms}
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
          mountDummyTransfers={this.mountDummyTransfers}
          mountDummyPlatforms={this.mountDummyPlatforms}
        />
      </>
    )
  }
}

export default Metro
