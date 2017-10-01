import * as L from 'leaflet'
import unblur from 'unblur'
import {
    difference,
    intersection,
    uniqueId,
    memoize,
    maxBy,
} from 'lodash'

import * as ui from './ui'
import { Config, getLineRules, getJSON } from './res'
import pool from './ObjectPool'

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
    dom,
    collections,
    MetroMapEventMap,
    getPlatformNames,
    getPlatformNamesZipped,
    // midPointsToEnds,
    // drawBezierHints,
} from './util'

const {
    mapbox,
    mapnik,
    osmFrance,
    openMapSurfer,
    cartoDBNoLabels,
    wikimapia,
} = ui.tileLayers

const {
    tryGetFromMap,
    tryGetKeyFromBiMap,
    getOrMakeInMap,
} = collections

const {
    mean,
    normalize,
    unit,
    angle,
} = math.vector

const { scale } = sfx
const { findCycle } = algorithm

const GAP_BETWEEN_PARALLEL = 0 // 0 - none, 1 - line width
const CURVE_SPLIT_NUM = 10

const groupIds = [
    'paths-outer',
    'paths-inner',
    'transfers-outer',
    'station-circles',
    'transfers-inner',
    'dummy-circles',
]

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

function getSvgSizesByZoom(zoom: number, detailedZoom: number) {
    const coef = zoom > 9 ? zoom : zoom > 8 ? 9.5 : 9
    // const lineWidth = 2 ** (zoom / 4 - 1.75);
    const lineWidth = (coef - 7) * 0.5
    const lightLineWidth = lineWidth * 0.75
    const circleRadius = coef < detailedZoom ? lineWidth * 1.25 : lineWidth * 1.1
    const circleBorder = coef < detailedZoom ? circleRadius * 0.4 : circleRadius * 0.6
    const dummyCircleRadius = circleRadius * 2
    const transferWidth = lineWidth * 0.9
    const transferBorder = circleBorder * 1.4
    const fullCircleRadius = circleRadius + circleBorder / 2
    return {
        lineWidth,
        lightLineWidth,
        circleRadius,
        circleBorder,
        dummyCircleRadius,
        transferWidth,
        transferBorder,
        fullCircleRadius,
    }
}

const getSvgSizesByZoomMemoized = memoize(getSvgSizesByZoom)

export default class {
    readonly mediator = new Mediator()
    protected readonly config: Config
    protected map: L.Map
    private moving = false
    protected overlay: ui.SvgOverlay
    protected readonly contextMenu = new ui.ContextMenu(contextMenuArray as any)

    protected network: Network
    private lineRules: Map<string, CSSStyleDeclaration>
    protected readonly whiskers = new WeakMap<Platform, Map<Span, L.Point>>()
    private readonly platformOffsets = new Map<L.Point, Map<Span, number>>()
    protected readonly platformsOnSVG = new WeakMap<Platform, L.Point>()

    protected readonly tooltip = new ui.Tooltip()

    // private routeWorker = new Worker('js/routeworker.js');

    getMap(): L.Map {
        return this.map
    }

    getNetwork(): Network {
        return this.network
    }

    constructor(config: Config) {
        this.config = config
        this.makeMap()
    }

