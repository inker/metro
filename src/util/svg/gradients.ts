import { Point } from 'leaflet'
import { createSVGElement } from './index'

function makeUndirectedLinear(colors: string[]): SVGLinearGradientElement {
    // @ts-ignore
    const gradient = createSVGElement('linearGradient')
    gradient.innerHTML = colors.map(color => `
        <stop style="stop-color:${color}" />
    `).join('')
    return gradient
}

export function makeLinear(vector: Point, colors: string[], offset = 0): SVGLinearGradientElement {
    const gradient = makeUndirectedLinear(colors)
    setOffset(gradient, offset)
    setDirection(gradient, vector)
    return gradient
}

export function setDirection(gradient: Element, vector: Point) {
    const rotate = `rotate(${Math.atan2(vector.y, vector.x) * 180 / Math.PI}, 0.5, 0.5)`
    gradient.setAttribute('gradientTransform', rotate)
}

export function setOffset(gradient: Element, offset: number) {
    (gradient.firstChild as SVGStopElement).setAttribute('offset', offset.toString());
    (gradient.lastChild as SVGStopElement).setAttribute('offset', (1 - offset).toString())
}
