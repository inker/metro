import React, { memo } from 'react'
import styled from 'styled-components'
import { Point } from 'leaflet'

import { getCircumcenter } from 'utils/math'
import { dot, det } from 'utils/math/vector'

interface ArcArgs {
  radius: number,
  large?: number,
  clockwise?: number,
}

const Root = styled.path`
`

function getArgs(a: Point, b: Point, controlPoint: Point): ArcArgs {
  const center = getCircumcenter([a, b, controlPoint])
  if (center === null) {
    return {
      radius: Infinity,
    }
  }
  const A = a.subtract(controlPoint)
  const B = b.subtract(controlPoint)
  const thirdIsBetween = dot(A, B) < 0
  const u = a.subtract(center)
  const v = b.subtract(center)
  // the distance is shorter when moving from start to end clockwise
  const isClockwise = det(u, v) >= 0
  return {
    radius: center.distanceTo(a),
    large: thirdIsBetween ? 1 : 0,
    clockwise: isClockwise && !thirdIsBetween || thirdIsBetween && !isClockwise ? 1 : 0,
  }
}

interface Props extends React.SVGProps<SVGPathElement> {
  a: Point,
  b: Point,
  third: Point,
  [prop: string]: any,
}

const Arc = ({
  a: start,
  b: end,
  third,
  ...otherProps
}: Props) => {
  const {
    radius,
    large,
    clockwise,
  } = getArgs(start, end, third)

  const d = [
    'M', start.x, start.y,
    ...(radius === Infinity ? ['L'] : ['A', radius, radius, 0, large, clockwise]),
    end.x, end.y,
  ].join(' ')

  return (
    <Root
      d={d}
      {...otherProps}
    />
  )
}

export default memo(Arc)
