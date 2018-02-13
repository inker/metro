import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { Point } from 'leaflet'

const Root = styled.circle`
`

interface Props {
  center: Point,
  radius: number,
  [prop: string]: any,
}

class Circle extends PureComponent<Props> {
  render() {
    const {
      id,
      center,
      radius,
      ...otherProps
    } = this.props

    return (
      <Root
        cx={center.x}
        cy={center.y}
        r={radius}
        transform-origin={center}
        {...otherProps}
      />
    )
  }
}

export default Circle
