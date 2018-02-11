import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { Point } from 'leaflet'

import Platform from '../network/Platform'

import Circle from './Circle'

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
      platform,
      onMouseOver,
    } = this.props

    

    return (
      <Circle
        center={position}
        radius={radius}
        onMouseOver={e => onMouseOver && onMouseOver(platform)}
      />
    )
  }
}

export default PlatformReact
