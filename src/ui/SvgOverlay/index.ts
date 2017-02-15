import { LatLngBounds, point } from 'leaflet'

import MapOverlay from '../base/MapOverlay'
import { createSVGElement } from '../../util/svg'

import * as style from './style.css'

export default class extends MapOverlay<SVGSVGElement> {
    readonly defs: SVGDefsElement
    readonly origin: SVGGElement

    constructor(bounds: LatLngBounds, margin = point(100, 100)) {
        super(bounds, margin)

        this.defs = createSVGElement('defs')

        const origin = createSVGElement('g')
        origin.id = 'origin'
        origin.setAttribute('transform', `translate(${this.margin.x}, ${this.margin.y})`)
        this.origin = origin

        const overlayContainer = createSVGElement('svg')
        overlayContainer.classList.add(style.overlay)
        overlayContainer.appendChild(this.defs)
        overlayContainer.appendChild(origin)
        this.overlayContainer = overlayContainer
    }
}
