import * as L from 'leaflet'
import { get } from 'lodash'

import Network, {
    Platform,
    Station,
    Span,
    Transfer,
} from './network'
import * as ui from './ui'
import * as util from './util'
import * as res from './res'
import pool from './ObjectPool'
import {
    mapbox,
    mapnik,
    osmFrance,
    openMapSurfer,
    cartoDBNoLabels,
    wikimapia,
} from './tilelayers'
import { tr } from './i18n'

const {
    geo,
    sfx,
    svg,
    math,
    algorithm,
    Mediator,
    color,
    file,
    tryGetFromMap,
} = util
const { Scale } = sfx
const { getCenter } = math
const { findCircle } = algorithm

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

export default class extends Mediator {
    private config: res.Config
    private map: L.Map
    private overlay: ui.SvgOverlay
    private contextMenu: ui.ContextMenu

    private network: Network
    private lineRules: Map<string, CSSStyleDeclaration>
    private whiskers = new WeakMap<Platform, Map<Span, L.Point>>()
    private platformsOnSVG = new WeakMap<Platform, L.Point>()

    private plate: ui.TextPlate

    // private routeWorker = new Worker('js/routeworker.js');

    getMap(): L.Map { return this.map }
    getNetwork(): Network { return this.network }

    constructor(config: res.Config) {
        super()
        this.config = config
        this.makeMap()
    }

    public async makeMap() {
        const { config } = this;
        (document.getElementById('scheme') as HTMLLinkElement).href = config.url['scheme']
        const networkPromise = this.getGraph()
        const lineRulesPromise = res.getLineRules()
        const tileLoadPromise = new Promise(resolve => mapbox.once('load', resolve))

        const faq = new ui.FAQ(config.url['data'])

        // wait.textContent = 'making map...';

        this.config.center = [0, 0]
        const mapOptions = Object.assign({}, config)
        if (L.version[0] === '1') {
            mapOptions['wheelPxPerZoomLevel'] = 75
            mapOptions['inertiaMaxSpeed'] = 1500
            mapOptions['fadeAnimation'] = false
        }
        this.map = L.map(config.containerId, mapOptions)
            .addControl(L.control.scale({ imperial: false }))
        const mapPaneStyle = this.map.getPanes().mapPane.style
        mapPaneStyle.visibility = 'hidden'

        ui.addLayerSwitcher(this.map, [mapbox, mapnik, osmFrance, openMapSurfer, cartoDBNoLabels, wikimapia])

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
        this.config.center = [center.lat, center.lng]
        const bounds = L.latLngBounds(this.network.platforms.map(p => p.location))
        this.overlay = new ui.SvgOverlay(bounds).addTo(this.map)
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
            new ui.MapEditor(this.config.detailedZoom).addTo(this)
        }

        await faq.whenAvailable
        faq.addTo(this.map)
        // wait.textContent = 'loading tiles...';

