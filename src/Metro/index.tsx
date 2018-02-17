import React, { PureComponent } from 'react'
import { Point, point } from 'leaflet'
import { maxBy, meanBy } from 'lodash'

import TooltipReact from 'components/Tooltip'

import ShadowFilter from 'components/filters/Shadow'
import BlackGlowFilter from 'components/filters/BlackGlow'
import GrayFilter from 'components/filters/Gray'
import OpacityFilter from 'components/filters/Opacity'

import SvgOverlay from 'ui/SvgOverlay'

import { getPlatformNamesZipped } from 'util/index'
import {
  tryGetFromMap,
} from 'util/collections'

import Network, {
  Platform,
  Span,
} from '../network'

import DummyContainer from './DummyContainer'
import MapContainer from './MapContainer'

export interface Containers {
  defs?: SVGDefsElement,
  dummyTransfers?: SVGGElement,
  dummyPlatforms?: SVGGElement,
}

interface Props {
  config: any,
  zoom: number,
  lineRules: Map<string, CSSStyleDeclaration>,
  network: Network,
  overlay: SvgOverlay,
  platformsOnSVG: WeakMap<Platform, Point>,
  platformOffsets: Map<Point, Map<Span, number>>,
  svgSizes: any,
}

interface State {
  containers: Containers,
  featuredPlatforms: Platform[] | null,
}

class Metro extends PureComponent<Props, State> {
  state: State = {
    containers: {},
    featuredPlatforms: null,
  }

  private mountDummyTransfers = (g: SVGGElement) => {
    console.log('mounting dummy transfers', g)
    this.setState(state => ({
      containers: {
        ...state.containers,
        dummyTransfers: g,
      },
    }))
  }

  private mountDummyPlatforms = (g: SVGGElement) => {
    console.log('mounting dummy platforms')
    this.setState(state => ({
      containers: {
        ...state.containers,
        dummyPlatforms: g,
      },
    }))
  }

  private mountDefs = (defs: SVGDefsElement) => {
    console.log('mounting dummy platforms')
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

  private getTooltipPosition() {
    const { featuredPlatforms } = this.state
    if (!featuredPlatforms) {
      return null
    }

    const { platformsOnSVG } = this.props

    const topmostPlatform = maxBy(featuredPlatforms, p => p.location.lat)
    const topmostPosition = tryGetFromMap(platformsOnSVG, topmostPlatform)

    const x = meanBy(featuredPlatforms, p => tryGetFromMap(platformsOnSVG, p).x)
    return topmostPosition ? point(x, topmostPosition.y) : null
  }

  render() {
    const {
      config,
      zoom,
      lineRules,
      network,
      overlay,
      platformsOnSVG,
      platformOffsets,
      svgSizes,
    } = this.props

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
          overlay={overlay}
          platformsOnSVG={platformsOnSVG}
          platformOffsets={platformOffsets}
          svgSizes={svgSizes}
          containers={containers}
          featuredPlatforms={featuredPlatforms}
          setFeaturedPlatforms={this.setFeaturedPlatforms}
        />

        <TooltipReact
          position={tooltipPos}
          names={tooltipStrings || null}
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
