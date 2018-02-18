import React from 'react'
import ReactDom from 'react-dom'
import L from 'leaflet'
import unblur from 'unblur'

import Config from './Config'
import getLineRules from './getLineRules'

import Network, { GraphJSON } from './network'

import addLayerSwitcher from './ui/addLayerSwitcher'
import DistanceMeasure from './ui/DistanceMeasure'
import SvgOverlay from './ui/SvgOverlay'
import ContextMenu from './ui/ContextMenu'
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
} from './ui/tilelayers'

import * as math from './util/math'
import { getJSON } from './util/http'
import getCenter from './util/geo/getCenter'
// import geometricMedian from './util/geo/geometricMedian'
import MetroMapEventMap from './util/MetroMapEventMap'
import Mediator from './util/Mediator'

import Metro from './Metro'

import 'leaflet/dist/leaflet.css'

const alertifyPromise = import(/* webpackChunkName: "alertify" */ './ui/alertify')

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
            this.network = new Network(json, config.detailedE)
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

    private latLngToOverlayPoint = (latLng: L.LatLng) =>
        this.overlay.latLngToOverlayPoint(latLng)

    render() {
        ReactDom.render((
            <Metro
                config={this.config}
                zoom={this.map.getZoom()}
                lineRules={this.lineRules}
                network={this.network}
                latLngToOverlayPoint={this.latLngToOverlayPoint}
            />
        ), this.overlay.origin)
    }
}
