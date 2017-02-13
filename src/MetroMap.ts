import * as L from 'leaflet'
import { downloadText } from 'download.js'
import { get, difference, uniqueId } from 'lodash'

import * as ui from './ui'
import * as res from './res'
import pool from './ObjectPool'
import { tr } from './i18n'

import Network, {
    Platform,
    Station,
    Span,
    Transfer,
    GraphJSON,
} from './network'

import {
    geo,
    sfx,
    svg,
    math,
    algorithm,
    Mediator,
    color,
    tryGetElement,
    tryGetFromMap,
    MetroMapEventMap,
    deleteFromArray,
    mouseToLatLng,
    intersection,
    getPlatformNames,
    getPlatformNamesZipped,
    fixFontRendering,
    removeAllChildren,
    byId,
    // midPointsToEnds,
    attr,
} from './util'

const {
    mapbox,
    mapnik,
    osmFrance,
    openMapSurfer,
    cartoDBNoLabels,
    wikimapia,
} = ui.tileLayers

const { Scale } = sfx
const { mean } = math
const { findCycle } = algorithm

const contextMenuArray = [{
    event: 'routefrom',
    text: 'Route from here',
}, {
    event: 'routeto',
    text: 'Route to here',
}, {
    event: 'clearroute',
    text: 'Clear route',
}, {
    event: 'showheatmap',
    text: 'Show heatmap',
    extra: {
        disabled: true,
    },
}]

export default class {
    readonly mediator = new Mediator()
    private readonly config: res.Config
    private map: L.Map
    private overlay: ui.SvgOverlay
    private contextMenu: ui.ContextMenu

    private network: Network
    private lineRules: Map<string, CSSStyleDeclaration>
    private readonly whiskers = new WeakMap<Platform, Map<Span, L.Point>>()
    private platformsOnSVG = new WeakMap<Platform, L.Point>()

    private plate: ui.TextPlate

    // private routeWorker = new Worker('js/routeworker.js');

    getMap(): L.Map {
        return this.map
    }

    getNetwork(): Network {
        return this.network
    }

    constructor(config: res.Config) {
        this.config = config
        this.makeMap()
    }

    public async makeMap() {
        const { config } = this
        const lineRulesPromise = tryGetElement('#scheme').then((link: HTMLLinkElement) => {
            link.href = config.url['scheme']
            return res.getLineRules()
        })
        const networkPromise = this.getGraph()
        const tileLoadPromise = new Promise(resolve => mapbox.once('load', resolve))
        const dataPromise = res.getJSON(config.url['data'])

        // wait.textContent = 'making map...';

        config.center = [0, 0]
        const mapOptions = Object.assign({}, config)
        if (L.version[0] === '1') {
            mapOptions['wheelPxPerZoomLevel'] = 75
            mapOptions['inertiaMaxSpeed'] = 1500
            mapOptions['fadeAnimation'] = false
        }
        this.map = L.map(config.containerId, mapOptions).addControl(L.control.scale({
            imperial: false,
        }))
        const mapPaneStyle = this.map.getPanes().mapPane.style
        mapPaneStyle.visibility = 'hidden'

        ui.addLayerSwitcher(this.map, [
            mapbox,
            mapnik,
            osmFrance,
            openMapSurfer,
            cartoDBNoLabels,
            wikimapia,
        ])

        addEventListener('keydown', e => {
            if (e.shiftKey && e.ctrlKey && e.keyCode === 82) {
                this.getGraph().then(nw => this.resetNetwork(nw))
            }
        })
        // wait.textContent = 'loading graph...';
        this.addContextMenu()

        const json = await networkPromise
        this.network = new Network(json)
        const center = geo.getCenter(this.network.platforms.map(p => p.location))
        config.center = [center.lat, center.lng]
        const bounds = L.latLngBounds(this.network.platforms.map(p => p.location))
        this.overlay = new ui.SvgOverlay(bounds, L.point(200, 200)).addTo(this.map)
        const { defs } = this.overlay
        svg.Filters.appendAll(defs)
        const { textContent } = defs
        if ((textContent || '').length === 0) {
            alert(tr`Your browser doesn't seem to have capabilities to display some features of the map. Consider using Chrome or Firefox for the best experience.`)
        }

        const lineRules = await lineRulesPromise
        this.lineRules = lineRules
        // wait.textContent = 'adding content...';
        this.resetMapView()
        this.map.addLayer(mapbox)
        this.map.on('overlayupdate', overlay => {
            this.redrawNetwork()
            // console.time('conversion');
            // file.svgToPicture(document.getElementById('overlay') as any).then(img => {
            //     document.body.appendChild(img);
            //     console.timeEnd('conversion');
            // });
        })
        this.initNetwork()
        // TODO: fix the kludge making the grey area disappear
        this.map.invalidateSize(false)
        this.addMapListeners()
        new ui.RoutePlanner().addTo(this)
        new ui.DistanceMeasure().addTo(this.map)
        // this.routeWorker.postMessage(this.network);
        // ui.drawZones(this.map, this.network.platforms);

        if (!L.Browser.mobile) {
            new ui.MapEditor(config.detailedZoom).addTo(this)
        }

        dataPromise.then(data => new ui.FAQ(data.faq).addTo(this))
        // wait.textContent = 'loading tiles...';

        await tileLoadPromise
        // wait.parentElement.removeChild(wait);
        fixFontRendering()
        this.map.on('layeradd layerremove', e => fixFontRendering())
        mapPaneStyle.visibility = ''
        // const img = file.svgToImg(document.getElementById('overlay') as any, true);
        // file.svgToCanvas(document.getElementById('overlay') as any)
        //     .then(canvas => fFile.downloadText('svg.txt', canvas.toDataURL('image/png')));
        // file.downloadText('img.txt', img.src);
    }

