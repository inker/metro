/// <reference path="../typings/tsd.d.ts" />
import * as L from 'leaflet';
import * as util from './util';
import { createSVGElement } from './svg';

export default class MapOverlay {
    private map: L.Map;
    private _bounds: L.LatLngBounds;
    private minZoom: number;
    private maxZoom: number;
    private zoomChangeListener: (e: L.LeafletEvent) => void;
    private _overlayContainer: SVGSVGElement;
    private _defs: SVGDefsElement;
    private _origin: SVGGElement;
    private topLeft: L.Point;
    private margin: L.Point;

    get origin() { return this._origin; }
    get defs() { return this._defs; }

    set bounds(bounds: L.LatLngBounds) {
        this._bounds = bounds;
        this.updateOverlayPositioning();
    }

    constructor(map: L.Map, bounds?: L.LatLngBounds, margin = new L.Point(100, 100)) {
        this.map = map;
        this.minZoom = map.getMinZoom();
        this.maxZoom = map.getMaxZoom();
        this.margin = margin.round();

        this.makeAndFillContainer();

        if (bounds !== undefined) {
            this.bounds = bounds;
        }

        const { objectsPane, markerPane, mapPane } = this.map.getPanes();
        (L.version[0] === '1' ? mapPane : objectsPane).insertBefore(this._overlayContainer, markerPane);
        
        this.addMapMovementListeners();
    }

    private makeAndFillContainer(): void {
        this._overlayContainer = createSVGElement('svg') as SVGSVGElement;
        this._overlayContainer.id = 'overlay';

        this._defs = createSVGElement('defs') as SVGDefsElement;
        this._overlayContainer.appendChild(this._defs);

        this._origin = createSVGElement('g') as SVGGElement;
        this._origin.id = 'origin';
        this._overlayContainer.appendChild(this._origin);
    }

    private addMapMovementListeners(): void {
        const { mapPane, tilePane, overlayPane } = this.map.getPanes();
        const { style, classList } = this._overlayContainer;
        const fixFontDelayed = (parent: Element, time = 250) => setTimeout(() => util.fixFontRendering(parent), time);
        let scaleFactor = 1, mousePos: L.Point;
        this.map.on('zoomstart', e => {
            classList.add('leaflet-zoom-animated');
            console.log('zoomstart', e);
            this.map.dragging.disable();
            //fromZoom = e.target['_zoom'];
            if (scaleFactor !== 1) {
                //mousePos = e.target['scrollWheelZoom']['_lastMousePos'];
                console.log('mousepos:', mousePos);
                util.scaleOverlay(this._overlayContainer, scaleFactor, mousePos);
            }
            scaleFactor = 1;
        }).on('zoomanim', e => {
            // const toZoom: number = e['zoom'];
            // scaleFactor = 2 ** (toZoom - fromZoom);
            // util.scaleOverlay(this.overlay, scaleFactor, mousePos);
        }).on('zoomend', e => {
            scaleFactor = 1;
            console.log('zoomend', e);
            //console.log(this.map.project(this.network.platforms[69].location, this.map.getZoom()).divideBy(2 ** this.map.getZoom()));
            style.transformOrigin = null;
            classList.remove('leaflet-zoom-animated' );

            this.updateOverlayPositioning();
            this.zoomChangeListener(e);
            this.map.dragging.enable();
        }).on('moveend', e => {
            util.fixFontRendering();
            if (L.version[0] === '1') {
                fixFontDelayed(tilePane.firstElementChild);
            } else if (overlayPane.hasChildNodes()) {
                fixFontDelayed(overlayPane, 0);
            }
            // the secret of correct positioning is the movend transform check for corrent transform
            style.transform = null;
        }).on('layeradd layerremove', () => util.fixFontRendering());
        
        const changeScaleFactor = (isZoomIn: boolean) => {
            const oldZoom = this.map.getZoom();
            scaleFactor = isZoomIn ?
                Math.min(scaleFactor * 2, 2 ** (this.maxZoom - oldZoom)) :
                Math.max(scaleFactor / 2, 2 ** (this.minZoom - oldZoom));            
        }

        const onWheel = (e: WheelEvent) => {
            mousePos = L.DomEvent.getMousePosition(e);
            //scaleFactor *= e.deltaY < 0 ? 2 : 0.5;
            changeScaleFactor(e.deltaY < 0);
            //this.map.setZoomAround(util.mouseToLatLng(this.map, e), e.deltaY < 0 ? zoom + 1 : zoom - 1);
        };
        mapPane.addEventListener('wheel', onWheel);
        // controls are not a part of the map pane, so a special listener is for them
        document.querySelector('.leaflet-control-container').addEventListener('wheel', onWheel);

        // +/- button click
        const zoomContainer = this.map.zoomControl.getContainer();
        zoomContainer.addEventListener('mousedown', e => {
            mousePos = new L.Point(innerWidth / 2, innerHeight / 2).round();
            changeScaleFactor(e.target === zoomContainer.firstChild);
        }, true);

        // double click zoom
        this.map.on('dblclick', (e: L.LeafletMouseEvent) => {
            const o = e.originalEvent;
            mousePos = L.DomEvent.getMousePosition(o);
            changeScaleFactor(!o.shiftKey);
        });

        // keyboard zoom
        document.addEventListener('keydown', e => {
            mousePos = new L.Point(innerWidth / 2, innerHeight / 2);
            const i = [189, 109, 54, 173, 187, 107, 61, 171].indexOf(e.keyCode);
            if (i !== -1) {
                changeScaleFactor(i > 3);
            }
        });
    }

    private updateOverlayPositioning(): void {
        const nw = this._bounds.getNorthWest(),
            se = this._bounds.getSouthEast();
        this.topLeft = this.map.project(nw).round();

        const pixelBounds = new L.Bounds(this.map.latLngToLayerPoint(nw), this.map.latLngToLayerPoint(se));
        const { style } = this._overlayContainer;
        const topLeft = pixelBounds.min.subtract(this.margin);
        style.left = topLeft.x + 'px';
        style.top = topLeft.y + 'px';
        
        //TODO: test which one is faster
        // transform may not work with svg elements
        //origin.setAttribute('x', margin.x + 'px');
        //origin.setAttribute('y', margin.y + 'px');
        this._origin.setAttribute('transform', `translate(${this.margin.x}, ${this.margin.y})`);
        //origin.style.transform = `translate(${margin.x}px, ${margin.y}px)`;
        //origin.style.left = margin.x + 'px';
        //origin.style.top = margin.y + 'px';

        const overlaySize = pixelBounds.getSize().add(this.margin).add(this.margin);
        style.width = overlaySize.x + 'px';
        style.height = overlaySize.y + 'px';
    }

    onZoomChange(listener: (e: L.LeafletEvent) => void): void {
        this.zoomChangeListener = listener;
    }

    latLngToSvgPoint(location: L.LatLng): L.Point {
        // return this.map.latLngToContainerPoint(location)
        //             .subtract(this.map.latLngToContainerPoint(this.bounds.getNorthWest()));
        return this.map
            .project(location)
            .round()
            .subtract(this.topLeft)
            .round();
    }
}