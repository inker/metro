import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { Point } from 'leaflet'

import PlatformReact from 'components/Platform'

import {
  Platform,
  Route,
} from '../network'

import getPlatformPositions from './utils/getPlatformPositions'

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
  getPlatformSlot: (platform: Platform) => Map<Route, number> | null,
  getFirstWhisker: (platform: Platform) => Point,
  getPlatformColor: (platform: Platform) => string,
  setFeaturedPlatforms: (platform: Platform[]) => void,
  unsetFeaturedPlatforms: () => void,
}

class Platforms extends PureComponent<Props> {
  private setFeaturedPlatforms = (platforms: Platform[]) => {
    const {
      isDetailed,
      setFeaturedPlatforms,
    } = this.props

    if (!isDetailed) {
      setFeaturedPlatforms(platforms)
      return
    }

    const platform = platforms[0]
    const { name } = platform
    const featuredPlatforms = platform.station.platforms.filter(p => p.name === name)
    setFeaturedPlatforms(featuredPlatforms)
  }

  private getPlatformPositions(platform: Platform) {
    const { props } = this
    return getPlatformPositions(
      platform,
      props.getPlatformPosition,
      props.getPlatformSlot,
      props.getFirstWhisker,
    )
  }

  private getDisplayedPlatforms() {
    const {
      platforms,
      isDetailed,
    } = this.props

    const map = new WeakMap<Platform, Platform[]>()

    if (isDetailed) {
      // show all platforms
      for (const p of platforms) {
        map.set(p, [p])
      }
    } else {
      const stations = Array.from(new Set(platforms.map(p => p.station)))
      for (const s of stations) {
        const names = new Set(s.platforms.map(p => p.name))
        for (const name of names) {
          const namesakes = s.platforms.filter(p => p.name === name)

          const firstEPlatform = namesakes.find(
            p => p.name === name && Array.from(p.passingLines()).some(l => l.startsWith('E')),
          )
          const platform = firstEPlatform || namesakes[0]
          if (!platform) {
            throw new Error('could not find platform, wtf')
          }

          map.set(platform, namesakes)
        }
      }
    }

    return map
  }

  render() {
    const {
      platforms,
      strokeWidth,
      circleRadius,
      dummyPlatforms,
      featuredPlatforms,
      getPlatformColor,
      unsetFeaturedPlatforms,
    } = this.props

    const displayedMap = this.getDisplayedPlatforms()
    const featuredSet = featuredPlatforms && new Set(featuredPlatforms)

    return (
      <PlatformCircles
        style={{
          strokeWidth: `${strokeWidth}px`,
        }}
      >
        {dummyPlatforms && platforms.map(platform => {
          const pos = this.getPlatformPositions(platform)
          const representedPlatforms = displayedMap.get(platform)
          const radius = representedPlatforms ? circleRadius : 0
          const isFeatured = !!featuredSet && featuredSet.has(platform)

          return (
            <PlatformReact
              key={platform.id}
              position={pos}
              radius={radius}
              color={getPlatformColor(platform)}
              isFeatured={isFeatured}
              platforms={representedPlatforms || []}
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
