import {
    Map as LeafletMap,
    polyline,
    circle,
} from 'leaflet'

import geometricMedian from 'utils/geo/geometricMedian'

import { Platform } from '../network'

const MAIN_STATION_NAME = 'Glavnyj voxal'

const findMainStationPlatform = (platforms: Platform[]) =>
    platforms.find(p => p.name === MAIN_STATION_NAME && p.spans[0].routes[0].line.startsWith('E'))

export default (map: LeafletMap, platforms: Platform[]) => {
    const metroPoints = platforms.filter(p => p.spans[0].routes[0].line.startsWith('M')).map(p => p.location)
    const fitnessFunc = pt => metroPoints.reduce((prev, cur) => prev + pt.distanceTo(cur), 0)
    const poly = polyline([], {
        color: 'red',
    })
    const metroMean = geometricMedian(metroPoints, fitnessFunc, 1, cur => poly.addLatLng(cur))
    map.addLayer(poly)
    for (let i = 5000; i < 20000; i += 5000) {
        circle(metroMean, i - 250, { weight: 1 }).addTo(map)
        circle(metroMean, i + 250, { weight: 1 }).addTo(map)
    }
    // const ePoints = platforms.filter(p => p.spans[0].routes[0].line.startsWith('E')).map(p => p.location)
    const mainStationPlatform = findMainStationPlatform(platforms)
    if (!mainStationPlatform) {
        return
    }
    const eMean = mainStationPlatform.location
    circle(eMean, 30000).addTo(map)
    circle(eMean, 45000).addTo(map)
}
