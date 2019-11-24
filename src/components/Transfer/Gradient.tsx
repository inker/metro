import React, { memo } from 'react'

import { Point } from 'leaflet'

import memoizeObject from 'utils/memoizeObject'

const memoStop1Style = memoizeObject()
const memoStop2Style = memoizeObject()

interface Props {
  id: string,
  start: Point,
  end: Point,
  startColor: string,
  endColor: string,
  fullCircleRadius: number,
}

const Gradient = ({
  id,
  start,
  end,
  startColor,
  endColor,
  fullCircleRadius,
}: Props) => {
  const vector = end.subtract(start)

  const transferLength = start.distanceTo(end)
  const circlePortion = transferLength === 0 ? 0 : fullCircleRadius / transferLength

  return (
    <linearGradient
      id={id}
      gradientTransform={`rotate(${Math.atan2(vector.y, vector.x) * 180 / Math.PI}, 0.5, 0.5)`}
    >
      <stop
        style={memoStop1Style({
          stopColor: startColor,
        })}
        offset={circlePortion}
      />
      <stop
        style={memoStop2Style({
          stopColor: endColor,
        })}
        offset={1 - circlePortion}
      />
    </linearGradient>
  )
}

export default memo(Gradient)
