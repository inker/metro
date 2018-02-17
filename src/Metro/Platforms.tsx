import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { Point } from 'leaflet'

import PlatformReact from 'components/Platform'

import {
  unit,
  angle,
} from 'util/math/vector'

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
  setFeaturedPlatformsByPlatform: (platform: Platform) => void,
  unsetFeaturedPlatforms: () => void,
}

class Platforms extends PureComponent<Props> {
  render() {
    const {
      isDetailed,
      platforms,
      strokeWidth,
      circleRadius,
      dummyPlatforms,
      featuredPlatforms,
      getPlatformPosition,
      getPlatformOffset,
      getFirstWhisker,
      getPlatformColor,
      setFeaturedPlatformsByPlatform,
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
          const isFeatured = featuredPlatformsSet && featuredPlatformsSet.has(platform)
          const radius = isFeatured ? circleRadius * 1.25 : circleRadius

          const offsetsMap = getPlatformOffset(pos)
          const stadiumProps = {}
          if (offsetsMap) {
            const offsets = Array.from(offsetsMap).map(([k, v]) => v)
            const width = Math.max(...offsets) - Math.min(...offsets)

            const value = getFirstWhisker(platform)
            stadiumProps.width = width
            stadiumProps.rotation = angle(value.subtract(pos), unit)
          }

          return (
            <PlatformReact
              key={platform.id}
              position={pos}
              radius={radius}
              {...stadiumProps}
              color={isDetailed ? getPlatformColor(platform) : undefined}
              platform={platform}
              dummyParent={dummyPlatforms}
              onMouseOver={setFeaturedPlatformsByPlatform}
              onMouseOut={unsetFeaturedPlatforms}
            />
          )
        })}
      </PlatformCircles>
    )
  }
}

export default Platforms
