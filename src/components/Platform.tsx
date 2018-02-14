import React, { PureComponent } from 'react'
import { Point } from 'leaflet'

import Circle from './Circle'

interface Props {
  position: Point,
  radius: number,
  color?: string,
}

class PlatformReact extends PureComponent<Props> {
  render() {
    const {
      position,
      radius,
      color,
    } = this.props

    return (
      <Circle
        center={position}
        radius={radius}
        stroke={color}
      />
    )
  }
}

export default PlatformReact
