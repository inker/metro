/// <reference path="../typings/tsd.d.ts" />
import * as L from 'leaflet';
const alertify = require('alertifyjs');
import { lineRulesPromise } from './res';
import { mapbox, mapnik, osmFrance, cartoDBNoLabels, wikimapia } from './tilelayers';
import * as util from './util';
import * as math from './math';
import * as algorithm from './algorithm';
import { translate as tr, formatTime as ft } from './lang';
import * as svg from './svg';
import * as g from './graph';
import * as bind from './bind';
import * as hints from './hints';
import * as geo from './geo';
import * as ui from './ui';

L.Icon.Default.imagePath = 'http://cdn.leafletjs.com/leaflet/v0.7.7/images';

const minZoom = 9, maxZoom = 18, startingZoom = 11, detailedZoom = 12;

export default class MetroMap implements EventTarget {
    private map: L.Map;
    private overlay: SVGSVGElement;
    private graph: g.Graph;
    private bounds: L.LatLngBounds;
    private hints: hints.Hints;

    private whiskers = new Map<number, Map<number, L.Point>>();
    private platformsOnSVG = new Map<number, L.Point>();

    private plate: ui.TextPlate;
    private distanceMeasure: ui.DistanceMeasure;

    private fromMarker = new L.Marker([0, 0], { draggable: true, icon: ui.Icons.start });
    private toMarker = new L.Marker([0, 0], { draggable: true, icon: ui.Icons.end });
    //private routeWorker = new Worker('js/routeworker.js');

    private _contextMenu: ui.ContextMenu;

    private lineRules: Map<string, CSSStyleDeclaration>;

    get contextMenu() {
        return this._contextMenu;
    }

    getMap(): L.Map {
        return this.map;
    }

    getOverlay(): SVGSVGElement {
        return this.overlay;
    }

    getPlate(): ui.TextPlate {
        return this.plate;
    }

    getGraph(): g.Graph {
        return this.graph;
    }

    constructor(containerId: string, kml: string) {
        const graphPromise = fetch(kml)
            .then(data => data.text())
            .then(graphJSON => this.graph = new g.Graph(graphJSON));
        const hintsPromise = fetch('json/hints.json')
            .then(data => data.json())
            .then((hintsJSON: hints.Hints) => this.hints = hintsJSON);
        const contextMenuPromise = fetch('json/contextmenudata.json')
            .then(data => data.json());

        this.map = new L.Map(containerId, {
            center: new L.LatLng(59.943556, 30.30452),
            zoom: startingZoom,
            minZoom,
            maxZoom,
            inertia: true
        }).addControl(new L.Control.Scale({ imperial: false })).addLayer(mapbox);

        const { tilePane, objectsPane, markerPane } = this.map.getPanes();
        tilePane.style.display = 'none';

        ui.addLayerSwitcher(this.map, [mapbox, mapnik, osmFrance, cartoDBNoLabels, wikimapia]);
        addEventListener('keydown', e => {
            if (e.altKey) {
                switch (e.keyCode) {
                    case 82: return this.redrawNetwork(); // r
                    default: return;
                }
            }
            switch (e.keyCode) {
                case 27: return this.dispatchEvent(new Event('clearroute')); // esc
                default: return;
            }
        });

        this.overlay = svg.createSVGElement('svg') as SVGSVGElement;
        this.overlay.id = 'overlay';
        objectsPane.insertBefore(this.overlay, markerPane);

        const defs = svg.createSVGElement('defs');
        defs.appendChild(svg.Shadows.makeDrop());
        defs.appendChild(svg.Shadows.makeGlow());
        defs.appendChild(svg.Shadows.makeOpacity());
        defs.appendChild(svg.Shadows.makeGray());
        if (defs.textContent.length === 0) {
            alert(tr("Your browser doesn't seem to have capabilities to display some features of the map. Consider using Chrome or Firefox for the best experience."));
        }
        this.overlay.appendChild(defs);

        graphPromise.then(g => hintsPromise).then(h => lineRulesPromise).then(lineRules => {
            this.lineRules = lineRules;
            this.bounds = new L.LatLngBounds(this.graph.platforms.map(p => p.location));
            this.redrawNetwork();
            // TODO: fix the kludge making the grey area disappear
            this.map.invalidateSize(false);
            this.addMapMovementListeners();
            //this.routeWorker.postMessage(this.graph);
            //drawZones(this);
            if (!L.Browser.mobile) {
                new ui.MapEditor(this, detailedZoom);
            }
            new ui.FAQ(this, 'json/data.json');
            return contextMenuPromise;
        }).then(contextMenuData => {
            this._contextMenu = new ui.ContextMenu(this, new Map<string, any>(contextMenuData));
            this.distanceMeasure = new ui.DistanceMeasure(this);
            this.resetMapView();
            ui.cacheIcons(this.map, [this.fromMarker, this.toMarker]);
            util.fixFontRendering(); // just in case
            tilePane.style.display = '';
            console.log(hints.verify(this.graph, this.hints));
        });
    }

