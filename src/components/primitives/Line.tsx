import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { Point } from 'leaflet'

const Root = styled.line`
`

interface Props {
  start: Point,
  end: Point,
  [prop: string]: any,
}

class Circle extends PureComponent<Props> {
  render() {
    const {
      start,
      end,
      ...otherProps
    } = this.props

    return (
      <Root
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        {...otherProps}
      />
    )
  }
}

export default Circle