    public subscribe<K extends keyof MetroMapEventMap>(type: K, listener: (e: MetroMapEventMap[K]) => void) {
        this.mediator.subscribe(type, listener)
        // forwarding map event to mediator
        this.map.on(type, this.mediator.publish)
    }

    private addContextMenu() {
        this.contextMenu = new ui.ContextMenu(contextMenuArray as any)
        for (const el of contextMenuArray) {
            this.map.on(el.event, this.mediator.publish)
        }
        this.contextMenu.addTo(this.map)
    }

    private addMapListeners() {
        const relatedTargetToSpan = (rt: EventTarget) => {
            const path = rt as SVGPathElement
            return (pool.outerEdgeBindings.getKey(path) || pool.innerEdgeBindings.getKey(path)) as Span
        }

        const relatedTargetToPlatform = (rt: EventTarget) => pool.dummyBindings.getKey(rt as SVGCircleElement)

        const { map, contextMenu } = this

        map.on('distancemeasureinit', e => {
            contextMenu.insertItem('measuredistance', 'Measure distance')
        })
        map.on('clearmeasurements', e => {
            contextMenu.removeItem('clearmeasurements')
            contextMenu.insertItem('measuredistance', 'Measure distance')
        })
        map.on('zoomstart', e => {
            this.plate.hide()
        })
        this.subscribe('measuredistance', e => {
            contextMenu.removeItem('measuredistance')
            contextMenu.insertItem('clearmeasurements', 'Clear measurements')
        })
        this.subscribe('platformrename', e => {
            const platform = relatedTargetToPlatform(e.relatedTarget)
            this.plate.show(svg.circleOffset(e.relatedTarget as SVGCircleElement), getPlatformNames(platform))
            ui.platformRenameDialog(platform)
        })
        this.subscribe('platformmovestart', e => {
            this.plate.disabled = true
        })
        this.subscribe('platformmove', e => {
            const platform = relatedTargetToPlatform(e.relatedTarget)
            platform.location = mouseToLatLng(map, e)
        })
        this.subscribe('platformmoveend', e => {
            const platform = relatedTargetToPlatform(e.relatedTarget)
            this.plate.disabled = false
            this.plate.show(svg.circleOffset(e.relatedTarget as SVGCircleElement), getPlatformNames(platform))
        })
        this.subscribe('platformadd', e => {
            const { detail } = e
            const location = mouseToLatLng(map, detail)
            const newPlatform = new Platform(tr`New station`, location, {})
            this.network.platforms.push(newPlatform)
            if (detail.relatedTarget !== undefined) {
                const span = relatedTargetToSpan(detail.relatedTarget)
                const prop = span.source === newPlatform ? 'target' : 'source'
                const newSpan = new Span(newPlatform, span[prop], span.routes)
                span[prop] = newPlatform
                this.network.spans.push(newSpan)
            }
            this.overlay.extendBounds(location)
            this.resetNetwork(JSON.parse(this.network.toJSON()))
        })
        this.subscribe('platformdelete', e => {
            const platform = relatedTargetToPlatform(e.relatedTarget)
            this.network.deletePlatform(platform)
            this.redrawNetwork()
        })
        this.subscribe('spanroutechange', e => {
            if (e.relatedTarget === undefined) {
                return
            }
            const span = relatedTargetToSpan(e.relatedTarget)
            const routeSet = ui.askRoutes(this.network, new Set(span.routes))
            span.routes = Array.from(routeSet)
            this.resetNetwork(JSON.parse(this.network.toJSON()))
        })
        this.subscribe('spaninvert', e => {
            if (e.relatedTarget === undefined) {
                return
            }
            const span = relatedTargetToSpan(e.relatedTarget)
            span.invert()
            this.resetNetwork(JSON.parse(this.network.toJSON()))
        })
        this.subscribe('spanend', e => {
            const source = pool.dummyBindings.getKey(e.detail.source)
            const target = pool.dummyBindings.getKey(e.detail.target)
            contextMenu.removeItem('spanend')

            const sourceRoutes = source.passingRoutes()
            const targetRoutes = target.passingRoutes()
            const sn = sourceRoutes.size
            const tn = targetRoutes.size

            const routeSet = sn > 0 && tn === 0 ? (sn === 1 ? sourceRoutes : ui.askRoutes(this.network, sourceRoutes)) :
                tn > 0 && sn === 0 ? (tn === 1 ? targetRoutes : ui.askRoutes(this.network, targetRoutes)) :
                    ui.askRoutes(this.network, intersection(sourceRoutes, targetRoutes))

            this.network.spans.push(new Span(source, target, Array.from(routeSet)))
            this.resetNetwork(JSON.parse(this.network.toJSON()))
        })
        this.subscribe('spandelete', e => {
            if (e.relatedTarget === undefined) {
                return
            }
            const span = relatedTargetToSpan(e.relatedTarget)
            deleteFromArray(this.network.spans, span)
            this.resetNetwork(JSON.parse(this.network.toJSON()))
        })
        this.subscribe('transferend', e => {
            const source = pool.dummyBindings.getKey(e.detail.source)
            const target = pool.dummyBindings.getKey(e.detail.target)
            console.log(source, target)
            contextMenu.removeItem('transferend')
            this.network.transfers.push(new Transfer(source, target))
            this.resetNetwork(JSON.parse(this.network.toJSON()))
        })
        this.subscribe('transferdelete', e => {
            if (e.relatedTarget === undefined) {
                return
            }
            const path = e.relatedTarget as SVGPathElement | SVGLineElement
            const transfer = (pool.outerEdgeBindings.getKey(path) || pool.innerEdgeBindings.getKey(path)) as Transfer
            deleteFromArray(this.network.transfers, transfer)
            this.resetNetwork(JSON.parse(this.network.toJSON()))
        })
        this.subscribe('editmapstart', e => {
            if (map.getZoom() < this.config.detailedZoom) {
                map.setZoom(this.config.detailedZoom)
            }
            const pathTrigger = (target: EventTarget) => {
                const targetsParent = (target as SVGElement).parentElement
                if (!targetsParent) {
                    return false
                }
                const parentId = targetsParent.id
                return parentId === 'paths-outer' || parentId === 'paths-inner'
            }
            contextMenu.insertItem('platformaddclick', 'New station', target => !pathTrigger(target))


            const trigger = (target: EventTarget) => {
                const targetsParent = (target as SVGElement).parentElement
                if (!targetsParent) {
                    return false
                }
                return targetsParent.id === 'dummy-circles'
            }

            contextMenu.insertItem('platformrename', 'Rename station', trigger)
            contextMenu.insertItem('platformdelete', 'Delete station', trigger)
            contextMenu.insertItem('spanstart', 'Span from here', trigger)
            contextMenu.insertItem('transferstart', 'Transfer from here', trigger)

            contextMenu.insertItem('spanroutechange', 'Change route', pathTrigger)
            contextMenu.insertItem('spaninvert', 'Invert span', pathTrigger)
            contextMenu.insertItem('platformaddtolineclick', 'Add station to line', pathTrigger)
            contextMenu.insertItem('spandelete', 'Delete span', pathTrigger)
            contextMenu.insertItem('transferdelete', 'Delete transfer', target => {
                const targetsParent = (target as SVGElement).parentElement
                if (!targetsParent) {
                    return false
                }
                const parentId = targetsParent.id
                return parentId === 'transfers-outer' || parentId === 'transfers-inner'
            })
        })
        this.subscribe('editmapend', e => {
            contextMenu.removeItem('platformaddclick')
            contextMenu.removeItem('platformrename')
            contextMenu.removeItem('platformdelete')
            contextMenu.removeItem('spanstart')
            contextMenu.removeItem('transferstart')
            contextMenu.removeItem('platformaddtolineclick')
            contextMenu.removeItem('spanroutechange')
            contextMenu.removeItem('spandelete')
            contextMenu.removeItem('transferdelete')
        })
        this.subscribe('mapsave', e => {
            downloadText('graph.json', this.network.toJSON())
        })
    }