    addEventListener(type: string, listener: EventListener) { }
    removeEventListener(type: string, listener: EventListener) { }

    dispatchEvent(event: Event): boolean {
        console.log('event as seen from the dispatcher', event);
        switch (event.type) {
            case 'measuredistance': {
                this.distanceMeasure.measureDistance(util.mouseToLatLng(this.map, event as MouseEvent));
                break;
            }
            case 'deletemeasurements':
                this.distanceMeasure.deleteMeasurements();
                break;
            case 'routefrom':
            case 'routeto':
                this.handleMenuFromTo(event as MouseEvent);
                break;
            case 'clearroute':
                this.clearRoute();
                break;
            case 'platformrename': {
                const me = event as MouseEvent;
                const circle = me.relatedTarget as SVGCircleElement;
                const platform = util.platformByCircle(circle, this.graph);
                this.plate.show(svg.circleOffset(circle), util.getPlatformNames(platform));
                ui.platformRenameDialog(this.graph, platform);
                break;
            }
            case 'platformdelete': {
                break;
            }
            case 'platformadd':
                const coor = util.mouseToLatLng(this.map, event as MouseEvent);
                const pos = this.map.latLngToContainerPoint(coor)
                    .subtract(this.map.latLngToContainerPoint(this.bounds.getNorthWest()));
                const stationCircles = document.getElementById('station-circles'),
                    dummyCircles = document.getElementById('dummy-circles');
                const circle = svg.makeCircle(pos, +stationCircles.firstElementChild.getAttribute('r')),
                    dummy = svg.makeCircle(pos, +dummyCircles.firstElementChild.getAttribute('r'));

                const id = this.graph.platforms.length;
                circle.id = 'p-' + id;
                dummy.id = 'd-' + id;
                stationCircles.appendChild(circle);
                dummyCircles.appendChild(dummy);
                const platform: g.Platform = {
                    name: tr('New station'),
                    altNames: {},
                    station: null,
                    spans: [],
                    elevation: 0,
                    location: coor
                };
                this.graph.platforms.push(platform);
                bind.platformToModel.call(this, platform, [circle, dummy])
                break;
            case 'showheatmap':
                this.showHeatMap();
                break;                
            default:
                break;
        }
        return false;
    }

    private clearRoute() {
        const terminate = svg.Animation.terminateAnimations();
        this.map.removeLayer(this.fromMarker).removeLayer(this.toMarker);
        this.fromMarker.off('drag').off('dragend');
        this.toMarker.off('drag').off('dragend');
        alertify.dismissAll();
        terminate.then(util.resetStyle);
    }

    private handleMenuFromTo(e: MouseEvent) {
        const coors = util.mouseToLatLng(this.map, e);
        const marker = e.type === 'routefrom' ? this.fromMarker : this.toMarker;
        marker.setLatLng(coors);
        if (!marker.hasEventListeners('drag')) {
            marker.on('drag', e => {
                if (!this.map.hasLayer(this.fromMarker) || !this.map.hasLayer(this.toMarker)) return;
                this.visualizeShortestRoute([this.fromMarker.getLatLng(), this.toMarker.getLatLng()], false);
            });
        }
        if (!marker.hasEventListeners('dragend')) {
            marker.on('dragend', e => {
                util.fixFontRendering();
                if (!this.map.hasLayer(this.fromMarker) || !this.map.hasLayer(this.toMarker)) return;
                this.visualizeShortestRoute([this.fromMarker.getLatLng(), this.toMarker.getLatLng()]);
            });
        }
        if (!this.map.hasLayer(marker)) {
            this.map.addLayer(marker);
        }

        const otherMarker = marker === this.fromMarker ? this.toMarker : this.fromMarker;
        if (this.map.hasLayer(otherMarker)) {
            // fixing font rendering here boosts the performance
            util.fixFontRendering();
            const latLngArr = [this.fromMarker.getLatLng(), this.toMarker.getLatLng()];
            this.visualizeShortestRoute(latLngArr);
            //this.map.once('zoomend', e => this.visualizeShortestRoute(latLngArr));
            //this.map.fitBounds(new L.LatLngBounds(latLngArr));
        }

    }

