import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { Point } from 'leaflet'

import PlatformReact from 'components/Platform'

import {
  unit,
  angle,
} from 'utils/math/vector'

import {
  Platform,
} from '../network'

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

  private getStadiumProps(platform: Platform) {
    const { props } = this
    const pos = props.getPlatformPosition(platform)
    const offsetsMap = props.getPlatformOffset(pos)
    if (!offsetsMap) {
      return null
    }

    const offsets = Array.from(offsetsMap).map(([k, v]) => v)
    const value = props.getFirstWhisker(platform)

    return {
      width: Math.max(...offsets) - Math.min(...offsets),
      rotation: angle(value.subtract(pos), unit),
    }
  }

  render() {
    const {
      isDetailed,
      platforms,
      strokeWidth,
      circleRadius,
      dummyPlatforms,
      featuredPlatforms,
      getPlatformPosition,
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
          const pos = getPlatformPosition(platform)
          const isFeatured = !!featuredPlatformsSet && featuredPlatformsSet.has(platform)
          const stadiumProps = this.getStadiumProps(platform)

          return (
            <PlatformReact
              key={platform.id}
              position={pos}
              radius={circleRadius}
              {...stadiumProps}
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
