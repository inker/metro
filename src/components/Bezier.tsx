import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { Point } from 'leaflet'

const curveTypeLetters = ['', 'L', 'Q', 'C']

function tailToString(tail: Point[]) {
  const { length } = tail
  if (length > 3) {
      throw new Error(`the tail should consist of 1-3 elements, but got ${length} instead`)
  }
  const letter = curveTypeLetters[length]
  const coords = tail.map(pt => `${pt.x} ${pt.y}`).join(' ')
  return `${letter} ${coords}`
}

const Path = styled.path`
  stroke: ${props => props.color || '#000'};
`

interface Props {
  controlPoints: Point[],
  tails?: Point[][],
  color?: string | null,
}

class Bezier extends PureComponent<Props> {
  makePath() {
    const {
      controlPoints,
      tails,
    } = this.props
    if (controlPoints.length < 2) {
        throw new Error(`there should be at least 2 control points, but got ${controlPoints.length} instead`)
    }
    const [start, ...tail] = controlPoints
    const str = `M ${start.x} ${start.y}`
    if (!tails) {
      return str
    }
    tails.unshift(tail) // tails can be mutable
    const tailStr = tails.map(tailToString).join(' ')
    return `${str} ${tailStr}`
  }

  render() {
    const { color } = this.props
    return (
      <Path
        color={color}
        d={this.makePath()}
      />
    )
  }
}

export default Bezier
