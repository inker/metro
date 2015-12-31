/// <reference path="../typings/tsd.d.ts" />
import * as L from 'leaflet';
const alertify = require('alertifyjs');
import { lineRulesPromise } from './res';
import * as util from './util';
const tr = (text: string) => util.translate(text);
import * as svg from './svg';
import * as po from './plain-objects';
import * as bind from './bind';
import * as geo from './geo';
import MapEditor from './mapeditor';
import FAQ from './faq';
import TextPlate from './textplate';
import ContextMenu from './contextmenu';

L.Icon.Default.imagePath = 'http://cdn.leafletjs.com/leaflet/v0.7.7/images';

export default class MetroMap implements EventTarget {
    private map: L.Map;
    private overlay: HTMLElement;
    private graph: po.Graph;
    private bounds: L.LatLngBounds;
    private hints: po.Hints;
    private textData: {};

    private whiskers = [];
    private platformsOnSVG: L.Point[];

    private plate: TextPlate;

    private fromMarker = new L.Marker([0, 0]);
    private toMarker = new L.Marker([0, 0]);

    private _contextMenu: ContextMenu;

    private lineRules: {};

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

    constructor(containerId: string, kml: string, tileLayers: {}) {
        const graphPromise: Promise<po.Graph> = fetch(kml)
            .then(data => data.json())
            .then(graphJSON => this.graph = graphJSON);
        const hintsPromise = fetch('json/hints.json')
            .then(data => data.json())
            .then(hintsJSON => this.hints = hintsJSON);
        const contextMenuPromise = fetch('json/contextmenudata.json')
            .then(data => data.json())
            .then(obj => { console.log(obj); return obj; })
            .catch(er => console.error(er))

        this.map = new L.Map(containerId, {
            //layers: tileLayers[Object.keys(tileLayers)[0]],
            center: new L.LatLng(59.943556, 30.30452),
            zoom: L.Browser.retina ? 12 : 11,
            minZoom: 9,
            inertia: false
        }).addControl(new L.Control.Scale({ imperial: false }));
        console.log(tileLayers[Object.keys(tileLayers)[0]][0]);
        tileLayers[Object.keys(tileLayers)[0]].addTo(this.map);
        this.map.addLayer(this.fromMarker).addLayer(this.toMarker);
        //new addons.LayerControl(tileLayers).addTo(this.map);
        
        console.log('map should be created by now');
        this.overlay = document.getElementById('overlay');
        const container = this.map.getContainer();
        container.removeChild(this.overlay);
        container.appendChild(this.overlay);

        const defs = svg.createSVGElement('defs');
        defs.appendChild(svg.Shadows.makeDrop());
        defs.appendChild(svg.Shadows.makeGlow());
        this.overlay.appendChild(defs);

        this.addMapListeners();
        graphPromise
            .catch(errText => alert(errText))
            .then(graphJson => this.extendBounds()) // because the previous assignment returns json
            .then(() => hintsPromise)
            .then(hintsJson => lineRulesPromise)
            .then(lineRules => {
                this.lineRules = lineRules;
                this.redrawNetwork();
                // TODO: fix the kludge making the grey area disappear
                this.map.invalidateSize(false);
                this.resetMapView();
                this.fixFontRendering();
                new MapEditor(this);
                new FAQ(this, 'json/data.json');
                // const metroPoints = this.graph.platforms.filter(p => this.graph.routes[this.graph.spans[p.spans[0]].routes[0]].line.startsWith('M')).map(p => p.location);
                // const foo = (points, pt) => points.reduce((prev, cur) => prev + pt.distanceTo(cur), 0);
                // const metroMean = util.geoMean(metroPoints, foo);
                // for (let i = 5000; i < 20000; i += 5000) {
                //     L.circle(metroMean, i - 250, { weight: 1 }).addTo(this.map);
                //     L.circle(metroMean, i + 250, { weight: 1 }).addTo(this.map);
                // }
                // const ePoints = this.graph.platforms.filter(p => this.graph.routes[this.graph.spans[p.spans[0]].routes[0]].line.startsWith('E')).map(p => p.location);
                // const eMean = this.graph.platforms.find(p => p.name === 'Glavnyj voxal' && this.graph.routes[this.graph.spans[p.spans[0]].routes[0]].line.startsWith('E')).location;
                // L.circle(eMean, 30000).addTo(this.map);
                // L.circle(eMean, 45000).addTo(this.map);
                return contextMenuPromise;
            })
            .then(contextMenuData => this._contextMenu = new ContextMenu(this, new Map<string, any>(contextMenuData)))
            .catch(er => console.error(er));

        Promise.all([graphPromise, hintsPromise])
            .then(results => util.verifyHints(this.graph, this.hints))
            .then(response => console.log(response))
            .catch(err => console.error(err));
    }

