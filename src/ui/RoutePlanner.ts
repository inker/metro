import { Marker, marker, LatLng } from 'leaflet'
import * as alertify from 'alertifyjs'

import MetroMap from '../MetroMap'
import { Icons, cacheIcons } from './index'
import Widget from './base/Widget'

import {
    sfx,
    algorithm,
    mouseToLatLng,
    resetStyle,
} from '../util'

const { animation, visualizeRoute } = sfx
const { shortestRoute } = algorithm

export default class implements Widget {
    private metroMap: MetroMap
    private readonly fromMarker: Marker
    private readonly toMarker: Marker

    constructor() {
        this.fromMarker = marker([0, 0], { draggable: true, icon: Icons.Marker('#228822', 'A') })
        this.toMarker = marker([0, 0], { draggable: true, icon: Icons.Marker('#dd2222', 'B') })
        this.addMarkerListeners()
    }

    private addMarkerListeners() {
        for (const marker of [this.fromMarker, this.toMarker]) {
            marker
                .on('drag', e => this.visualizeShortestRoute(false))
                .on('dragend', e => this.visualizeShortestRoute(true))
        }
    }

    addTo(metroMap: MetroMap) {
        this.metroMap = metroMap
        const { mediator } = metroMap
        const map = metroMap.getMap()
        const center = map.getCenter()
        this.fromMarker.setLatLng(center)
        this.toMarker.setLatLng(center)
        cacheIcons(map, [this.fromMarker, this.toMarker])
        mediator.subscribe('routefrom', this.onFromTo)
        mediator.subscribe('routeto', this.onFromTo)
        mediator.subscribe('clearroute', this.clearRoute)
        map.on('zoomstart', animation.terminateAnimations)
        addEventListener('keydown', e => {
            if (e.keyCode !== 27) {
                return
            }
            mediator.publish(new Event('clearroute'))
        })
        return this
    }

    private onFromTo = (e: MouseEvent) => {
        const map = this.metroMap.getMap()
        const coors = mouseToLatLng(map, e)
        const marker = e.type === 'routefrom' ? this.fromMarker : this.toMarker
        marker.setLatLng(coors)
        if (!map.hasLayer(marker)) {
            map.addLayer(marker)
        }
        const otherMarker = marker === this.fromMarker ? this.toMarker : this.fromMarker
        if (map.hasLayer(otherMarker)) {
            this.visualizeShortestRoute(true)
            // this.map.once('zoomend', e => this.visualizeShortestRoute(latLngArr));
            // this.map.fitBounds(L.latLngBounds(latLngArr));
        }
    }

    private visualizeShortestRoute(shouldAnimate: boolean) {
        const map = this.metroMap.getMap()
        if (!map.hasLayer(this.fromMarker) || !map.hasLayer(this.toMarker)) {
            return
        }
        this.visualizeRouteBetween(
            this.fromMarker.getLatLng(),
            this.toMarker.getLatLng(),
            shouldAnimate,
        )
    }

    private visualizeRouteBetween(from: LatLng, to: LatLng, shouldAnimate: boolean) {
        resetStyle()
        alertify.dismissAll()
        const route = shortestRoute(this.metroMap.getNetwork().platforms, from, to)
        visualizeRoute(route, shouldAnimate)
    }

    private clearRoute = () => {
        const map = this.metroMap.getMap()
        const terminate = animation.terminateAnimations()
        map.removeLayer(this.fromMarker).removeLayer(this.toMarker)
        alertify.dismissAll()
        terminate.then(resetStyle)
    }

}
