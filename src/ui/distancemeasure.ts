import * as L from 'leaflet'

import * as util from '../util'
import { Icons } from '../ui'

export default class implements L.ILayer {
    private map: L.Map
    private polyline = L.polyline([], { color: 'red'})
    private markers = L.featureGroup().on('layeradd layerremove', e => util.fixFontRendering())
    private dashedLine = L.polyline([], { color: 'red', opacity: 0.5, dashArray: '0,9' })

    onAdd(map: L.Map) {
        this.map = map
        const measureListener = (e: MouseEvent) => this.measureDistance(util.mouseToLatLng(map, e))
        map.fireEvent('distancemeasureinit')
        map.on('measuredistance', (e: MouseEvent) => this.measureDistance(util.mouseToLatLng(map, e)))
        map.on('clearmeasurements', (e: MouseEvent) => this.clearMeasurements())
        return this
    }

    onRemove(map: L.Map) {

    }
    addTo(map: L.Map) {
        this.onAdd(map)
        return this
    }

    private updateDistances() {
        const latlngs = this.polyline.getLatLngs()
        const markers = this.markers.getLayers() as L.Marker[]
        const nMarkers = markers.length
        latlngs[0] = markers[0].setPopupContent('0').getLatLng()
        for (let i = 1, distance = 0; i < nMarkers; ++i) {
            const currentLatLng = markers[i].getLatLng()
            latlngs[i] = currentLatLng
            distance += markers[i - 1].getLatLng().distanceTo(currentLatLng)
            const d = Math.round(distance)
            const str = d < 1000 ? d + ' m' : (d < 10000 ? d / 1000 : Math.round(d / 10) / 100) + ' km'
            markers[i].setPopupContent(str)
        }
        if (latlngs.length > nMarkers) {
            latlngs.length = nMarkers
        }
        this.dashedLine.getLatLngs()[0] = latlngs[latlngs.length - 1]
        this.polyline.redraw()
        if (nMarkers > 1) {
            markers[nMarkers - 1].openPopup()
        }
    }

    private showDashedLine() {
        this.dashedLine.setStyle({ opacity: 0.5 })
    }

    private hideDashedLine() {
        this.dashedLine.setStyle({ opacity: 0 })
    }

    private onCircleClick(e: L.MouseEvent) {
        if (e.originalEvent.button !== 0) return
        this.markers.removeLayer(e.target)
        if (this.markers.getLayers().length === 0) {
            this.map.fire('clearmeasurements')
            return
        }
        this.updateDistances()
        if (!this.map.hasLayer(this.dashedLine)) {
            this.showDashedLine()
        }
    }

    private makeMarker = (e: L.MouseEvent) => {
        if (e.originalEvent.button !== 0) return
        const handleDrag = e => {
            this.dashedLine.setStyle({ opacity: 0})
            this.updateDistances()
        }
        const marker = L.marker(e.latlng, { draggable: true })
            .setIcon(Icons.Circle)
            .bindPopup('')
            .on('mouseover', e => this.hideDashedLine())
            .on('mouseout', e => this.showDashedLine())
            .on('drag', handleDrag)
            .on('click', this.onCircleClick.bind(this))
        // const el = { lang: { ru: 'Udaliť izmerenia', en: 'Delete measurements' } };
        // this.metroMap.contextMenu.extraItems.set(circle, new Map().set('deletemeasurements', el));
        this.markers.addLayer(marker)
        this.updateDistances()
    }

    private resetDashedLine = (e: L.MouseEvent) => {
        this.dashedLine.getLatLngs()[1] = e.latlng
        this.dashedLine.redraw()
    }

    private measureDistance(initialCoordinate: L.LatLng) {
        this.dashedLine.addLatLng(initialCoordinate).addLatLng(initialCoordinate)
        this.map
            .addLayer(this.polyline.setLatLngs([]))
            .addLayer(this.markers)
            .addLayer(this.dashedLine.setLatLngs([]))
            .on('click', this.makeMarker)
            .on('mousemove', this.resetDashedLine)
            .fire('click', { latlng: initialCoordinate, originalEvent: { button: 0 } })
        util.onceEscapePress(e => this.map.fire('clearmeasurements'))
    }

    private clearMeasurements() {
        this.map
            .removeLayer(this.polyline)
            .removeLayer(this.markers.clearLayers())
            .removeLayer(this.dashedLine)
            .off('mousemove', this.resetDashedLine)
            .off('click', this.makeMarker)
    }
}
