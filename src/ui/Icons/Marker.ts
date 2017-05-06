import { point, icon, bounds } from 'leaflet'
import { svgToDataUrl } from 'svgio'

import {
    createSVGElement,
    makePolygon,
    makeCircle,
} from '../../util/svg'

function makeTextLabel(text: string) {
    const label = createSVGElement('text')
    label.setAttribute('x', '10')
    label.setAttribute('y', '15')
    const { style } = label
    style.fill = '#fff'
    style.opacity = '1'
    style.textAnchor = 'middle'
    style.fontFamily = 'Corbel, Verdana, Ubuntu'
    style.fontSize = '12px'
    label.textContent = text
    return label
}

export default (color: string, text?: string) => {
    const root = createSVGElement('svg')
    root.setAttribute('width', '20')
    root.setAttribute('height', '30')
    const a = point(3, 12)
    const c = point(10, 29)
    const b = point(17, 12)
    const triangle = makePolygon([c, a, b])
    triangle.style.fill = color

    const circle = makeCircle(point(10, 10), 9)
    circle.style.fill = color

    root.appendChild(triangle)
    root.appendChild(circle)

    if (text) {
        const label = makeTextLabel(text)
        root.appendChild(label)
    }

    return icon({
        iconUrl: svgToDataUrl(root),
        iconAnchor: c,
        popupAnchor: a.add(b).divideBy(2),
    })
}
