import React, { PureComponent } from 'react'
import styled from 'styled-components'

import TooltipReact from 'components/Tooltip'
import StationReact from 'components/Station'
import TransferReact from 'components/Transfer'
import Bezier from 'components/Bezier'

import SvgOverlay from './ui/SvgOverlay'

import * as math from './util/math'
import { meanColor } from './util/color'

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

const StationCircles = styled.g`
  fill: white;
  stroke: black;
`

const Paths = styled.g`
  fill: none;
`

const Inner = styled(Paths)`
`

const Outer = styled(Paths)`
  & path {
    pointer-events: stroke;
  }
`

const PathsOuter = styled(Outer)`
  stroke-width: ${props => props.strokeWidth};
`

const PathsInner = styled(Inner)`
  stroke-width: ${props => props.strokeWidth};
`

const TransfersOuter = styled(Outer)`
  stroke: #404040;
  stroke-width: ${props => props.strokeWidth};
`

const TransfersInner = styled(Inner)`
  stroke: #FFFFFF;
  stroke-width: ${props => props.strokeWidth};
`

const DummyPlatforms = styled.g`
  opacity: 0;
  /* stroke: blue; */
  /* stroke-width: 0.5px; */
`

const DummyTransfers = styled.g`
  opacity: 0;
`

interface Containers {
  transfersInner?: SVGGElement,
  defs?: SVGDefsElement,
  dummyTransfers?: SVGGElement,
  dummyPlatforms?: SVGGElement,
}

interface Props {
  isDetailed: boolean,
  lineRules: Map<string, CSSStyleDeclaration>,
  network: Network,
  overlay: SvgOverlay,
  platformsOnSVG: WeakMap<Platform, L.Point>,
  platformOffsets: Map<L.Point, Map<Span, number>>,
  whiskers: WeakMap<Platform, Map<Span, L.Point>>,
  svgSizes: any,
}

interface State {
  containers: Containers,
  currentPlatform: Platform | null,
}

class Metro extends PureComponent<Props, State> {
  state: State = {
    containers: {},
    currentPlatform: null,
  }

  private mountTransfersInner = (g: SVGGElement) => {
    console.log('mounting transfers inner', g)
    this.setState(state => ({
      containers: {
        ...state.containers,
        transfersInner: g,
      },
    }))
  }

  private mountDummyTransfers = (g: SVGGElement) => {
    console.log('mounting dummy transfers', g)
    this.setState(state => ({
      containers: {
        ...state.containers,
        dummyTransfers: g,
      },
    }))
  }

  private mountDummyPlatforms = (g: SVGGElement) => {
    console.log('mounting dummy platforms')
    this.setState(state => ({
      containers: {
        ...state.containers,
        dummyPlatforms: g,
      },
    }))
  }

  private mountDefs = (defs: SVGDefsElement) => {
    console.log('mounting dummy platforms')
    this.setState(state => ({
      containers: {
        ...state.containers,
        defs,
      },
    }))
  }

  private setCurrentPlatform = (platform: Platform) => {
    this.setState({
      currentPlatform: platform,
    })
  }

  private unsetCurrentPlatform = () => {
    this.setState({
      currentPlatform: null,
    })
  }

  private getPlatformColor = (platform: Platform) =>
    meanColor(this.linesToColors(platform.passingLines()))

  private linesToColors(lines: Set<string>): string[] {
    const { lineRules } = this.props
    const rgbs: string[] = []
    for (const line of lines) {
      const { stroke } = tryGetFromMap(lineRules, line[0] === 'M' ? line : line[0])
      if (stroke) {
          rgbs.push(stroke)
      }
    }
    return rgbs
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
      isDetailed,
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
      fullCircleRadius,
    } = svgSizes

    const {
      currentPlatform,
      containers: {
        transfersInner,
        dummyTransfers,
        dummyPlatforms,
        defs,
      },
    } = this.state

    return (
      <>
        <defs ref={this.mountDefs}>
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
        <PathsOuter
          style={{
            strokeWidth: `${lineWidth}px`,
          }}
        >
          {network.spans.map(span => {
            const [outer] = this.makePath(span)
            return outer
          })}
        </PathsOuter>

        <PathsInner
          style={{
            strokeWidth: `${lineWidth / 2}px`,
          }}
        />

        <TransfersOuter
          style={{
            strokeWidth: `${transferWidth + transferBorder / 2}px`,
          }}
        >
          {transfersInner && dummyTransfers && defs && network && network.transfers.map(transfer => {
            return (
              <TransferReact
                key={transfer.id}
                start={tryGetFromMap(platformsOnSVG, transfer.source)}
                end={tryGetFromMap(platformsOnSVG, transfer.target)}
                transfer={transfer}
                fullCircleRadius={fullCircleRadius}
                defs={defs}
                innerParent={transfersInner}
                dummyParent={dummyTransfers}
                getPlatformColor={this.getPlatformColor}
                onMouseOver={console.log}
              />
            )
          })}
        </TransfersOuter>

        <StationCircles
          style={{
            strokeWidth: `${circleBorder}px`,
          }}
        >
          {dummyPlatforms && network && network.stations.map(station => {
            return (
              <StationReact
                key={station.id}
                isDetailed={isDetailed}
                platformsOnSVG={platformsOnSVG}
                station={station}
                radius={circleRadius}
                dummyParent={dummyPlatforms}
                getPlatformColor={this.getPlatformColor}
                onMouseOver={this.setCurrentPlatform}
                onMouseOut={this.unsetCurrentPlatform}
              />
            )
          })}
        </StationCircles>

        <TransfersInner
          innerRef={this.mountTransfersInner}
          style={{
            strokeWidth: `${transferWidth - transferBorder / 2}px`,
          }}
        />

        <TooltipReact
          position={currentPlatform && platformsOnSVG.get(currentPlatform) || null}
          names={currentPlatform && [currentPlatform.name, ...Object.values(currentPlatform.altNames)]}
        />

        <DummyTransfers
          innerRef={this.mountDummyTransfers}
        />

        <DummyPlatforms
          innerRef={this.mountDummyPlatforms}
        />
      </>
    )
  }
}

export default Metro
