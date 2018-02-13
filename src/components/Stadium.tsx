import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { Point } from 'leaflet'

const Root = styled.rect`
`

interface Props {
  center: Point,
  distance: number,
  radius: number,
  [prop: string]: any,
}

class Circle extends PureComponent<Props> {
  render() {
    const {
      center,
      distance,
      radius,
      onMouseOver,
      ...otherProps
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
        transform-origin={center}
        {...otherProps}
      />
    )
  }
}

export default Circle
