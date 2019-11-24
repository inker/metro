import React, { memo } from 'react'

const ShadowFilter = () => (
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
)

export default memo(ShadowFilter)
