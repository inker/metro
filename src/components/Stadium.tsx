import React, { Component } from 'react'
import { Point } from 'leaflet'

interface Props extends React.SVGProps<SVGRectElement> {
  c1: Point,
  c2: Point,
  radius: number,
  [prop: string]: any,
}

class Stadium extends Component<Props> {
  render() {
    const {
      c1,
      c2,
      radius,
      ...otherProps
    } = this.props

    const diameter = radius * 2

    const center = c1.add(c2).divideBy(2)
    const distance = c1.distanceTo(c2)

    const vec = c2.subtract(c1)
    const rotation = Math.atan2(vec.y, vec.x)
    const rotationDeg = rotation * 180 / Math.PI

    return (
      <rect
        x={center.x - distance * 0.5 - radius}
        y={center.y - radius}
        width={distance + diameter}
        height={diameter}
        rx={radius}
        ry={radius}
        transform-origin={`${center.x}px ${center.y}px`}
        transform={`rotate(${rotationDeg})`}
        {...otherProps}
      />
    )
  }
}

export default Stadium
