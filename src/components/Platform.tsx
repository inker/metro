import React, { Component } from 'react'
import { Point } from 'leaflet'

import Platform from 'network/Platform'

import comparisonLevel from 'util/comparisonLevel'

import Circle from './primitives/Circle'
import Stadium from './primitives/Stadium'

import Modal from './Modal'

interface Props {
  position: Point | Point[],
  radius: number,
  color?: string,
  isFeatured?: boolean,
  platforms: Platform[], // platforms it represents
  dummyParent: Element | null,
  onMouseOver?: (platforms: Platform[]) => void,
  onMouseOut?: () => void,
}

@comparisonLevel(2)
class PlatformReact extends Component<Props> {
  private onMouseOver = () => {
    const { platforms, onMouseOver } = this.props
    if (!onMouseOver) {
      return
    }
    onMouseOver(platforms)
  }

  private getPlatformElement = (props) => {
    const { position } = this.props
    return Array.isArray(position) ? (
      <Stadium
        {...props}
        c1={position[0]}
        c2={position[1]}
      />
    ) : (
      <Circle
        {...props}
        center={position}
      />
    )
  }

  render() {
    const {
      platforms,
      radius,
      color,
      isFeatured,
      dummyParent,
      onMouseOut,
    } = this.props

    const El = this.getPlatformElement
    const realRadius = isFeatured ? radius * 1.25 : radius
    const dummyRadius = radius * 2

    return (
      <>
        <El
          radius={realRadius}
          stroke={color}
          display={platforms.every(p => p.type === 'dummy') ? 'none' : undefined}
        />
        {dummyParent &&
          <Modal
            tagName="g"
            modalRoot={dummyParent}
          >
            <El
              radius={dummyRadius}
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
