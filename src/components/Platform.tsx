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
      platform,
      dummyParent,
      onMouseOut,
    } = this.props

    const El = width ? Stadium : Circle
    const rotationDeg = rotation && rotation * 180 / Math.PI

    return (
      <>
        <El
          center={position}
          radius={radius}
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
              radius={radius * 2}
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
