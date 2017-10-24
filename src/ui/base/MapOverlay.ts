import * as L from 'leaflet'
import { get } from 'lodash'
import * as htmlTags from 'html-tags'

type LeafletMouseEvent = L.LeafletMouseEvent

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
        const { map } = this
        const { style, classList } = this.overlayContainer
        let mousePos: L.Point | null
        classList.add('leaflet-zoom-animated')
        map.on('zoomanim', ({ target, center, zoom }: any) => {
            // console.log('zoomanim', Object.freeze(e))
            const oldZoom = map.getZoom()
            const scale = map.getZoomScale(zoom, oldZoom)
            if (scale !== 1) {
                const oldCenter = this.map.getCenter()
                if (oldCenter.equals(center)) {
                    // +/- button click
                    mousePos = L.point(innerWidth / 2, innerHeight / 2).round()
                }
                this.scaleOverlay(scale, mousePos || get(target, 'scrollWheelZoom._lastMousePos') as L.Point)
            }
            mousePos = null
        }).on('zoomend', e => {
            // console.log('zoomend', e)
            // console.log(map.project(this.network.platforms[69].location, map.getZoom()).divideBy(2 ** map.getZoom()))

            style.transform = null
            style.transformOrigin = null

            this.updateOverlayPositioning()
            map.fireEvent('overlayupdate', this)
        })

        // double click zoom
        map.on('dblclick', (e: LeafletMouseEvent) => mousePos = L.DomEvent.getMousePosition(e.originalEvent))
    }

    private updateOverlayPositioning() {
        const { map, bounds, margin } = this
        const nw = bounds.getNorthWest()
        const se = bounds.getSouthEast()
        this.topLeft = map.project(nw, map.getZoom()).round()

        const pixelBounds = L.bounds(map.latLngToLayerPoint(nw), map.latLngToLayerPoint(se))
        const { style } = this.overlayContainer
        const topLeft = (pixelBounds.min as L.Point).subtract(margin)
        style.left = topLeft.x + 'px'
        style.top = topLeft.y + 'px'

        const overlaySize = pixelBounds.getSize().add(margin).add(margin)
        style.width = overlaySize.x + 'px'
        style.height = overlaySize.y + 'px'
    }

    private scaleOverlay(scaleFactor: number, mousePos?: L.Point) {
        const { left, top } = this.overlayContainer.getBoundingClientRect()
        if (!mousePos) {
            const el = document.documentElement
            mousePos = L.point(el.clientWidth / 2, el.clientHeight / 2)
        }
        const { style } = this.overlayContainer
        // style.left = '0';
        // style.top = '0';
        style.transformOrigin = `${mousePos.x - left}px ${mousePos.y - top}px`
        style.transform = `scale(${scaleFactor})`
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
