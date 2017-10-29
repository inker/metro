import * as L from 'leaflet'
import { get } from 'lodash'
import * as htmlTags from 'html-tags'

const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml'
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

export default class MapOverlay<TagName extends keyof ElementTagNameMap> {
    private map: L.Map
    protected overlayContainer: ElementTagNameMap[TagName]

    private readonly bounds: L.LatLngBounds
    private topLeft: L.Point
    protected readonly margin: L.Point

    private minZoom: number
    private maxZoom: number

    private mousePos: L.Point | null

    constructor(tagName: TagName, bounds: L.LatLngBounds, margin = L.point(100, 100)) {
        const ns = htmlTags.includes(tagName) && tagName !== 'svg' ? HTML_NAMESPACE : SVG_NAMESPACE
        this.overlayContainer = document.createElementNS(ns, tagName) as any
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
        const { markerPane, mapPane } = map.getPanes()
        mapPane.insertBefore(this.overlayContainer, markerPane)
        this.addMapMovementListeners()
    }

    onRemove(map: L.Map) {
        // this.map = this.minZoom = this.maxZoom = undefined
        map.getPanes().mapPane.removeChild(this.overlayContainer)
        this.map.clearAllEventListeners() // fix later
    }

    private addMapMovementListeners() {
        this.overlayContainer.classList.add('leaflet-zoom-animated')
        this.map
            .on('zoomanim', this.onZoomAnim as any)
            .on('zoomend', this.onZoomEnd)
            .on('dblclick', this.onDoubleClick)
    }

    private onDoubleClick = (e: L.LeafletMouseEvent) => {
        // double click zoom
        this.mousePos = this.map.mouseEventToContainerPoint(e.originalEvent)
    }

    private onZoomAnim = ({ target, center, zoom }) => {
        const { map } = this
        const oldZoom = map.getZoom()
        if (zoom !== oldZoom) {
            const scale = map.getZoomScale(zoom, oldZoom)
            const oldCenter = map.getCenter()
            if (center.equals(oldCenter)) {
                this.mousePos = L.point(innerWidth / 2, innerHeight / 2).round()
            } else if (!this.mousePos) {
                this.mousePos = get(target, 'scrollWheelZoom._lastMousePos')
            }
            this.scaleOverlay(scale)
        }
        this.mousePos = null
    }

    private onZoomEnd = () => {
        this.map.fireEvent('overlayupdate', {
            zoom: this.map.getZoom(),
            reset: this.updateOverlayPositioning,
        })
    }

    private updateOverlayPositioning = () => {
        const { style } = this.overlayContainer

        style.transform = null
        style.transformOrigin = null
        const { map, bounds, margin } = this
        const nw = bounds.getNorthWest()
        const se = bounds.getSouthEast()
        this.topLeft = map.project(nw, map.getZoom()).round()

        const pixelBounds = L.bounds(map.latLngToLayerPoint(nw), map.latLngToLayerPoint(se))
        const topLeft = (pixelBounds.min as L.Point).subtract(margin)
        style.left = topLeft.x + 'px'
        style.top = topLeft.y + 'px'

        const overlaySize = pixelBounds.getSize().add(margin).add(margin)
        style.width = overlaySize.x + 'px'
        style.height = overlaySize.y + 'px'
    }

    private scaleOverlay(scaleFactor: number) {
        const nw = this.bounds.getNorthWest()
        const boxTopLeft = this.map.latLngToContainerPoint(nw).subtract(this.margin)
        if (!this.mousePos) {
            const el = document.documentElement
            this.mousePos = L.point(el.clientWidth / 2, el.clientHeight / 2)
        }
        const o = this.mousePos.subtract(boxTopLeft)
        const { style } = this.overlayContainer
        // style.transformOrigin += `${o.x}px ${o.y}px`
        style.transform += `translate(${o.x / 2}px, ${o.y / 2}px) scale(${scaleFactor})`
    }

    extendBounds(point: L.LatLng) {
        this.bounds.extend(point)
        this.updateOverlayPositioning()
    }

    latLngToOverlayPoint(location: L.LatLng): L.Point {
        return this.map
            .project(location, this.map.getZoom())
            .round()
            .subtract(this.topLeft)
    }
}
