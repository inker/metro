import * as L from 'leaflet'
import * as alertify from 'alertifyjs'

import Network, {
    Platform,
    Route,
} from '../network'
import { getSecondLanguage } from '../util'
import { calculateGeoMean } from '../util/geo'
import { tr } from '../i18n'

import MapEditor from './MapEditor'
import FAQ from './FAQ'
import TextPlate from './TextPlate'
import RoutePlanner from './RoutePlanner'
import ContextMenu from './ContextMenu'
import DistanceMeasure from './DistanceMeasure'
import SvgOverlay from './SvgOverlay'
import * as Icons from './Icons'
import * as tileLayers from './tilelayers'

export {
    DistanceMeasure,
    MapEditor,
    FAQ,
    TextPlate,
    RoutePlanner,
    ContextMenu,
    Icons,
    SvgOverlay,
    tileLayers,
}

function assignNames(platform: Platform, newNames: string[]) {
    const second = getSecondLanguage()
    const { altNames } = platform
    if (second) {
        [platform.name, altNames[second], altNames['en']] = newNames
    } else {
        [platform.name, altNames['en']] = newNames
    }
}

export function platformRenameDialog(platform: Platform) {
    const ru = platform.name
    const { fi, en } = platform.altNames
    const names = en ? [ru, fi, en] : fi ? [ru, fi] : [ru]
    const nameString = names.join('|')
    alertify.prompt(tr`New name`, nameString, (okev, val: string) => {
        const newNames = val.split('|')
        assignNames(platform, newNames)
        if (val === nameString) {
            return alertify.warning(tr`Name was not changed`)
        }
        const oldNamesStr = names.slice(1).join(', ')
        const newNamesStr = newNames.slice(1).join(', ')
        alertify.success(tr`${ru} (${oldNamesStr}) renamed to ${newNames[0]} (${newNamesStr})`)
        const station = platform.station
        if (station.platforms.length < 2) {
            return
        }
        alertify.confirm(tr`Rename the entire station?`, () => {
            for (const p of station.platforms) {
                assignNames(p, newNames)
            }
            alertify.success(tr`The entire station was renamed to ${val}`)
        })

    }, () => alertify.warning(tr`Name change cancelled`))
}

export function askRoutes(network: Network, defSet?: Set<Route>) {
    const def = defSet === undefined ? undefined : Array.from(defSet).map(r => r.line + r.branch).join('|')
    const routeSet = new Set<Route>()
    const routeString = prompt('routes', def) || ''
    for (const s of routeString.split('|')) {
        const tokens = s[0] === 'M' ? s.match(/(M\d{0,2})(\w?)/) : s.match(/([EL])(.{0,2})/)
        if (!tokens) {
            console.error('incorrect route', s)
            continue
        }
        const [, line, branch] = tokens
        let route = network.routes.find(r => r.line === line && r.branch === branch)
        if (route === undefined) {
            console.log('creating new route')
            route = {
                line,
                branch,
            }
            network.routes.push(route)
        }
        routeSet.add(route)
    }
    return routeSet
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
    const metroMean = calculateGeoMean(metroPoints, fitnessFunc, 1, cur => poly.addLatLng(cur))
    map.addLayer(poly)
    for (let i = 5000; i < 20000; i += 5000) {
        L.circle(metroMean, i - 250, { weight: 1 }).addTo(map)
        L.circle(metroMean, i + 250, { weight: 1 }).addTo(map)
    }
    const ePoints = platforms.filter(p => p.spans[0].routes[0].line.startsWith('E')).map(p => p.location)
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