    /** call only once! */
    private initNetwork() {
        const { origin } = this.overlay
        const groupIds = [
            'paths-outer',
            'paths-inner',
            'transfers-outer',
            'station-circles',
            'transfers-inner',
            'dummy-circles',
        ]

        for (const groupId of groupIds) {
            const g = svg.createSVGElement('g')
            g.id = groupId
            origin.appendChild(g)
        }

        this.plate = new ui.TextPlate()
        origin.insertBefore(this.plate.element, document.getElementById('dummy-circles'))
        this.redrawNetwork()
        this.addStationListeners()
    }

    private resetMapView() {
        // const fitness = (points, pt) => points.reduce((prev, cur) => this.bounds., 0);
        // const center = geo.calculateGeoMean(this.network.platforms.map(p => p.location), fitness, 0.1);
        const { center, zoom } = this.config
        const options = {
            pan: { animate: false },
            zoom: { animate: false },
        }
        if (!center) {
            console.error(`cannot set map to center`)
            return
        }
        this.map.setView(center, zoom + 1, options)
        this.map.setView(center, zoom, options)
    }

    private getGraph(): Promise<GraphJSON> {
        return res.getJSON(this.config.url['graph']) as any
    }

    private resetNetwork(json: GraphJSON) {
        this.network = new Network(json)
        this.redrawNetwork()
    }

