import { memoize } from 'lodash'
import { Point } from 'leaflet'

import {
  orthogonal,
  normalize,
} from 'util/math/vector'

import Platform from 'network/Platform'
import Route from 'network/Route'

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
  getPlatformSlot: (platform: Platform) => Map<Route, number> | null,
  getFirstWhisker: (platform: Platform) => Point,
) => {
  const pos = getPlatformPosition(platform)
  const slotsMap = getPlatformSlot(platform)
  if (!slotsMap) {
    return pos
  }

  const slots = Array.from(slotsMap).map(([k, v]) => v)
  const value = getFirstWhisker(platform)
  if (pos.equals(value)) {
    // TODO WTF
    return pos
  }
  const minSlot = Math.min(...slots)
  const maxSlot = Math.max(...slots)
  return getPositionsMemoized(pos, value, minSlot, maxSlot)
}
