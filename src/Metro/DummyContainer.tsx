import React, { PureComponent } from 'react'
import styled from 'styled-components'

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

class DummyContainer extends PureComponent<Props> {
  render() {
    const { props } = this
    return (
      <>
        <DummyTransfers
          ref={props.mountDummyTransfers}
          style={{
            stroke: 'black',
            strokeWidth: `${props.dummyTransfersStrokeWidth}px`,
          }}
        />

        <DummyPlatforms
          ref={props.mountDummyPlatforms}
          style={{
            strokeWidth: `${props.dummyPlatformsStrokeWidth}px`,
          }}
        />
      </>
    )
  }
}

export default DummyContainer
