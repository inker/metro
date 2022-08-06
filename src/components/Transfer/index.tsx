import React, {
  useCallback,
  memo,
} from 'react'
import { Point } from 'leaflet'

import memoizeObject from 'utils/memoizeObject'

import Transfer from '../../network/Transfer'
import Platform from '../../network/Platform'

import Line from '../primitives/Line'
import Arc from '../primitives/Arc'

import Portal from '../Portal'

import Gradient from './Gradient'

const memoPathStyle = memoizeObject()

const getId = (transfer: Transfer) =>
  `gradient-${transfer.id}`

interface Props {
  start: Point,
  end: Point,
  third?: Point | null,
  transfer: Transfer,
  fullCircleRadius: number,
  strokeWidth?: number,
  defs: SVGDefsElement | null,
  innerParent: Element | null,
  dummyParent: Element | null,
  getPlatformColor: (platform: Platform) => string,
  onMouseOver?: (transfer: Transfer) => void,
  onMouseOut?: () => void,
}

const TransferReact = ({
  start,
  end,
  third,
  transfer,
  fullCircleRadius,
  strokeWidth,
  defs,
  innerParent,
  dummyParent,
  getPlatformColor,
  onMouseOver,
  onMouseOut,
}: Props) => {
  const onMouseOverMem = useCallback(() => {
    if (!onMouseOver) {
      return
    }
    onMouseOver(transfer)
  }, [transfer, onMouseOver])

  const Path = third ? Arc : Line
  const newEnd = end.clone()
  if (!third) {
    if (start.x === end.x) {
      newEnd.x += 0.01
    }
    if (start.y === end.y) {
      newEnd.y += 0.01
    }
  }

  const osiStyle = strokeWidth && transfer.type === 'osi' && {
    strokeDasharray: `0 ${strokeWidth * 1.5}`,
    strokeLinecap: 'round',
  }

  return (
    <>
      <Path
        a={start}
        b={newEnd}
        third={third}
        style={memoPathStyle({
          ...osiStyle,
          stroke: `url(#${getId(transfer)})`,
          strokeWidth: strokeWidth && `${strokeWidth}px`,
        })}
      />
      {innerParent && transfer.type !== 'osi'
        && (
        <Portal
          tagName="g"
          modalRoot={innerParent}
        >
          <Path
            data-id={transfer.id}
            a={start}
            b={newEnd}
            third={third}
          />
        </Portal>
        )}
      {defs
        && (
        <Portal
          tagName="g"
          modalRoot={defs}
        >
          <Gradient
            id={getId(transfer)}
            start={start}
            end={end}
            startColor={getPlatformColor(transfer.source)}
            endColor={getPlatformColor(transfer.target)}
            fullCircleRadius={fullCircleRadius}
          />
        </Portal>
        )}
      {dummyParent
        && (
        <Portal
          tagName="g"
          modalRoot={dummyParent}
        >
          <Path
            data-id={transfer.id}
            a={start}
            b={newEnd}
            third={third}
            onMouseOver={onMouseOverMem}
            onMouseOut={onMouseOut}
          />
        </Portal>
        )}
    </>
  )
}

export default memo(TransferReact)
