import React, { PureComponent } from 'react'
import { Point } from 'leaflet'

import Circle from './Circle'

interface Props {
  position: Point,
  radius: number,
}

class PlatformReact extends PureComponent<Props> {
  render() {
    const {
      position,
      radius,
    } = this.props

    return (
      <Circle
        center={position}
        radius={radius}
      />
    )
  }
}

export default PlatformReact