    private cleanElements() {
        for (const child of (this.overlay.origin.childNodes as any)) {
            if (child !== this.plate.element) {
                removeAllChildren(child)
            }
        }
    }

    private addBindings() {
        const { platforms } = this.network
        const { platformBindings, dummyBindings } = pool
        for (const platform of platforms) {
            this.platformToModel(platform, [
                tryGetFromMap(platformBindings, platform),
                tryGetFromMap(dummyBindings, platform) as SVGCircleElement,
            ])
        }
    }

    private redrawNetwork() {
        console.time('pre')
        this.cleanElements()
        this.updatePlatformsPositionOnOverlay()
        console.timeEnd('pre')
        console.time('preparation')
        const { detailedZoom } = this.config
        const zoom = this.map.getZoom()
        const coef = zoom > 9 ? zoom : zoom > 8 ? 9.5 : 9
        // const lineWidth = 2 ** (zoom / 4 - 1.75);
        const lineWidth = (coef - 7) * 0.5
        const lightLineWidth = lineWidth * 0.75
        const circleRadius = coef < detailedZoom ? lineWidth * 1.25 : lineWidth
        const circleBorder = coef < detailedZoom ? circleRadius * 0.4 : circleRadius * 0.6
        const dummyCircleRadius = circleRadius * 2
        const transferWidth = lineWidth * 0.9
        const transferBorder = circleBorder * 1.25

        const strokeWidths = {
            'station-circles': circleBorder,
            'dummy-circles': 0,
            'transfers-outer': transferWidth + transferBorder / 2,
            'transfers-inner': transferWidth - transferBorder / 2,
            'paths-outer': lineWidth,
            'paths-inner': lineWidth / 2,
        }
        const fullCircleRadius = circleRadius + circleBorder / 2

        const docFrags = new Map<string, DocumentFragment>()
        for (const id of Object.keys(strokeWidths)) {
            docFrags.set(id, document.createDocumentFragment())
            byId(id).style.strokeWidth = `${strokeWidths[id]}px`
        }

        const lightRailPathStyle = tryGetFromMap(this.lineRules, 'L')
        lightRailPathStyle.strokeWidth = `${lightLineWidth}px`

        // 11 - 11, 12 - 11.5, 13 - 12, 14 - 12.5
        const fontSize = Math.max((zoom + 10) * 0.5, 11)
        const plateStyle = get(this.plate, 'element.firstChild.firstChild.style') as any
        if (plateStyle) {
            plateStyle.fontSize = fontSize + 'px'
        }

        const stationCircumpoints = new Map<Station, Platform[]>()

        console.timeEnd('preparation')

        // station circles

        console.time('circle preparation')

        const stationCirclesFrag = tryGetFromMap(docFrags, 'station-circles')
        const dummyCirclesFrag = tryGetFromMap(docFrags, 'dummy-circles')

        for (const station of this.network.stations) {
            const circumpoints: L.Point[] = []
            // const stationMeanColor: string
            // if (zoom < 12) {
            //     stationMeanColor = color.mean(this.linesToColors(this.passingLinesStation(station)));
            // }
            for (const platform of station.platforms) {
                const posOnSVG = tryGetFromMap(this.platformsOnSVG, platform)
                // const posOnSVG = this.overlay.latLngToSvgPoint(platform.location);
                if (zoom > 9) {
                    const ci = svg.makeCircle(posOnSVG, circleRadius)
                    // ci.id = 'p-' + platformIndex;

                    if (zoom >= detailedZoom) {
                        this.colorizePlatformCircle(ci, platform.passingLines())
                    }
                    // else {
                    //     ci.style.stroke = stationMeanColor;
                    // }
                    const dummyCircle = svg.makeCircle(posOnSVG, dummyCircleRadius)
                    // dummyCircle.id = 'd-' + platformIndex;

                    stationCirclesFrag.appendChild(ci)
                    pool.platformBindings.set(platform, ci)
                    dummyCirclesFrag.appendChild(dummyCircle)
                    pool.dummyBindings.set(platform, dummyCircle)
                }

                this.whiskers.set(platform, this.makeWhiskers(platform))
            }

            const circular = findCycle(this.network, station)
            if (circular.length > 0) {
                for (const platform of station.platforms) {
                    if (circular.includes(platform)) {
                        const pos = tryGetFromMap(this.platformsOnSVG, platform)
                        circumpoints.push(pos)
                    }
                }
                stationCircumpoints.set(station, circular)
            }

        }

        console.timeEnd('circle preparation')
        console.time('transfer preparation')

        // transfers

        const transfersOuterFrag = tryGetFromMap(docFrags, 'transfers-outer')
        const transfersInnerFrag = tryGetFromMap(docFrags, 'transfers-inner')
        for (const transfer of this.network.transfers) {
            const pl1 = transfer.source
            const pl2 = transfer.target
            const detailed = zoom >= detailedZoom
            if (!detailed && pl1.name === pl2.name) {
                continue
            }
            const scp = stationCircumpoints.get(pl1.station)
            const paths = scp !== undefined
                && scp.includes(pl1)
                && scp.includes(pl2) ? this.makeTransferArc(
                    transfer,
                    scp,
                ) : svg.makeTransferLine(
                    tryGetFromMap(this.platformsOnSVG, pl1),
                    tryGetFromMap(this.platformsOnSVG, pl2),
                )
            pool.outerEdgeBindings.set(transfer, paths[0])
            pool.innerEdgeBindings.set(transfer, paths[1])
            paths[0].style.stroke = detailed ? this.makeGradient(transfer, fullCircleRadius) : '#000'
            transfersOuterFrag.appendChild(paths[0])
            transfersInnerFrag.appendChild(paths[1])
            // this.transferToModel(transfer, paths);
        }

        console.timeEnd('transfer preparation')
        console.time('span preparation')
        // paths

        const pathsOuterFrag = tryGetFromMap(docFrags, 'paths-outer')
        const pathsInnerFrag = tryGetFromMap(docFrags, 'paths-inner')
        for (const span of this.network.spans) {
            const [outer, inner] = this.makePath(span)
            pathsOuterFrag.appendChild(outer)
            if (inner) {
                pathsInnerFrag.appendChild(inner)
            }
        }

        console.timeEnd('span preparation')

        console.time('appending')

        docFrags.forEach((val, key) => byId(key).appendChild(val))

        this.addBindings()
        console.timeEnd('appending')

    }