    private showHeatMap() {
        // if (this.map.hasLayer(this.fromMarker)) {
        //     // draw time map from the marker                    
        // } else {
        //     // draw time map to the closest station from each point
        //     const nw = this.bounds.getNorthWest();
        //     const topLeft = this.map.latLngToContainerPoint(nw);
        //     const se = this.bounds.getSouthEast();
        //     const bottomRight = this.map.latLngToContainerPoint(se);
        //     const step = bottomRight.subtract(topLeft).divideBy(200);
        //     console.log(se.distanceTo(nw) / 200);
        //     console.log('for ' + step);
        //     console.time('checking');
        //     for (let i = topLeft.x; i < bottomRight.x; i += step.x) {
        //         for (let j = topLeft.y; j < bottomRight.y; j += step.y) {
        //             const c = this.map.containerPointToLatLng(new L.Point(i, j));
        //             //new L.Marker(c).addTo(this.map);
        //             const closest = geo.findClosestObject(c, this.graph.platforms).location;
        //             L.LatLng.prototype.distanceTo.call(closest, c);
        //             //util.shortestPath(this.graph, c, closest);
        //         }
        //     }
        //     console.timeEnd('checking');
        // }
    }

    private addMapMovementListeners(): void {
        const mapPane = this.map.getPanes().mapPane;
        const overlayStyle = this.overlay.style;
        const overlayClassList = this.overlay.classList;
        let scaleFactor = 1,
            mousePos: L.Point,
            fromZoom: number;
        this.map.on('zoomstart', e => {
            overlayClassList.add('leaflet-zoom-animated');
            console.log('zoomstart', e);
            this.map.dragging.disable();
            fromZoom = e.target['_zoom'];
            if (scaleFactor !== 1) {
                //mousePos = e.target['scrollWheelZoom']['_lastMousePos'];
                console.log('mousepos:', mousePos);
                util.scaleOverlay(this.overlay, scaleFactor, mousePos);
            }
            scaleFactor = 1;
        }).on('zoomanim', e => {
            // const toZoom: number = e['zoom'];
            // scaleFactor = 2 ** (toZoom - fromZoom);
            // util.scaleOverlay(this.overlay, scaleFactor, mousePos);
        }).on('zoomend', e => {
            scaleFactor = 1;
            console.log('zoomend', e);
            console.log(this.map.project(this.graph.platforms[69].location, this.map.getZoom()).divideBy(2 ** this.map.getZoom()));
            overlayStyle.transformOrigin = null;
            overlayClassList.remove('leaflet-zoom-animated');
            this.redrawNetwork();
            this.map.dragging.enable();
        }).on('moveend', e => {
            util.fixFontRendering();
            // the secret of correct positioning is the movend transform check for corrent transform
            overlayStyle.transform = null;
        }).on('layeradd layerremove', util.fixFontRendering);
        
        const changeScaleFactor = (zoomedIn: () => boolean) => {
            const oldZoom = this.map.getZoom();
            scaleFactor = zoomedIn() ?
                Math.min(scaleFactor * 2, 2 ** (maxZoom - oldZoom)) :
                Math.max(scaleFactor / 2, 2 ** (minZoom - oldZoom));            
        }

        const onWheel = (e: WheelEvent) => {
            mousePos = L.DomEvent.getMousePosition(e);
            //scaleFactor *= e.deltaY < 0 ? 2 : 0.5;
            changeScaleFactor(() => e.deltaY < 0);
            //this.map.setZoomAround(util.mouseToLatLng(this.map, e), e.deltaY < 0 ? zoom + 1 : zoom - 1);
        };
        mapPane.addEventListener('wheel', onWheel);
        // controls are not a part of the map pane, so a special listener is for them
        document.querySelector('.leaflet-control-container').addEventListener('wheel', onWheel);

        // +/- button click
        const zoomContainer = this.map.zoomControl.getContainer();
        zoomContainer.addEventListener('mousedown', e => {
            mousePos = new L.Point(innerWidth / 2, innerHeight / 2);
            changeScaleFactor(() => e.target === zoomContainer.firstChild);
        }, true);

        // double click zoom
        this.map.on('dblclick', (e: L.LeafletMouseEvent) => {
            const o = e.originalEvent;
            mousePos = L.DomEvent.getMousePosition(o);
            changeScaleFactor(() => !o.shiftKey);
        });

        // keyboard zoom
        document.addEventListener('keydown', e => {
            mousePos = new L.Point(innerWidth / 2, innerHeight / 2);
            const i = [189, 109, 54, 173, 187, 107, 61, 171].indexOf(e.keyCode);
            if (i !== -1) {
                changeScaleFactor(() => i > 3);
            }
        });
    }


    private resetMapView(): void {
        //const fitness = (points, pt) => points.reduce((prev, cur) => this.bounds., 0);
        //const center = geo.calculateGeoMean(this.graph.platforms.map(p => p.location), fitness, 0.1);
        this.map.setView(this.bounds.getCenter(), startingZoom, {
            pan: { animate: false },
            zoom: { animate: false }
        });
    }

