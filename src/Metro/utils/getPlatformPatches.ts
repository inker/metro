import {
  xor,
} from 'lodash'

import Platform from 'network/Platform'

function walk(platform: Platform, patches: Set<Platform>): Set<Platform> {
  patches.add(platform)
  const passingRoutes = Array.from(platform.passingRoutes())
  const neighbors = platform.adjacentPlatformsBySpans()
  for (const p of neighbors) {
    if (patches.has(p) || xor(passingRoutes, Array.from(p.passingRoutes())).length !== 0) {
      continue
    }
    walk(p, patches)
  }
  return patches
}

const getCloud = (platform: Platform) => walk(platform, new Set())

/**
 * patches of platforms with the same routes (exactly)
 */
export default (platforms: Platform[]): Platform[][] => {
  const remainingPlatforms = new Set(platforms)
  const patches: Platform[][] = []
  for (const platform of platforms) {
    if (!remainingPlatforms.has(platform)) {
      continue
    }
    const patch = Array.from(getCloud(platform))
    for (const p of patch) {
      remainingPlatforms.delete(p)
    }
    patches.push(patch)
  }
  return patches
}
