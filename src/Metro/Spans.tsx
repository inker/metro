import React, {
  useState,
  memo,
} from 'react'
import styled from 'styled-components'
import { Point } from 'leaflet'

import Portal from 'components/Portal'
import Bezier from 'components/primitives/Bezier'

import * as math from 'utils/math'
import memoizeObject from 'utils/memoizeObject'

import {
  tryGetFromMap,
} from 'utils/collections'

import {
  Span,
  Platform,
} from '../network'

const E_COLORS = [
  '#000',
  '#f00', // 1
  '#4af', // 2
  '#00f', // 3
  '#840', // 4
  '#0a0', // 5
  '#ff0', // 6
  '#c0c', // 7
  '#fc0', // 8
  '#ac0', // 9
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

const memoPathsOuterStyle = memoizeObject()
const memoPathsInnerStyle = memoizeObject()

interface Props {
  spans: Span[],
  lineWidth: number,
  lineRules: Map<string, CSSStyleDeclaration>,
  detailedE: boolean,
  pathsInnerWrapper: Element,
  getPlatformPosition: (platform: Platform) => Point,
  getPlatformWhiskers: (platform: Platform) => Map<Span, Point>,
  getSpanSlotsScaled: (span: Span) => { source: number, target: number },
  getSpanOffset: (span: Span) => number,
}

const Spans = ({
  spans,
  lineWidth,
  pathsInnerWrapper,
  lineRules,
  detailedE,
  getPlatformPosition,
  getPlatformWhiskers,
  getSpanSlotsScaled,
  getSpanOffset,
}: Props) => {
  const [pathsInner, setPathsInner] = useState<SVGGElement | null>(null)

  const getControlPoints = (span: Span) => {
    const { source, target } = span
    const sourcePos = getPlatformPosition(source)
    const targetPos = getPlatformPosition(target)

    const sourceControlPoint = tryGetFromMap(getPlatformWhiskers(source), span)
    const targetControlPoint = tryGetFromMap(getPlatformWhiskers(target), span)

    const controlPoints = [
      sourcePos,
      sourceControlPoint,
      targetControlPoint,
      targetPos,
    ]

    const {
      source: sourceSlot,
      target: targetSlot,
    } = getSpanSlotsScaled(span)

    const offset = getSpanOffset(span)

    if (sourceSlot === 0 && targetSlot === 0 && offset === 0) {
      return [controlPoints]
    }

    const sourceLine = controlPoints.slice(0, 2)
    const targetLine = controlPoints.slice(2, 4)

    // TODO: figure out what to do with zero lines
    const offsetSourceLine = sourceLine[0].equals(sourceLine[1])
      ? sourceLine
      : math.offsetLine(sourceLine, sourceSlot - offset)

    const offsetTargetLine = targetLine[0].equals(targetLine[1])
      ? targetLine
      : math.offsetLine(targetLine, targetSlot - offset)

    controlPoints[0] = offsetSourceLine[0]
    controlPoints[1] = offsetSourceLine[1]
    controlPoints[2] = offsetTargetLine[0]
    controlPoints[3] = offsetTargetLine[1]

    if (offset === 0) {
      return [controlPoints]
    }

    const curves = math.split(controlPoints, CURVE_SPLIT_NUM)
    const [head, ...tail] = curves.map(pa => math.offsetPath(pa, offset))
    return [head, ...tail.map(arr => arr.slice(1))]
  }

  const makePath = (span: Span) => {
    const {
      routes,
      source,
      target,
    } = span

    if (routes.length === 0) {
      console.error(span, 'span has no routes!')
      throw new Error('span has no routes!')
    }
    const tokens = routes[0].line.match(/([ELM])(\d{0,2})/)
    if (!tokens) {
      throw new Error(`match failed for ${source.name}-${target.name}`)
    }
    const [lineId, lineType] = tokens

    const controlPoints = getControlPoints(span)

    // drawBezierHints(this.overlay.origin, controlPoints, get(this.lineRules.get(lineId), 'stroke') as string)
    const lineStyle = lineRules.get(lineType === 'M' ? routes[0].line : lineType)
    const color = detailedE
      ? (lineType === 'E' ? E_COLORS[routes[0].branch] : '#999')
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

  const outerStrokeWidth = lineWidth
  const innerStrokeWidth = lineWidth / 2

  return (
    <>
      <PathsOuter
        style={memoPathsOuterStyle({
          strokeWidth: `${outerStrokeWidth}px`,
        })}
      >
        {pathsInner && spans.map(span => {
          const [outer] = makePath(span)
          return outer
        })}
      </PathsOuter>

      <Portal
        tagName="g"
        modalRoot={pathsInnerWrapper}
      >
        <PathsInner
          ref={setPathsInner}
          style={memoPathsInnerStyle({
            strokeWidth: `${innerStrokeWidth}px`,
          })}
        />
      </Portal>
    </>
  )
}

export default memo(Spans)
