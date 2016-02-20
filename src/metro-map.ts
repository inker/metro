/// <reference path="../typings/tsd.d.ts" />
import * as L from 'leaflet';
const alertify = require('alertifyjs');
import { lineRulesPromise } from './res';
import { mapbox, mapnik } from './tilelayers';
import * as util from './util';
import * as math from './math';
import * as algorithm from './algorithm';
import { translate as tr, formatTime as ft } from './lang';
import * as svg from './svg';
import * as po from './plain-objects';
import * as bind from './bind';
import * as geo from './geo';
import { ContextMenu, MapEditor, FAQ, TextPlate, Icons } from './ui';

L.Icon.Default.imagePath = 'http://cdn.leafletjs.com/leaflet/v0.7.7/images';

const minZoom = 9, maxZoom = 18;

export default class MetroMap implements EventTarget {
    private map: L.Map;
    private overlay: HTMLElement;
    private graph: po.Graph;
    private bounds: L.LatLngBounds;
    private hints: po.Hints;
    private textData: {};

    private whiskers = [];
    private platformsOnSVG = new Map<number, L.Point>();

    private plate: TextPlate;

    private fromMarker = new L.Marker([0, 0], { draggable: true , icon: Icons.start });
    private toMarker = new L.Marker([0, 0], { draggable: true, icon: Icons.end });
    //private routeWorker = new Worker('js/routeworker.js');

    private _contextMenu: ContextMenu;

    private lineRules: Map<string, string>;

    get contextMenu() {
        return this._contextMenu;
    }

    getMap(): L.Map {
        return this.map;
    }

    getOverlay(): HTMLElement {
        return this.overlay;
    }

    getPlate(): TextPlate {
        return this.plate;
    }

    getGraph(): po.Graph {
        return this.graph;
    }

    constructor(containerId: string, kml: string) {
        const graphPromise: Promise<po.Graph> = fetch(kml)
            .then(data => data.json())
            .then(graphJSON => this.graph = graphJSON);
        const hintsPromise = fetch('json/hints.json')
            .then(data => data.json())
            .then(hintsJSON => this.hints = hintsJSON);
        const contextMenuPromise = fetch('json/contextmenudata.json')
            .then(data => data.json());

        this.map = new L.Map(containerId, {
            //layers: tileLayers[Object.keys(tileLayers)[0]],
            center: new L.LatLng(59.943556, 30.30452),
            zoom: 11,
            minZoom,
            maxZoom,
            inertia: true
        }).addControl(new L.Control.Scale({ imperial: false })).addLayer(mapbox);

        addEventListener('keydown', e => {
            if (e.ctrlKey) {
                switch (e.keyCode) {
                    case 76: return mapnik.addTo(this.map).bringToFront();
                    default: return;
                }
            }
            switch(e.keyCode) {
                case 27: return this.dispatchEvent(new Event('clearroute'));
                default: return;
            }

        });

        this.overlay = document.getElementById('overlay');
        const container = this.map.getContainer();
        const objectsPane = this.map.getPanes().objectsPane;
        container.removeChild(this.overlay);
        objectsPane.insertBefore(this.overlay, objectsPane.querySelector('.leaflet-marker-pane'));

        const defs = svg.createSVGElement('defs');
        defs.appendChild(svg.Shadows.makeDrop());
        defs.appendChild(svg.Shadows.makeGlow());
        defs.appendChild(svg.Shadows.makeOpacity());
        defs.appendChild(svg.Shadows.makeGray());
        if (defs.textContent.length === 0) {
            alert(tr("Your browser doesn't seem to have capabilities to display some features of the map. Consider using Chrome or Firefox for the best experience."));
        }
        this.overlay.appendChild(defs);

        graphPromise
            .catch(errText => alert(errText))
            .then(graphJson => hintsPromise)
            .then(hintsJson => lineRulesPromise)
            .then(lineRules => {
                this.lineRules = lineRules;
                this.bounds = new L.LatLngBounds(this.graph.platforms.map(p => p.location));
                this.redrawNetwork();
                // TODO: fix the kludge making the grey area disappear
                this.map.invalidateSize(false);
                this.addMapListeners();
                //this.routeWorker.postMessage(this.graph);
                //util.drawZones(this);
                if (!L.Browser.mobile) {
                    new MapEditor(this);
                }
                new FAQ(this, 'json/data.json');
                return contextMenuPromise;
            })
            .then(contextMenuData => {
                this._contextMenu = new ContextMenu(this, new Map<string, any>(contextMenuData));
                this.resetMapView();
                util.loadIcons(this.map, [this.fromMarker, this.toMarker]);
                util.fixFontRendering(); // just in case
            });

        Promise.all([graphPromise, hintsPromise])
            .then(results => util.Hints.verify(this.graph, this.hints))
            .then(response => console.log(response));
    }

