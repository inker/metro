import React, { memo } from 'react'

const GrayFilter = () => (
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
)

export default memo(GrayFilter)