    private resetOverlayStructure(): void {
        let origin: SVGGElement = document.getElementById('origin') as any;
        if (origin === null) {
            origin = svg.createSVGElement('g') as SVGGElement;
            origin.id = 'origin';
            this.overlay.appendChild(origin);
        } else {
            util.removeAllChildren(origin);
        }

        const groupIds = [
            'paths-outer',
            'paths-inner',
            'transfers-outer',
            'station-circles',
            'transfers-inner',
            'dummy-circles'
        ];
        for (let groupId of groupIds) {
            const g = svg.createSVGElement('g');
            g.id = groupId;
            if (groupId.startsWith('transfers-')) {
                g.setAttribute('fill', 'none');
            }
            origin.appendChild(g);
        }

        this.plate = new ui.TextPlate();
        origin.insertBefore(this.plate.element, document.getElementById('dummy-circles'));
    }

    private addBindings() {
        const nPlatforms = this.graph.platforms.length;
        for (let i = 0; i < nPlatforms; ++i) {
            const circle = document.getElementById('p-' + i);
            const dummyCircle = document.getElementById('d-' + i);
            bind.platformToModel.call(this, i, [circle, dummyCircle]);
        }
    }

    private updateOverlayPositioning(): void {
        const nw = this.bounds.getNorthWest(),
            se = this.bounds.getSouthEast();
        // svg bounds in pixels relative to container 

        const overlayStyle = this.overlay.style;
        const pixelBounds = new L.Bounds(this.map.latLngToLayerPoint(nw), this.map.latLngToLayerPoint(se));

        const margin = new L.Point(100, 100);
        const topLeft = pixelBounds.min.subtract(margin);
        overlayStyle.left = topLeft.x + 'px';
        overlayStyle.top = topLeft.y + 'px';
        const origin = document.getElementById('origin');
        //TODO: test which one is faster
        // transform may not work with svg elements
        //origin.setAttribute('x', margin.x + 'px');
        //origin.setAttribute('y', margin.y + 'px');
        origin.setAttribute('transform', `translate(${margin.x}, ${margin.y})`);
        //origin.style.transform = `translate(${margin.x}px, ${margin.y}px)`;
        //origin.style.left = margin.x + 'px';
        //origin.style.top = margin.y + 'px';

        const overlaySize = pixelBounds.getSize().add(margin).add(margin);
        overlayStyle.width = overlaySize.x + 'px';
        overlayStyle.height = overlaySize.y + 'px';
    }

    /**
     * circles, paths without specified coordinates
     */
    private sketchNetwork() {
        this.resetOverlayStructure();

        for (let station of this.graph.stations) {

        }
    }

