import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { Point } from 'leaflet'
import { difference } from 'lodash'

import Modal from 'components/Modal'
import TransferReact from 'components/Transfer'

import {
  Platform,
  Station,
  Transfer,
} from '../network'

const Paths = styled.g`
  fill: none;
`

const Inner = styled(Paths)`
`

const Outer = styled(Paths)`
`

const TransfersOuter = styled(Outer)`
  stroke: #404040;
  stroke-width: ${props => props.strokeWidth};
`

const TransfersInner = styled(Inner)`
  stroke: #FFFFFF;
  stroke-width: ${props => props.strokeWidth};
`

interface Props {
  transfers: Transfer[],
  isDetailed: boolean,
  stationCircumpoints: Map<Station, Platform[]>,
  featuredPlatforms: Platform[] | null,
  outerStrokeWidth: number,
  innerStrokeWidth: number,
  fullCircleRadius: number,
  transfersInnerWrapper: SVGGElement,
  dummyTransfers: SVGGElement,
  defs: SVGDefsElement,
  getPlatformPosition: (platform: Platform) => Point,
  getPlatformColor: (platform: Platform) => string,
  setFeaturedPlatformsByTransfer: (transfer: Transfer) => void,
  unsetFeaturedPlatforms: () => void,
}

class Transfers extends PureComponent<Props> {
  state = {
    transfersInner: null,
  }

  mountInner = (g: SVGGElement) => {
    this.setState({
      transfersInner: g,
    })
  }

  render() {
    const {
      transfers,
      isDetailed,
      stationCircumpoints,
      featuredPlatforms,
      outerStrokeWidth,
      innerStrokeWidth,
      fullCircleRadius,
      transfersInnerWrapper,
      dummyTransfers,
      defs,
      getPlatformPosition,
      getPlatformColor,
      setFeaturedPlatformsByTransfer,
      unsetFeaturedPlatforms,
    } = this.props

    const {
      transfersInner,
    } = this.state

    const featuredPlatformsSet = featuredPlatforms && new Set(featuredPlatforms)

    return (
      <>
        <TransfersOuter
          style={{
            display: isDetailed ? '' : 'none',
            strokeWidth: `${outerStrokeWidth}px`,
          }}
        >
          {transfersInner && dummyTransfers && defs && transfers.map(transfer => {
            const { source, target } = transfer
            const scp = stationCircumpoints.get(source.station)
            const includes = scp && scp.includes(source) && scp.includes(target)
            const third = includes && difference(scp, [transfer.source, transfer.target])[0] || undefined
            const thirdPosition = third && getPlatformPosition(third)

            const isFeatured = featuredPlatformsSet
              && featuredPlatformsSet.has(source)
              && featuredPlatformsSet.has(target)

            return (
              <TransferReact
                key={transfer.id}
                start={getPlatformPosition(source)}
                end={getPlatformPosition(target)}
                third={thirdPosition}
                transfer={transfer}
                fullCircleRadius={fullCircleRadius}
                strokeWidth={isFeatured ? outerStrokeWidth * 1.25 : undefined}
                defs={defs}
                innerParent={transfersInner}
                dummyParent={dummyTransfers}
                getPlatformColor={getPlatformColor}
                onMouseOver={setFeaturedPlatformsByTransfer}
                onMouseOut={unsetFeaturedPlatforms}
              />
            )
          })}
        </TransfersOuter>
        <Modal
          tagName="g"
          modalRoot={transfersInnerWrapper}
        >
          <TransfersInner
            innerRef={this.mountInner}
            style={{
              display: isDetailed ? '' : 'none',
              strokeWidth: `${innerStrokeWidth}px`,
            }}
          />
        </Modal>
      </>
    )
  }
}

export default Transfers
