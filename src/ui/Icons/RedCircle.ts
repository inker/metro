import {
    file,
    svg,
} from '../../util'

const root = svg.createSVGElement('svg') as SVGSVGElement
root.setAttribute('width', '100')
root.setAttribute('height', '100')
const ci = svg.makeCircle(L.point(50, 50), 40)
ci.style.stroke = 'red'
ci.style.strokeWidth = '20px'
ci.style.fill = 'white'
root.appendChild(ci)
const r = 5
export default L.icon({
    iconUrl: file.svgToDataUrl(root),
    iconSize: [r * 2, r * 2],
    iconAnchor: [r, r],
    popupAnchor: [0, -r],
})
