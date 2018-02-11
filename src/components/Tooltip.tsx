import React, { PureComponent } from 'react'
import styled from 'styled-components'

const PlateBox = styled.div`
  color: #000000;
  text-anchor: end;
  text-align: right;
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
  display: inline-block;
  /*float: left;*/
`

interface Props {
  names: string[] | null,
}

class Tooltip extends PureComponent<Props> {
  render() {
    const { names } = this.props
    return (
      <g id="plaaaaate">
        <foreignObject
            x="0"
            y="0"
            width="100%"
            height="100%"
            transform=""
        >
          <PlateBox>
            {names && names.map(name => (
              <span>{name}</span>
            ))}
          </PlateBox>
        </foreignObject>
      </g>
    )
  }
}

export default Tooltip
