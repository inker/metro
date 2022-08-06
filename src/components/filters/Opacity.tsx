import React, { memo } from 'react'

const OpacityFilter = () => (
  <filter id="opacity">
    <feComponentTransfer>
      <feFuncA
        type="table"
        tableValues="0 0.5"
      />
    </feComponentTransfer>
  </filter>
)

export default memo(OpacityFilter)