    /**
     *  lineWidth = (zoom - 7) * 0.5
     *  9 - only lines (1px)
     *  10 - lines (1.5px) & roundels (2+1px)
     *  11 - lines (2px) & roundels (2+2px)
     *  12 - lines (2.5px), platforms (2+1px) & transfers (2px)
     *  ...
     */
    private redrawNetwork() {

        console.time('pre');
        this.resetOverlayStructure();
        this.updateOverlayPositioning();
        this.updatePlatformsPositionOnOverlay();
        console.timeEnd('pre');
        console.time('preparation');
        const zoom = this.map.getZoom();

        //const lineWidth = 2 ** (zoom / 4 - 1.75);
        const lineWidth = (zoom - 7) * 0.5;
        const circleRadius = zoom < detailedZoom ? lineWidth * 1.25 : lineWidth;
        const circleBorder = zoom < detailedZoom ? circleRadius * 0.4 : circleRadius * 0.6;
        const transferWidth = lineWidth * 0.9;
        const transferBorder = circleBorder * 1.25;
        const strokeWidths = {
            'station-circles': circleBorder,
            'dummy-circles': 0,
            'transfers-outer': transferWidth + transferBorder / 2,
            'transfers-inner': transferWidth - transferBorder / 2,
            'paths-outer': lineWidth,
            'paths-inner': lineWidth / 2
        };
        const fullCircleRadius = circleRadius + circleBorder / 2;
        //const thinnerLineWidth = lineWidth * 0.75;
        this.lineRules.get('light-rail-path').strokeWidth = lineWidth * 0.75 + 'px';

        const docFrags = new Map<string, DocumentFragment>();
        for (let id of Object.keys(strokeWidths)) {
            docFrags.set(id, document.createDocumentFragment());
            document.getElementById(id).style.strokeWidth = strokeWidths[id] + 'px';
        }

        // 11 - 11, 12 - 11.5, 13 - 12, 14 - 12.5
        const fontSize = Math.max((zoom + 10) * 0.5, 11);
        (this.plate.element.firstChild.firstChild as HTMLElement).style.fontSize = fontSize + 'px';

        const stationCircumpoints = new Map<g.Station, g.Platform[]>();

        console.timeEnd('preparation');

        // station circles

        console.time('circle preparation');

        const stationCirclesFrag = docFrags.get('station-circles');
        const dummyCirclesFrag = docFrags.get('dummy-circles');

        for (let station of this.graph.stations) {
            const circumpoints: L.Point[] = [];
            let stationMeanColor: string;
            // if (zoom < 12) {
            //     stationMeanColor = util.Color.mean(this.linesToColors(this.passingLinesStation(station)));
            // }
            for (let platformIndex of station.platforms) {
                const platform = this.graph.platforms[platformIndex];
                const posOnSVG = this.platformsOnSVG.get(platformIndex);
                if (zoom > 9) {
                    const ci = svg.makeCircle(posOnSVG, circleRadius);
                    ci.id = 'p-' + platformIndex;
                    if (zoom >= detailedZoom) {
                        this.colorizePlatformCircle(ci, this.passingLines(platform));
                    }
                    // else {
                    //     ci.style.stroke = stationMeanColor;
                    // }
                    const dummyCircle = svg.makeCircle(posOnSVG, circleRadius * 2);
                    dummyCircle.id = 'd-' + platformIndex;

                    stationCirclesFrag.appendChild(ci);
                    dummyCirclesFrag.appendChild(dummyCircle);
                }

                this.whiskers.set(platformIndex, this.makeWhiskers(platformIndex));
            }

            const circular = algorithm.findCircle(this.graph, station);
            if (circular.length > 0) {
                for (let platformIndex of station.platforms) {
                    const platform = this.graph.platforms[platformIndex];
                    if (circular.indexOf(platform) > -1) {
                        circumpoints.push(this.platformsOnSVG.get(platformIndex));
                    }
                }
                stationCircumpoints.set(station, circular);
            }

        }

        console.timeEnd('circle preparation');
        console.time('transfer preparation');

        // transfers

        if (zoom >= detailedZoom) {
            const transfersOuterFrag = docFrags.get('transfers-outer');
            const transfersInnerFrag = docFrags.get('transfers-inner');
            const defs = this.overlay.querySelector('defs');
            const graphTransfers = this.graph.transfers, nTransfers = graphTransfers.length;
            for (let transferIndex = 0; transferIndex < nTransfers; ++transferIndex) {
                const transfer = graphTransfers[transferIndex];
                const pl1 = this.graph.platforms[transfer.source],
                    pl2 = this.graph.platforms[transfer.target];
                const pos1 = this.platformsOnSVG.get(transfer.source),
                    pos2 = this.platformsOnSVG.get(transfer.target);
                const scp = stationCircumpoints.get(this.graph.stations[pl1.station]);
                const paths = scp !== undefined && scp.indexOf(pl1) > -1 && scp.indexOf(pl2) > -1
                    ? this.makeTransferArc(transfer, scp)
                    : svg.makeTransfer(pos1, pos2);
                paths[0].id = 'ot-' + transferIndex;
                paths[1].id = 'it-' + transferIndex;
                const gradientColors: string[] = [pl1, pl2].map(p => {
                    const span = this.graph.spans[p.spans[0]];
                    const routes = span.routes.map(n => this.graph.routes[n]);
                    const [lineId, lineType, lineNum] = routes[0].line.match(/([MEL])(\d{0,2})/);
                    return this.lineRules.get(lineType === 'L' ? lineType : lineId).stroke;
                });
                // const colors = [transfer.source, transfer.target].map(i => getComputedStyle(stationCirclesFrag.childNodes[i] as Element, null).stroke);
                // console.log(colors);
                const circlePortion = fullCircleRadius / pos1.distanceTo(pos2);
                const gradientVector = pos2.subtract(pos1);
                let gradient: SVGLinearGradientElement = document.getElementById('g-' + transferIndex) as any;
                if (gradient === null) {
                    gradient = svg.Gradients.makeLinear(gradientVector, gradientColors, circlePortion);
                    gradient.id = 'g-' + transferIndex;
                    defs.appendChild(gradient);
                } else {
                    svg.Gradients.setDirection(gradient, gradientVector);
                    svg.Gradients.setOffset(gradient, circlePortion);
                }
                paths[0].style.stroke = `url(#${gradient.id})`;

                transfersOuterFrag.appendChild(paths[0]);
                transfersInnerFrag.appendChild(paths[1]);
                bind.transferToModel.call(this, transfer, paths);
            }
        }

        console.timeEnd('transfer preparation');
        console.time('span preparation');
        // paths

        const pathsOuterFrag = docFrags.get('paths-outer');
        const pathsInnerFrag = docFrags.get('paths-inner');
        for (let i = 0, numSpans = this.graph.spans.length; i < numSpans; ++i) {
            const [outer, inner] = this.makePath(i);
            pathsOuterFrag.appendChild(outer);
            if (inner) {
                pathsInnerFrag.appendChild(inner);
            } else if (outer.classList.contains('L')) {
                //outer.style.strokeWidth = thinnerLineWidth + 'px';
            }
        }

        console.timeEnd('span preparation');

        console.time('appending');

        docFrags.forEach((val, key) => document.getElementById(key).appendChild(val));

        this.addStationListeners();
        this.addBindings();
        console.timeEnd('appending');

    }

