import React, { memo } from 'react'
import styled from 'styled-components'
import { Point } from 'leaflet'

const Root = styled.line`
`

interface Props extends React.SVGProps<SVGLineElement> {
  a: Point,
  b: Point,
  [prop: string]: any,
}

const Line = ({
  a,
  b,
  ...otherProps
}: Props) => (
  <Root
    x1={a.x}
    y1={a.y}
    x2={b.x}
    y2={b.y}
    {...otherProps}
  />
)

export default memo(Line)
