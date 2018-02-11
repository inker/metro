import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { Point } from 'leaflet'

const Circle = styled.circle`
  transform-origin: ${({ center }) => `${center.x}px ${center.y}px`};
`

interface Props {
  position: Point,
  radius: number,
}

class Platform extends PureComponent<Props> {
  render() {
    const {
      position,
      radius,
    } = this.props
    return (
      <Circle
        cx={position.x}
        cy={position.y}
        r={radius}
        center={position}
      />
    )
  }
}

export default Platform
