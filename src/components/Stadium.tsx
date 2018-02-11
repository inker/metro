import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { Point } from 'leaflet'

const Root = styled.rect`
  transform-origin: ${({ transformOrigin }) => `${transformOrigin.x}px ${transformOrigin.y}px`};
`

interface Props {
  center: Point,
  distance: number,
  radius: number,
  onMouseOver?: (e?: React.MouseEvent<SVGRectElement>) => void,
}

class Circle extends PureComponent<Props> {
  render() {
    const {
      center,
      distance,
      radius,
      onMouseOver,
    } = this.props

    const diameter = radius * 2

    return (
      <Root
        x={center.x - distance * 0.5 - radius}
        y={center.y - radius}
        width={distance + diameter}
        height={diameter}
        rx={radius}
        ry={radius}
        transformOrigin={position}
        onMouseOver={onMouseOver}
      />
    )
  }
}

export default Circle
