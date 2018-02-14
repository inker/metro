import React, { PureComponent } from 'react'

import Platform from '../network/Platform'
import Station from '../network/Station'

import {
  tryGetFromMap,
} from '../util/collections'

import Modal from './Modal'
import PlatformReact from './Platform'
import Circle from './Circle'

interface Props {
  isDetailed: boolean,
  platformsOnSVG: WeakMap<Platform, L.Point>,
  station: Station,
  radius: number,
  dummyParent?: Element | null,
  getPlatformColor: (platform: Platform) => string,
  onMouseOver?: (platform: Platform) => void,
  onMouseOut?: () => void,
}

class StationReact extends PureComponent<Props> {
  onFoo = (e) => {
    const { station, onMouseOver } = this.props
    if (!onMouseOver) {
      return
    }
    const { id } = e.target.dataset
    const platform = station.platforms.find(p => p.id === id)
    if (!platform) {
      throw new Error(`no platform with id=${id} found`)
    }
    onMouseOver(platform)
  }

  render() {
    const {
      isDetailed,
      platformsOnSVG,
      station,
      radius,
      dummyParent,
      getPlatformColor,
      onMouseOver,
      onMouseOut,
    } = this.props

    return (
      <>
        {station.platforms.map(platform => {
          const pos = tryGetFromMap(platformsOnSVG, platform)
          return (
              <>
                <PlatformReact
                  key={platform.id}
                  position={pos}
                  radius={radius}
                  color={isDetailed ? getPlatformColor(platform) : undefined}
                />
                {dummyParent &&
                  <Modal
                    tagName="g"
                    modalRoot={dummyParent}
                  >
                    <Circle
                      key={platform.id}
                      data-id={platform.id}
                      center={pos}
                      radius={radius * 2}
                      onMouseOver={this.onFoo}
                      onMouseOut={onMouseOut}
                    />
                  </Modal>
                }
              </>
            )
          })}
      </>
    )
  }
}

export default StationReact