    addEventListener(type: string, listener: EventListener) { }

    dispatchEvent(event: Event): boolean {
        console.log('event target as seen from dispatcher', event.target);
        console.log(event);
        switch (event.type) {
            case 'clearroute':
                this.fromMarker.setLatLng([0, 0]);
                this.toMarker.setLatLng([0, 0]);
                util.resetStyle();
                alertify.dismissAll();
                this.fixFontRendering();
                break;
            case 'showheatmap':
                if (this.fromMarker.getLatLng().equals([0, 0])) {
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
                } else {
                    // draw time map from the marker
                }
                break;
            case 'measuredistance': {
                const coors = util.mouseToLatLng(this.map, event as MouseEvent);
                const origin = document.getElementById('origin');
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
                const me = event as MouseEvent;
                const platform = svg.platformByCircle(me.relatedTarget as any, this.graph);
                const spans = platform.spans;
                //TODO: somehow delete node
                // find spans that belong to the same line
                // find 
                break;
            }
            case 'platformadd':
                const coor = util.mouseToLatLng(this.map, event as MouseEvent);
                const pos = this.map.latLngToContainerPoint(coor)
                    .subtract(this.map.latLngToContainerPoint(this.bounds.getNorthWest()));
                const stationCircles = document.getElementById('station-circles'),
                    dummyCircles = document.getElementById('dummy-circles');
                const circle = svg.makeCircle(pos, parseFloat(stationCircles.firstElementChild.getAttribute('r'))),         dummy = svg.makeCircle(pos, parseFloat(dummyCircles.firstElementChild.getAttribute('r')));

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
            default:
                this.handleMenuFromTo(event as MouseEvent);
                return false;

        }
    }

    removeEventListener(type: string, listener: EventListener) { }

    private handleMenuFromTo(e: MouseEvent) {
        const coors = util.mouseToLatLng(this.map, e);
        const marker = e.type === 'fromclick' ? this.fromMarker : this.toMarker;
        marker.setLatLng(coors);
        console.log(this.fromMarker, this.toMarker);
        const zero = new L.LatLng(0, 0);
        if (!this.fromMarker.getLatLng().equals(zero) && !this.toMarker.getLatLng().equals(zero)) {
            this.visualizeShortestRoute(this.fromMarker.getLatLng(), this.toMarker.getLatLng());
        }
        util.onceEscapePress(e => this.dispatchEvent(new MouseEvent('clearroute')));
        this.fixFontRendering();
    }

