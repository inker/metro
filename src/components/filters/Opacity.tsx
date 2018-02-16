import React, { PureComponent } from 'react'

class OpacityFilter extends PureComponent {
  render() {
    return (
      <filter id="opacity">
        <feComponentTransfer>
          <feFuncA
            type="table"
            tableValues="0 0.5"
          />
        </feComponentTransfer>
      </filter>
    )
  }
}

export default OpacityFilter
