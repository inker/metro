import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { Point } from 'leaflet'

import { getCircumcenter } from 'utils/math'
import { dot, det } from 'utils/math/vector'

interface ArcArgs {
  radius: number,
  large?: number,
  clockwise?: number,
}

const Root = styled.path`
`

interface Props {
  start: Point,
  end: Point,
  third: Point,
  [prop: string]: any,
}

class Arc extends PureComponent<Props> {
  private getArgs(): ArcArgs {
    const {
      start,
      end,
      third,
    } = this.props

    const center = getCircumcenter([start, end, third])
    if (center === null) {
      return {
        radius: Infinity,
      }
    }
    const a = start.subtract(third)
    const b = end.subtract(third)
    const thirdIsBetween = dot(a, b) < 0
    const u = start.subtract(center)
    const v = end.subtract(center)
    // the distance is shorter when moving from start to end clockwise
    const isClockwise = det(u, v) >= 0
    return {
      radius: center.distanceTo(start),
      large: thirdIsBetween ? 1 : 0,
      clockwise: isClockwise && !thirdIsBetween || thirdIsBetween && !isClockwise ? 1 : 0,
    }
  }

  render() {
    const {
      start,
      end,
      ...otherProps
    } = this.props

    const {
      radius,
      large,
      clockwise,
    } = this.getArgs()

    const d = [
        'M', start.x, start.y,
        ...(radius === Infinity ? ['L'] : ['A', radius, radius, 0, large, clockwise]),
        end.x, end.y,
    ].join(' ')

    return (
      <Root
        d={d}
        {...otherProps}
      />
    )
  }
}

export default Arc