    private makeGradient(transfer: Transfer, fullCircleRadius: number) {
        const { source, target } = transfer
        const pos1 = tryGetFromMap(this.platformsOnSVG, source)
        const pos2 = tryGetFromMap(this.platformsOnSVG, target)
        // paths[0].id = 'ot-' + transferIndex;
        // paths[1].id = 'it-' + transferIndex;
        const gradientColors = [
            this.getPlatformColor(source),
            this.getPlatformColor(target),
        ]
        // const colors = [transfer.source, transfer.target].map(i => getComputedStyle(stationCirclesFrag.childNodes[i] as Element, null).stroke);
        // console.log(colors);
        const circlePortion = fullCircleRadius / pos1.distanceTo(pos2)
        const gradientVector = pos2.subtract(pos1)
        let gradient = pool.gradientBindings.get(transfer)
        if (gradient === undefined) {
            gradient = svg.Gradients.makeLinear(gradientVector, gradientColors, circlePortion)
            gradient.id = uniqueId('gradient-')
            pool.gradientBindings.set(transfer, gradient)
            this.overlay.defs.appendChild(gradient)
        } else {
            svg.Gradients.setDirection(gradient, gradientVector)
            svg.Gradients.setOffset(gradient, circlePortion)
        }
        return `url(#${gradient.id})`
    }

    private updatePlatformsPositionOnOverlay(zoom = this.map.getZoom()) {
        const { config, network, overlay, platformsOnSVG } = this
        // all platforms are in their place
        if (zoom >= config.detailedZoom) {
            for (const station of network.stations) {
                for (const platform of station.platforms) {
                    const pos = overlay.latLngToOverlayPoint(platform.location)
                    platformsOnSVG.set(platform, pos)
                }
            }
            return
        }
        for (const station of network.stations) {
            const nameSet = new Set<string>()
            const center = overlay.latLngToOverlayPoint(station.getCenter())
            for (const platform of station.platforms) {
                nameSet.add(platform.name)
                platformsOnSVG.set(platform, center)
            }
            if (nameSet.size === 1) {
                continue
            }
            // unless...
            if (nameSet.size < 1) {
                console.error(station)
                throw new Error(`station has no names`)
            }
            const posByName = new Map<string, L.Point>()
            nameSet.forEach(name => {
                const locations = station.platforms.filter(p => p.name === name).map(p => p.location)
                const geoCenter = geo.getCenter(locations)
                posByName.set(name, overlay.latLngToOverlayPoint(geoCenter))
            })
            for (const platform of station.platforms) {
                const pos = tryGetFromMap(posByName, platform.name)
                platformsOnSVG.set(platform, pos)
            }
        }
    }