    private addMapListeners(): void {
        const mapPane = this.map.getPanes().mapPane;
        this.map.on('movestart', e => {
            console.log('move start');
            this.map.touchZoom.disable();
            if (L.Browser.webkit) {
                svg.Gradients.removeAll();
            }
        }).on('move', e => {
            // using 'move' here instead of 'drag' because on window resize the overlay 
            // is translated instantly without causing the entire network to be redrawn
            this.overlay.style.transform = mapPane.style.transform;
        }).on('moveend', e => {
            console.log('move ended');
            this.map.touchZoom.enable();
            if (L.Browser.webkit) {
                svg.Gradients.addAll();
            }
            this.fixFontRendering();
            // the secret of correct positioning is the movend transform check for corrent transform
            this.overlay.style.transform = mapPane.style.transform;
        }).on('zoomstart', e => {
            console.log('zoomstart', e.target);
            this.map.dragging.disable();
            const fromZoom: number = e.target['_zoom'];
            setTimeout(() => {
                const toZoom: number = e.target['_animateToZoom'];
                const scaleFactor = 2 ** (toZoom - fromZoom);
                const box = this.overlay.getBoundingClientRect();
                let client: L.Point = e.target['scrollWheelZoom']['_lastMousePos'];
                if (!client) {
                    const el = document.documentElement;
                    client = new L.Point(el.clientWidth / 2, el.clientHeight / 2);
                }
                const clickOffset = new L.Point(client.x - box.left, client.y - box.top);
                const ratio = new L.Point(clickOffset.x / box.width, clickOffset.y / box.height);
                const overlayStyle = this.overlay.style;
                overlayStyle.left = '0';
                overlayStyle.top = '0';
                overlayStyle.transformOrigin = `${ratio.x * 100}% ${ratio.y * 100}%`;
                overlayStyle.transform = `matrix(${scaleFactor}, 0, 0, ${scaleFactor}, ${box.left}, ${box.top})`;
                // overlayStyle.transform = `translate3d(${box.left}px, ${box.top}px, 0) scale(${scaleFactor})`;
            }, 0);
            this.overlay.style.opacity = '0.5';
        }).on('zoomend', e => {
            this.overlay.style.opacity = null;
            this.overlay.style.transformOrigin = null;
            this.redrawNetwork();
            this.map.dragging.enable();
        });
    }

    /**
     * Fixes blurry font due to 'transform3d' CSS property. Changes everything to 'transform' when the map is not moving
     */
    private fixFontRendering(): void {
        const blurringStuff: HTMLElement[] = document.querySelectorAll('img[style*="translate3d"]') as any;
        console.log(blurringStuff);
        for (let i = 0; i < blurringStuff.length; ++i) {
            util.replaceTransform(blurringStuff[i]);
        }
        util.replaceTransform(this.map.getPanes().mapPane);
        //this.overlay.style.transform = mapPane.style.transform = `translate(${t3d.x}px, ${t3d.y}px)`;
    }

    private resetMapView(): void {
        //this.map.addLayer(L.circle(L.LatLng(60, 30), 10));
        //this.overlay = <HTMLElement>this.map.getPanes().overlayPane.children[0];
        this.map.setView(this.bounds.getCenter(), L.Browser.retina ? 12 : 11, {
            pan: { animate: false },
            zoom: { animate: false }
        });
    }

