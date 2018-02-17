import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { Point } from 'leaflet'
import { difference, uniq } from 'lodash'

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
  transferWidth: number,
  transferBorder: number,
  fullCircleRadius: number,
  transfersInnerWrapper: SVGGElement,
  dummyTransfers: SVGGElement,
  defs: SVGDefsElement,
  getPlatformPosition: (platform: Platform) => Point,
  getPlatformColor: (platform: Platform) => string,
  setFeaturedPlatforms: (platforms: Platform[]) => void,
  unsetFeaturedPlatforms: () => void,
}

class Transfers extends PureComponent<Props> {
  state = {
    transfersInner: null,
  }

  private mountInner = (g: SVGGElement) => {
    this.setState({
      transfersInner: g,
    })
  }

  private setFeaturedPlatforms = (transfer: Transfer) => {
    const { source, target } = transfer
    const sourceName = source.name
    const targetName = target.name
    const sourceFeaturedPlatforms = source.station.platforms.filter(p => p.name === sourceName)
    const targetFeaturedPlatforms = target.station.platforms.filter(p => p.name === targetName)
    const featuredPlatforms = uniq([...sourceFeaturedPlatforms, ...targetFeaturedPlatforms])
    this.props.setFeaturedPlatforms(featuredPlatforms)
  }

  render() {
    const {
      transfers,
      isDetailed,
      stationCircumpoints,
      featuredPlatforms,
      transferWidth,
      transferBorder,
      fullCircleRadius,
      transfersInnerWrapper,
      dummyTransfers,
      defs,
      getPlatformPosition,
      getPlatformColor,
      unsetFeaturedPlatforms,
    } = this.props

    const {
      transfersInner,
    } = this.state

    const outerStrokeWidth = transferWidth + transferBorder / 2
    const innerStrokeWidth = transferWidth - transferBorder / 2

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
                onMouseOver={this.setFeaturedPlatforms}
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
