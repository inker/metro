import * as L from 'leaflet'
import {
    fixFontRendering,
    scaleOverlay,
} from '../../util'

function fixFontDelayed(parent: Element, time = 250) {
    setTimeout(() => fixFontRendering(parent), time)
}

export default class MapOverlay<Container extends Element&{ style: CSSStyleDeclaration }> implements L.ILayer {
    private map: L.Map
    protected overlayContainer: Container

    private _bounds: L.LatLngBounds
    private topLeft: L.Point
    protected margin: L.Point

    private minZoom: number
    private maxZoom: number

    constructor(bounds: L.LatLngBounds, margin = L.point(100, 100)) {
        this.margin = margin.round()
        this._bounds = bounds
    }

    addTo(map: L.Map) {
        this.onAdd(map)
        return this
    }

    onAdd(map: L.Map) {
        this.map = map
        this.minZoom = map.getMinZoom()
        this.maxZoom = map.getMaxZoom()

        this.updateOverlayPositioning()

        const { objectsPane, markerPane, mapPane } = map.getPanes();
        (L.version[0] === '1' ? mapPane : objectsPane).insertBefore(this.overlayContainer, markerPane)

        this.addMapMovementListeners()
    }

    onRemove(map: L.Map) {
        // this.map = this.minZoom = this.maxZoom = undefined
        const { objectsPane, markerPane, mapPane } = map.getPanes();
        (L.version[0] === '1' ? mapPane : objectsPane).removeChild(this.overlayContainer)
        this.map.clearAllEventListeners() // fix later
    }

    private addMapMovementListeners(): void {
        const { map } = this
        const { mapPane, tilePane, overlayPane } = map.getPanes()
        const { style, classList } = this.overlayContainer
        let mousePos: L.Point
        map.on('zoomstart', e => {
            classList.add('leaflet-zoom-animated')
            console.log('zoomstart', e)
            map.dragging.disable()
        }).on('zoomanim', e => {
            console.log('zoomanim', e)
            const { scale, origin } = e as any
            if (scale !== 1) {
                scaleOverlay(this.overlayContainer, scale, mousePos || origin)
            }
            mousePos = null
        }).on('zoomend', e => {
            console.log('zoomend', e)
            //console.log(map.project(this.network.platforms[69].location, map.getZoom()).divideBy(2 ** map.getZoom()));

            classList.remove('leaflet-zoom-animated')
            style.transform = null
            style.transformOrigin = null

            this.updateOverlayPositioning()
            map.fireEvent('overlayupdate', this)
            map.dragging.enable()
        }).on('moveend', e => {
            fixFontRendering()
            if (L.version[0] === '1') {
                fixFontDelayed(tilePane.firstElementChild)
            } else if (overlayPane.hasChildNodes()) {
                fixFontDelayed(overlayPane, 0)
            }
        })

        const onWheel = (e: WheelEvent) => mousePos = L.DomEvent.getMousePosition(e)
        mapPane.addEventListener('wheel', onWheel)
        // controls are not a part of the map pane, so a special listener is for them
        const leafletControlContainer = document.querySelector('.leaflet-control-container')
        if (leafletControlContainer) {
            leafletControlContainer.addEventListener('wheel', onWheel)
        } else {
            console.error('cannot append wheel to leaflet-control-container')
        }

        // +/- button click
        map.zoomControl.getContainer()
            .addEventListener('mousedown', e => mousePos = L.point(innerWidth / 2, innerHeight / 2).round(), true)

        // double click zoom
        map.on('dblclick', (e: L.MouseEvent) => mousePos = L.DomEvent.getMousePosition(e.originalEvent))

        // keyboard zoom
        document.addEventListener('keydown', e => mousePos = L.point(innerWidth / 2, innerHeight / 2))
    }

    private updateOverlayPositioning(): void {
        const nw = this._bounds.getNorthWest()
        const se = this._bounds.getSouthEast()
        const { map, margin } = this
        this.topLeft = map.project(nw).round()

        const pixelBounds = L.bounds(map.latLngToLayerPoint(nw), map.latLngToLayerPoint(se))
        const { style } = this.overlayContainer
        const topLeft = pixelBounds.min.subtract(margin)
        style.left = topLeft.x + 'px'
        style.top = topLeft.y + 'px'

        const overlaySize = pixelBounds.getSize().add(margin).add(margin)
        style.width = overlaySize.x + 'px'
        style.height = overlaySize.y + 'px'
    }

    extendBounds(point: L.LatLng) {
        this._bounds.extend(point)
        this.updateOverlayPositioning()
    }

    latLngToSvgPoint(location: L.LatLng): L.Point {
        return this.map
            .project(location)
            .round()
            .subtract(this.topLeft)
    }
}
