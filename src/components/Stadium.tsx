import React, { PureComponent } from 'react'
import { Point } from 'leaflet'

interface Props {
  center: Point,
  distance: number,
  radius: number,
  [prop: string]: any,
}

class Stadium extends PureComponent<Props> {
  render() {
    const {
      center,
      distance,
      radius,
      ...otherProps
    } = this.props

    const diameter = radius * 2

    return (
      <rect
        x={center.x - distance * 0.5 - radius}
        y={center.y - radius}
        width={distance + diameter}
        height={diameter}
        rx={radius}
        ry={radius}
        transform-origin={`${center.x}px ${center.y}px`}
        {...otherProps}
      />
    )
  }
}

export default Stadium
