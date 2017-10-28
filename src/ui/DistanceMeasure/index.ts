import * as L from 'leaflet'
import { last } from 'lodash'

import { RedCircle } from '../Icons'
import { onceEscapePress } from '../../util/events'

import styles from './styles.pcss'

export default class DistanceMeasure {
    private map: L.Map
    private readonly polyline = L.polyline([], {
        color: 'red',
    })
    private readonly markers = L.featureGroup()
    private readonly dashedLine = L.polyline([], {
        color: 'red',
        opacity: 0.5,
        dashArray: '0,9',
        className: styles['dashed-line'],
    })

    onAdd(map: L.Map) {
        this.map = map
        map.fireEvent('distancemeasureinit')
        map.on('measuredistance', (e: MouseEvent) => this.measureDistance(map.mouseEventToLatLng(e)))
        return this
    }

    onRemove(map: L.Map) {
        // TODO
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
            const str = d < 1000 ? `${d} m` : `${d < 10000 ? d / 1000 : Math.round(d / 10) / 100} km`
            markers[i].setPopupContent(str)
        }
        if (latlngs.length > nMarkers) {
            latlngs.length = nMarkers
        }
        const dashedLingLatLngs = this.dashedLine.getLatLngs()
        dashedLingLatLngs[0] = last(latlngs) as L.LatLng
        this.dashedLine.setLatLngs(dashedLingLatLngs)

        this.polyline.setLatLngs(latlngs)
        this.polyline.redraw()
        this.openLastMarkerPopup()
    }

    private openLastMarkerPopup() {
        const markers = this.markers.getLayers()
        if (markers.length < 2) {
            return
        }
        const lastMarker = last(markers)
        if (!lastMarker || !(lastMarker instanceof L.Marker)) {
            return
        }
        lastMarker.openPopup()
    }

    private showDashedLine = () => {
        this.dashedLine.setStyle({ opacity: 0.5 })
    }

    private hideDashedLine = () => {
        this.dashedLine.setStyle({ opacity: 0 })
    }

    private handleDrag = () => {
        this.dashedLine.setStyle({ opacity: 0})
        this.updateDistances()
    }

    private onCircleClick = (e: L.LeafletMouseEvent) => {
        if (e.originalEvent.button !== 0) {
            return
        }
        this.markers.removeLayer(e.target)
        if (this.markers.getLayers().length === 0) {
            this.clearMeasurements()
            return
        }
        this.updateDistances()
        if (!this.map.hasLayer(this.dashedLine)) {
            this.showDashedLine()
        }
    }

    private makeMarker = (e: L.LeafletMouseEvent) => {
        if (e.originalEvent.button !== 0) {
            return
        }
        const marker = L.marker(e.latlng, { draggable: true })
            .setIcon(RedCircle)
            .bindPopup('')
            .on('mouseover', this.hideDashedLine)
            .on('mouseout', this.showDashedLine)
            .on('drag', this.handleDrag)
            .on('click', this.onCircleClick)
        // const el = { lang: { ru: 'Udaliť izmerenia', en: 'Delete measurements' } };
        // this.metroMap.contextMenu.extraItems.set(circle, new Map().set('deletemeasurements', el));
        this.markers.addLayer(marker)
        this.updateDistances()
    }

    private resetDashedLine = (e: L.LeafletMouseEvent) => {
        const dashedLingLatLngs = this.dashedLine.getLatLngs()
        dashedLingLatLngs[1] = e.latlng
        this.dashedLine.setLatLngs(dashedLingLatLngs)
        this.dashedLine.redraw()
    }

    private clearMeasurements = () => {
        this.map.fire('clearmeasurements')
        this.map.getPanes().overlayPane.style.zIndex = '-1000'
        this.map
            .removeLayer(this.polyline)
            .removeLayer(this.markers.clearLayers())
            .removeLayer(this.dashedLine)
            .off('mousemove', this.resetDashedLine)
            .off('click', this.makeMarker)
    }

    private measureDistance(initialCoordinate: L.LatLng) {
        this.map.getPanes().overlayPane.style.zIndex = ''
        // this.dashedLine.addLatLng(initialCoordinate).addLatLng(initialCoordinate)
        this.map
            .addLayer(this.polyline.setLatLngs([]))
            .addLayer(this.markers)
            .addLayer(this.dashedLine.setLatLngs([]))
            .on('click', this.makeMarker)
            .on('mousemove', this.resetDashedLine)
            .fire('click', { latlng: initialCoordinate, originalEvent: { button: 0 } })
        onceEscapePress(this.clearMeasurements)
    }
}
