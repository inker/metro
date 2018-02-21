import React, { PureComponent } from 'react'
import { Point } from 'leaflet'

interface Props extends React.SVGProps<SVGCircleElement> {
  center: Point,
  radius: number,
  [prop: string]: any,
}

class Circle extends PureComponent<Props> {
  render() {
    const {
      center,
      radius,
      ...otherProps
    } = this.props

    return (
      <circle
        cx={center.x}
        cy={center.y}
        r={radius}
        transform-origin={center}
        {...otherProps}
      />
    )
  }
}

export default Circle
