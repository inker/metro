import { svgToDataUrl } from 'svgio'

import { createSVGElement, makeCircle } from '../../util/svg'

const root = createSVGElement('svg')
root.setAttribute('width', '100')
root.setAttribute('height', '100')
const ci = makeCircle(L.point(50, 50), 40)
ci.style.stroke = 'red'
ci.style.strokeWidth = '20px'
ci.style.fill = 'white'
root.appendChild(ci)
const r = 5

export default L.icon({
    iconUrl: svgToDataUrl(root),
    iconSize: [r * 2, r * 2],
    iconAnchor: [r, r],
    popupAnchor: [0, -r],
})
