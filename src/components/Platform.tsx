import React, { PureComponent } from 'react'
import { Point } from 'leaflet'

import Platform from 'network/Platform'

import Modal from './Modal'
import Circle from './Circle'

interface Props {
  position: Point,
  radius: number,
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
      platform,
      dummyParent,
      onMouseOut,
    } = this.props

    return (
      <>
        <Circle
          center={position}
          radius={radius}
          stroke={color}
        />
        {dummyParent &&
          <Modal
            tagName="g"
            modalRoot={dummyParent}
          >
            <Circle
              key={platform.id}
              data-id={platform.id}
              center={position}
              radius={radius * 2}
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
