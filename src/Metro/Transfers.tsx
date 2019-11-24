import React, {
  useState,
  useCallback,
  memo,
} from 'react'
import styled from 'styled-components'
import { Point } from 'leaflet'
import {
  castArray,
  difference,
  uniq,
  minBy,
} from 'lodash'

import Portal from 'components/Portal'
import TransferReact from 'components/Transfer'

import { getCircumcenter } from 'utils/math'
import memoizeObject from 'utils/memoizeObject'

import {
  Platform,
  Station,
  Transfer,
} from '../network'

import cartesian from './utils/cartesian'

type Pair<T> = [T, T]
type Triple<T> = [T, T, T]

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

const memoTransfersOuterStyle = memoizeObject()
const memoTransfersInnerStyle = memoizeObject()

function getFeaturedPlatforms(transfer: Transfer) {
  const { source, target } = transfer
  const sourceName = source.name
  const targetName = target.name
  const sourceFeaturedPlatforms = source.station.platforms.filter(p => p.name === sourceName)
  const targetFeaturedPlatforms = target.station.platforms.filter(p => p.name === targetName)
  return uniq([...sourceFeaturedPlatforms, ...targetFeaturedPlatforms])
}

function getBestPair(sourcePositionArr: Point[], targetPositionArr: Point[]) {
  const combos = cartesian(sourcePositionArr, targetPositionArr) as Pair<Point>[]
  return minBy(combos, ([p1, p2]) => p1.distanceTo(p2))!
}

function getBestTriplet(sourcePositionArr: Point[], targetPositionArr: Point[], thirdPos: Point) {
  const thirdPositions = [thirdPos]
  const combos = cartesian(sourcePositionArr, targetPositionArr, thirdPositions) as Triple<Point>[]
  return minBy(combos, combo => {
    const c = getCircumcenter(combo)
    return c ? c.distanceTo(combo[0]) : Infinity
  })!
}

function getBestCombo(sourcePos: Point | Point[], targetPos: Point | Point[], thirdPos: Point | null) {
  if (!Array.isArray(sourcePos) && !Array.isArray(targetPos)) {
    return [sourcePos, targetPos, thirdPos] as const
  }

  const sourcePositionArr = castArray(sourcePos)
  const targetPositionArr = castArray(targetPos)
  const bestCombo = thirdPos
    ? getBestTriplet(sourcePositionArr, targetPositionArr, thirdPos)
    : getBestPair(sourcePositionArr, targetPositionArr)

  if (!bestCombo) {
    throw new Error('somehow best combo sucks')
  }
  return bestCombo
}

interface Props {
  transfers: Transfer[],
  isDetailed: boolean,
  stationCircumpoints: WeakMap<Station, Platform[]>,
  featuredPlatforms: Platform[] | null,
  transferWidth: number,
  transferBorder: number,
  fullCircleRadius: number,
  transfersInnerWrapper: Element,
  dummyTransfers: Element,
  defs: Element,
  getPlatformPosition: (platform: Platform) => Point,
  getPlatformSlotPoints: (platform: Platform) => Point | Point[],
  getPlatformColor: (platform: Platform) => string,
  setFeaturedPlatforms: (platforms: Platform[]) => void,
  unsetFeaturedPlatforms: () => void,
}

const Transfers = ({
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
  getPlatformSlotPoints,
  getPlatformColor,
  setFeaturedPlatforms,
  unsetFeaturedPlatforms,
}: Props) => {
  const [transfersInner, setTransfersInner] = useState<SVGGElement | null>(null)

  const getThirdPosition = (transfer: Transfer) => {
    const { source, target } = transfer
    const scp = stationCircumpoints.get(source.station)
    const includes = scp && scp.includes(source) && scp.includes(target)
    if (!includes) {
      return null
    }
    const third = difference(scp, [source, target])[0] || undefined
    return getPlatformPosition(third)
  }

  const getPositions = (transfer: Transfer) => {
    const { source, target } = transfer
    const sourcePos = getPlatformSlotPoints(source)
    const targetPos = getPlatformSlotPoints(target)
    const thirdPos = getThirdPosition(transfer)
    return getBestCombo(sourcePos, targetPos, thirdPos)
  }

  const setFeaturedPlatformsMem = useCallback((transfer: Transfer) => {
    const feat = getFeaturedPlatforms(transfer)
    setFeaturedPlatforms(feat)
  }, [setFeaturedPlatforms])

  const outerStrokeWidth = transferWidth + transferBorder / 2
  const innerStrokeWidth = transferWidth - transferBorder / 2

  const featuredPlatformsSet = featuredPlatforms && new Set(featuredPlatforms)

  return (
    <>
      <TransfersOuter
        style={memoTransfersOuterStyle({
          display: isDetailed ? '' : 'none',
          strokeWidth: `${outerStrokeWidth}px`,
        })}
      >
        {transfersInner && dummyTransfers && defs && transfers.map(transfer => {
          const [
            sourcePos,
            targetPos,
            thirdPos,
          ] = getPositions(transfer)
          const { source, target } = transfer

          const isFeatured = featuredPlatformsSet
            && featuredPlatformsSet.has(source)
            && featuredPlatformsSet.has(target)

          const strokeWidth = transfer.type === 'osi'
            ? outerStrokeWidth / 1.5
            : isFeatured
              ? outerStrokeWidth * 1.25
              : undefined

          return (
            <TransferReact
              key={transfer.id}
              start={sourcePos}
              end={targetPos}
              third={thirdPos}
              transfer={transfer}
              fullCircleRadius={fullCircleRadius}
              strokeWidth={strokeWidth}
              defs={defs}
              innerParent={transfersInner}
              dummyParent={dummyTransfers}
              getPlatformColor={getPlatformColor}
              onMouseOver={setFeaturedPlatformsMem}
              onMouseOut={unsetFeaturedPlatforms}
            />
          )
        })}
      </TransfersOuter>
      <Portal
        tagName="g"
        modalRoot={transfersInnerWrapper}
      >
        <TransfersInner
          ref={setTransfersInner}
          style={memoTransfersInnerStyle({
            display: isDetailed ? '' : 'none',
            strokeWidth: `${innerStrokeWidth}px`,
          })}
        />
      </Portal>
    </>
  )
}

export default memo(Transfers)
