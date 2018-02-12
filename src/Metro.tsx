import React, { PureComponent } from 'react'

import TooltipReact from 'components/Tooltip'
import StationReact from 'components/Station'
import Bezier from 'components/Bezier'

import SvgOverlay from './ui/SvgOverlay'

import * as math from './util/math'

import {
  tryGetFromMap,
} from './util/collections'

import Network, {
  Platform,
  Station,
  Span,
  Transfer,
  GraphJSON,
} from './network'

const CURVE_SPLIT_NUM = 10

interface Props {
  lineRules: Map<string, CSSStyleDeclaration>,
  network: Network,
  overlay: SvgOverlay,
  platformsOnSVG: WeakMap<Platform, L.Point>,
  platformOffsets: Map<L.Point, Map<Span, number>>,
  whiskers: WeakMap<Platform, Map<Span, L.Point>>,
  svgSizes: any,
}

class Metro extends PureComponent<Props> {
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
      platformsOnSVG,
      platformOffsets,
      whiskers,
    } = this.props
    const { source, target } = span
    const sourcePos = tryGetFromMap(platformsOnSVG, source)
    const targetPos = tryGetFromMap(platformsOnSVG, target)

    const controlPoints = [
        sourcePos,
        tryGetFromMap(tryGetFromMap(whiskers, source), span),
        tryGetFromMap(tryGetFromMap(whiskers, target), span),
        targetPos,
    ]

    const sourceMap = platformOffsets.get(sourcePos)
    const targetMap = platformOffsets.get(targetPos)
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
      network,
      overlay,
      platformsOnSVG,
      svgSizes,
    } = this.props

    const {
      lineWidth,
      lightLineWidth,
      circleBorder,
      circleRadius,
      dummyCircleRadius,
      transferWidth,
      transferBorder,
    } = svgSizes

    return (
      <>
        <defs>
          <filter
            id="shadow"
            width="200%"
            height="200%"
          >
            <feOffset
              result="offOut"
              in="SourceAlpha"
              dx="0"
              dy="4"
            />
            <feColorMatrix
              result="matrixOut"
              in="offOut"
              type="matrix"
              values="
                0 0 0 0   0
                0 0 0 0   0
                0 0 0 0   0
                0 0 0 0.5 0
              "
            />
            <feGaussianBlur
              result="blurOut"
              in="matrixOut"
              stdDeviation="2"
            />
            <feBlend
              in="SourceGraphic"
              in2="blurOut"
              mode="normal"
            />
          </filter>
          <filter id="black-glow">
            <feColorMatrix
              type="matrix"
              values="
                0 0 0 0   0
                0 0 0 0   0
                0 0 0 0   0
                0 0 0 0.3 0
              "
            />
            <feGaussianBlur
              stdDeviation="2.5"
              result="coloredBlur"
            />
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="opacity">
            <feComponentTransfer>
              <feFuncA
                type="table"
                tableValues="0 0.5"
              />
            </feComponentTransfer>
          </filter>
          <filter id="gray">
            <feColorMatrix
              type="matrix"
              values="
                0.2126 0.7152 0.0722 0 0
                0.2126 0.7152 0.0722 0 0
                0.2126 0.7152 0.0722 0 0
                0 0 0 1 0
              "
            />
          </filter>
        </defs>
        <g
          id="paths-outer"
          style={{
            strokeWidth: `${lineWidth}px`,
          }}
        >
          {network.spans.map(span => {
            const [foo] = this.makePath(span)
            return foo
          })}
        </g>
        <g
          id="paths-inner"
          style={{
            strokeWidth: `${lineWidth / 2}px`,
          }}
        >
          {}
        </g>
        <g
          id="transfers-outer"
          style={{
            strokeWidth: `${transferWidth + transferBorder / 2}px`,
          }}
        >
          {}
        </g>
        <g
          id="station-circles"
          style={{
            strokeWidth: `${circleBorder}px`,
          }}
        >
          {network && network.stations.map(station => {
            return (
              <StationReact
                key={station.id}
                platformsOnSVG={platformsOnSVG}
                station={station}
                radius={circleRadius}
                dummyParent={overlay.dummy}
                onMouseOver={console.log}
              />
            )
          })}
        </g>
        <g
          id="transfers-inner"
          style={{
            strokeWidth: `${transferWidth - transferBorder / 2}px`,
          }}
        >
          {}
        </g>
        <TooltipReact
          names={['foo', 'bar']}
        />
        <g
          id="dummy-circles"
        >
          {}
        </g>
      </>
    )
  }
}

export default Metro
