import {
    LatLngBounds,
    point,
} from 'leaflet'

import MapOverlay from '../base/MapOverlay'
import { createSVGElement } from '../../util/svg'

import * as style from './style.css'

export default class extends MapOverlay<SVGSVGElement> {
    readonly defs: SVGDefsElement
    readonly origin: SVGGElement

    constructor(bounds: LatLngBounds, margin = point(100, 100)) {
        super(bounds, margin)

        this.overlayContainer = createSVGElement('svg')
        this.overlayContainer.classList.add(style.overlay)

        this.defs = createSVGElement('defs')
        this.overlayContainer.appendChild(this.defs)

        this.origin = createSVGElement('g')
        this.origin.id = 'origin'
        this.origin.setAttribute('transform', `translate(${this.margin.x}, ${this.margin.y})`)
        this.overlayContainer.appendChild(this.origin)
    }
}