import React, { memo } from 'react'
import { Point } from 'leaflet'

interface Props extends React.SVGProps<SVGRectElement> {
  c1: Point,
  c2: Point,
  radius: number,
  [prop: string]: any,
}

const Stadium = ({
  c1,
  c2,
  radius,
  ...otherProps
}: Props) => {
  const diameter = radius * 2

  const center = c1.add(c2).divideBy(2)
  const distance = c1.distanceTo(c2)

  const vec = c2.subtract(c1)
  const rotation = Math.atan2(vec.y, vec.x)
  const rotationDeg = rotation * 180 / Math.PI

  return (
    <rect
      // x={center.x - radius - distance / 2}
      // y={center.y - radius}
      x={-radius - distance / 2}
      y={-radius}
      width={distance + diameter}
      height={diameter}
      rx={radius}
      ry={radius}
      // transform-origin={`${center.x} ${center.y}`}
      // transform={`rotate(${rotationDeg})`}
      transform={`translate(${center.x} ${center.y}) rotate(${rotationDeg})`}
      {...otherProps}
    />
  )
}

export default memo(Stadium)
