import { point, icon } from 'leaflet'
import { svgToDataUrl } from 'svgio'

import { createSVGElement, makeCircle } from '../../util/svg'

const R = 5
const D = R * 2

const root = createSVGElement('svg')
root.setAttribute('width', '100')
root.setAttribute('height', '100')
const ci = makeCircle(point(50, 50), 40)
const { style } = ci
style.stroke = 'red'
style.strokeWidth = '20px'
style.fill = 'white'
root.appendChild(ci)

export default icon({
    iconUrl: svgToDataUrl(root),
    iconSize: [D, D],
    iconAnchor: [R, R],
    popupAnchor: [0, -R],
})
