import * as L from 'leaflet'

import MapOverlay from './base/MapOverlay'
import { createSVGElement } from '../util/svg'

export default class extends MapOverlay<SVGSVGElement> {
    private _defs: SVGDefsElement
    private _origin: SVGGElement

    get origin() { return this._origin }
    get defs() { return this._defs }

    constructor(bounds: L.LatLngBounds, margin = L.point(100, 100)) {
        super(bounds, margin)

        this.overlayContainer = createSVGElement('svg') as SVGSVGElement
        this.overlayContainer.id = 'overlay'

        this._defs = createSVGElement('defs') as SVGDefsElement
        this.overlayContainer.appendChild(this._defs)

        this._origin = createSVGElement('g') as SVGGElement
        this._origin.id = 'origin'
        this._origin.setAttribute('transform', `translate(${this.margin.x}, ${this.margin.y})`)
        this.overlayContainer.appendChild(this._origin)
    }
}