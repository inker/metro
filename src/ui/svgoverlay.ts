/// <reference path="../../typings/tsd.d.ts" />
import * as L from 'leaflet';
import MapOverlay from './base/mapoverlay';
import { createSVGElement } from '../util/svg';

export default class extends MapOverlay<SVGSVGElement> {
    private _defs: SVGDefsElement;
    private _origin: SVGGElement;

    get origin() { return this._origin; }
    get defs() { return this._defs; }

    constructor(bounds?: L.LatLngBounds, margin = new L.Point(100, 100)) {
        super(bounds, margin);

        this.overlayContainer = createSVGElement('svg') as SVGSVGElement;
        this.overlayContainer.id = 'overlay';

        this._defs = createSVGElement('defs') as SVGDefsElement;
        this.overlayContainer.appendChild(this._defs);

        this._origin = createSVGElement('g') as SVGGElement;
        this._origin.id = 'origin';
        this.overlayContainer.appendChild(this._origin);
    }

    protected additionalUpdate() {
        console.log('gets called');
        //TODO: test which one is faster
        // transform may not work with svg elements
        //origin.setAttribute('x', margin.x + 'px');
        //origin.setAttribute('y', margin.y + 'px');
        this._origin.setAttribute('transform', `translate(${this.margin.x}, ${this.margin.y})`);
        //origin.style.transform = `translate(${margin.x}px, ${margin.y}px)`;
        //origin.style.left = margin.x + 'px';
        //origin.style.top = margin.y + 'px';        
    }
}