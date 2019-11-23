import { LatLngBounds } from 'leaflet'

import MapOverlay from 'ui/base/MapOverlay'
import { createSVGElement } from 'utils/svg'

import styles from './styles.pcss'

export default class extends MapOverlay<'svg'> {
    readonly defs: SVGDefsElement
    readonly origin: SVGGElement

    constructor(bounds: LatLngBounds) {
        super('svg', bounds)

        this.defs = createSVGElement('defs')
        this.origin = createSVGElement('g')

        const { overlayContainer } = this
        overlayContainer.classList.add(styles.overlay)
        overlayContainer.appendChild(this.defs)
        overlayContainer.appendChild(this.origin)
    }
}
