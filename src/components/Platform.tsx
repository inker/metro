import React, { PureComponent } from 'react'
import { Point } from 'leaflet'

import Platform from 'network/Platform'

import Modal from './Modal'
import Circle from './Circle'
import Stadium from './Stadium'

interface Props {
  position: Point,
  radius: number,
  width?: number, // distance between centers, 0 for circle
  rotation?: number,
  color?: string,
  isFeatured?: boolean,
  platform: Platform,
  dummyParent: Element | null,
  onMouseOver?: (platform: Platform) => void,
  onMouseOut?: () => void,
}

class PlatformReact extends PureComponent<Props> {
  onMouseOver = (e) => {
    const { platform, onMouseOver } = this.props
    if (!onMouseOver) {
      return
    }
    onMouseOver(platform)
  }

  render() {
    const {
      position,
      radius,
      color,
      width,
      rotation,
      isFeatured,
      platform,
      dummyParent,
      onMouseOut,
    } = this.props

    const El = width ? Stadium : Circle
    const rotationDeg = rotation && rotation * 180 / Math.PI
    const realRadius = isFeatured ? radius * 1.25 : radius
    const dummyRadius = radius * 2

    return (
      <>
        <El
          center={position}
          radius={realRadius}
          distance={width}
          transform={rotationDeg && `rotate(${rotationDeg})`}
          stroke={color}
        />
        {dummyParent &&
          <Modal
            tagName="g"
            modalRoot={dummyParent}
          >
            <El
              key={platform.id}
              data-id={platform.id}
              center={position}
              radius={dummyRadius}
              distance={width}
              transform={rotationDeg && `rotate(${rotationDeg})`}
              onMouseOver={this.onMouseOver}
              onMouseOut={onMouseOut}
            />
          </Modal>
        }
      </>
    )
  }
}

export default PlatformReact