    private getPlatformColor(platform: Platform): string {
        return color.mean(this.linesToColors(platform.passingLines()))
    }

    private linesToColors(lines: Set<string>): string[] {
        const rgbs: string[] = []
        lines.forEach(line => {
            const { stroke } = tryGetFromMap(this.lineRules, line[0] === 'M' ? line : line[0])
            if (stroke) {
                rgbs.push(stroke)
            }
        })
        return rgbs
    }

    private colorizePlatformCircle(ci: SVGCircleElement, lines: Set<string>) {
        if (lines.size === 0) {
            return
        }
        if (lines.size === 1) {
            const line = lines.values().next().value
            ci.classList.add(line[0] === 'M' ? line : line[0])
            return
        }
        ci.style.stroke = color.mean(this.linesToColors(lines))
    }

    private makeWhiskers(platform: Platform): Map<Span, L.Point> {
        const c = 0.5
        const pos = tryGetFromMap(this.platformsOnSVG, platform)
        const whiskers = new Map<Span, L.Point>()
        const { spans } = platform
        if (spans.length === 0) {
            return whiskers
        }
        if (spans.length === 1) {
            return whiskers.set(spans[0], pos)
        }
        if (spans.length === 2) {
            if (platform.passingLines().size === 2) {
                return whiskers.set(spans[0], pos).set(spans[1], pos)
            }
            const neighborPositions = spans.map(span => tryGetFromMap(this.platformsOnSVG, span.other(platform)))
            const [prevPos, nextPos] = neighborPositions
            const wings = math.wings(prevPos, pos, nextPos, 1)
            const t = Math.min(pos.distanceTo(prevPos), pos.distanceTo(nextPos)) * c
            for (let i = 0; i < 2; ++i) {
                // const t = pos.distanceTo(neighborPositions[i]) * c
                const end = wings[i].multiplyBy(t).add(pos)
                whiskers.set(spans[i], end)
            }
            return whiskers
        }

        const normals: L.Point[][] = [[], []]
        const sortedSpans: Span[][] = [[], []]
        const distances = new WeakMap<Span, number>()
        for (const span of spans) {
            const neighbor = span.other(platform)
            const neighborPos = tryGetFromMap(this.platformsOnSVG, neighbor)
            const dirIdx = span.source === platform ? 0 : 1
            normals[dirIdx].push(math.normalize(neighborPos.subtract(pos)))
            sortedSpans[dirIdx].push(span)
            distances.set(span, pos.distanceTo(neighborPos))
        }
        const [prevPos, nextPos] = normals.map(ns => mean(ns).add(pos))
        const wings = math.wings(prevPos, pos, nextPos, 1)
        for (let i = 0; i < 2; ++i) {
            const wing = wings[i]
            for (const span of sortedSpans[i]) {
                const t = tryGetFromMap(distances, span) * c
                const end = wing.multiplyBy(t).add(pos)
                whiskers.set(span, end)
            }
        }
        return whiskers
    }

    private makeTransferArc(transfer: Transfer, cluster: Platform[]): SVGLineElement[] | SVGPathElement[] {
        const { source, target } = transfer
        const pos1 = tryGetFromMap(this.platformsOnSVG, source)
        const pos2 = tryGetFromMap(this.platformsOnSVG, target)
        const makeArc = (third: Platform) => svg.makeTransferArc(pos1, pos2, tryGetFromMap(this.platformsOnSVG, third))
        if (cluster.length === 3) {
            const third = difference(cluster, [source, target])[0]
            return makeArc(third)
        } else if (source === cluster[2] && target === cluster[3] || source === cluster[3] && target === cluster[2]) {
            return svg.makeTransferLine(pos1, pos2)
        }
        // const s = transfer.source;
        // const pl1neighbors = this.network.transfers.filter(t => t.source === s || t.target === s);
        // const pl1deg = pl1neighbors.length;
        const rarr: Platform[] = []
        for (const t of this.network.transfers) {
            if (t === transfer) {
                continue
            }
            if (transfer.has(t.source)) {
                rarr.push(t.target)
            } else if (transfer.has(t.target)) {
                rarr.push(t.source)
            }
        }
        let third: Platform
        if (rarr.length === 2) {
            if (rarr[0] !== rarr[1]) {
                throw Error('FFFFUC')
            }
            third = rarr[0]
        } else if (rarr.length === 3) {
            third = rarr[0] === rarr[1] ? rarr[2] : rarr[0] === rarr[2] ? rarr[1] : rarr[0]
        } else {
            throw new Error('111FUUFF')
        }
        return makeArc(third)
    }

