import { LatLngBounds, point } from 'leaflet'

import MapOverlay from 'ui/base/MapOverlay'
import { createSVGElement } from 'utils/svg'

import styles from './styles.pcss'

export default class extends MapOverlay<'svg'> {
    readonly defs: SVGDefsElement
    readonly origin: SVGGElement
    readonly dummy: SVGGElement

    constructor(bounds: LatLngBounds, margin = point(100, 100)) {
        super('svg', bounds, margin)

        this.defs = createSVGElement('defs')

        const origin = createSVGElement('g')
        origin.setAttribute('transform', `translate(${this.margin.x}, ${this.margin.y})`)
        this.origin = origin

        const dummy = createSVGElement('g')
        dummy.setAttribute('transform', `translate(${this.margin.x}, ${this.margin.y})`)
        // dummy.setAttribute('stroke', 'red')
        dummy.style.fillOpacity = '0'
        this.dummy = dummy

        const { overlayContainer } = this
        overlayContainer.classList.add(styles.overlay)
        overlayContainer.appendChild(this.defs)
        overlayContainer.appendChild(origin)
        overlayContainer.appendChild(dummy)
    }
}
