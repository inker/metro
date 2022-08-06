import React, { memo } from 'react'
import { Point } from 'leaflet'

interface Props extends React.SVGProps<SVGCircleElement> {
  center: Point,
  radius: number,
  [prop: string]: any,
}

const Circle = ({
  center,
  radius,
  ...otherProps
}: Props) => (
  <circle
    cx={center.x}
    cy={center.y}
    r={radius}
    transform-origin={center}
    {...otherProps}
  />
)

export default memo(Circle)
