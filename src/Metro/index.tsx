import React, { PureComponent } from 'react'
import { Point } from 'leaflet'
import { maxBy } from 'lodash'

import TooltipReact from 'components/Tooltip'

import ShadowFilter from 'components/filters/Shadow'
import BlackGlowFilter from 'components/filters/BlackGlow'
import GrayFilter from 'components/filters/Gray'
import OpacityFilter from 'components/filters/Opacity'

import SvgOverlay from 'ui/SvgOverlay'

import { getPlatformNamesZipped } from 'util/index'

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

  setFeaturedPlatforms = (featuredPlatforms: Platform[] | null) => {
    this.setState({
      featuredPlatforms,
    })
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

    const tooltipStrings = featuredPlatforms && getPlatformNamesZipped(featuredPlatforms)
    const topmostPlatform = featuredPlatforms && maxBy(featuredPlatforms, p => p.location.lat)
    const topmostPosition = topmostPlatform && platformsOnSVG.get(topmostPlatform)

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
          position={topmostPosition || null}
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
