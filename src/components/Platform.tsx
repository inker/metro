import React, {
  memo,
  useCallback,
} from 'react'
import { Point } from 'leaflet'

import Platform from 'network/Platform'

import Circle from './primitives/Circle'
import Stadium from './primitives/Stadium'

import Portal from './Portal'

interface Props {
  position: Point | Point[],
  radius: number,
  color?: string,
  isFeatured?: boolean,
  platforms: readonly Platform[], // platforms it represents
  dummyParent: Element | null,
  onMouseOver?: (platforms: readonly Platform[]) => void,
  onMouseOut?: () => void,
}

const PlatformReact = ({
  position,
  platforms,
  radius,
  color,
  isFeatured,
  dummyParent,
  onMouseOver,
  onMouseOut,
}: Props) => {
  // console.log('rend', position)
  const onMouseOverCb = useCallback(() => {
    if (!onMouseOver || platforms.every(p => p.type === 'dummy')) {
      return
    }
    onMouseOver(platforms)
  }, [platforms, onMouseOver])

  const El = useCallback(
    (props) =>
      Array.isArray(position) ? (
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
      ),
    [position],
  )

  const realRadius = isFeatured ? radius * 1.25 : radius
  const dummyRadius = radius * 2

  return (
    <>
      <El
        radius={realRadius}
        stroke={color}
        display={platforms.every(p => p.type === 'dummy') ? 'none' : undefined}
      />
      {dummyParent
        && (
        <Portal
          tagName="g"
          modalRoot={dummyParent}
        >
          <El
            radius={dummyRadius}
            onMouseOver={onMouseOverCb}
            onMouseOut={onMouseOut}
          />
        </Portal>
        )}
    </>
  )
}

export default memo(PlatformReact)
