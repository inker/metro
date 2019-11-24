import React, {
  memo,
  useCallback,
  useMemo,
} from 'react'
import styled from 'styled-components'
import { Point } from 'leaflet'

import memoizeObject from 'utils/memoizeObject'

import PlatformReact from 'components/Platform'

import {
  Platform,
} from '../network'

const PlatformCircles = styled.g`
  fill: white;
  stroke: black;
`

const emptyArray = [] as const

const memoPlatformCirclesStyle = memoizeObject()

const platformHasELines = (platform: Platform) =>
  Array.from(platform.passingLines()).some(l => l.startsWith('E'))

function getDisplayedPlatforms(platforms: Platform[], isDetailed: boolean) {
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

        const firstEPlatform = namesakes.find(platformHasELines)
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

function getFeatured(platforms: Platform[]) {
  const platform = platforms[0]
  const { name } = platform
  return platform.station.platforms.filter(p => p.name === name)
}

interface Props {
  platforms: Platform[],
  isDetailed: boolean,
  strokeWidth: number,
  circleRadius: number,
  dummyPlatforms: SVGGElement,
  featuredPlatforms: Platform[] | null,
  getPlatformSlotPoints: (platform: Platform) => Point | Point[],
  getPlatformColor: (platform: Platform) => string,
  setFeaturedPlatforms: (platform: Platform[]) => void,
  unsetFeaturedPlatforms: () => void,
}

const Platforms = ({
  platforms,
  isDetailed,
  strokeWidth,
  circleRadius,
  dummyPlatforms,
  featuredPlatforms,
  getPlatformSlotPoints,
  getPlatformColor,
  setFeaturedPlatforms,
  unsetFeaturedPlatforms,
}: Props) => {
  const displayedMap = useMemo(
    () => getDisplayedPlatforms(platforms, isDetailed),
    [platforms, isDetailed],
  )
  const featuredSet = featuredPlatforms && new Set(featuredPlatforms)

  const setFeaturedPlatformsCb = useCallback((pls: Platform[]) => {
    const featureds = isDetailed ? getFeatured(pls) : pls
    setFeaturedPlatforms(featureds)
  }, [isDetailed, setFeaturedPlatforms])

  return (
    <PlatformCircles
      style={memoPlatformCirclesStyle({
        strokeWidth: `${strokeWidth}px`,
      })}
    >
      {dummyPlatforms && platforms.map(platform => {
        const slotPoints = getPlatformSlotPoints(platform)
        const representedPlatforms = displayedMap.get(platform)
        const radius = representedPlatforms ? circleRadius : 0
        const isFeatured = featuredSet?.has(platform)

        return (
          <PlatformReact
            key={platform.id}
            position={slotPoints}
            radius={radius}
            color={getPlatformColor(platform)}
            isFeatured={isFeatured}
            platforms={representedPlatforms ?? emptyArray}
            dummyParent={dummyPlatforms}
            onMouseOver={setFeaturedPlatformsCb}
            onMouseOut={unsetFeaturedPlatforms}
          />
        )
      })}
    </PlatformCircles>
  )
}

export default memo(Platforms)
