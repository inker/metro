import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { Point } from 'leaflet'

const WIDTH = 300
const HALF_WIDTH = WIDTH / 2

const GAP = 10

const PlateBox = styled.div`
  color: #000000;
  text-align: center;
  font-family: Corbel, Candara, Calibri, 'Trebuchet MS', Ubuntu, sans-serif;
  font-weight: bold;
  opacity: 1;
  user-select: none;

  white-space: nowrap;
  /*border-radius: 2px;*/
  box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
  /*filter: url(#shadow);*/
  background-color: white; /* for div */
  padding: 1px 3px 1px 3px;
  line-height: 1.3em;
  display: ${props => props.display ? 'inline-block' : 'none'};
  margin-bottom: ${GAP}px;
  /*float: left;*/
`

const Foobar = styled.div`
  display: flex;
  justify-content: center;
  height: 100%;
  align-items: flex-end;
`

interface Props {
  names: string[] | null,
  position: Point | null,
}

class Tooltip extends PureComponent<Props> {
  render() {
    const {
      position,
      names,
    } = this.props

    return (
      <g>
        <foreignObject
            x={-HALF_WIDTH}
            y={-WIDTH}
            width={WIDTH}
            height={WIDTH}
            transform={position ? `translate(${position.x}, ${position.y})` : ''}
        >
          <Foobar>
            <PlateBox display={position}>
              {names && names.map((name, i) => (
                <div key={`${name}_${i}`}>
                  {name}
                </div>
              ))}
            </PlateBox>
          </Foobar>
        </foreignObject>
      </g>
    )
  }
}

export default Tooltip