    protected async makeMap() {
        try {
            const { config } = this
            const lineRulesPromise = dom.tryGetElement('#scheme').then((link: HTMLLinkElement) => {
                link.href = config.url.scheme
                return getLineRules()
            })
            const networkPromise = this.getGraph()
            const tileLoadPromise = new Promise(resolve => mapbox.once('load', resolve))
            const dataPromise = getJSON(config.url.data)

            // wait.textContent = 'making map...';

            config.center = [0, 0]
            const mapOptions = { ...config }
            if (L.version[0] === '1') {
                mapOptions.wheelPxPerZoomLevel = 75
                mapOptions.inertiaMaxSpeed = 1500
                mapOptions.fadeAnimation = false
            }
            const scaleControl = L.control.scale({
                imperial: false,
            })
            this.map = L.map(config.containerId, mapOptions).addControl(scaleControl)
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
            const platformLocations = this.network.platforms.map(p => p.location)
            const center = geo.getCenter(platformLocations)
            config.center = [center.lat, center.lng]
            const bounds = L.latLngBounds(platformLocations)
            this.overlay = new ui.SvgOverlay(bounds, L.point(200, 200)).addTo(this.map)
            const { defs } = this.overlay
            svg.filters.appendAll(defs)
            const { textContent } = defs
            if (!textContent) {
                alert("Your browser doesn't seem to have capabilities to display some features of the map. Consider using Chrome or Firefox for the best experience.")
            }

            this.lineRules = await lineRulesPromise
            // wait.textContent = 'adding content...';
            this.resetMapView()
            this.map.addLayer(mapbox)
            this.map.on('overlayupdate', e => {
                this.moving = true
                this.redrawNetwork()
                this.moving = false
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

            dataPromise.then(data => new ui.FAQ(data.faq).addTo(this))
            // wait.textContent = 'loading tiles...';

            await tileLoadPromise
            // wait.parentElement.removeChild(wait);
            mapPaneStyle.visibility = ''
            // const img = file.svgToImg(document.getElementById('overlay') as any, true);
            // file.svgToCanvas(document.getElementById('overlay') as any)
            //     .then(canvas => fFile.downloadText('svg.txt', canvas.toDataURL('image/png')));
            // file.downloadText('img.txt', img.src);
            this.runUnblur()
        } catch (e) {
            console.error(e)
        }
    }

    runUnblur() {
        this.map
            .on('movestart', e => this.moving = true)
            .on('moveend', e => this.moving = false)
        unblur({
            skipIf: () => this.moving,
            interval: 250,
        })
    }

    subscribe<K extends keyof MetroMapEventMap>(type: K, listener: (e: MetroMapEventMap[K]) => void) {
        this.mediator.subscribe(type, listener)
        // forwarding map event to mediator
        this.map.on(type, this.mediator.publish)
    }

    private addContextMenu() {
        for (const el of contextMenuArray) {
            this.map.on(el.event, this.mediator.publish)
        }
        this.contextMenu.addTo(this.map)
    }

    protected addMapListeners() {
        const { map, contextMenu } = this

        map.on('zoomstart', e => {
            this.tooltip.hide()
        })

        map.on('distancemeasureinit', e => {
            contextMenu.insertItem('measuredistance', 'Measure distance')

            map.on('clearmeasurements', () => {
                contextMenu.removeItem('clearmeasurements')
                contextMenu.insertItem('measuredistance', 'Measure distance')
            })

            this.subscribe('measuredistance', () => {
                contextMenu.removeItem('measuredistance')
                contextMenu.insertItem('clearmeasurements', 'Clear measurements')
            })
        })
    }

    /** call only once! */
    private initNetwork() {
        const { origin } = this.overlay

        for (const groupId of groupIds) {
            const g = svg.createSVGElement('g')
            g.id = groupId
            origin.appendChild(g)
        }

        origin.insertBefore(this.tooltip.element, document.getElementById('dummy-circles'))
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
        return getJSON(this.config.url.graph) as any
    }

    protected resetNetwork(json: GraphJSON) {
        this.network = new Network(json)
        this.redrawNetwork()
    }

    private cleanElements() {
        const { overlay, tooltip } = this
        const { element } = tooltip
        for (const child of (overlay.origin.childNodes as any)) {
            if (child !== element) {
                dom.removeAllChildren(child)
            }
        }
    }

    protected redrawNetwork() {
        console.time('pre')
        this.cleanElements()
        this.updatePlatformsPositionOnOverlay()
        console.timeEnd('pre')
        console.time('preparation')
        const { detailedZoom } = this.config
        const zoom = this.map.getZoom()
        // const lineWidth = 2 ** (zoom / 4 - 1.75);
        const {
            lineWidth,
            lightLineWidth,
            circleBorder,
            dummyCircleRadius,
            transferWidth,
            transferBorder,
        } = this.getSvgSizes()

        const strokeWidths = {
            'station-circles': circleBorder,
            'dummy-circles': 0,
            'transfers-outer': transferWidth + transferBorder / 2,
            'transfers-inner': transferWidth - transferBorder / 2,
            'paths-outer': lineWidth,
            'paths-inner': lineWidth / 2,
        }

        const docFrags = new Map<string, DocumentFragment>()
        for (const [id, width] of Object.entries(strokeWidths)) {
            docFrags.set(id, document.createDocumentFragment())
            dom.byId(id).style.strokeWidth = `${width}px`
        }

        const lightRailPathStyle = tryGetFromMap(this.lineRules, 'L')
        lightRailPathStyle.strokeWidth = `${lightLineWidth}px`

        // 11 - 11, 12 - 11.5, 13 - 12, 14 - 12.5
        this.tooltip.setFontSize(Math.max((zoom + 10) * 0.5, 11))

        const stationCircumpoints = new Map<Station, Platform[]>()

        console.timeEnd('preparation')

        // station circles

        console.time('circle preparation')

        const stationCirclesFrag = tryGetFromMap(docFrags, 'station-circles')
        const dummyCirclesFrag = tryGetFromMap(docFrags, 'dummy-circles')

        const isDetailed = zoom >= detailedZoom

        this.platformOffsets.clear()
        const lineWidthPlusGapPx = (GAP_BETWEEN_PARALLEL + 1) * lineWidth
        for (const span of this.network.spans) {
            const { source, target, routes } = span
            const parallel = this.network.spans.filter(s => s.isOf(source, target))
            if (parallel.length === 1) {
                continue
            }
            if (parallel.length === 0) {
                throw new Error(`some error with span ${source.name}-${target.name}: it probably does not exist`)
            }

            const i = parallel.indexOf(span)
            if (i === -1) {
                throw new Error(`some error with span ${source.name}-${target.name}`)
            }
            const leftShift = (parallel.length - 1) / 2
            const totalOffset = (i - leftShift) * lineWidthPlusGapPx
            for (const p of [source, target]) {
                const pos = tryGetFromMap(this.platformsOnSVG, p)
                const spanRouteSpans = p.spans.filter(s => intersection(s.routes, routes).length > 0)
                for (const s of spanRouteSpans) {
                    const map = getOrMakeInMap(this.platformOffsets, pos, () => new Map<Span, number>())
                    map.set(s, totalOffset)
                }
            }
        }

        for (const station of this.network.stations) {
            const circumpoints: L.Point[] = []
            // const stationMeanColor: string
            // if (zoom < 12) {
            //     stationMeanColor = color.mean(this.linesToColors(this.passingLinesStation(station)));
            // }
            for (const platform of station.platforms) {
                const pos = tryGetFromMap(this.platformsOnSVG, platform)
                // const posOnSVG = this.overlay.latLngToSvgPoint(platform.location);
                const whiskers = this.makeWhiskers(platform)
                this.whiskers.set(platform, whiskers)

                if (zoom > 9) {
                    const ci = this.makePlatformElement(platform)
                    // ci.id = 'p-' + platformIndex;

                    if (isDetailed) {
                        this.colorizePlatformElement(ci, platform.passingLines())
                    }
                    // else {
                    //     ci.style.stroke = stationMeanColor;
                    // }
                    const dummyCircle = svg.makeCircle(pos, dummyCircleRadius)
                    // dummyCircle.id = 'd-' + platformIndex;

                    stationCirclesFrag.appendChild(ci)
                    pool.platformBindings.set(platform, ci)
                    dummyCirclesFrag.appendChild(dummyCircle)
                    pool.dummyBindings.set(platform, dummyCircle)
                }

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
            const { source, target } = transfer
            if (!isDetailed && source.name === target.name) {
                continue
            }
            const scp = stationCircumpoints.get(source.station)
            const paths = scp !== undefined
                && scp.includes(source)
                && scp.includes(target) ? this.makeTransferArc(
                    transfer,
                    scp,
                ) : svg.makeTransferLine(
                    tryGetFromMap(this.platformsOnSVG, source),
                    tryGetFromMap(this.platformsOnSVG, target),
                )
            pool.outerEdgeBindings.set(transfer, paths[0])
            pool.innerEdgeBindings.set(transfer, paths[1])
            paths[0].style.stroke = isDetailed ? this.makeGradient(transfer) : '#000'
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
        for (const [key, val] of docFrags) {
            dom.byId(key).appendChild(val)
        }
        console.timeEnd('appending')
    }

    private getSvgSizes() {
        return getSvgSizesByZoomMemoized(this.map.getZoom(), this.config.detailedZoom)
    }

    private makePlatformElement(platform: Platform) {
        const pos = tryGetFromMap(this.platformsOnSVG, platform)
        const { circleRadius } = this.getSvgSizes()
        const offsetsMap = this.platformOffsets.get(pos)
        if (!offsetsMap) {
            return svg.makeCircle(pos, circleRadius)
        }

        const offsets = Array.from(offsetsMap).map(([k, v]) => v)
        const width = Math.max(...offsets) - Math.min(...offsets)

        const stadium = svg.makeStadium(pos, width, circleRadius)
        const { value } = tryGetFromMap(this.whiskers, platform).values().next()
        const rotationAngle = angle(value.subtract(pos), unit)
        const deg = rotationAngle * 180 / Math.PI
        stadium.setAttribute('transform', `rotate(${deg})`)
        return stadium
    }

    private makeGradient(transfer: Transfer) {
        const { source, target } = transfer
        const pos1 = tryGetFromMap(this.platformsOnSVG, source)
        const pos2 = tryGetFromMap(this.platformsOnSVG, target)
        // paths[0].id = 'ot-' + transferIndex;
        // paths[1].id = 'it-' + transferIndex;
        const gradientColors = [
            this.getPlatformColor(source),
            this.getPlatformColor(target),
        ]
        // const colors = [source, target].map(i => getComputedStyle(stationCirclesFrag.childNodes[i] as Element, null).stroke)
        // console.log(colors);
        const { fullCircleRadius } = this.getSvgSizes()
        const circlePortion = fullCircleRadius / pos1.distanceTo(pos2)
        const gradientVector = pos2.subtract(pos1)
        let gradient = pool.gradientBindings.get(transfer)
        if (gradient === undefined) {
            gradient = svg.gradients.makeLinear(gradientVector, gradientColors, circlePortion)
            gradient.id = uniqueId('gradient-')
            pool.gradientBindings.set(transfer, gradient)
            this.overlay.defs.appendChild(gradient)
        } else {
            svg.gradients.setDirection(gradient, gradientVector)
            svg.gradients.setOffset(gradient, circlePortion)
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
            const { platforms } = station
            for (const platform of platforms) {
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
            for (const name of nameSet) {
                const locations = platforms.filter(p => p.name === name).map(p => p.location)
                const geoCenter = geo.getCenter(locations)
                posByName.set(name, overlay.latLngToOverlayPoint(geoCenter))
            }
            for (const platform of platforms) {
                const pos = tryGetFromMap(posByName, platform.name)
                platformsOnSVG.set(platform, pos)
            }
        }
    }

    private getPlatformColor(platform: Platform): string {
        return color.meanColor(this.linesToColors(platform.passingLines()))
    }

    private linesToColors(lines: Set<string>): string[] {
        const rgbs: string[] = []
        for (const line of lines) {
            const { stroke } = tryGetFromMap(this.lineRules, line[0] === 'M' ? line : line[0])
            if (stroke) {
                rgbs.push(stroke)
            }
        }
        return rgbs
    }

    private colorizePlatformElement(ci: SVGElement, lines: Set<string>) {
        if (lines.size === 0) {
            return
        }
        if (lines.size === 1) {
            const line = lines.values().next().value
            ci.classList.add(line[0] === 'M' ? line : line[0])
            return
        }
        ci.style.stroke = color.meanColor(this.linesToColors(lines))
    }

    protected makeWhiskers(platform: Platform): Map<Span, L.Point> {
        const PART = 0.5
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
            const t = Math.min(pos.distanceTo(prevPos), pos.distanceTo(nextPos)) * PART
            for (let i = 0; i < 2; ++i) {
                // const t = pos.distanceTo(neighborPositions[i]) * PART
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
            normals[dirIdx].push(normalize(neighborPos.subtract(pos)))
            sortedSpans[dirIdx].push(span)
            distances.set(span, pos.distanceTo(neighborPos))
        }
        const [prevPos, nextPos] = normals.map(ns => mean(ns).add(pos))
        const wings = math.wings(prevPos, pos, nextPos, 1)
        for (let i = 0; i < 2; ++i) {
            const wing = wings[i]
            for (const span of sortedSpans[i]) {
                const t = tryGetFromMap(distances, span) * PART
                const end = wing.multiplyBy(t).add(pos)
                whiskers.set(span, end)
            }
        }
        return whiskers
    }

    private makeTransferArc(transfer: Transfer, cluster: Platform[]): SVGLineElement[] | SVGPathElement[] {
        const { network, platformsOnSVG } = this
        const { source, target } = transfer
        const pos1 = tryGetFromMap(platformsOnSVG, source)
        const pos2 = tryGetFromMap(platformsOnSVG, target)
        const makeArc = (third: Platform) =>
            svg.makeTransferArc(pos1, pos2, tryGetFromMap(platformsOnSVG, third))
        if (cluster.length === 3) {
            const third = difference(cluster, [source, target])[0]
            return makeArc(third)
        }
        if (source === cluster[2] && target === cluster[3] || source === cluster[3] && target === cluster[2]) {
            return svg.makeTransferLine(pos1, pos2)
        }
        // const s = transfer.source;
        // const pl1neighbors = network.transfers.filter(t => t.source === s || t.target === s);
        // const pl1deg = pl1neighbors.length;
        const rarr: Platform[] = []
        for (const t of network.transfers) {
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
        const { routes, source, target } = span
        if (routes.length === 0) {
            console.error(span, 'span has no routes!')
            throw new Error('span has no routes!')
        }
        const tokens = routes[0].line.match(/([MEL])(\d{0,2})/)
        if (!tokens) {
            throw new Error(`match failed for ${source.name}-${target.name}`)
        }
        const [lineId, lineType] = tokens

        const controlPoints = this.getControlPoints(span)

        // drawBezierHints(this.overlay.origin, controlPoints, get(this.lineRules.get(lineId), 'stroke') as string)

        const bezier = svg.bezier.create(controlPoints[0], ...controlPoints.slice(1))
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

    private getControlPoints(span: Span) {
        const { source, target } = span
        const sourcePos = tryGetFromMap(this.platformsOnSVG, source)
        const targetPos = tryGetFromMap(this.platformsOnSVG, target)

        const controlPoints = [
            sourcePos,
            tryGetFromMap(tryGetFromMap(this.whiskers, source), span),
            tryGetFromMap(tryGetFromMap(this.whiskers, target), span),
            targetPos,
        ]

        const sourceMap = this.platformOffsets.get(sourcePos)
        const targetMap = this.platformOffsets.get(targetPos)
        if (sourceMap) {
            const offset = sourceMap.get(span)
            if (!offset) {
                return [controlPoints]
            }
            if (targetMap) {
                const curves = math.split(controlPoints, CURVE_SPLIT_NUM)
                const [head, ...tail] = curves.map(pa => math.offsetPath(pa, offset))
                return [head, ...tail.map(arr => arr.slice(1))]
            }
            const lineO = math.offsetLine(controlPoints.slice(0, 2), offset)
            controlPoints[0] = lineO[0]
            controlPoints[1] = lineO[1]
            return [controlPoints]
        }
        if (targetMap) {
            const offset = targetMap.get(span)
            if (!offset) {
                return [controlPoints]
            }
            const lineO = math.offsetLine(controlPoints.slice(2, 4), offset)
            controlPoints[2] = lineO[0]
            controlPoints[3] = lineO[1]
        }
        return [controlPoints]
    }

    private addStationListeners() {
        const onMouseOut = (e: MouseEvent) => {
            this.tooltip.hide()
            scale.unscaleAll()
        }
        const dummyCircles = dom.byId('dummy-circles')
        dummyCircles.addEventListener('mouseover', e => {
            const dummy = e.target as SVGCircleElement
            const platform = tryGetKeyFromBiMap(pool.dummyBindings, dummy)
            this.highlightStation(platform.station, getPlatformNames(platform), [platform.name])
        })
        dummyCircles.addEventListener('mouseout', onMouseOut)
        const onTransferOver = (e: MouseEvent) => {
            const el = e.target as SVGPathElement | SVGLineElement
            const { source, target } = pool.outerEdgeBindings.getKey(el)
                || tryGetKeyFromBiMap(pool.innerEdgeBindings, el)
            const names = getPlatformNamesZipped([source, target])
            this.highlightStation(source.station, names, [source.name, target.name])
        }
        const transfersOuter = dom.byId('transfers-outer')
        const transfersInner = dom.byId('transfers-inner')
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
            scale.scaleElement(circle, scaleFactor, true)
        }
        if (this.map.getZoom() >= this.config.detailedZoom) {
            for (const transfer of this.network.transfers) {
                const shouldScale = platforms.some(p => transfer.has(p))
                    && filteredNames.includes(transfer.source.name)
                    && filteredNames.includes(transfer.target.name)
                if (shouldScale) {
                    scale.scaleTransfer(transfer, scaleFactor)
                }
            }
        }
        const topmostPlatform = maxBy(platforms, p => p.location.lat)
        const topmostCircle = tryGetFromMap(pool.platformBindings, topmostPlatform)
        this.tooltip.show(svg.getElementOffset(topmostCircle), namesOnPlate)
    }

}
