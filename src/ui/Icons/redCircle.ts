import { point, icon } from 'leaflet'
import { svgToDataUrl } from 'svgio'

import { createSVGElement, makeCircle } from '../../util/svg'

export default (radius: number) => {
    const root = createSVGElement('svg')
    root.setAttribute('width', '100')
    root.setAttribute('height', '100')
    const ci = makeCircle(point(50, 50), 40)
    const { style } = ci
    style.stroke = 'red'
    style.strokeWidth = '20px'
    style.fill = 'white'
    root.appendChild(ci)

    const diameter = radius * 2
    return icon({
        iconUrl: svgToDataUrl(root),
        iconSize: [diameter, diameter],
        iconAnchor: [radius, radius],
        popupAnchor: [0, -radius],
    })
}