    private updatePlatformsPositionOnOverlay(zoom = this.map.getZoom()) {
        const graphPlatforms = this.graph.platforms;
        const stationCenter = (s: g.Station) => geo.getCenter(s.platforms.map(i => graphPlatforms[i].location));
        const topLeftOverall = this.map.project(this.bounds.getNorthWest(), zoom).round();
        for (let station of this.graph.stations) {
            const center = zoom < detailedZoom ? stationCenter(station) : null;
            for (let platformIndex of station.platforms) {
                const projPt = this.map.project(center || graphPlatforms[platformIndex].location, zoom).round();
                this.platformsOnSVG.set(platformIndex, projPt.subtract(topLeftOverall));
            }
        }
    }

    private passingLines(platform: g.Platform) {
        const lines = new Set<string>();
        for (let spanIndex of platform.spans) {
            for (let routeIndex of this.graph.spans[spanIndex].routes) {
                lines.add(this.graph.routes[routeIndex].line);
            }
        }
        return lines;
    }

    private passingLinesStation(station: g.Station) {
        const lines = new Set<string>();
        for (let platformIndex of station.platforms) {
            for (let spanIndex of this.graph.platforms[platformIndex].spans) {
                for (let routeIndex of this.graph.spans[spanIndex].routes) {
                    lines.add(this.graph.routes[routeIndex].line);
                }
            }
        }
        return lines;
    }

    private linesToColors(lines: Set<string>): string[] {
        const rgbs: string[] = [];
        for (let vals = lines.values(), it = vals.next(); !it.done; it = vals.next()) {
            const tokens = it.value.match(/^([MEL])(\d{0,2})$/);
            if (!tokens) continue;
            rgbs.push(this.lineRules.get(tokens[1] === 'M' ? tokens[0] : tokens[1]).stroke);
        }
        return rgbs;
    }

    private colorizePlatformCircle(ci: SVGCircleElement, lines: Set<string>) {
        if (lines.size === 0) return;
        if (lines.size > 1) {
            ci.style.stroke = util.Color.mean(this.linesToColors(lines));
            return;
        }
        const tokens = lines.values().next().value.match(/^([MEL])(\d{0,2})$/);
        if (tokens) {
            ci.classList.add(tokens[1] === 'M' ? tokens[0] : tokens[1]);
        }
    }

    private makeWhiskers(platformIndex: number): Map<number, L.Point> {
        const platform = this.graph.platforms[platformIndex];
        const posOnSVG = this.platformsOnSVG.get(platformIndex);
        const wh = new Map<number, L.Point>();
        if (platform.spans.length === 1) {
            return wh.set(platform.spans[0], posOnSVG);
        }

        if (platform.spans.length > 2) {
            // 0 - prev, 1 - next
            const points: L.Point[][] = [[], []];
            const spanIds: number[][] = [[], []];
            const dirHints = this.hints.crossPlatform;
            const idx = hints.hintContainsLine(this.graph, dirHints, platform);
            if (platform.name in dirHints && idx !== null) {
                // array or object
                const platformHint = idx > -1 ? dirHints[platform.name][idx] : dirHints[platform.name];
                const nextPlatformNames: string[] = [];
                for (let key of Object.keys(platformHint)) {
                    const val = platformHint[key];
                    if (typeof val === 'string') {
                        nextPlatformNames.push(val);
                    } else {
                        nextPlatformNames.push(...val);
                    }
                }
                for (let spanIndex of platform.spans) {
                    const span = this.graph.spans[spanIndex];
                    const neighborIndex = span.source === platformIndex ? span.target : span.source;
                    const neighbor = this.graph.platforms[neighborIndex];
                    const neighborPos = this.platformsOnSVG.get(neighborIndex);
                    const dirIdx = nextPlatformNames.indexOf(neighbor.name) > -1 ? 1 : 0;
                    points[dirIdx].push(neighborPos);
                    spanIds[dirIdx].push(spanIndex);
                }
            }
            const midPts = points.map(pts => posOnSVG
                .add(pts.length === 1 ? pts[0] : pts.length === 0 ? posOnSVG : math.getCenter(pts))
                .divideBy(2)
            );
            const lens = midPts.map(midPt => posOnSVG.distanceTo(midPt));
            const mdiff = midPts[1].subtract(midPts[0]).multiplyBy(lens[0] / (lens[0] + lens[1]));
            const mm = midPts[0].add(mdiff);
            const diff = posOnSVG.subtract(mm);
            spanIds[0].forEach(spanIndex => wh.set(spanIndex, midPts[0].add(diff)));
            spanIds[1].forEach(spanIndex => wh.set(spanIndex, midPts[1].add(diff)));
            return wh;
        }

        const lines = platform.spans.map(i => this.graph.routes[this.graph.spans[i].routes[0]].line);
        // TODO: refactor this stuff, unify 2-span & >2-span platforms
        if (lines[0] !== lines[1]) {
            return wh.set(platform.spans[0], posOnSVG)
                .set(platform.spans[1], posOnSVG);
        }

        const midPts = [posOnSVG, posOnSVG];
        const lens = [0, 0];
        const firstSpan = this.graph.spans[platform.spans[0]];
        if (firstSpan.source === platformIndex) {
            platform.spans.reverse();
        }
        // previous node should come first
        for (let i = 0; i < 2; ++i) {
            const span = this.graph.spans[platform.spans[i]];
            const neighborOnSVG = this.platformsOnSVG.get(span.source === platformIndex ? span.target : span.source);
            lens[i] = posOnSVG.distanceTo(neighborOnSVG);
            midPts[i] = posOnSVG.add(neighborOnSVG).divideBy(2);
        }
        const mdiff = midPts[1].subtract(midPts[0]).multiplyBy(lens[0] / (lens[0] + lens[1]));
        const mm = midPts[0].add(mdiff);
        const diff = posOnSVG.subtract(mm);
        return wh.set(platform.spans[0], midPts[0].add(diff))
            .set(platform.spans[1], midPts[1].add(diff));
    }

