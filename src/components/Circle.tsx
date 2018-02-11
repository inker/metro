import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { Point } from 'leaflet'

const Root = styled.circle`
  transform-origin: ${({ transformOrigin }) => `${transformOrigin.x}px ${transformOrigin.y}px`};
`

interface Props {
  center: Point,
  radius: number,
  onMouseOver?: (e?: React.MouseEvent<SVGCircleElement>) => void,
}

class Circle extends PureComponent<Props> {
  render() {
    const {
      center,
      radius,
      onMouseOver,
    } = this.props

    return (
      <Root
        cx={center.x}
        cy={center.y}
        r={radius}
        transformOrigin={center}
        onMouseOver={onMouseOver}
      />
    )
  }
}

export default Circle
