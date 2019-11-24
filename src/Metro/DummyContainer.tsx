import React, { memo } from 'react'
import styled from 'styled-components'

import memoizeObject from 'utils/memoizeObject'

const memoDummyTransfersStyle = memoizeObject()
const memoDummyPlatformsStyle = memoizeObject()

const DummyPlatforms = styled.g`
  opacity: 0;
  /* stroke: blue; */
  /* stroke-width: 0.5px; */
`

const DummyTransfers = styled.g`
  opacity: 0;

  & path {
    fill: none;
    pointer-events: stroke;
  }
`

interface Props {
  dummyTransfersStrokeWidth: number,
  dummyPlatformsStrokeWidth: number,
  mountDummyTransfers: (g: SVGGElement) => void,
  mountDummyPlatforms: (g: SVGGElement) => void,
}

const DummyContainer = (props: Props) => (
  <>
    <DummyTransfers
      ref={props.mountDummyTransfers}
      style={memoDummyTransfersStyle({
        stroke: 'black',
        strokeWidth: `${props.dummyTransfersStrokeWidth}px`,
      })}
    />

    <DummyPlatforms
      ref={props.mountDummyPlatforms}
      style={memoDummyPlatformsStyle({
        strokeWidth: `${props.dummyPlatformsStrokeWidth}px`,
      })}
    />
  </>
)

export default memo(DummyContainer)
