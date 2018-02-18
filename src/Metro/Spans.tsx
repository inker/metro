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

const E_COLORS = [
  '#f0f',
  '#f00',
  '#00f',
  '#080',
  '#f80',
  '#808',
  '#ff0',
  '#840',
  '#4af',
]

const CURVE_SPLIT_NUM = 8

const Paths = styled.g`
  fill: none;
`

const Inner = styled(Paths)`
`

const Outer = styled(Paths)`
`

const PathsOuter = styled(Outer)`
`

const PathsInner = styled(Inner)`
`

interface Props {
  spans: Span[],
  lineWidth: number,
  whiskers: WeakMap<Platform, Map<Span, Point>>,
  lineRules: Map<string, CSSStyleDeclaration>,
  detailedE: boolean,
  pathsInnerWrapper: SVGGElement,
  getPlatformPosition: (platform: Platform) => Point,
  getPlatformOffset: (position: Point) => Map<any, number> | null,
}

class Spans extends PureComponent<Props> {
  state = {
    pathsInner: null,
  }

  private mountInner = (g: SVGGElement) => {
    this.setState({
      pathsInner: g,
    })
  }

  private makePath(span: Span) {
    const { detailedE } = this.props

    const {
      routes,
      source,
      target,
    } = span

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

    const {
      lineRules,
    } = this.props

    // drawBezierHints(this.overlay.origin, controlPoints, get(this.lineRules.get(lineId), 'stroke') as string)
    const lineStyle = lineRules.get(lineType === 'M' ? routes[0].line : lineType)
    const color = detailedE
      ? (lineType === 'E' ? E_COLORS[routes[0].branch] : '#808080')
      : lineStyle && lineStyle.stroke
    const bezier = (
      <Bezier
        key={span.id}
        controlPoints={controlPoints[0]}
        tails={controlPoints.slice(1)}
        color={color}
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
      lineWidth,
      pathsInnerWrapper,
    } = this.props

    const {
      pathsInner,
    } = this.state

    const outerStrokeWidth = lineWidth
    const innerStrokeWidth = lineWidth / 2

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

export default Spans