    addEventListener(type: string, listener: EventListener) { }

    dispatchEvent(event: Event): boolean {
        console.log('event target as seen from dispatcher', event.target);
        console.log(event);
        switch (event.type) {
            case 'clearroute':
                svg.Animation.terminateAnimations();
                this.map.removeLayer(this.fromMarker).removeLayer(this.toMarker);
                this.fromMarker.off('drag').off('dragend');
                this.toMarker.off('drag').off('dragend');
                util.resetStyle();
                alertify.dismissAll();
                break;
            case 'showheatmap':
                if (this.map.hasLayer(this.fromMarker)) {
                    // draw time map from the marker                    
                } else {
                    // draw time map to the closest station from each point
                    const nw = this.bounds.getNorthWest();
                    const topLeft = this.map.latLngToContainerPoint(nw);
                    const se = this.bounds.getSouthEast();
                    const bottomRight = this.map.latLngToContainerPoint(se);
                    const step = bottomRight.subtract(topLeft).divideBy(200);
                    console.log(se.distanceTo(nw) / 200);
                    console.log('for ' + step);
                    console.time('checking');
                    for (let i = topLeft.x; i < bottomRight.x; i += step.x) {
                        for (let j = topLeft.y; j < bottomRight.y; j += step.y) {
                            const c = this.map.containerPointToLatLng(new L.Point(i, j));
                            //new L.Marker(c).addTo(this.map);
                            const closest = geo.findClosestObject(c, this.graph.platforms).location;
                            L.LatLng.prototype.distanceTo.call(closest, c);
                            //util.shortestPath(this.graph, c, closest);
                        }
                    }
                    console.timeEnd('checking');
                }
                break;
            case 'measuredistance': {
                const coors = util.mouseToLatLng(this.map, event as MouseEvent);
                const origin = document.getElementById('origin');
                // const points: L.LatLng[] = [];
                // this.map.on('click', (e: L.LeafletMouseEvent) => {
                //     if (e.originalEvent.button !== 0) return;
                //     const circle = new L.CircleMarker(e.latlng, {
                        
                //     });
                //     points.push(e.latlng);
                //     const el = { lang: { ru: 'Udaliť izmerenia', en: 'Delete measurements' } };
                //     this._contextMenu.extraItems.set(circle, new Map().set('deletemeasurements', el));                                       
                // });
                // this.map.fire('click', { latlng: coors, originalEvent: { button: 0 } });
                // util.onceEscapePress(e => this.dispatchEvent(new MouseEvent('deletemeasurements')));
                // break;
                
                                
                let ptGroup = document.getElementById('measure-circles');
                let lineGroup = document.getElementById('measure-lines');
                if (ptGroup !== null) {
                    origin.removeChild(ptGroup);
                    origin.removeChild(lineGroup);
                }
                ptGroup = svg.createSVGElement('g') as any;
                ptGroup.id = 'measure-circles';
                lineGroup = svg.createSVGElement('g') as any;
                lineGroup.id = 'measure-lines';

                origin.appendChild(ptGroup);
                origin.appendChild(lineGroup);
                let prevCoors = coors;
                const pts: L.LatLng[] = [];
                this.map.on('click', (e: L.LeafletMouseEvent) => {
                    if (e.originalEvent.button !== 0) return;
                    const pos = this.map.latLngToContainerPoint(e.latlng).subtract(this.map.latLngToContainerPoint(this.bounds.getNorthWest()));
                    const circle = svg.makeCircle(pos, 3);
                    circle.classList.add('measure-circle');
                    const el = { lang: { ru: 'Udaliť izmerenia', en: 'Delete measurements' } };
                    this._contextMenu.extraItems.set(circle, new Map().set('deletemeasurements', el));
                    ptGroup.appendChild(circle);
                    const prevPos = this.map.latLngToContainerPoint(prevCoors)
                        .subtract(this.map.latLngToContainerPoint(this.bounds.getNorthWest()));
                    const line = svg.makeLine(prevPos, pos);
                    line.classList.add('measure-line');
                    lineGroup.appendChild(line);
                    pts.push(e.latlng);
                    if (pts.length > 1) {
                        let distance = 0;
                        for (let i = 1; i < pts.length; ++i) {
                            distance += pts[i - 1].distanceTo(pts[i]);
                        }
                        alertify.dismissAll();
                        alertify.message(Math.round(distance) + 'm');
                    }
                    prevCoors = e.latlng;
                });
                this.map.fire('click', { latlng: coors, originalEvent: { button: 0 } });
                util.onceEscapePress(e => this.dispatchEvent(new MouseEvent('deletemeasurements')));
                break;
            }
            case 'deletemeasurements': {
                const origin = document.getElementById('origin');
                for (let id of ['measure-circles', 'measure-lines']) {
                    origin.removeChild(document.getElementById(id));
                }
                this.map.off('click');
                break;
            }
            case 'platformrename': {
                const me = event as MouseEvent;
                const platform = svg.platformByCircle(me.relatedTarget as any, this.graph);
                this.plate.show(svg.circleByDummy(me.relatedTarget as any));
                util.platformRenameDialog(this.graph, platform);
                break;
            }
            case 'platformdelete': {

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
                const platform: po.Platform = {
                    name: tr('New station'),
                    altNames: {},
                    station: null,
                    spans: [],
                    transfers: [],
                    elevation: 0,
                    location: coor
                };
                this.graph.platforms.push(platform);
                bind.platformToModel.call(this, platform, [circle, dummy])
                break;
            case 'routefrom':
            case 'routeto':
                this.handleMenuFromTo(event as MouseEvent);
                break;
            default:
                break;
        }
        return false;
    }

    removeEventListener(type: string, listener: EventListener) { }

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
            this.visualizeShortestRoute([this.fromMarker.getLatLng(), this.toMarker.getLatLng()]);   
        }

    }

    private addMapListeners(): void {
        const mapPane = this.map.getPanes().mapPane;
        const overlayStyle = this.overlay.style;
        let scaleFactor = 1;
        this.map.on('movestart', e => {
            this.map.touchZoom.disable();
            if (L.Browser.webkit) {
                svg.Gradients.removeAll();
            }
        }).on('moveend', e => {
            console.log('move ended');
            this.map.touchZoom.enable();
            if (L.Browser.webkit) {
                svg.Gradients.addAll();
            }
            util.fixFontRendering();
            // the secret of correct positioning is the movend transform check for corrent transform
            overlayStyle.transform = null;
        }).on('zoomstart', e => {
            console.log('zoomstart', e);
            this.map.dragging.disable();
            const mousePos = e.target['scrollWheelZoom']['_lastMousePos'];
            const fromZoom: number = e.target['_zoom'];
            if (scaleFactor === 1) {
                setTimeout(() => {
                    const toZoom: number = e.target['_animateToZoom'];
                    scaleFactor = 2 ** (toZoom - fromZoom);
                    util.scaleOverlay(this.overlay, scaleFactor, mousePos);
                }, 0);                
            } else {
                //const a = fromZoom + Math.log2(scaleFactor);
                // if (a < minZoom) {
                //     scaleFactor *= 2 ** (minZoom - a);
                // } else if (a > maxZoom) {
                //     scaleFactor *= 2 ** (maxZoom - a);
                // }
                util.scaleOverlay(this.overlay, scaleFactor, mousePos);               
            }
            scaleFactor = 1; 
            overlayStyle.opacity = '0.5';
        }).on('zoomend', e => {
            scaleFactor = 1;
            overlayStyle.opacity = null;
            overlayStyle.transformOrigin = null;
            this.redrawNetwork();
            this.map.dragging.enable();
        }).on('layeradd', e => util.fixFontRendering());
        this.overlay.addEventListener('wheel', e => scaleFactor *= e.deltaY < 0 ? 2 : 0.5);
    }


    private resetMapView(): void {
        //const fitness = (points, pt) => points.reduce((prev, cur) => this.bounds., 0);
        //const center = geo.calculateGeoMean(this.graph.platforms.map(p => p.location), fitness, 0.1);
        this.map.setView(this.bounds.getCenter(), 11, {
            pan: { animate: false },
            zoom: { animate: false }
        });
    }

    private resetOverlayStructure(): void {
        const origin = document.getElementById('origin') || svg.createSVGElement('g');
        util.removeAllChildren(origin);

        origin.id = 'origin';
        const groupIds = [
            'paths-outer',
            'paths-inner',
            'transfers-outer',
            'station-circles',
            'transfers-inner',
            'dummy-circles'
        ];
        for (let groupId of groupIds) {
            const group = svg.createSVGElement('g');
            group.id = groupId;
            origin.appendChild(group);
        }
        this.overlay.appendChild(origin);
        this.plate = new TextPlate(this.graph);
        origin.insertBefore(this.plate.element, document.getElementById('dummy-circles'));
    }

    private addBindings() {
        const graphPlatforms = this.graph.platforms;
        for (let i = 0; i < graphPlatforms.length; ++i) {
            const circle = document.getElementById('p-' + i);
            const dummyCircle = document.getElementById('d-' + i);
            bind.platformToModel.call(this, i, [circle, dummyCircle]);
        }
    }

    /**
     *
     * @param SVGBounds
     * @param location
     * @returns {Point}
     */
    private posOnSVG(SVGBounds: L.Bounds, location: L.LatLngExpression): L.Point {
        const pos = this.map.latLngToContainerPoint(location);
        return pos.subtract(SVGBounds.min);
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
     *  lineWidth = (zoom - 7) * 0.5
     *  9 - only lines (1px)
     *  10 - lines (1.5px) & roundels (2+1px)
     *  11 - lines (2px) & roundels (2+2px)
     *  12 - lines (2.5px), platforms (2+1px) & transfers (2px)
     *  ...
     */
    private redrawNetwork() {
        this.resetOverlayStructure();
        this.updateOverlayPositioning();
        this.getPlatformsPositionOnOverlay();
        
        const zoom = this.map.getZoom();

        const lineWidth = (zoom - 7) * 0.5; // or just (zoom - 9) ? 
        const circleRadius = zoom < 12 ? lineWidth * 1.25 : lineWidth;
        const circleBorder = zoom < 12 ? circleRadius * 0.4 : circleRadius * 0.6;
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
        const docFrags = new Map<string, DocumentFragment>();
        for (let id of Object.keys(strokeWidths)) {
            docFrags.set(id, document.createDocumentFragment());
            document.getElementById(id).style.strokeWidth = strokeWidths[id] + 'px';
        }

        const platformsInCircles = new Set<number>();
        const stationCircumpoints = new Map<po.Station, po.Platform[]>();
        
        const stationCirclesFrag = docFrags.get('station-circles');
        const dummyCirclesFrag = docFrags.get('dummy-circles');

        for (let station of this.graph.stations) {
            const circumpoints: L.Point[] = [];
            for (let platformIndex of station.platforms) {
                const platform = this.graph.platforms[platformIndex];
                const posOnSVG = this.platformsOnSVG.get(platformIndex);

                if (zoom > 9) {
                    const ci = svg.makeCircle(posOnSVG, circleRadius);
                    ci.id = 'p-' + platformIndex;
                    if (zoom > 11) {
                        const lines = this.passingLines(platform);
                        if (lines.size === 1) {
                            const tokens = lines.values().next().value.match(/([MEL])(\d{0,2})/);
                            if (tokens) {
                                ci.classList.add(tokens[1] === 'M' ? tokens[0] : tokens[1]);
                            }
                        } else {
                            const rgbs = [];
                            for (let vals = lines.values(), it = vals.next(); !it.done; it = vals.next()) {
                                const tokens = it.value.match(/([MEL])(\d{0,2})/);
                                if (!tokens) return;
                                rgbs.push(this.lineRules.get(tokens[1] === 'M' ? tokens[0] : tokens[1]));
                            }
                            ci.style.stroke = util.Color.mean(rgbs);
                        }
                        //else if (lines.size === 2) {
                        //const vals = lines.values();
                        //const [line1 , lineType1, lineNum1 ] = vals.next().value.match(/([MEL])(\d{0,2})/);
                        //const [line2 , lineType2, lineNum2 ] = vals.next().value.match(/([MEL])(\d{0,2})/);
                        //const cl1 = lineType1 === 'M' ? line1 : lineType1,
                        //    cl2 = lineType2 === 'M' ? line2 : lineType2;
                        //const toGrey = ()
                        //if (this.lineRules[cl1])
                        //}
                    }
                    const dummyCircle = svg.makeCircle(posOnSVG, circleRadius * 2);
                    dummyCircle.id = 'd-' + platformIndex;

                    stationCirclesFrag.appendChild(ci);
                    dummyCirclesFrag.appendChild(dummyCircle);
                }

                this.whiskers[platformIndex] = this.makeWhiskers(platformIndex);
            }

            const dummyCircles = document.getElementById('dummy-circles');
            dummyCircles.addEventListener('mouseover', e => this.plate.show(svg.circleByDummy(e.target as Element)));
            dummyCircles.addEventListener('mouseout', e => this.plate.hide());

            const circular = algorithm.findCircle(this.graph, station);
            if (circular.length > 0) {
                for (let platformIndex of station.platforms) {
                    const platform = this.graph.platforms[platformIndex];
                    if (circular.indexOf(platform) > -1) {
                        circumpoints.push(this.platformsOnSVG.get(platformIndex));
                        platformsInCircles.add(platformIndex);
                    }
                }
                stationCircumpoints.set(station, circular);
            }

        }

        if (zoom > 11) {
            const transfersOuterFrag = docFrags.get('transfers-outer');
            const transfersInnerFrag = docFrags.get('transfers-inner');
            for (let transferIndex = 0; transferIndex < this.graph.transfers.length; ++transferIndex) {
                const transfer = this.graph.transfers[transferIndex];
                var paths: (SVGPathElement | SVGLineElement)[];
                var pl1 = this.graph.platforms[transfer.source],
                    pl2 = this.graph.platforms[transfer.target];
                var pos1 = this.platformsOnSVG.get(transfer.source),
                    pos2 = this.platformsOnSVG.get(transfer.target);
                if (platformsInCircles.has(transfer.source) && platformsInCircles.has(transfer.target)) {
                    const cluster = stationCircumpoints.get(this.graph.stations[pl1.station]);
                    const makeArc = (third: po.Platform) => {
                        const thirdPos = this.platformsOnSVG.get(this.graph.platforms.indexOf(third));
                        paths = svg.makeTransferArc(pos1, pos2, thirdPos);
                    }
                    if (cluster.length === 3) {
                        makeArc(cluster.find(p => p !== pl1 && p !== pl2));
                    } else if (pl1 === cluster[2] && pl2 === cluster[3] || pl1 === cluster[3] && pl2 === cluster[2]) {
                        paths = svg.makeTransfer(pos1, pos2);
                    } else {
                        const degs = cluster.map(p => p.transfers.length);
                        var [a, b] = pl1.transfers.length === 2 ? [pl1, pl2] : [pl2, pl1];
                        makeArc(this.graph.platforms[a.transfers.find(i => this.graph.platforms[i] !== b)]);
                    }
                } else {
                    paths = svg.makeTransfer(pos1, pos2);
                }
                paths[0].id = 'ot-' + transferIndex;
                paths[1].id = 'it-' + transferIndex;
                const gradientColors: string[] = [pl1, pl2].map(p => {
                    const span = this.graph.spans[p.spans[0]];
                    const routes = span.routes.map(n => this.graph.routes[n]);
                    const [lineId, lineType, lineNum] = routes[0].line.match(/([MEL])(\d{0,2})/);
                    return this.lineRules.get(lineType === 'L' ? lineType : lineId);
                });
                //const colors = [transfer.source, transfer.target].map(i => getComputedStyle(docFrags['station-circles'].childNodes[i] as Element, null).getPropertyValue('stroke'));
                const circlePortion = (circleRadius + circleBorder / 2) / pos1.distanceTo(pos2);
                let gradient: SVGLinearGradientElement = document.getElementById('g-' + transferIndex) as any;
                if (gradient === null) {
                    gradient = svg.Gradients.makeLinear(pos2.subtract(pos1), gradientColors, circlePortion);
                    gradient.id = 'g-' + transferIndex;
                    this.overlay.querySelector('defs').appendChild(gradient);
                } else {
                    svg.Gradients.setDirection(gradient, pos2.subtract(pos1));
                    svg.Gradients.setOffset(gradient, circlePortion);
                }

                paths[0].style.stroke = `url(#${gradient.id})`;
                transfersOuterFrag.appendChild(paths[0]);
                transfersInnerFrag.appendChild(paths[1]);
                bind.transferToModel.call(this, transfer, paths);
            }
        }
        const pathsOuterFrag = docFrags.get('paths-outer');
        const pathsInnerFrag = docFrags.get('paths-inner');
        for (let i = 0; i < this.graph.spans.length; ++i) {
            const [outer, inner] = this.makePath(i);
            pathsOuterFrag.appendChild(outer);
            if (inner) {
                pathsInnerFrag.appendChild(inner);
            } else if (this.graph.routes[this.graph.spans[i].routes[0]].line.startsWith('L')) {
                outer.style.strokeWidth = lineWidth * 0.75 + 'px';
            }
        }
        
        docFrags.forEach((val, key) => document.getElementById(key).appendChild(val));
        this.addBindings();
    }

    private getPlatformsPositionOnOverlay() {
        const zoom = this.map.getZoom();
        const nw = this.bounds.getNorthWest();
        const se = this.bounds.getSouthEast();
        const svgBounds = new L.Bounds(this.map.latLngToContainerPoint(nw), this.map.latLngToContainerPoint(se));
        const graphPlatforms = this.graph.platforms;
        const stationCenter = (st: po.Station) => geo.getCenter(st.platforms.map(i => graphPlatforms[i].location));
        for (let station of this.graph.stations) {
            const center = zoom < 12 ? stationCenter(station) : null;
            for (let platformIndex of station.platforms) {
                const pos = this.posOnSVG(svgBounds, center || graphPlatforms[platformIndex].location);
                this.platformsOnSVG.set(platformIndex, pos);
            }
        }
    }

    private passingLines(platform: po.Platform) {
        const lines = new Set<string>();
        for (let spanIndex of platform.spans) {
            for (let routeIndex of this.graph.spans[spanIndex].routes) {
                lines.add(this.graph.routes[routeIndex].line);
            }
        }
        return lines;
    }

    private makeWhiskers(platformIndex: number): {} {
        const platform = this.graph.platforms[platformIndex];
        const posOnSVG = this.platformsOnSVG.get(platformIndex);
        if (platform.spans.length < 2) {
            return { [platform.spans[0]]: posOnSVG };
        }

        if (platform.spans.length > 2) {
            // 0 - prev, 1 - next
            const points: L.Point[][] = [[], []];
            const spanIds: number[][] = [[], []];

            const dirHints = this.hints.crossPlatform;
            const idx = util.Hints.hintContainsLine(this.graph, dirHints, platform);
            if (platform.name in dirHints && idx !== null) {
                // array or object
                const platformHints = idx > -1 ? dirHints[platform.name][idx] : dirHints[platform.name];
                const nextPlatformNames: string[] = [];
                for (let key of Object.keys(platformHints)) {
                    const val: string[]|string = platformHints[key];
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
            const whisker = {};
            spanIds[0].forEach(spanIndex => whisker[spanIndex] = midPts[0].add(diff));
            spanIds[1].forEach(spanIndex => whisker[spanIndex] = midPts[1].add(diff));
            return whisker;
        }

        const lines = platform.spans.map(i => this.graph.routes[this.graph.spans[i].routes[0]].line);
        // TODO: refactor this stuff, unify 2-span & >2-span platforms
        if (lines[0] !== lines[1]) {
            return {
                [platform.spans[0]]: posOnSVG,
                [platform.spans[1]]: posOnSVG
            };
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
            const neighborNum = (span.source === platformIndex) ? span.target : span.source;
            const neighborOnSVG = this.platformsOnSVG.get(neighborNum);
            lens[i] = posOnSVG.distanceTo(neighborOnSVG);
            midPts[i] = posOnSVG.add(neighborOnSVG).divideBy(2);
        }
        const mdiff = midPts[1].subtract(midPts[0]).multiplyBy(lens[0] / (lens[0] + lens[1]));
        const mm = midPts[0].add(mdiff);
        const diff = posOnSVG.subtract(mm);
        return {
            [platform.spans[0]]: midPts[0].add(diff),
            [platform.spans[1]]: midPts[1].add(diff)
        };

    }

    private makePath(spanIndex: number) {
        const span = this.graph.spans[spanIndex];
        const srcN = span.source, trgN = span.target;
        const routes = span.routes.map(n => this.graph.routes[n]);
        const [lineId, lineType, lineNum] = routes[0].line.match(/([MEL])(\d{0,2})/);
        const controlPoints = [
            this.platformsOnSVG.get(srcN),
            this.whiskers[srcN][spanIndex],
            this.whiskers[trgN][spanIndex],
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
    
    private visualizeShortestRoute(obj: L.LatLng[]|algorithm.ShortestRouteObject, animate = true) {
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
            const els: HTMLElement[] = this.overlay.querySelectorAll(selector) as any;
            for (let i = 0; i < els.length; ++i) {
                const elStyle = els[i].style;
                //els[i].style['-webkit-filter'] = 'grayscale(1)';
                elStyle.filter = null;
                elStyle.opacity = '0.25';
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
        }).catch(animate => svg.Animation.animateRoute(this.graph, platforms, edges)).then(finished => {
            if (!finished) return;
            alertify.message(`${tr('time').toUpperCase()}:<br>${walkTo} ${onFoot}<br>${ft(time.metro)} ${tr('by metro')}<br>${ft(time.walkFrom)} ${onFoot}<br>${tr('TOTAL')}: ${ft(time.total)}`, 10)
        });       
    }
}