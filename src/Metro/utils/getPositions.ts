import { memoize } from 'lodash'

import {
  orthogonal,
  normalize,
} from 'util/math/vector'

function getPositions(pos, value, minOffset, maxOffset) {
  const ortho = normalize(orthogonal(value.subtract(pos))[0])
  return [
    ortho.multiplyBy(minOffset).add(pos),
    ortho.multiplyBy(maxOffset).add(pos),
  ]
}

export default memoize(
  getPositions,
  (pos, value, minOffset, maxOffset) => `${pos.x};${pos.y};${value.x};${value.y};${minOffset};${maxOffset}`,
)