        await tileLoadPromise
        // wait.parentElement.removeChild(wait);
        util.fixFontRendering()
        this.map.on('layeradd layerremove', e => util.fixFontRendering())
        mapPaneStyle.visibility = ''
        // const img = file.svgToImg(document.getElementById('overlay') as any, true);
        // file.svgToCanvas(document.getElementById('overlay') as any)
        //     .then(canvas => fFile.downloadText('svg.txt', canvas.toDataURL('image/png')));
        // file.downloadText('img.txt', img.src);
    }

    public subscribe(type: string, listener: EventListener) {
        super.subscribe(type, listener)
        // forwarding map event to mediator
        this.map.on(type, e => this.publish(e as any))
    }

    private addContextMenu() {
        this.contextMenu = new ui.ContextMenu(contextMenuArray)
        for (const el of contextMenuArray) {
            this.map.on(el.event, e => {
                console.log(e)
                this.publish(e as any)
            })
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
        this.subscribe('measuredistance', (e: Event) => {
            contextMenu.removeItem('measuredistance')
            contextMenu.insertItem('clearmeasurements', 'Clear measurements')
        })
        this.subscribe('platformrename', (e: MouseEvent) => {
            const platform = relatedTargetToPlatform(e.relatedTarget)
            this.plate.show(svg.circleOffset(e.relatedTarget as SVGCircleElement), util.getPlatformNames(platform))
            ui.platformRenameDialog(platform)
        })
        this.subscribe('platformmovestart', (e: MouseEvent) => {
            this.plate.disabled = true
        })
        this.subscribe('platformmove', (e: MouseEvent) => {
            const platform = relatedTargetToPlatform(e.relatedTarget)
            platform.location = util.mouseToLatLng(map, e)
        })
        this.subscribe('platformmoveend', (e: MouseEvent) => {
            const platform = relatedTargetToPlatform(e.relatedTarget)
            this.plate.disabled = false
            this.plate.show(svg.circleOffset(e.relatedTarget as SVGCircleElement), util.getPlatformNames(platform))
        })
        this.subscribe('platformadd', (e: CustomEvent) => {
            console.log(e)
            const { detail } = e
            const location = util.mouseToLatLng(map, detail)
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
        this.subscribe('platformdelete', (e: MouseEvent) => {
            const platform = relatedTargetToPlatform(e.relatedTarget)
            this.network.deletePlatform(platform)
            this.redrawNetwork()
        })
        this.subscribe('spanroutechange', (e: MouseEvent) => {
            if (e.relatedTarget === undefined) return
            const span = relatedTargetToSpan(e.relatedTarget)
            const routeSet = ui.askRoutes(this.network, new Set(span.routes))
            span.routes = Array.from(routeSet)
            this.resetNetwork(JSON.parse(this.network.toJSON()))
        })
        this.subscribe('spaninvert', (e: MouseEvent) => {
            if (e.relatedTarget === undefined) return
            const span = relatedTargetToSpan(e.relatedTarget)
            span.invert()
            this.resetNetwork(JSON.parse(this.network.toJSON()))
        })
        this.subscribe('spanend', (e: CustomEvent) => {
            const source: Platform = pool.dummyBindings.getKey(e.detail.source)
            const target: Platform = pool.dummyBindings.getKey(e.detail.target)
            console.log(source, target)
            contextMenu.removeItem('spanend')

            const sourceRoutes = source.passingRoutes()
            const targetRoutes = target.passingRoutes()
            const sn = sourceRoutes.size
            const tn = targetRoutes.size

            const routeSet = sn > 0 && tn === 0 ? (sn === 1 ? sourceRoutes : ui.askRoutes(this.network, sourceRoutes)) :
                tn > 0 && sn === 0 ? (tn === 1 ? targetRoutes : ui.askRoutes(this.network, targetRoutes)) :
                    ui.askRoutes(this.network, util.intersection(sourceRoutes, targetRoutes))

            this.network.spans.push(new Span(source, target, Array.from(routeSet)))
            this.resetNetwork(JSON.parse(this.network.toJSON()))
        })
        this.subscribe('spandelete', (e: MouseEvent) => {
            if (e.relatedTarget === undefined) return
            const span = relatedTargetToSpan(e.relatedTarget)
            util.deleteFromArray(this.network.spans, span)
            this.resetNetwork(JSON.parse(this.network.toJSON()))
        })
        this.subscribe('transferend', (e: CustomEvent) => {
            const source = pool.dummyBindings.getKey(e.detail.source)
            const target = pool.dummyBindings.getKey(e.detail.target)
            console.log(source, target)
            contextMenu.removeItem('transferend')
            this.network.transfers.push(new Transfer(source, target))
            this.resetNetwork(JSON.parse(this.network.toJSON()))
        })
        this.subscribe('transferdelete', (e: MouseEvent) => {
            if (e.relatedTarget === undefined) {
                return
            }
            const path = e.relatedTarget as SVGPathElement | SVGLineElement
            const transfer = (pool.outerEdgeBindings.getKey(path) || pool.innerEdgeBindings.getKey(path)) as Transfer
            util.deleteFromArray(this.network.transfers, transfer)
            this.resetNetwork(JSON.parse(this.network.toJSON()))
        })
        this.subscribe('editmapstart', (e: Event) => {
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
                targetsParent.id === 'dummy-circles'
                return true
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
        this.subscribe('editmapend', (e: Event) => {
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
        this.subscribe('mapsave', (e: Event) => {
            file.downloadText('graph.json', this.network.toJSON())
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
            const g = svg.createSVGElement('g') as SVGGElement
            g.id = groupId
            origin.appendChild(g)
        }

        this.plate = new ui.TextPlate()
        origin.insertBefore(this.plate.element, document.getElementById('dummy-circles'))
        this.redrawNetwork()
        this.addStationListeners()
    }

    private resetMapView(): void {
        // const fitness = (points, pt) => points.reduce((prev, cur) => this.bounds., 0);
        // const center = geo.calculateGeoMean(this.network.platforms.map(p => p.location), fitness, 0.1);
        const { center, zoom } = this.config
        const options = {
            pan: { animate: false },
            zoom: { animate: false },
        }
        if (!center) {
            console.error(`cannot set map to center`)
        }
        this.map.setView(center, zoom + 1, options)
        this.map.setView(center, zoom, options)
    }

    private getGraph(): Promise<GraphJSON> {
        return res.getJSON(this.config.url['graph']) as any
    }

    private resetNetwork(json: GraphJSON): void {
        this.network = new Network(json)
        this.redrawNetwork()
    }

    private cleanElements(): void {
        for (const child of (this.overlay.origin.childNodes as any)) {
            if (child !== this.plate.element) {
                util.removeAllChildren(child)
            }
        }
    }

    private addBindings() {
        const { platforms } = this.network
        const { tryGetFromMap } = util
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
            const container = document.getElementById(id)
            if (!container) {
                console.error(`container ${id} does not exist`)
                continue
            }
            container.style.strokeWidth = strokeWidths[id] + 'px'
        }

        const lightRailPathStyle = tryGetFromMap(this.lineRules, 'light-rail-path')
        lightRailPathStyle.strokeWidth = lightLineWidth + 'px'

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

            const circular = findCircle(this.network, station)
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

        if (zoom >= detailedZoom) {
            const transfersOuterFrag = tryGetFromMap(docFrags, 'transfers-outer')
            const transfersInnerFrag = tryGetFromMap(docFrags, 'transfers-inner')
            const { defs } = this.overlay
            for (const transfer of this.network.transfers) {
                const pl1 = transfer.source
                const pl2 = transfer.target
                const pos1 = tryGetFromMap(this.platformsOnSVG, transfer.source)
                const pos2 = tryGetFromMap(this.platformsOnSVG, transfer.target)
                const scp = stationCircumpoints.get(pl1.station)
                const paths = scp !== undefined && scp.includes(pl1) && scp.includes(pl2)
                    ? this.makeTransferArc(transfer, scp)
                    : svg.makeTransferLine(pos1, pos2)
                pool.outerEdgeBindings.set(transfer, paths[0])
                pool.innerEdgeBindings.set(transfer, paths[1])
                // paths[0].id = 'ot-' + transferIndex;
                // paths[1].id = 'it-' + transferIndex;
                const gradientColors = [pl1, pl2].map(p => this.getPlatformColor(p))
                // const colors = [transfer.source, transfer.target].map(i => getComputedStyle(stationCirclesFrag.childNodes[i] as Element, null).stroke);
                // console.log(colors);
                const circlePortion = fullCircleRadius / pos1.distanceTo(pos2)
                const gradientVector = pos2.subtract(pos1)
                let gradient = pool.gradientBindings.get(transfer)
                if (gradient === undefined) {
                    gradient = svg.Gradients.makeLinear(gradientVector, gradientColors, circlePortion)
                    gradient.id = util.generateId(id => document.getElementById(id) !== null)
                    pool.gradientBindings.set(transfer, gradient)
                    defs.appendChild(gradient)
                } else {
                    svg.Gradients.setDirection(gradient, gradientVector)
                    svg.Gradients.setOffset(gradient, circlePortion)
                }
                paths[0].style.stroke = `url(#${gradient.id})`

                transfersOuterFrag.appendChild(paths[0])
                transfersInnerFrag.appendChild(paths[1])
                // this.transferToModel(transfer, paths);
            }
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

        docFrags.forEach((val, key) => {
            const frag = document.getElementById(key)
            if (!frag) {
                throw new Error(`frag ${key} does not exist`)
            }
            frag.appendChild(val)
        })

        this.addBindings()
        console.timeEnd('appending')

    }

    private updatePlatformsPositionOnOverlay(zoom = this.map.getZoom()) {
        const detailed = zoom < this.config.detailedZoom
        for (const station of this.network.stations) {
            const center = detailed ? this.overlay.latLngToSvgPoint(station.getCenter()) : undefined
            for (const platform of station.platforms) {
                const pos = center || this.overlay.latLngToSvgPoint(platform.location)
                this.platformsOnSVG.set(platform, pos)
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
        const pos = tryGetFromMap(this.platformsOnSVG, platform)
        const whiskers = new Map<Span, L.Point>()
        if (platform.spans.length === 0) {
            return whiskers
        }
        if (platform.spans.length === 1) {
            return whiskers.set(platform.spans[0], pos)
        }
        if (platform.spans.length === 2) {
            if (platform.passingLines().size === 2) {
                return whiskers.set(platform.spans[0], pos).set(platform.spans[1], pos)
            }
            const getNeighborPos = (span: Span) => tryGetFromMap(this.platformsOnSVG, span.other(platform))
            const midPts = platform.spans.map(span => getNeighborPos(span).add(pos).divideBy(2))
            const ends = util.midPointsToEnds(pos, midPts)
            return whiskers.set(platform.spans[0], ends[0]).set(platform.spans[1], ends[1])
        }

        const points: L.Point[][] = [[], []]
        const spanIds: Span[][] = [[], []]
        for (const span of platform.spans) {
            const neighbor = span.other(platform)
            const neighborPos = tryGetFromMap(this.platformsOnSVG, neighbor)
            const dirIdx = span.source === platform ? 0 : 1
            points[dirIdx].push(neighborPos)
            spanIds[dirIdx].push(span)
        }
        const avg = (pts: L.Point[]) => pts.length === 1 ? pts[0] : pts.length === 0 ? pos : getCenter(pts)
        const midPts = points.map(pts => avg(pts).add(pos).divideBy(2))
        const ends = util.midPointsToEnds(pos, midPts)
        spanIds[0].forEach(i => whiskers.set(i, ends[0]))
        spanIds[1].forEach(i => whiskers.set(i, ends[1]))
        return whiskers
    }

    private makeTransferArc(transfer: Transfer, cluster: Platform[]): SVGLineElement[] | SVGPathElement[] {
        const pl1 = transfer.source
        const pl2 = transfer.target
        const pos1 = this.platformsOnSVG.get(transfer.source)
        const pos2 = this.platformsOnSVG.get(transfer.target)
        const makeArc = (third: Platform) => svg.makeTransferArc(pos1, pos2, this.platformsOnSVG.get(third))
        if (cluster.length === 3) {
            const third = cluster.find(p => p !== pl1 && p !== pl2)
            return makeArc(third)
        } else if (pl1 === cluster[2] && pl2 === cluster[3] || pl1 === cluster[3] && pl2 === cluster[2]) {
            return svg.makeTransferLine(pos1, pos2)
        }
        // const s = transfer.source;
        // const pl1neighbors = this.network.transfers.filter(t => t.source === s || t.target === s);
        // const pl1deg = pl1neighbors.length;
        const rarr: Platform[] = []
        for (const t of this.network.transfers) {
            if (t === transfer) continue
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
        // console.log(span.source, span.target);
        const controlPoints = [
            tryGetFromMap(this.platformsOnSVG, span.source),
            tryGetFromMap(tryGetFromMap(this.whiskers, span.source), span),
            tryGetFromMap(tryGetFromMap(this.whiskers, span.target), span),
            tryGetFromMap(this.platformsOnSVG, span.target),
        ]
        // console.log(span, this.whiskers.get(span.target), controlPoints);
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
        const dummyCircles = document.getElementById('dummy-circles')
        if (!dummyCircles) {
            throw new Error('dummy-circles do not exist')
        }
        dummyCircles.addEventListener('mouseover', e => {
            const dummy = e.target as SVGCircleElement
            const platform = pool.dummyBindings.getKey(dummy)
            const { station } = platform
            const names = this.map.getZoom() < this.config.detailedZoom && station.platforms.length > 1 ?
                station.getNames() :
                util.getPlatformNames(platform)
            this.highlightStation(station, names)
        })
        dummyCircles.addEventListener('mouseout', onMouseOut)
        const onTransferOver = (e: MouseEvent) => {
            const el = e.target as SVGPathElement | SVGLineElement
            const transfer = pool.outerEdgeBindings.getKey(el) || pool.innerEdgeBindings.getKey(el)
            const names = util.getPlatformNamesZipped([transfer.source, transfer.target])
            this.highlightStation(transfer.source.station, names)
        }
        const transfersOuter = document.getElementById('transfers-outer')
        if (!transfersOuter) {
            throw new Error('transfers-outer do not exist')
        }
        const transfersInner = document.getElementById('transfers-inner')
        if (!transfersInner) {
            throw new Error('transfers-inner do not exist')
        }
        transfersOuter.addEventListener('mouseover', onTransferOver)
        transfersInner.addEventListener('mouseover', onTransferOver)
        transfersOuter.addEventListener('mouseout', onMouseOut)
        transfersInner.addEventListener('mouseout', onMouseOut)
    }

    private highlightStation(station: Station, names: string[]) {
        const scaleFactor = 1.25
        let circle: SVGCircleElement|undefined
        let platform: Platform
        if (station.platforms.length === 1) {
            platform = station.platforms[0]
            circle = tryGetFromMap(pool.platformBindings, platform)
            Scale.scaleCircle(circle, scaleFactor, true)
        } else {
            const transfers = this.map.getZoom() < this.config.detailedZoom ? undefined : this.network.transfers
            Scale.scaleStation(station, scaleFactor, transfers)
            platform = station.platforms.reduce((prev, cur) => prev.location.lat < cur.location.lat ? cur : prev)
            circle = tryGetFromMap(pool.platformBindings, platform)
        }
        this.plate.show(svg.circleOffset(circle), names)
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
                const pos = this.overlay.latLngToSvgPoint(locForPos)
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
                    const circleTotalRadius = +circle.getAttribute('r') / 2 + circleBorderWidth
                    const pos = tryGetFromMap(this.platformsOnSVG, platform)
                    if (tagName === 'line') {
                        const n = pi + 1
                        const other = transfer.other(platform)
                        if (!other) {
                            throw new Error(`no other for ${platform.name}`)
                        }
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
                                if (transfers.length === 3) break
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
                            var pos1 = tryGetFromMap(this.platformsOnSVG, tr.source)
                            var pos2 = tryGetFromMap(this.platformsOnSVG, tr.target)
                            const thirdPos = circumpoints.find(pos => pos !== pos1 && pos !== pos2)
                            if (thirdPos) {
                                svg.setCircularPath(outer, pos1, pos2, thirdPos)
                            }
                            inner.setAttribute('d', outer.getAttribute('d'))
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