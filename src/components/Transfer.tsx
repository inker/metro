import React, { PureComponent } from 'react'
import { Point } from 'leaflet'

import Transfer from '../network/Transfer'

import Modal from './Modal'
import Line from './Line'

interface Props {
  start: Point,
  end: Point,
  transfer: Transfer,
  innerParent: Element | null,
  dummyParent: Element | null,
  onMouseOver?: (transfer: Transfer) => void,
  onMouseOut?: () => void,
}

class TransferReact extends PureComponent<Props> {
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
      transfer,
      innerParent,
      dummyParent,
      onMouseOut,
    } = this.props

    return (
      <>
        <Line
          start={start}
          end={end}
        />
        {innerParent &&
          <Modal
            tagName="g"
            modalRoot={innerParent}
          >
            <Line
              data-id={transfer.id}
              start={start}
              end={end}
              onMouseOver={this.onMouseOver}
              onMouseOut={onMouseOut}
            />
          </Modal>
        }
        {dummyParent &&
          <Modal
            tagName="g"
            modalRoot={dummyParent}
          >
            <Line
              data-id={transfer.id}
              start={start}
              end={end}
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
