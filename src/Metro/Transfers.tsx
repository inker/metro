import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { Point } from 'leaflet'
import {
  castArray,
  difference,
  uniq,
  minBy,
} from 'lodash'

import Modal from 'components/Modal'
import TransferReact from 'components/Transfer'

import { getCircumcenter } from 'utils/math'

import {
  Platform,
  Station,
  Transfer,
} from '../network'

import cartesian from './utils/cartesian'

const Paths = styled.g`
  fill: none;
`

const Inner = styled(Paths)`
`

const Outer = styled(Paths)`
`

const TransfersOuter = styled(Outer)`
  stroke: #404040;
`

const TransfersInner = styled(Inner)`
  stroke: #FFFFFF;
`

function bestPair(sourcePositionArr: Point[], targetPositionArr: Point[]) {
  const combos = cartesian(sourcePositionArr, targetPositionArr) as Point[][]
  return minBy(combos, ([p1, p2]) => p1.distanceTo(p2))
}

function bestTriplet(sourcePositionArr: Point[], targetPositionArr: Point[], thirdPos: Point) {
  const thirdPositions = [thirdPos]
  const combos = cartesian(sourcePositionArr, targetPositionArr, thirdPositions) as Point[][]
  return minBy(combos, combo => {
    const c = getCircumcenter(combo)
    return c ? c.distanceTo(combo[0]) : Infinity
  })
}

interface Props {
  transfers: Transfer[],
  isDetailed: boolean,
  stationCircumpoints: WeakMap<Station, Platform[]>,
  featuredPlatforms: Platform[] | null,
  transferWidth: number,
  transferBorder: number,
  fullCircleRadius: number,
  transfersInnerWrapper: SVGGElement,
  dummyTransfers: SVGGElement,
  defs: SVGDefsElement,
  getPlatformPosition: (platform: Platform) => Point,
  getPlatformPositions: (platform: Platform) => Point | Point[],
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

  private getThirdPosition(transfer: Transfer) {
    const {
      stationCircumpoints,
      getPlatformPosition,
    } = this.props

    const { source, target } = transfer
    const scp = stationCircumpoints.get(source.station)
    const includes = scp && scp.includes(source) && scp.includes(target)
    if (!includes) {
      return null
    }
    const third = difference(scp, [source, target])[0] || undefined
    return getPlatformPosition(third)
  }

  private getPositions(transfer: Transfer) {
    const { getPlatformPositions } = this.props
    const { source, target } = transfer
    const sourcePos = getPlatformPositions(source)
    const targetPos = getPlatformPositions(target)
    const thirdPos = this.getThirdPosition(transfer)

    if (!Array.isArray(sourcePos) && !Array.isArray(targetPos)) {
      return [sourcePos, targetPos, thirdPos]
    }

    const sourcePositionArr = castArray(sourcePos)
    const targetPositionArr = castArray(targetPos)
    const bestCombo = thirdPos
      ? bestTriplet(sourcePositionArr, targetPositionArr, thirdPos)
      : bestPair(sourcePositionArr, targetPositionArr)

    if (!bestCombo) {
      throw new Error('somehow best combo sucks')
    }
    return bestCombo
  }

  render() {
    const {
      transfers,
      isDetailed,
      featuredPlatforms,
      transferWidth,
      transferBorder,
      fullCircleRadius,
      transfersInnerWrapper,
      dummyTransfers,
      defs,
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
            const [
              sourcePos,
              targetPos,
              thirdPos,
            ] = this.getPositions(transfer) as [Point, Point, Point | undefined]
            const { source, target } = transfer

            const isFeatured = featuredPlatformsSet
              && featuredPlatformsSet.has(source)
              && featuredPlatformsSet.has(target)

            return (
              <TransferReact
                key={transfer.id}
                start={sourcePos}
                end={targetPos}
                third={thirdPos}
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