    private resetOverlayStructure(): void {

        const origin = document.getElementById('origin') || svg.createSVGElement('g');
        let child;
        while (child = origin.firstChild) {
            origin.removeChild(child);
        }        

        // svg element won't work because it does not have negative dimensions
        // (top-left station is partially visible)

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


    private extendBounds(): void {
        const a = this.graph.platforms[0].location;
        this.bounds = new L.LatLngBounds(a, a);
        this.graph.platforms.forEach(platform => this.bounds.extend(platform.location));
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
        const pixelBounds = new L.Bounds(this.map.latLngToContainerPoint(nw), this.map.latLngToContainerPoint(se));
        const transform = util.parseTransform(overlayStyle.transform);

        const pixelBoundsSize = pixelBounds.getSize();
        const topLeft = pixelBounds.min.subtract(transform).subtract(pixelBoundsSize);
        console.log(this.map.latLngToContainerPoint(nw));
        overlayStyle.left = topLeft.x + 'px';
        overlayStyle.top = topLeft.y + 'px';
        const originShift = pixelBoundsSize;
        const origin = document.getElementById('origin');
        //TODO: test which one is faster
        // transform may not work with svg elements
        //origin.setAttribute('x', originShift.x + 'px');
        //origin.setAttribute('y', originShift.y + 'px');
        origin.style.transform = `translate(${originShift.x}px, ${originShift.y}px)`;
        //origin.style.left = originShift.x + 'px';
        //origin.style.top = originShift.y + 'px';
        
        const tripleSvgBoundsSize = pixelBoundsSize.multiplyBy(3);
        overlayStyle.width = tripleSvgBoundsSize.x + 'px';
        overlayStyle.height = tripleSvgBoundsSize.y + 'px';
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
        this.fromMarker.setLatLng([0, 0]);
        this.toMarker.setLatLng([0, 0]);
        this.resetOverlayStructure();
        this.updateOverlayPositioning();

        const docFrags = {
            'station-circles': document.createDocumentFragment(),
            'dummy-circles': document.createDocumentFragment(),
            'paths-inner': document.createDocumentFragment(),
            'paths-outer': document.createDocumentFragment(),
            'transfers-inner': document.createDocumentFragment(),
            'transfers-outer': document.createDocumentFragment()
        };

        const zoom = this.map.getZoom();
        const nw = this.bounds.getNorthWest();
        const se = this.bounds.getSouthEast();
        const svgBounds = new L.Bounds(this.map.latLngToContainerPoint(nw), this.map.latLngToContainerPoint(se));

        const posTransform = zoom < 12
            ? platform => this.posOnSVG(svgBounds, this.graph.stations[platform.station].location)
            : platform => this.posOnSVG(svgBounds, platform.location);
        this.platformsOnSVG = this.graph.platforms.map(posTransform);

        let lineWidth = (zoom - 7) * 0.5;
        let circleRadius = zoom < 12 ? lineWidth * 1.25 : lineWidth;
        let circleBorder = zoom < 12 ? circleRadius * 0.4 : circleRadius * 0.6;
        let transferWidth = lineWidth * 0.9;
        let transferBorder = circleBorder * 1.25;
        if (L.Browser.retina) {
            const arr = [lineWidth, circleRadius, circleBorder, transferWidth];
            [lineWidth, circleRadius, circleBorder, transferWidth, transferBorder] = arr.map(item => item * 1.5);
        }
        const strokeWidths = {
            'station-circles': circleBorder,
            'transfers-outer': transferWidth + transferBorder / 2,
            'transfers-inner': transferWidth - transferBorder / 2,
            'paths-outer': lineWidth,
            'paths-inner': lineWidth / 2
        };
        for (let id of Object.keys(strokeWidths)) {
            document.getElementById(id).style.strokeWidth = strokeWidths[id] + 'px';
        }

        const platformsInCircles = new Set<number>();
        const stationCircumpoints = new Map<number, po.Platform[]>();

        for (let stationIndex = 0; stationIndex < this.graph.stations.length; ++stationIndex) {
            const station = this.graph.stations[stationIndex];

            const circumpoints: L.Point[] = [];
            for (let platformIndex of station.platforms) {
                const platform = this.graph.platforms[platformIndex];
                const posOnSVG = this.platformsOnSVG[platformIndex];

                if (zoom > 9) {
                    const ci = svg.makeCircle(posOnSVG, circleRadius);
                    ci.id = 'p-' + platformIndex;
                    if (zoom > 11) {
                        const lines = new Set<string>();
                        for (let spanIndex of platform.spans) {
                            for (let routeIndex of this.graph.spans[spanIndex].routes) {
                                lines.add(this.graph.routes[routeIndex].line);
                            }
                        }
                        if (lines.size === 1) {
                            const matches = lines.values().next().value.match(/([MEL])(\d{0,2})/);
                            if (matches) {
                                ci.classList.add(matches[1] === 'M' ? matches[0] : matches[1]);
                            }
                        } else {
                            var rgbs = [];
                            lines.forEach(l => {
                                const matches = l.match(/([MEL])(\d{0,2})/);
                                if (!matches) return;
                                rgbs.push(this.lineRules[matches[1] === 'M' ? matches[0] : matches[1]]);
                            });
                            ci.style.stroke = util.meanColor(rgbs);
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

                    docFrags['station-circles'].appendChild(ci);
                    docFrags['dummy-circles'].appendChild(dummyCircle);
                }

                this.whiskers[platformIndex] = this.makeWhiskers(platformIndex);
            }

            const dummyCircles = document.getElementById('dummy-circles');
            dummyCircles.addEventListener('mouseover', e => this.plate.show(svg.circleByDummy(e.target as any)));
            dummyCircles.addEventListener('mouseout', e => this.plate.hide());

            const circular = util.findCircle(this.graph, station);
            for (let platformIndex of station.platforms) {
                const platform = this.graph.platforms[platformIndex];
                if (circular && circular.indexOf(platform) > -1) {
                    circumpoints.push(this.platformsOnSVG[platformIndex]);
                    platformsInCircles.add(platformIndex);
                }
            }
            if (circular && circular.length === 3) {
                stationCircumpoints.set(stationIndex, circular);
            }

        }

        if (zoom > 11) {
            for (let transferIndex = 0; transferIndex < this.graph.transfers.length; ++transferIndex) {
                const transfer = this.graph.transfers[transferIndex];
                let paths: (SVGPathElement | SVGLineElement)[];
                var pl1 = this.graph.platforms[transfer.source],
                    pl2 = this.graph.platforms[transfer.target];
                const pos1 = this.platformsOnSVG[transfer.source],
                    pos2 = this.platformsOnSVG[transfer.target];
                if (platformsInCircles.has(transfer.source) && platformsInCircles.has(transfer.target)) {
                    const triplet = stationCircumpoints.get(pl1.station);
                    const third = triplet.find(p => p !== pl1 && p !== pl2);
                    paths = svg.makeTransferArc(pos1, pos2, this.platformsOnSVG[this.graph.platforms.indexOf(third)]);
                } else {
                    // gradient disappearing fix (maybe use rectangle?)
                    if (pos1.x === pos2.x) {
                        pos2.x += 0.01;
                    } else if (pos1.y === pos2.y) {
                        pos2.y += 0.01;
                    }
                    paths = svg.makeTransfer(pos1, pos2);
                }
                paths[0].id = 'ot-' + transferIndex;
                paths[1].id = 'it-' + transferIndex;
                const gradientColors: string[] = [pl1, pl2].map(p => {
                    const span = this.graph.spans[p.spans[0]];
                    const routes = span.routes.map(n => this.graph.routes[n]);
                    const [lineId, lineType, lineNum] = routes[0].line.match(/([MEL])(\d{0,2})/);
                    return this.lineRules[lineType === 'L' ? lineType : lineId];
                });
                //const colors = [transfer.source, transfer.target].map(i => getComputedStyle(docFrags['station-circles'].childNodes[i] as Element, null).getPropertyValue('stroke'));
                const circlePortion = (circleRadius + circleBorder / 2) / pos1.distanceTo(pos2);
                let gradient: SVGLinearGradientElement = document.getElementById('g-' + transferIndex) as any;
                if (gradient === null) {
                    gradient = svg.Gradients.make(pos2.subtract(pos1), gradientColors, circlePortion);
                    gradient.id = 'g-' + transferIndex;
                    this.overlay.querySelector('defs').appendChild(gradient);
                } else {
                    svg.Gradients.setDirection(gradient, pos2.subtract(pos1));
                    svg.Gradients.setOffset(gradient, circlePortion);
                }

                paths[0].style.stroke = `url(#${gradient.id})`;
                docFrags['transfers-outer'].appendChild(paths[0]);
                docFrags['transfers-inner'].appendChild(paths[1]);
                bind.transferToModel.call(this, transfer, paths);
            }
        }
        for (let i = 0; i < this.graph.spans.length; ++i) {
            const [outer, inner] = this.makePath(i);
            docFrags['paths-outer'].appendChild(outer);
            if (inner) {
                docFrags['paths-inner'].appendChild(inner);
            } else if (this.graph.routes[this.graph.spans[i].routes[0]].line.startsWith('L')) {
                outer.style.strokeWidth = lineWidth * 0.75 + 'px';
            }
        }

        for (let i of Object.keys(docFrags)) {
            document.getElementById(i).appendChild(docFrags[i]);
        }
        this.addBindings();
    }

    private makeWhiskers(platformIndex: number): {} {
        const platform = this.graph.platforms[platformIndex];
        const posOnSVG = this.platformsOnSVG[platformIndex];
        if (platform.spans.length < 2) {
            return { [platform.spans[0]]: posOnSVG };
        }

        if (platform.spans.length > 2) {
            // 0 - prev, 1 - next
            const points: L.Point[][] = [[], []];
            const spanIds: number[][] = [[], []];

            const dirHints = this.hints.crossPlatform;
            const idx = util.hintContainsLine(this.graph, dirHints, platform);
            if (platform.name in dirHints && idx !== null) {
                // array or object
                const platformHints = idx > -1 ? dirHints[platform.name][idx] : dirHints[platform.name];
                const nextPlatformNames: string[] = [];
                for (let key of Object.keys(platformHints)) {
                    const val = platformHints[key];
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
                    const neighborPos = this.platformsOnSVG[neighborIndex];
                    const dirIdx = nextPlatformNames.indexOf(neighbor.name) > -1 ? 1 : 0;
                    points[dirIdx].push(neighborPos);
                    spanIds[dirIdx].push(spanIndex);
                }
            }
            const midPts = points.map(pts => posOnSVG
                .add(pts.length === 1 ? pts[0] : pts.length === 0 ? posOnSVG : util.getCenter(pts))
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
            const neighborOnSVG = this.platformsOnSVG[neighborNum];
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
            this.platformsOnSVG[srcN],
            this.whiskers[srcN][spanIndex],
            this.whiskers[trgN][spanIndex],
            this.platformsOnSVG[trgN]
        ];
        const bezier = svg.makeCubicBezier(controlPoints);
        bezier.id = 'op-' + spanIndex;
        if (lineType === 'E') {
            bezier.classList.add('E');
            const inner: typeof bezier = bezier.cloneNode(true) as any;
            inner.id = 'ip-' + spanIndex;
            return [bezier, inner];
        } else {
            if (lineId) {
                bezier.classList.add(lineId);
            }
            bezier.classList.add(lineType);
            return [bezier];
        }
    }

    visualizeShortestRoute(departure: L.LatLng, arrival: L.LatLng) {
        util.resetStyle();
        alertify.dismissAll();
        const { platforms, edges, time } = util.shortestPath(this.graph, departure, arrival);
        const onFoot = tr('on foot');
        const walkTo = util.formatTime(time.walkTo);
        if (edges === undefined) {
            return alertify.success(`${walkTo} ${onFoot}!`);
        }
        const selector = '#paths-inner *, #paths-outer *, #transfers-inner *, #transfers-outer *, #station-circles *';
        const els: HTMLElement[] = this.overlay.querySelectorAll(selector) as any;
        for (let i = 0; i < els.length; ++i) {
            //els[i].style['-webkit-filter'] = 'grayscale(1)';
            els[i].style.opacity = '0.25';
        }
        console.log(edges);
        console.log(platforms.map(p => this.graph.platforms[p].name));
        svg.animateRoute(this.graph, platforms, edges).then(() => {
            alertify.message(`${tr('time').toUpperCase()}:<br>${walkTo} ${onFoot}<br>${util.formatTime(time.metro)} ${tr('by metro')}<br>${util.formatTime(time.walkFrom)} ${onFoot}<br>${tr('TOTAL')}: ${util.formatTime(time.total)}`, 10);
        });
    }
}