    private makeTransferArc(transfer: g.Transfer, cluster: g.Platform[]): (SVGLineElement | SVGPathElement)[] {
        const graphPlatforms = this.graph.platforms;
        const pl1 = graphPlatforms[transfer.source],
            pl2 = graphPlatforms[transfer.target];
        const pos1 = this.platformsOnSVG.get(transfer.source),
            pos2 = this.platformsOnSVG.get(transfer.target);
        const makeArc = (thirdIndex: number) => svg.makeTransferArc(pos1, pos2, this.platformsOnSVG.get(thirdIndex));
        if (cluster.length === 3) {
            const third = cluster.find(p => p !== pl1 && p !== pl2);
            return makeArc(graphPlatforms.indexOf(third));
        } else if (pl1 === cluster[2] && pl2 === cluster[3] || pl1 === cluster[3] && pl2 === cluster[2]) {
            return svg.makeTransfer(pos1, pos2);
        }
        //const s = transfer.source;
        //const pl1neighbors = this.graph.transfers.filter(t => t.source === s || t.target === s);
        //const pl1deg = pl1neighbors.length;
        const rarr: number[] = [];
        for (let t of this.graph.transfers) {
            if (t === transfer) continue;
            if (t.source === transfer.source || t.source === transfer.target) rarr.push(t.target);
            else if (t.target === transfer.source || t.target === transfer.target) rarr.push(t.source);
        }
        let thirdIndex: number;
        if (rarr.length === 2) {
            if (rarr[0] !== rarr[1]) throw Error("FFFFUC");
            thirdIndex = rarr[0];
        } else if (rarr.length === 3) {
            thirdIndex = rarr.sort()[1];
        } else {
            throw new Error("111FUUFF");
        }
        return makeArc(thirdIndex);
    }

    private makePath(spanIndex: number) {
        const span = this.graph.spans[spanIndex];
        const srcN = span.source, trgN = span.target;
        const routes = span.routes.map(n => this.graph.routes[n]);
        const [lineId, lineType, lineNum] = routes[0].line.match(/([MEL])(\d{0,2})/);
        const controlPoints = [
            this.platformsOnSVG.get(srcN),
            this.whiskers.get(srcN).get(spanIndex),
            this.whiskers.get(trgN).get(spanIndex),
            this.platformsOnSVG.get(trgN)
        ];
        const bezier = svg.makeCubicBezier(controlPoints);
        bezier.id = 'op-' + spanIndex;
        if (lineType === 'E') {
            bezier.classList.add('E');
            const inner = bezier.cloneNode(true) as typeof bezier;
            inner.id = 'ip-' + spanIndex;
            return [bezier, inner];
        }
        if (lineId) {
            bezier.classList.add(lineId);
        }
        bezier.classList.add(lineType);
        return [bezier];
    }

