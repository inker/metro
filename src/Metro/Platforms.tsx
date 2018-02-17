import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { Point } from 'leaflet'

import PlatformReact from 'components/Platform'

import {
  Platform,
} from '../network'

import getPlatformPositions from './getPlatformPositions'

const PlatformCircles = styled.g`
  fill: white;
  stroke: black;
`

interface Props {
  platforms: Platform[],
  isDetailed: boolean,
  strokeWidth: number,
  circleRadius: number,
  dummyPlatforms: SVGGElement,
  featuredPlatforms: Platform[] | null,
  getPlatformPosition: (platform: Platform) => Point,
  getPlatformOffset: (position: Point) => Map<any, number> | null,
  getFirstWhisker: (platform: Platform) => Point,
  getPlatformColor: (platform: Platform) => string,
  setFeaturedPlatforms: (platform: Platform[]) => void,
  unsetFeaturedPlatforms: () => void,
}

class Platforms extends PureComponent<Props> {
  private setFeaturedPlatforms = (platform: Platform) => {
    const { name } = platform
    const featuredPlatforms = platform.station.platforms.filter(p => p.name === name)
    this.props.setFeaturedPlatforms(featuredPlatforms)
  }

  private getPlatformPositions(platform: Platform) {
    const { props } = this
    return getPlatformPositions(
      platform,
      props.getPlatformPosition,
      props.getPlatformOffset,
      props.getFirstWhisker,
    )
  }

  render() {
    const {
      isDetailed,
      platforms,
      strokeWidth,
      circleRadius,
      dummyPlatforms,
      featuredPlatforms,
      getPlatformColor,
      unsetFeaturedPlatforms,
    } = this.props

    const featuredPlatformsSet = featuredPlatforms && new Set(featuredPlatforms)

    return (
      <PlatformCircles
        style={{
          strokeWidth: `${strokeWidth}px`,
        }}
      >
        {dummyPlatforms && platforms.map(platform => {
          const pos = this.getPlatformPositions(platform)
          const isFeatured = !!featuredPlatformsSet && featuredPlatformsSet.has(platform)

          return (
            <PlatformReact
              key={platform.id}
              position={pos}
              radius={circleRadius}
              color={isDetailed ? getPlatformColor(platform) : undefined}
              isFeatured={isFeatured}
              platform={platform}
              dummyParent={dummyPlatforms}
              onMouseOver={this.setFeaturedPlatforms}
              onMouseOut={unsetFeaturedPlatforms}
            />
          )
        })}
      </PlatformCircles>
    )
  }
}

export default Platforms
