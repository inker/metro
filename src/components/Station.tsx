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
  platformsOnSVG: WeakMap<Platform, L.Point>,
  station: Station,
  radius: number,
  dummyParent?: Element | null,
  onMouseOver?: (platform: Platform) => void,
}

class StationReact extends PureComponent<Props> {
  render() {
    const {
      platformsOnSVG,
      station,
      radius,
      dummyParent,
      onMouseOver,
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
                />
                {dummyParent &&
                  <Modal
                    tagName="g"
                    modalRoot={dummyParent}
                  >
                    <Circle
                      key={platform.id}
                      center={pos}
                      radius={radius * 2}
                      onMouseOver={e => onMouseOver(platform)}
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
