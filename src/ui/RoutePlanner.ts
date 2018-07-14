import { marker, LatLng } from 'leaflet'

import { resetStyle } from 'utils/misc'
import shortestRoute from 'utils/algorithm/shortestRoute'
import { visualizeRoute } from 'utils/sfx'
import * as animation from 'utils/sfx/animation'

import MetroMap from '../MetroMap'
import cacheIcons from './cacheIcons'
import makeMarker from './Icons/marker'
import Widget from './base/Widget'

const alertifyPromise = import(/* webpackChunkName: "alertify" */ './alertify')

export default class implements Widget {
    private metroMap: MetroMap
    private readonly fromMarker = marker([0, 0], {
        draggable: true,
        icon: makeMarker('#228822', 'A'),
    })
    private readonly toMarker = marker([0, 0], {
        draggable: true,
        icon: makeMarker('#dd2222', 'B'),
    })

    constructor() {
        for (const m of [this.fromMarker, this.toMarker]) {
            m
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
        const coors = map.mouseEventToLatLng(e)
        const m = e.type === 'routefrom' ? this.fromMarker : this.toMarker
        m.setLatLng(coors)
        if (!map.hasLayer(m)) {
            map.addLayer(m)
        }
        const otherMarker = m === this.fromMarker ? this.toMarker : this.fromMarker
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

    private async visualizeRouteBetween(from: LatLng, to: LatLng, shouldAnimate: boolean) {
        resetStyle()
        const mod = await alertifyPromise
        mod.default.dismissAll()
        const route = shortestRoute(this.metroMap.getNetwork().platforms, from, to)
        visualizeRoute(route, shouldAnimate)
    }

    private clearRoute = async () => {
        const map = this.metroMap.getMap()
        const terminate = animation.terminateAnimations()
        map.removeLayer(this.fromMarker).removeLayer(this.toMarker)
        const mod = await alertifyPromise
        mod.default.dismissAll()
        terminate.then(resetStyle)
    }

}
