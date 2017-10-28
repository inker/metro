import * as L from 'leaflet'

import { Platform } from '../network'
import { calculateGeoMedian } from '../util/geo'

import * as Icons from './Icons'
import * as tileLayers from './tilelayers'

export { default as MapEditor } from './MapEditor'
export { default as FAQ } from './FAQ'
export { default as Tooltip } from './Tooltip'
export { default as RoutePlanner } from './RoutePlanner'
export { default as ContextMenu } from './ContextMenu'
export { default as DistanceMeasure } from './DistanceMeasure'
export { default as SvgOverlay } from './SvgOverlay'
export { default as gitHubDialog } from './GitHub'
export { default as askRoutes } from './askRoutes'
export { default as platformRenameDialog } from './platformRenameDialog'

export {
    Icons,
    tileLayers,
}

export function addLayerSwitcher(map: L.Map, layers: L.TileLayer[]) {
    let currentLayerIndex = 0
    addEventListener('keydown', e => {
        if (!e.shiftKey || !e.ctrlKey || e.keyCode !== 76) {
            return
        }
        e.preventDefault()
        map.removeLayer(layers[currentLayerIndex])
        if (++currentLayerIndex === layers.length) {
            currentLayerIndex = 0
        }
        map.addLayer(layers[currentLayerIndex])
        map.invalidateSize(false)
    })
}

export function drawZones(map: L.Map, platforms: Platform[]) {
    const metroPoints = platforms.filter(p => p.spans[0].routes[0].line.startsWith('M')).map(p => p.location)
    const fitnessFunc = pt => metroPoints.reduce((prev, cur) => prev + pt.distanceTo(cur), 0)
    const poly = L.polyline([], { color: 'red'})
    const metroMean = calculateGeoMedian(metroPoints, fitnessFunc, 1, cur => poly.addLatLng(cur))
    map.addLayer(poly)
    for (let i = 5000; i < 20000; i += 5000) {
        L.circle(metroMean, i - 250, { weight: 1 }).addTo(map)
        L.circle(metroMean, i + 250, { weight: 1 }).addTo(map)
    }
    // const ePoints = platforms.filter(p => p.spans[0].routes[0].line.startsWith('E')).map(p => p.location)
    const mainStationName = 'Glavnyj voxal'
    const mainStationPlatform = platforms.find(p => p.name === mainStationName && p.spans[0].routes[0].line.startsWith('E'))
    if (!mainStationPlatform) {
        return
    }
    const eMean = mainStationPlatform.location
    L.circle(eMean, 30000).addTo(map)
    L.circle(eMean, 45000).addTo(map)
}

export function cacheIcons(map: L.Map, markers: L.Marker[]) {
    for (const marker of markers) {
        map.addLayer(marker).removeLayer(marker)
    }
}
