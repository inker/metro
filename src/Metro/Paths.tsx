import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { Point } from 'leaflet'

import Modal from 'components/Modal'
import Bezier from 'components/Bezier'

import * as math from 'util/math'
import {
  tryGetFromMap,
} from 'util/collections'

import {
  Span,
  Platform,
} from '../network'

const CURVE_SPLIT_NUM = 10

const Paths = styled.g`
  fill: none;
`

const Inner = styled(Paths)`
`

const Outer = styled(Paths)`
`

const PathsOuter = styled(Outer)`
  stroke-width: ${props => props.strokeWidth};
`

const PathsInner = styled(Inner)`
  stroke-width: ${props => props.strokeWidth};
`

interface Props {
  spans: Span[],
  outerStrokeWidth: number,
  innerStrokeWidth: number,
  whiskers: WeakMap<Platform, Map<Span, L.Point>>,
  lineRules: Map<string, CSSStyleDeclaration>,
  pathsInnerWrapper: SVGGElement,
  getPlatformPosition: (platform: Platform) => Point,
  getPlatformOffset: (position: Point) => Map<any, number> | null,
}

class PathsContainer extends PureComponent<Props> {
  state = {
    pathsInner: null,
  }

  mountInner = (g: SVGGElement) => {
    this.setState({
      pathsInner: g,
    })
  }

  private makePath(span: Span) {
    const { routes, source, target } = span
    if (routes.length === 0) {
      console.error(span, 'span has no routes!')
      throw new Error('span has no routes!')
    }
    const tokens = routes[0].line.match(/([MEL])(\d{0,2})/)
    if (!tokens) {
      throw new Error(`match failed for ${source.name}-${target.name}`)
    }
    const [lineId, lineType] = tokens

    const controlPoints = this.getControlPoints(span)

    // drawBezierHints(this.overlay.origin, controlPoints, get(this.lineRules.get(lineId), 'stroke') as string)
    const foo = this.props.lineRules.get(routes[0].line)
    const bezier = (
      <Bezier
        controlPoints={controlPoints[0]}
        tails={controlPoints.slice(1)}
        color={foo && foo.stroke}
      />
    )
    // bezier.id = 'op-' + spanIndex;
    if (lineType === 'E') {
      // bezier.classList.add('E')
      // const { branch } = span.routes[0];
      // if (branch !== undefined) {
      //     bezier.classList.add('E' + branch);
      // }
      const inner = (
        <Bezier
          controlPoints={controlPoints[0]}
          tails={controlPoints.slice(1)}
        />
      )
      // inner.id = 'ip-' + spanIndex;
      // pool.outerEdgeBindings.set(span, bezier)
      // pool.innerEdgeBindings.set(span, inner)
      return [bezier, inner]
    }
    // if (lineId !== undefined) {
    //     bezier.classList.add(lineId)
    // }
    // if (lineType !== undefined) {
    //     bezier.classList.add(lineType)
    // } else {
    //     bezier.style.stroke = 'black'
    // }
    // pool.outerEdgeBindings.set(span, bezier)
    return [bezier]
  }

  private getControlPoints(span: Span) {
    const {
      whiskers,
      getPlatformPosition,
      getPlatformOffset,
    } = this.props
    const { source, target } = span
    const sourcePos = getPlatformPosition(source)
    const targetPos = getPlatformPosition(target)

    const controlPoints = [
      sourcePos,
      tryGetFromMap(tryGetFromMap(whiskers, source), span),
      tryGetFromMap(tryGetFromMap(whiskers, target), span),
      targetPos,
    ]

    const sourceMap = getPlatformOffset(sourcePos)
    const targetMap = getPlatformOffset(targetPos)
    if (sourceMap) {
      const offset = sourceMap.get(span)
      if (!offset) {
        return [controlPoints]
      }
      if (targetMap) {
        const curves = math.split(controlPoints, CURVE_SPLIT_NUM)
        const [head, ...tail] = curves.map(pa => math.offsetPath(pa, offset))
        return [head, ...tail.map(arr => arr.slice(1))]
      }
      const lineO = math.offsetLine(controlPoints.slice(0, 2), offset)
      controlPoints[0] = lineO[0]
      controlPoints[1] = lineO[1]
      return [controlPoints]
    }
    if (targetMap) {
      const offset = targetMap.get(span)
      if (!offset) {
        return [controlPoints]
      }
      const lineO = math.offsetLine(controlPoints.slice(2, 4), offset)
      controlPoints[2] = lineO[0]
      controlPoints[3] = lineO[1]
    }
    return [controlPoints]
  }

  render() {
    const {
      spans,
      outerStrokeWidth,
      innerStrokeWidth,
      pathsInnerWrapper,
    } = this.props

    const {
      pathsInner,
    } = this.state

    return (
      <>
        <PathsOuter
          style={{
            strokeWidth: `${outerStrokeWidth}px`,
          }}
        >
          {pathsInner && spans.map(span => {
            const [outer] = this.makePath(span)
            return outer
          })}
        </PathsOuter>

        <Modal
          tagName="g"
          modalRoot={pathsInnerWrapper}
        >
          <PathsInner
            innerRef={this.mountInner}
            style={{
              strokeWidth: `${innerStrokeWidth}px`,
            }}
          />
        </Modal>
      </>
    )
  }
}

export default PathsContainer
