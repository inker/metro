import React, { PureComponent } from 'react'

class BlackGlowFilter extends PureComponent {
  render() {
    return (
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
    )
  }
}

export default BlackGlowFilter
