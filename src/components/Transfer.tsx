import React, { PureComponent } from 'react'
import { Point } from 'leaflet'

import Transfer from '../network/Transfer'
import Platform from '../network/Platform'

import Modal from './Modal'
import Line from './Line'
import Arc from './Arc'

interface Props {
  start: Point,
  end: Point,
  third?: Point,
  transfer: Transfer,
  fullCircleRadius: number,
  defs: SVGDefsElement | null,
  innerParent: Element | null,
  dummyParent: Element | null,
  getPlatformColor: (platform: Platform) => string,
  onMouseOver?: (transfer: Transfer) => void,
  onMouseOut?: () => void,
}

export function setDirection(gradient: Element, vector: Point) {
  const rotate = `rotate(${Math.atan2(vector.y, vector.x) * 180 / Math.PI}, 0.5, 0.5)`
  gradient.setAttribute('gradientTransform', rotate)
}

export function setOffset(gradient: Element, offset: number) {
  (gradient.firstElementChild as SVGStopElement).setAttribute('offset', offset.toString());
  (gradient.lastElementChild as SVGStopElement).setAttribute('offset', (1 - offset).toString())
}

class TransferReact extends PureComponent<Props> {
  private getGradient() {
    const {
      start,
      end,
      transfer,
      fullCircleRadius,
      getPlatformColor,
    } = this.props
    const { source, target } = transfer

    const gradientColors = [
      getPlatformColor(source),
      getPlatformColor(target),
    ]

    const vector = end.subtract(start)

    const circlePortion = fullCircleRadius / start.distanceTo(end)

    return (
      <linearGradient
        id={`gradient-${transfer.id}`}
        gradientTransform={`rotate(${Math.atan2(vector.y, vector.x) * 180 / Math.PI}, 0.5, 0.5)`}
      >
        <stop
          style={{
            stopColor: gradientColors[0],
          }}
          offset={circlePortion}
        />
        <stop
          style={{
            stopColor: gradientColors[1],
          }}
          offset={1 - circlePortion}
        />
      </linearGradient>
    )
  }

  onMouseOver = (e) => {
    const { transfer, onMouseOver } = this.props
    if (!onMouseOver) {
      return
    }
    onMouseOver(transfer)
  }

  render() {
    const {
      start,
      end,
      third,
      transfer,
      defs,
      innerParent,
      dummyParent,
      onMouseOut,
    } = this.props

    const Path = third ? Arc : Line

    return (
      <>
        <Path
          start={start}
          end={end}
          third={third}
          style={{
            stroke: `url(#${`gradient-${transfer.id}`})`,
          }}
        />
        {innerParent &&
          <Modal
            tagName="g"
            modalRoot={innerParent}
          >
            <Path
              data-id={transfer.id}
              start={start}
              end={end}
              third={third}
              onMouseOver={this.onMouseOver}
              onMouseOut={onMouseOut}
            />
          </Modal>
        }
        {defs &&
          <Modal
            tagName="g"
            modalRoot={defs}
          >
            {this.getGradient()}
          </Modal>
        }
        {dummyParent &&
          <Modal
            tagName="g"
            modalRoot={dummyParent}
          >
            <Path
              data-id={transfer.id}
              start={start}
              end={end}
              third={third}
              onMouseOver={this.onMouseOver}
              onMouseOut={onMouseOut}
            />
          </Modal>
        }
      </>
    )
  }
}

export default TransferReact