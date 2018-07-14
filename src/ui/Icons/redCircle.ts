import { point, icon } from 'leaflet'
import { svgToDataUrl } from 'svgio'

import { createSVGElement, makeCircle } from 'utils/svg'

const SVG_SIZE = 100

const sizeStr = SVG_SIZE.toString()
const halfSize = SVG_SIZE / 2
const offset = SVG_SIZE / 10

export default (radius: number) => {
    const root = createSVGElement('svg')
    root.setAttribute('width', sizeStr)
    root.setAttribute('height', sizeStr)

    const ci = makeCircle(point(halfSize, halfSize), halfSize - offset)
    const { style } = ci
    style.stroke = 'red'
    style.strokeWidth = `${offset * 2}px`
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
