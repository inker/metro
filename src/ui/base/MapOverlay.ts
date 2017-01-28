import * as L from 'leaflet'
import { fixFontRendering } from '../../util'

type LeafletMouseEvent = L.LeafletMouseEvent

function fixFontDelayed(parent: Element, time = 250) {
    setTimeout(() => fixFontRendering(parent), time)
}

type ElementWithStyle = Element&{ style: CSSStyleDeclaration }
export default class MapOverlay<Container extends ElementWithStyle> implements L.ILayer {
    private map: L.Map
    protected overlayContainer: Container

    private readonly bounds: L.LatLngBounds
    private topLeft: L.Point
    protected readonly margin: L.Point

    private minZoom: number
    private maxZoom: number

    constructor(bounds: L.LatLngBounds, margin = L.point(100, 100)) {
        this.margin = margin.round()
        this.bounds = bounds
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
        const { objectsPane, mapPane } = map.getPanes();
        (L.version[0] === '1' ? mapPane : objectsPane).removeChild(this.overlayContainer)
        this.map.clearAllEventListeners() // fix later
    }

    private addMapMovementListeners() {
        const { map } = this
        const { mapPane, tilePane, overlayPane } = map.getPanes()
        const { style, classList } = this.overlayContainer
        let mousePos: L.Point|null
        map.on('zoomstart', e => {
            classList.add('leaflet-zoom-animated')
            console.log('zoomstart', e)
            map.dragging.disable()
        }).on('zoomanim', e => {
            console.log('zoomanim', e)
            const { scale, origin } = e as any
            if (scale !== 1) {
                this.scaleOverlay(scale, mousePos || origin)
            }
            mousePos = null
        }).on('zoomend', e => {
            console.log('zoomend', e)
            // console.log(map.project(this.network.platforms[69].location, map.getZoom()).divideBy(2 ** map.getZoom()))

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
        map.on('dblclick', (e: LeafletMouseEvent) => mousePos = L.DomEvent.getMousePosition(e.originalEvent))

        // keyboard zoom
        document.addEventListener('keydown', e => mousePos = L.point(innerWidth / 2, innerHeight / 2))
    }

    private updateOverlayPositioning() {
        const nw = this.bounds.getNorthWest()
        const se = this.bounds.getSouthEast()
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

    private scaleOverlay(
        scaleFactor: number,
        mousePos?: L.Point,
    ) {
        const box = this.overlayContainer.getBoundingClientRect()
        if (!mousePos) {
            const el = document.documentElement
            mousePos = L.point(el.clientWidth / 2, el.clientHeight / 2)
        }
        const clickOffset = L.point(mousePos.x - box.left, mousePos.y - box.top)
        const ratio = L.point(clickOffset.x / box.width, clickOffset.y / box.height)
        const { style } = this.overlayContainer
        // style.left = '0';
        // style.top = '0';
        style.transformOrigin = `${ratio.x * 100}% ${ratio.y * 100}%`
        style.transform = `scale(${scaleFactor})`
    }

    extendBounds(point: L.LatLng) {
        this.bounds.extend(point)
        this.updateOverlayPositioning()
    }

    latLngToSvgPoint(location: L.LatLng): L.Point {
        return this.map
            .project(location)
            .round()
            .subtract(this.topLeft)
    }
}
