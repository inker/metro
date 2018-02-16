import React from 'react'
import ReactDom from 'react-dom'
import L from 'leaflet'
import unblur from 'unblur'
import {
    intersection,
} from 'lodash'

import Config from './Config'
import getLineRules from './getLineRules'

import Network, {
    Platform,
    Station,
    Span,
    Transfer,
    GraphJSON,
} from './network'

import getSvgSizesByZoom from './ui/getSvgSizesByZoom'
import addLayerSwitcher from './ui/addLayerSwitcher'
import DistanceMeasure from './ui/DistanceMeasure'
import SvgOverlay from './ui/SvgOverlay'
import ContextMenu from './ui/ContextMenu'
import RoutePlanner from './ui/RoutePlanner'
import Tooltip from './ui/Tooltip'
import FAQ from './ui/FAQ'
// import drawZones from './ui/drawZones'

import {
    mapbox,
    mapbox2,
    mapnik,
    osmFrance,
    openMapSurfer,
    cartoDBNoLabels,
    wikimapia,
} from 'ui/tilelayers'

import * as math from './util/math'
import { getJSON } from './util/http'
import getCenter from './util/geo/getCenter'
// import geometricMedian from './util/geo/geometricMedian'
import MetroMapEventMap from './util/MetroMapEventMap'
import Mediator from './util/Mediator'

import {
    tryGetFromMap,
    getOrMakeInMap,
} from 'utils/collections'

import {
    mean,
    normalize,
} from './util/math/vector'

import Metro from './Metro'

import 'leaflet/dist/leaflet.css'

import Config from './Config'
import pool from './ObjectPool'
import getLineRules from './getLineRules'

import Network, {
    Platform,
    Station,
    Span,
    Transfer,
    GraphJSON,
} from './network'

const alertifyPromise = import(/* webpackChunkName: "alertify" */ 'ui/alertify')

const GAP_BETWEEN_PARALLEL = 0 // 0 - none, 1 - line width

const contextMenuArray = [
    {
        event: 'routefrom',
        text: 'Route from here',
    },
    {
        event: 'routeto',
        text: 'Route to here',
    },
    {
        event: 'clearroute',
        text: 'Clear route',
    },
    {
        event: 'showheatmap',
        text: 'Show heatmap',
        extra: {
            disabled: true,
        },
    },
]

export default class {
    readonly mediator = new Mediator()
    protected readonly config: Config
    protected map: L.Map
    private moving = false
    protected overlay: SvgOverlay
    protected readonly contextMenu = new ContextMenu(contextMenuArray as any)

    protected network: Network
    private lineRules: Map<string, CSSStyleDeclaration>
    protected readonly whiskers = new WeakMap<Platform, Map<Span, L.Point>>()
    private readonly platformOffsets = new Map<L.Point, Map<Span, number>>()
    protected readonly platformsOnSVG = new WeakMap<Platform, L.Point>()

    protected readonly tooltip = new Tooltip()

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
            const networkPromise = this.getGraph()
            const lineRulesPromise = getLineRules(config.url.scheme)
            const dataPromise = getJSON(config.url.data)

            const tileLoadPromise = new Promise(resolve => {
                mapbox.once('load', resolve)
                setTimeout(resolve, 5000)
            })

            // wait.textContent = 'making map...';

            config.center = [0, 0]
            const mapOptions = { ...config }
            const scaleControl = L.control.scale({
                imperial: false,
            })
            this.map = L.map(config.containerId, mapOptions).addControl(scaleControl)
            const mapPaneStyle = this.map.getPanes().mapPane.style
            mapPaneStyle.visibility = 'hidden'

            addLayerSwitcher(this.map, [
                mapbox,
                mapnik,
                osmFrance,
                mapbox2,
                openMapSurfer,
                cartoDBNoLabels,
                wikimapia,
            ])

            // wait.textContent = 'loading graph...';
            this.addContextMenu()

