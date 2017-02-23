import * as L from 'leaflet'
import { get } from 'lodash'
import * as htmlTags from 'html-tags'

type LeafletMouseEvent = L.LeafletMouseEvent

export default class MapOverlay<TagName extends keyof ElementTagNameMap> implements L.ILayer {
    private map: L.Map
    protected overlayContainer: ElementTagNameMap[TagName]

    private readonly bounds: L.LatLngBounds
    private topLeft: L.Point
    protected readonly margin: L.Point

    private minZoom: number
    private maxZoom: number

    constructor(tagName: TagName, bounds: L.LatLngBounds, margin = L.point(100, 100)) {
        const ns = htmlTags.includes(tagName) && tagName !== 'svg' ? 'http://www.w3.org/1999/xhtml' : 'http://www.w3.org/2000/svg'
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

        const { objectsPane, markerPane, mapPane } = map.getPanes();
        (L.version[0] === '1' ? mapPane : objectsPane).insertBefore(this.overlayContainer as any, markerPane)

        this.addMapMovementListeners()
    }

    onRemove(map: L.Map) {
        // this.map = this.minZoom = this.maxZoom = undefined
        const { objectsPane, mapPane } = map.getPanes();
        (L.version[0] === '1' ? mapPane : objectsPane).removeChild(this.overlayContainer as any)
        this.map.clearAllEventListeners() // fix later
    }

    private addMapMovementListeners() {
        const { map } = this
        const { style, classList } = this.overlayContainer as any as HTMLElement
        let mousePos: L.Point|null
        classList.add('leaflet-zoom-animated')
        map.on('zoomanim', e => {
            // console.log('zoomanim', Object.freeze(e))
            const { scale, target } = e as any
            if (scale !== 1) {
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

        // +/- button click
        map.zoomControl.getContainer()
            .addEventListener('mousedown', e => mousePos = L.point(innerWidth / 2, innerHeight / 2).round(), true)

        // double click zoom
        map.on('dblclick', (e: LeafletMouseEvent) => mousePos = L.DomEvent.getMousePosition(e.originalEvent))
    }

    private updateOverlayPositioning() {
        const nw = this.bounds.getNorthWest()
        const se = this.bounds.getSouthEast()
        const { map, margin } = this
        this.topLeft = map.project(nw).round()

        const pixelBounds = L.bounds(map.latLngToLayerPoint(nw), map.latLngToLayerPoint(se))
        const { style } = this.overlayContainer as any as HTMLElement
        const topLeft = pixelBounds.min.subtract(margin)
        style.left = topLeft.x + 'px'
        style.top = topLeft.y + 'px'

        const overlaySize = pixelBounds.getSize().add(margin).add(margin)
        style.width = overlaySize.x + 'px'
        style.height = overlaySize.y + 'px'
    }

    private scaleOverlay(scaleFactor: number, mousePos?: L.Point) {
        const { left, top } = (this.overlayContainer as any).getBoundingClientRect()
        if (!mousePos) {
            const el = document.documentElement
            mousePos = L.point(el.clientWidth / 2, el.clientHeight / 2)
        }
        const { style } = this.overlayContainer as any as  HTMLElement
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
            .project(location)
            .round()
            .subtract(this.topLeft)
    }
}
