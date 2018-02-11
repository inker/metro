import React, { PureComponent } from 'react'

import Platform from '../network/Platform'
import Station from '../network/Station'

import {
  tryGetFromMap,
} from '../util/collections'

import Modal from './Modal'
import PlatformReact from './Platform'

interface Props {
  platformsOnSVG: WeakMap<Platform, L.Point>,
  station: Station,
  radius: number,
  dummyParent?: Element | null,
}

class StationReact extends PureComponent<Props> {
  render() {
    const {
      platformsOnSVG,
      station,
      radius,
      dummyParent,
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
                  <Modal modalRoot={dummyParent}>
                    <PlatformReact
                      key={platform.id}
                      position={pos}
                      radius={radius}
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
