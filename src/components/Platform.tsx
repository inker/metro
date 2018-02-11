import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { Point } from 'leaflet'

import Platform from '../network/Platform'

const Circle = styled.circle`
  transform-origin: ${({ center }) => `${center.x}px ${center.y}px`};
`

interface Props {
  position: Point,
  radius: number,
  platform?: Platform,
  onMouseOver?: (platform?: Platform) => void,
}

class PlatformReact extends PureComponent<Props> {
  onMouseOver = (e: React.MouseEvent<SVGCircleElement>) => {
    const {
      platform,
      onMouseOver,
    } = this.props
    if (onMouseOver) {
      onMouseOver(platform)
    }
  }

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
        onMouseOver={this.onMouseOver}
      />
    )
  }
}

export default PlatformReact
