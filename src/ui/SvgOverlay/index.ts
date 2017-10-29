import { LatLngBounds, point } from 'leaflet'

import MapOverlay from '../base/MapOverlay'
import { createSVGElement } from '../../util/svg'

import styles from './styles.pcss'

export default class extends MapOverlay<'svg'> {
    readonly defs: SVGDefsElement
    readonly origin: SVGGElement

    constructor(bounds: LatLngBounds, margin = point(100, 100)) {
        super('svg', bounds, margin)

        this.defs = createSVGElement('defs')

        const origin = createSVGElement('g')
        origin.setAttribute('transform', `translate(${this.margin.x}, ${this.margin.y})`)
        this.origin = origin

        const { overlayContainer } = this
        overlayContainer.classList.add(styles.overlay)
        overlayContainer.appendChild(this.defs)
        overlayContainer.appendChild(origin)
    }
}