    private addStationListeners() {
        const onMouseOut = (e: MouseEvent) => {
            this.plate.hide();
            svg.Scale.unscaleAll();
        };
        const zip = (prev, cur) => `${prev} / ${cur}`;
        
        const getNames = (platforms: g.Platform[]) => [0, 1, 2]
            .map(no => util.uniquify(platforms.map(p => util.getPlatformNames(p)[no])).reduce(zip))
            .filter(s => s !== undefined && s.length > 0);
        const dummyCircles = document.getElementById('dummy-circles');
        dummyCircles.addEventListener('mouseover', e => {
            const dummy = e.target as SVGCircleElement;
            const platform = this.graph.platforms[+dummy.id.slice(2)];
            const station = this.graph.stations[platform.station];
            const names = this.map.getZoom() < detailedZoom && station.platforms.length > 1 ? 
                getNames(station.platforms.map(i => this.graph.platforms[i])) :
                util.getPlatformNames(platform);
            this.highlightStation(station, names);
        });
        dummyCircles.addEventListener('mouseout', onMouseOut);
        const onTransferOver = (e: MouseEvent) => {
            const el = e.target as SVGPathElement | SVGLineElement;
            const transfer = this.graph.transfers[+el.id.slice(3)];
            const source = this.graph.platforms[transfer.source];
            const station = this.graph.stations[source.station];
            this.highlightStation(station, getNames([source, this.graph.platforms[transfer.target]]));
        };
        const transfersOuter = document.getElementById('transfers-outer'),
            transfersInner = document.getElementById('transfers-inner');
        transfersOuter.addEventListener('mouseover', onTransferOver);
        transfersInner.addEventListener('mouseover', onTransferOver);
        transfersOuter.addEventListener('mouseout', onMouseOut);
        transfersInner.addEventListener('mouseout', onMouseOut);
    }

    private highlightStation(station: g.Station, names: string[]) {
        const scaleFactor = 1.25,
            graphPlatforms = this.graph.platforms,
            stationPlatforms = station.platforms;
        let circle: SVGCircleElement,
            platform: g.Platform;
        if (stationPlatforms.length === 1) {
            circle = util.circleByIndex(stationPlatforms[0]);
            svg.Scale.scaleCircle(circle, scaleFactor, true);
            platform = graphPlatforms[stationPlatforms[0]];
        } else {
            const transfers = this.map.getZoom() < detailedZoom ? undefined : this.graph.transfers;
            svg.Scale.scaleStation(graphPlatforms, station, scaleFactor, transfers);

            const idx2lat = (i: number) => graphPlatforms[i].location.lat;
            const topmostIndex = stationPlatforms.reduce((prev, cur) => idx2lat(prev) < idx2lat(cur) ? cur : prev);
            circle = util.circleByIndex(topmostIndex);
            platform = graphPlatforms[topmostIndex];
        }
        this.plate.show(svg.circleOffset(circle), names);
    }

    private visualizeShortestRoute(obj: L.LatLng[] | algorithm.ShortestRouteObject, animate = true) {
        util.resetStyle();
        alertify.dismissAll();
        const o = obj instanceof Array ? algorithm.shortestRoute(this.graph, obj[0], obj[1]) : obj;
        const { platforms, edges, time } = o as algorithm.ShortestRouteObject;
        const onFoot = tr('on foot');
        const walkTo = ft(time.walkTo);
        if (edges === undefined) {
            return alertify.success(`${walkTo} ${onFoot}!`);
        }
        const selector = '#paths-inner *, #paths-outer *, #transfers-inner *, #transfers-outer *, #station-circles *';
        svg.Animation.terminateAnimations().then(() => {
            for (let { style } of this.overlay.querySelectorAll(selector) as any) {
                //style['-webkit-filter'] = 'grayscale(1)';
                style.filter = null;
                style.opacity = '0.25';
            }
            if (animate) throw animate;
        }).then(() => {
            for (let edgeIdTail of edges) {
                const outer: SVGPathElement = document.getElementById('o' + edgeIdTail) as any;
                if (outer === null) continue;
                outer.style.opacity = null;
                const inner = document.getElementById('i' + edgeIdTail);
                if (inner !== null) {
                    inner.style.opacity = null;
                }
                if (outer.id.charAt(1) !== 't') {
                    svg.Shadows.applyDrop(outer);
                }
            }
            for (let platformNum of platforms) {
                document.getElementById('p-' + platformNum).style.opacity = null;
            }
        }).catch(animate => svg.Animation.animateRoute(this.graph, platforms, edges, 1)).then(finished => {
            if (!finished) return;
            alertify.message(`${tr('time').toUpperCase()}:<br>${walkTo} ${onFoot}<br>${ft(time.metro)} ${tr('by metro')}<br>${ft(time.walkFrom)} ${onFoot}<br>${tr('TOTAL')}: ${ft(time.total)}`, 10)
        });
    }
}