            const json = await networkPromise
            this.network = new Network(json)
            const platformLocations = this.network.platforms.map(p => p.location)
            const center = getCenter(platformLocations)
            config.center = [center.lat, center.lng]
            const bounds = L.latLngBounds(platformLocations)
            this.overlay = new SvgOverlay(bounds, L.point(200, 200)).addTo(this.map)
            const { defs } = this.overlay

            const {
                default: alertify,
                confirm,
            } = await alertifyPromise
            // addEventListener('keydown', async e => {
            //     if (!e.shiftKey || !e.ctrlKey || e.keyCode !== 82 || !(await confirm('Reset network?'))) {
            //         return
            //     }
            //     const graph = await this.getGraph()
            //     this.resetNetwork(graph)
            // })

            // const { textContent } = defs
            // if (!textContent) {
            //     alertify.alert(`
            //         Your browser doesn't seem to have capabilities to display some features of the map.
            //         Consider using Chrome or Firefox for the best experience.
            //     `)
            // }

            this.lineRules = await lineRulesPromise
            // wait.textContent = 'adding content...';
            this.resetMapView()
            this.map.addLayer(mapbox)
            this.map.on('overlayupdate', e => {
                this.moving = true
                this.render()
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
            // new RoutePlanner().addTo(this)
            new DistanceMeasure().addTo(this.map)
            // this.routeWorker.postMessage(this.network);
            // drawZones(this.map, this.network.platforms);

            dataPromise.then(data => new FAQ(data).addTo(this.map))
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
        this.render()
    }

    private resetMapView() {
        // const fitness = (points, pt) => points.reduce((prev, cur) => this.bounds., 0);
        // const center = geometricMedian(this.network.platforms.map(p => p.location), fitness, 0.1);
        const { center, zoom } = this.config
        const options = {
            animate: false,
        }
        if (!center) {
            console.error(`cannot set map to center`)
            return
        }
        this.map.setView(center, zoom + 1, options)
        this.map.setView(center, zoom, options)
    }

    private getGraph(): Promise<GraphJSON> {
        return getJSON(this.config.url.graph)
    }

    protected resetNetwork(json: GraphJSON) {
        this.network = new Network(json)
        this.render()
    }

    render() {
        this.updatePlatformsPositionOnOverlay()
        const {
            network,
        } = this
        const zoom = this.map.getZoom()
        // const lineWidth = 2 ** (zoom / 4 - 1.75);
        const svgSizes = this.getSvgSizes()
        const {
            lineWidth,
            lightLineWidth,
        } = svgSizes

        const lightRailPathStyle = tryGetFromMap(this.lineRules, 'L')
        lightRailPathStyle.strokeWidth = `${lightLineWidth}px`

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

        ReactDom.render((
            <Metro
                config={this.config}
                zoom={zoom}
                lineRules={this.lineRules}
                network={network}
                overlay={this.overlay}
                platformsOnSVG={this.platformsOnSVG}
                platformOffsets={this.platformOffsets}
                svgSizes={svgSizes}
            />
        ), this.overlay.origin)
    }

    private getSvgSizes() {
        return getSvgSizesByZoom(this.map.getZoom(), this.config.detailedZoom)
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
                const geoCenter = getCenter(locations)
                posByName.set(name, overlay.latLngToOverlayPoint(geoCenter))
            }
            for (const platform of platforms) {
                const pos = tryGetFromMap(posByName, platform.name)
                platformsOnSVG.set(platform, pos)
            }
        }
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
            const wings = math.makeWings(prevPos, pos, nextPos, 1)
            const t = Math.min(pos.distanceTo(prevPos), pos.distanceTo(nextPos)) * PART
            for (let i = 0; i < 2; ++i) {
                // const t = pos.distanceTo(neighborPositions[i]) * PART
                const end = wings[i].multiplyBy(t).add(pos)
                whiskers.set(spans[i], end)
            }
            return whiskers
        }

        const normals: [L.Point[], L.Point[]] = [[], []]
        const sortedSpans: [Span[], Span[]] = [[], []]
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
        const wings = math.makeWings(prevPos, pos, nextPos, 1)
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
}
