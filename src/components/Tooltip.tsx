import React, { memo } from 'react'
import styled, { createGlobalStyle } from 'styled-components'
import { Point } from 'leaflet'

import memoizeObject from 'utils/memoizeObject'

const WIDTH = 300
const HALF_WIDTH = WIDTH / 2

const GAP = 10

const Fonts = createGlobalStyle`
  /* latin-ext */
  @font-face {
    font-family: 'Ubuntu';
    font-style: normal;
    font-weight: 400;
    src: local('Ubuntu Regular'), local('Ubuntu-Regular'), url(https://fonts.gstatic.com/s/ubuntu/v12/4iCs6KVjbNBYlgoKcQ72nU6AF7xm.woff2) format('woff2');
    unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
  }
  /* latin */
  @font-face {
    font-family: 'Ubuntu';
    font-style: normal;
    font-weight: 400;
    src: local('Ubuntu Regular'), local('Ubuntu-Regular'), url(https://fonts.gstatic.com/s/ubuntu/v12/4iCs6KVjbNBYlgoKfw72nU6AFw.woff2) format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }

  /* latin-ext */
  @font-face {
    font-family: 'Ubuntu-Medium';
    font-style: normal;
    /* font-weight: 500; */
    font-weight: 700;
    src: local('Ubuntu Medium'), local('Ubuntu-Medium'), url(https://fonts.gstatic.com/s/ubuntu/v12/4iCv6KVjbNBYlgoCjC3jvmyNPYZvg7UI.woff2) format('woff2');
    unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
  }
  /* latin */
  @font-face {
    font-family: 'Ubuntu-Medium';
    font-style: normal;
    /* font-weight: 500; */
    font-weight: 700;
    src: local('Ubuntu Medium'), local('Ubuntu-Medium'), url(https://fonts.gstatic.com/s/ubuntu/v12/4iCv6KVjbNBYlgoCjC3jsGyNPYZvgw.woff2) format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }

  /* latin-ext */
  @font-face {
    font-family: 'Ubuntu';
    font-style: normal;
    font-weight: 700;
    src: local('Ubuntu Bold'), local('Ubuntu-Bold'), url(https://fonts.gstatic.com/s/ubuntu/v12/4iCv6KVjbNBYlgoCxCvjvmyNPYZvg7UI.woff2) format('woff2');
    unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
  }
  /* latin */
  @font-face {
    font-family: 'Ubuntu';
    font-style: normal;
    font-weight: 700;
    src: local('Ubuntu Bold'), local('Ubuntu-Bold'), url(https://fonts.gstatic.com/s/ubuntu/v12/4iCv6KVjbNBYlgoCxCvjsGyNPYZvgw.woff2) format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }
`

const PlateBoxWrapper = styled.div`
  display: flex;
  justify-content: center;
  height: 100%;
  align-items: flex-end;
`

const PlateBox = styled.div`
  color: #000000;
  text-align: center;
  font-family: Corbel, 'Ubuntu-Medium', Candara, Calibri, 'Trebuchet MS', sans-serif;
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

const Textling = styled.div`
  font-weight: ${props => props.primary && 'bold'};
`

const memoizeTextLingStyle = memoizeObject()

interface Props {
  names: string[] | null,
  position: Point | null,
  fontSize: number,
}

const Tooltip = ({
  position,
  names,
  fontSize,
}: Props) => (
  <foreignObject
    x={-HALF_WIDTH}
    y={-WIDTH}
    width={WIDTH}
    height={WIDTH}
    transform={position ? `translate(${position.x}, ${position.y})` : ''}
  >
    <Fonts />
    <PlateBoxWrapper>
      <PlateBox display={position}>
        {names && names.map((name, i) => (
          <Textling
            key={`${name}_${i}`}
            primary={i === 0}
            style={memoizeTextLingStyle({
              fontSize,
            })}
          >
            {name}
          </Textling>
        ))}
      </PlateBox>
    </PlateBoxWrapper>
  </foreignObject>
)

export default memo(Tooltip)