    private makePath(span: Span) {
        const { routes } = span
        let lineId = ''
        let lineType = ''
        let lineNum = ''
        if (routes.length > 0) {
            const tokens = span.routes[0].line.match(/([MEL])(\d{0,2})/)
            if (!tokens) {
                throw new Error(`match failed for ${span.source.name}-${span.target.name}`)
            }
            [lineId, lineType, lineNum] = tokens
        } else {
            console.error(span, 'span has no routes!')
        }

        const controlPoints = [
            tryGetFromMap(this.platformsOnSVG, span.source),
            tryGetFromMap(tryGetFromMap(this.whiskers, span.source), span),
            tryGetFromMap(tryGetFromMap(this.whiskers, span.target), span),
            tryGetFromMap(this.platformsOnSVG, span.target),
        ]

        const bezier = svg.makeCubicBezier(controlPoints)
        // bezier.id = 'op-' + spanIndex;
        if (lineType === 'E') {
            bezier.classList.add('E')
            // const { branch } = span.routes[0];
            // if (branch !== undefined) {
            //     bezier.classList.add('E' + branch);
            // }
            const inner = bezier.cloneNode(true) as typeof bezier
            // inner.id = 'ip-' + spanIndex;
            pool.outerEdgeBindings.set(span, bezier)
            pool.innerEdgeBindings.set(span, inner)
            return [bezier, inner]
        }
        if (lineId !== undefined) {
            bezier.classList.add(lineId)
        }
        if (lineType !== undefined) {
            bezier.classList.add(lineType)
        } else {
            bezier.style.stroke = 'black'
        }
        pool.outerEdgeBindings.set(span, bezier)
        return [bezier]
    }

    private addStationListeners() {
        const onMouseOut = (e: MouseEvent) => {
            this.plate.hide()
            Scale.unscaleAll()
        }
        const dummyCircles = byId('dummy-circles')
        dummyCircles.addEventListener('mouseover', e => {
            const dummy = e.target as SVGCircleElement
            const platform = pool.dummyBindings.getKey(dummy)
            const { station } = platform
            this.highlightStation(station, getPlatformNames(platform), [platform.name])
        })
        dummyCircles.addEventListener('mouseout', onMouseOut)
        const onTransferOver = (e: MouseEvent) => {
            const el = e.target as SVGPathElement | SVGLineElement
            const transfer = pool.outerEdgeBindings.getKey(el) || pool.innerEdgeBindings.getKey(el)
            const names = getPlatformNamesZipped([transfer.source, transfer.target])
            this.highlightStation(transfer.source.station, names, [transfer.source.name, transfer.target.name])
        }
        const transfersOuter = byId('transfers-outer')
        const transfersInner = byId('transfers-inner')
        transfersOuter.addEventListener('mouseover', onTransferOver)
        transfersInner.addEventListener('mouseover', onTransferOver)
        transfersOuter.addEventListener('mouseout', onMouseOut)
        transfersInner.addEventListener('mouseout', onMouseOut)
    }

    private highlightStation(station: Station, namesOnPlate: string[], filteredNames: string[]) {
        const scaleFactor = 1.25
        const platforms = station.platforms.filter(p => filteredNames.includes(p.name))
        for (const platform of platforms) {
            const circle = tryGetFromMap(pool.platformBindings, platform)
            Scale.scaleCircle(circle, scaleFactor, true)
        }
        if (this.map.getZoom() >= this.config.detailedZoom) {
            for (const transfer of this.network.transfers) {
                if (
                    platforms.some(p => transfer.has(p))
                    && filteredNames.includes(transfer.source.name)
                    && filteredNames.includes(transfer.target.name)
                ) {
                    Scale.scaleTransfer(transfer, scaleFactor)
                }
            }
        }
        const topmostPlatform = platforms.reduce((p, c) => p.location.lat < c.location.lat ? c : p)
        const topmostCircle = tryGetFromMap(pool.platformBindings, topmostPlatform)
        this.plate.show(svg.circleOffset(topmostCircle), namesOnPlate)
    }

