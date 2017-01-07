import * as L from 'leaflet'
import * as alertify from 'alertifyjs'

import MetroMap from '../MetroMap'
import * as util from '../util'
import {
    Icons,
    cacheIcons,
} from './index'
import { Widget } from './base/Widget'

const { sfx } = util
const { shortestRoute } = util.algorithm

export default class implements Widget {
    private metroMap: MetroMap
    private fromMarker: L.Marker
    private toMarker: L.Marker

    constructor() {
        this.fromMarker = L.marker([0, 0], { draggable: true, icon: Icons.Start })
        this.toMarker = L.marker([0, 0], { draggable: true, icon: Icons.End })
        this.addMarkerListeners()
    }

    addTo(metroMap: MetroMap) {
        this.metroMap = metroMap
        const map = metroMap.getMap()
        const center = map.getCenter()
        this.fromMarker.setLatLng(center)
        this.toMarker.setLatLng(center)
        cacheIcons(map, [this.fromMarker, this.toMarker])
        metroMap.subscribe('routefrom routeto', this.handleFromTo.bind(this))
        metroMap.subscribe('clearroute', e => this.clearRoute())
        map.on('zoomstart', e => sfx.Animation.terminateAnimations())
        addEventListener('keydown', e => {
            if (e.keyCode !== 27) return
            metroMap.publish(new Event('clearroute'))
        })
        return this
    }

    private handleFromTo(e: MouseEvent) {
        const map = this.metroMap.getMap()
        const coors = util.mouseToLatLng(map, e)
        const marker = e.type === 'routefrom' ? this.fromMarker : this.toMarker
        marker.setLatLng(coors)
        if (!map.hasLayer(marker)) {
            map.addLayer(marker)
        }
        const otherMarker = marker === this.fromMarker ? this.toMarker : this.fromMarker
        if (map.hasLayer(otherMarker)) {
            // fixing font rendering here boosts the performance
            util.fixFontRendering()
            this.visualizeRouteBetween(this.fromMarker.getLatLng(), this.toMarker.getLatLng())
            //this.map.once('zoomend', e => this.visualizeShortestRoute(latLngArr));
            //this.map.fitBounds(L.latLngBounds(latLngArr));
        }
    }

    private addMarkerListeners(): void {
        for (let marker of [this.fromMarker, this.toMarker]) {
            marker.on('drag', e => this.visualizeShortestRoute(false)).on('dragend', e => {
                util.fixFontRendering()
                this.visualizeShortestRoute()
            })
        }
    }

    private visualizeShortestRoute(animate = true) {
        const map = this.metroMap.getMap()
        if (!map.hasLayer(this.fromMarker) || !map.hasLayer(this.toMarker)) return
        this.visualizeRouteBetween(this.fromMarker.getLatLng(), this.toMarker.getLatLng(), animate)
    }

    private visualizeRouteBetween(from: L.LatLng, to: L.LatLng, animate = true) {
        util.resetStyle()
        alertify.dismissAll()
        sfx.visualizeRoute(shortestRoute(this.metroMap.getNetwork().platforms, from, to), animate)
    }

    private clearRoute() {
        const map = this.metroMap.getMap()
        const terminate = sfx.Animation.terminateAnimations()
        map.removeLayer(this.fromMarker).removeLayer(this.toMarker)
        this.fromMarker.off('drag').off('dragend')
        this.toMarker.off('drag').off('dragend')
        alertify.dismissAll()
        terminate.then(util.resetStyle)
    }

}