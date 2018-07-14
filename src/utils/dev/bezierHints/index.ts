import { Point } from 'leaflet'

import { createSVGElement } from 'utils/svg'
import { meanColor } from 'utils/color'

import styles from './styles.css'

export function drawBezierHints(parent: Element, controlPoints: Point[], linesColor?: string) {
  for (let i = 1; i < controlPoints.length; ++i) {
      const line = createSVGElement('line')
      line.setAttribute('x1', controlPoints[i - 1].x.toString())
      line.setAttribute('y1', controlPoints[i - 1].y.toString())
      line.setAttribute('x2', controlPoints[i].x.toString())
      line.setAttribute('y2', controlPoints[i].y.toString())
      line.classList.add(styles.line)
      const arr = ['#000']
      if (linesColor) {
          arr.push(linesColor)
      }
      line.style.stroke = meanColor(arr)
      parent.appendChild(line)
  }
}