    private platformToModel(platform: Platform, circles: Element[]) {
        const cached = platform.location
        Object.defineProperty(platform, 'location', {
            get: () => platform['_location'],
            set: (location: L.LatLng) => {
                platform['_location'] = location
                const locForPos = this.map.getZoom() < this.config.detailedZoom
                    ? platform.station.getCenter()
                    : location
                const pos = this.overlay.latLngToOverlayPoint(locForPos)
                // const nw = this.bounds.getNorthWest();
                // const pos = this.map.latLngToContainerPoint(locForPos).subtract(this.map.latLngToContainerPoint(nw));
                for (const c of circles) {
                    c.setAttribute('cx', pos.x.toString())
                    c.setAttribute('cy', pos.y.toString())
                }
                this.whiskers.set(platform, this.makeWhiskers(platform))
                this.platformsOnSVG.set(platform, pos)
                const spansToChange = new Set<Span>(platform.spans)
                for (const span of platform.spans) {
                    const neighbor = span.other(platform)
                    this.whiskers.set(neighbor, this.makeWhiskers(neighbor))
                    neighbor.spans.forEach(si => spansToChange.add(si))
                }
                spansToChange.forEach(span => {
                    const controlPoints = [
                        tryGetFromMap(this.platformsOnSVG, span.source),
                        tryGetFromMap(tryGetFromMap(this.whiskers, span.source), span),
                        tryGetFromMap(tryGetFromMap(this.whiskers, span.target), span),
                        tryGetFromMap(this.platformsOnSVG, span.target),
                    ]
                    const outer = pool.outerEdgeBindings.get(span)
                    const inner = pool.innerEdgeBindings.get(span)
                    svg.setBezierPath(outer, controlPoints)
                    if (inner) {
                        svg.setBezierPath(inner, controlPoints)
                    }
                })
                for (const tr of platform.transfers) {
                    tr[tr.source === platform ? 'source' : 'target'] = platform
                }
            },
        })
        platform['_location'] = cached
    }

    private transferToModel(transfer: Transfer, elements: Element[]) {
        const cached = [transfer.source, transfer.target]
        const { tagName } = elements[0];
        ['source', 'target'].forEach((prop, pi) => {
            Object.defineProperty(transfer, prop, {
                get: () => transfer['_' + prop],
                set: (platform: Platform) => {
                    transfer['_' + prop] = platform
                    const circle = tryGetFromMap(pool.platformBindings, platform)
                    const circleBorderWidth = parseFloat(getComputedStyle(circle).strokeWidth || '')
                    const r = +attr(circle, 'r')
                    const circleTotalRadius = r / 2 + circleBorderWidth
                    const pos = tryGetFromMap(this.platformsOnSVG, platform)
                    if (tagName === 'line') {
                        const n = pi + 1
                        const other = transfer.other(platform)
                        for (const el of elements) {
                            el.setAttribute('x' + n, pos.x.toString())
                            el.setAttribute('y' + n, pos.y.toString())
                        }
                        const gradient = tryGetFromMap(pool.gradientBindings, transfer)
                        const otherPos = tryGetFromMap(this.platformsOnSVG, other)
                        const dir = prop === 'source' ? otherPos.subtract(pos) : pos.subtract(otherPos)
                        svg.Gradients.setDirection(gradient, dir)
                        const circlePortion = circleTotalRadius / pos.distanceTo(otherPos)
                        svg.Gradients.setOffset(gradient, circlePortion)
                    } else if (tagName === 'path') {
                        const transfers: Transfer[] = []
                        for (const t of this.network.transfers) {
                            if (transfer.isAdjacent(t)) {
                                transfers.push(t)
                                if (transfers.length === 3) {
                                    break
                                }
                            }
                        }

                        const circular = new Set<Platform>()
                        for (const tr of transfers) {
                            circular.add(tr.source).add(tr.target)
                        }

                        const circumpoints = Array.from(circular).map(i => this.platformsOnSVG.get(i))
                        circular.forEach(i => circumpoints.push(this.platformsOnSVG.get(i)))
                        const outerArcs = transfers.map(t => pool.outerEdgeBindings.get(t))
                        const innerArcs = transfers.map(t => pool.innerEdgeBindings.get(t))
                        for (let i = 0; i < 3; ++i) {
                            const tr = transfers[i]
                            const outer = outerArcs[i]
                            const inner = innerArcs[i]
                            const pos1 = tryGetFromMap(this.platformsOnSVG, tr.source)
                            const pos2 = tryGetFromMap(this.platformsOnSVG, tr.target)
                            const thirdPos = difference(circumpoints, [pos1, pos2])[0]
                            if (thirdPos) {
                                svg.setCircularPath(outer, pos1, pos2, thirdPos)
                                inner.setAttribute('d', attr(outer, 'd'))
                            }
                            const gradient = tryGetFromMap(pool.gradientBindings, tr)
                            svg.Gradients.setDirection(gradient, pos2.subtract(pos1))
                            const circlePortion = circleTotalRadius / pos1.distanceTo(pos2)
                            svg.Gradients.setOffset(gradient, circlePortion)
                        }
                    } else {
                        throw new TypeError('wrong element type for transfer')
                    }
                },
            })
            transfer['_' + prop] = cached[pi]
        })
    }

}
