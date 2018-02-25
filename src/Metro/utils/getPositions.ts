import { Point } from 'leaflet'
import { memoize } from 'lodash'

import {
  orthogonal,
  normalize,
} from 'util/math/vector'

function getPositions(pos: Point, value: Point, minOffset: number, maxOffset: number) {
  const vec = value.subtract(pos)
  const ortho = orthogonal(vec)[0]
  const normal = normalize(ortho)
  return [
    normal.multiplyBy(minOffset).add(pos),
    normal.multiplyBy(maxOffset).add(pos),
  ]
}

export default memoize(
  getPositions,
  (pos, value, minOffset, maxOffset) => `${pos.x};${pos.y};${value.x};${value.y};${minOffset};${maxOffset}`,
)
