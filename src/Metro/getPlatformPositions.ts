import { memoize } from 'lodash'
import { Point } from 'leaflet'

import {
  orthogonal,
  normalize,
} from 'util/math/vector'

import Platform from 'network/Platform'

function getPositions(pos, value, minOffset, maxOffset) {
  const ortho = normalize(orthogonal(value.subtract(pos))[0])
  return [
    ortho.multiplyBy(minOffset).add(pos),
    ortho.multiplyBy(maxOffset).add(pos),
  ]
}

const getPositionsMemoized = memoize(
  getPositions,
  (pos, value, minOffset, maxOffset) => `${pos.x};${pos.y};${value.x};${value.y};${minOffset};${maxOffset}`,
)

export default (
  platform: Platform,
  getPlatformPosition: (platform: Platform) => Point,
  getPlatformOffset: (platform: Platform) => Map<any, number> | null,
  getFirstWhisker: (platform: Platform) => Point,
) => {
  const pos = getPlatformPosition(platform)
  const offsetsMap = getPlatformOffset(platform)
  if (!offsetsMap) {
    return pos
  }

  const offsets = Array.from(offsetsMap).map(([k, v]) => v)
  const value = getFirstWhisker(platform)
  if (pos === value) {
    // TODO WTF
    return pos
  }
  const minOffset = Math.min(...offsets)
  const maxOffset = Math.max(...offsets)
  return getPositionsMemoized(pos, value, minOffset, maxOffset)
}
