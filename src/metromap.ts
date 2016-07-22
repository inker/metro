/// <reference path="../typings/tsd.d.ts" />;
import * as L from 'leaflet';
import * as nw from './network';
import * as hints from './hints';
import * as ui from './ui';
import * as svg from './svg';
import * as util from './util';
import * as res from './res';
import { getCenter } from './math';
import { findCircle } from './algorithm';
import { mapbox, mapnik, osmFrance, cartoDBNoLabels, wikimapia } from './tilelayers';
import { tr } from './i18n';
import Mediator from './mediator';

export default class MetroMap extends Mediator {
    private config: res.Config;
    private map: L.Map;
    private overlay: ui.MapOverlay;
    private contextMenu: ui.ContextMenu;

    private network: nw.Network;
    private hints: hints.Hints;
    private lineRules: Map<string, CSSStyleDeclaration>;
    private whiskers = new Map<number, Map<number, L.Point>>();
    private platformsOnSVG = new Map<number, L.Point>();
    private plate: ui.TextPlate;

    //private routeWorker = new Worker('js/routeworker.js');

    getMap(): L.Map { return this.map; }
    getNetwork(): nw.Network { return this.network; }  

    constructor(config: res.Config) {
        super();
        const networkPromise = res.getContent(config.url['graph'])
            .then(json => this.network = new nw.Network(json));
        const lineRulesPromise = res.getLineRules()
            .then(lineRules => this.lineRules = lineRules);
        const hintsPromise = Promise.all([res.getJSON(config.url['hints']), networkPromise] as any[])
            .then(results => hints.verify(results[1], results[0]))
            .catch(console.error)
            .then(json => this.hints = json);
        const contextMenu = new ui.ContextMenu(config.url['contextMenu']);
        const faq = new ui.FAQ(config.url['data']);
        const tileLoadPromise = new Promise(resolve => mapbox.once('load', e => resolve()));
        
        this.config = config;
        const mapOptions = Object.assign({}, config);
        if (L.version[0] === '1') {
            mapOptions['wheelPxPerZoomLevel'] = 75;
            mapOptions['inertiaMaxSpeed'] = 1500;
            mapOptions['fadeAnimation'] = false;
        }
        this.map = new L.Map(config.containerId, mapOptions)
            .addControl(new L.Control.Scale({ imperial: false }))
            .addLayer(mapbox);
        
        const mapPaneStyle = this.map.getPanes().mapPane.style;
        mapPaneStyle.visibility = 'hidden';

        ui.addLayerSwitcher(this.map, [mapbox, mapnik, osmFrance, cartoDBNoLabels, wikimapia]);
        this.addMapListeners();
        this.addKeyboardListeners();
        networkPromise.then(network => {
            const bounds = new L.LatLngBounds(this.network.platforms.map(p => p.location));
            this.overlay = new ui.MapOverlay(bounds).addTo(this.map);
            const { defs } = this.overlay;
            svg.Filters.appendAll(defs);
            if (defs.textContent.length === 0) {
                alert(tr`Your browser doesn't seem to have capabilities to display some features of the map. Consider using Chrome or Firefox for the best experience.`);
            }
            return Promise.all([lineRulesPromise, hintsPromise] as any[]);
        }).then(results => {
            this.redrawNetwork();
            this.overlay.onZoomChange = e => this.redrawNetwork();
            // TODO: fix the kludge making the grey area disappear
            this.map.invalidateSize(false);
            new ui.RoutePlanner(this);
            new ui.DistanceMeasure(this);
            //this.routeWorker.postMessage(this.network);
            //ui.drawZones(this);
            this.resetMapView();
            return contextMenu.whenAvailable;
        }).then(() => {
            contextMenu.addTo(this);
            this.contextMenu = contextMenu;
            if (!L.Browser.mobile) {
                new ui.MapEditor(this.config.detailedZoom).addTo(this);
            }
            return faq.whenAvailable;
        }).then(() => {
            faq.addTo(this);
            return tileLoadPromise;
        }).then(() => {
            util.fixFontRendering();
            mapPaneStyle.visibility = '';
        });
    }

    private addMapListeners() {
        super.addListenersFromObject({
            'measuredistance': (e: Event) => {
                this.contextMenu.removeItem('measuredistance');
                this.contextMenu.insertItem({event: 'deletemeasurements', text: 'Delete measurements'});
            },
            'deletemeasurements': (e: Event) => {
                this.contextMenu.removeItem('deletemeasurements');
                this.contextMenu.insertItem({event: 'measuredistance', text: 'Measure distance'});
            },
            'platformrename': (e: Event) => {
                const circle = (e as MouseEvent).relatedTarget as SVGCircleElement;
                const platform = util.platformByCircle(circle, this.network);
                this.plate.show(svg.circleOffset(circle), util.getPlatformNames(platform));
                ui.platformRenameDialog(this.network, platform);
            },
            'platformmove': (e: Event) => {
                this.plate.disabled = true;
            },
            'platformmoveend': (e: Event) => {
                const circle = (e as MouseEvent).relatedTarget as SVGCircleElement;
                const platform = util.platformByCircle(circle, this.network);
                this.plate.disabled = false;
                this.plate.show(svg.circleOffset(circle), util.getPlatformNames(platform));                
            },
            'platformadd': (e: Event) => {
                //this.contextMenu.items.delete('platformadd');
                const coor = util.mouseToLatLng(this.map, e as MouseEvent);
                const pos = this.overlay.latLngToSvgPoint(coor);
                const stationCircles = document.getElementById('station-circles'),
                    dummyCircles = document.getElementById('dummy-circles');
                const circle = svg.makeCircle(pos, +stationCircles.firstElementChild.getAttribute('r')),
                    dummy = svg.makeCircle(pos, +dummyCircles.firstElementChild.getAttribute('r'));

                const id = this.network.platforms.length;
                circle.id = 'p-' + id;
                dummy.id = 'd-' + id;
                stationCircles.appendChild(circle);
                dummyCircles.appendChild(dummy);
                const platform: nw.Platform = {
                    name: tr`New station`,
                    altNames: {},
                    station: null,
                    spans: [],
                    elevation: 0,
                    location: coor
                };
                this.network.platforms.push(platform);
                this.platformToModel(platform, [circle, dummy]);
            },
            'platformdelete': (e: Event) => {

            },
            'editmapstart': (e: Event) => {
                if (this.map.getZoom() < this.config.detailedZoom) {
                    // const plusButton = this.map.zoomControl.getContainer().firstChild;
                    // util.triggerMouseEvent(plusButton, 'mousedown');
                    // util.triggerMouseEvent(plusButton, 'click');
                    this.map.setZoom(this.config.detailedZoom);
                }
                this.contextMenu.insertItem({text: 'New station', event: 'platformadd'});
                const predicate = (target: EventTarget) => (target as SVGElement).parentElement.id === 'dummy-circles';
                this.contextMenu.insertItem({text: 'Rename station', predicate, event: 'platformrename'});
                this.contextMenu.insertItem({text: 'Delete station', predicate, event: 'platformdelete'});
            },
            'editmapend': (e: Event) => {
                this.contextMenu.removeItem('platformadd');
                this.contextMenu.removeItem('platformrename');
                this.contextMenu.removeItem('platformdelete');
            },
            'showheatmap': (e: Event) => {
                //this.showHeatMap();
            }
        });
    }

    private addKeyboardListeners(): void {
        addEventListener('keydown', e => {
            if (e.altKey) {
                switch (e.keyCode) {
                    case 82: return this.resetNetwork(); // r
                    default: return;
                }
            }
            switch (e.keyCode) {
                case 27: return this.receiveEvent(new Event('clearroute')); // esc
                default: return;
            }
        });
    }

    private resetMapView(): void {
        //const fitness = (points, pt) => points.reduce((prev, cur) => this.bounds., 0);
        //const center = geo.calculateGeoMean(this.network.platforms.map(p => p.location), fitness, 0.1);
        this.map.setView(this.config.center, this.config.zoom, {
            pan: { animate: false },
            zoom: { animate: false }
        });
    }

    private resetNetwork(): void {
       	res.getContent(this.config.url['graph']).then(json => {
            this.network = new nw.Network(json);
            this.redrawNetwork();
        });
    }

    private resetOverlayStructure(): void {
        let { origin } = this.overlay;
        util.removeAllChildren(origin);

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
            // if (groupId.startsWith('transfers-')) {
            //     g.setAttribute('fill', 'none');
            // }
            origin.appendChild(g);
        }

        this.plate = new ui.TextPlate();
        origin.insertBefore(this.plate.element, document.getElementById('dummy-circles'));
    }

    private addBindings() {
        const nPlatforms = this.network.platforms.length;
        for (let i = 0; i < nPlatforms; ++i) {
            const circle = document.getElementById('p-' + i);
            const dummyCircle = document.getElementById('d-' + i);
            this.platformToModel(i, [circle, dummyCircle]);
        }
    }

    private redrawNetwork() {
        console.time('pre');
        this.resetOverlayStructure();
        this.updatePlatformsPositionOnOverlay();
        console.timeEnd('pre');
        console.time('preparation');
        const { detailedZoom } = this.config;
        const zoom = this.map.getZoom(),
            coef = zoom > 9 ? zoom : zoom > 8 ? 9.5 : 9,
            //lineWidth = 2 ** (zoom / 4 - 1.75);
        	lineWidth = (coef - 7) * 0.5,
            lightLineWidth = lineWidth * 0.75,
        	circleRadius = coef < detailedZoom ? lineWidth * 1.25 : lineWidth,
        	circleBorder = coef < detailedZoom ? circleRadius * 0.4 : circleRadius * 0.6,
            dummyCircleRadius = circleRadius * 2, 
        	transferWidth = lineWidth * 0.9,
        	transferBorder = circleBorder * 1.25;

        const strokeWidths = {
            'station-circles': circleBorder,
            'dummy-circles': 0,
            'transfers-outer': transferWidth + transferBorder / 2,
            'transfers-inner': transferWidth - transferBorder / 2,
            'paths-outer': lineWidth,
            'paths-inner': lineWidth / 2
        };
        const fullCircleRadius = circleRadius + circleBorder / 2;

        const docFrags = new Map<string, DocumentFragment>();
        for (let id of Object.keys(strokeWidths)) {
            docFrags.set(id, document.createDocumentFragment());
            document.getElementById(id).style.strokeWidth = strokeWidths[id] + 'px';
        }

        this.lineRules.get('light-rail-path').strokeWidth = lightLineWidth + 'px';

        // 11 - 11, 12 - 11.5, 13 - 12, 14 - 12.5
        const fontSize = Math.max((zoom + 10) * 0.5, 11);
        (this.plate.element.firstChild.firstChild as HTMLElement).style.fontSize = fontSize + 'px';

        const stationCircumpoints = new Map<nw.Station, nw.Platform[]>();

        console.timeEnd('preparation');

        // station circles

        console.time('circle preparation');

        const stationCirclesFrag = docFrags.get('station-circles');
        const dummyCirclesFrag = docFrags.get('dummy-circles');

        for (let station of this.network.stations) {
            const circumpoints: L.Point[] = [];
            let stationMeanColor: string;
            // if (zoom < 12) {
            //     stationMeanColor = util.Color.mean(this.linesToColors(this.passingLinesStation(station)));
            // }
            for (let platformIndex of station.platforms) {
                const platform = this.network.platforms[platformIndex];
                const posOnSVG = this.platformsOnSVG.get(platformIndex);
                //const posOnSVG = this.overlay.latLngToSvgPoint(platform.location);
                if (zoom > 9) {
                    const ci = svg.makeCircle(posOnSVG, circleRadius);
                    ci.id = 'p-' + platformIndex;
                    if (zoom >= detailedZoom) {
                        this.colorizePlatformCircle(ci, this.network.passingLines(platform));
                    }
                    // else {
                    //     ci.style.stroke = stationMeanColor;
                    // }
                    const dummyCircle = svg.makeCircle(posOnSVG, dummyCircleRadius);
                    dummyCircle.id = 'd-' + platformIndex;

                    stationCirclesFrag.appendChild(ci);
                    dummyCirclesFrag.appendChild(dummyCircle);
                }

                this.whiskers.set(platformIndex, this.makeWhiskers(platformIndex));
            }

            const circular = findCircle(this.network, station);
            if (circular.length > 0) {
                for (let platformIndex of station.platforms) {
                    const platform = this.network.platforms[platformIndex];
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
            const { defs } = this.overlay;
            const nwTransfers = this.network.transfers, nTransfers = nwTransfers.length;
            for (let transferIndex = 0; transferIndex < nTransfers; ++transferIndex) {
                const transfer = nwTransfers[transferIndex];
                const pl1 = this.network.platforms[transfer.source],
                    pl2 = this.network.platforms[transfer.target];
                const pos1 = this.platformsOnSVG.get(transfer.source),
                    pos2 = this.platformsOnSVG.get(transfer.target);
                const scp = stationCircumpoints.get(this.network.stations[pl1.station]);
                const paths = scp !== undefined && scp.indexOf(pl1) > -1 && scp.indexOf(pl2) > -1
                    ? this.makeTransferArc(transfer, scp)
                    : svg.makeTransferLine(pos1, pos2);
                paths[0].id = 'ot-' + transferIndex;
                paths[1].id = 'it-' + transferIndex;
                const gradientColors = [pl1, pl2].map(p => this.getPlatformColor(p));
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
                this.transferToModel(transfer, paths);
            }
        }

        console.timeEnd('transfer preparation');
        console.time('span preparation');
        // paths

        const pathsOuterFrag = docFrags.get('paths-outer');
        const pathsInnerFrag = docFrags.get('paths-inner');
        for (let i = 0, numSpans = this.network.spans.length; i < numSpans; ++i) {
            const [outer, inner] = this.makePath(i);
            pathsOuterFrag.appendChild(outer);
            if (inner) {
                pathsInnerFrag.appendChild(inner);
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
        const nwPlatforms = this.network.platforms;
        const detailed = zoom < this.config.detailedZoom;
        for (let station of this.network.stations) {
            const center = detailed ? this.overlay.latLngToSvgPoint(this.network.getStationCenter(station)) : undefined;
            for (let platformIndex of station.platforms) {
                const pos = center || this.overlay.latLngToSvgPoint(nwPlatforms[platformIndex].location);
                this.platformsOnSVG.set(platformIndex, pos);
            }
        }
    }

    private getPlatformColor(platform: nw.Platform): string {
        return util.Color.mean(this.linesToColors(this.network.passingLines(platform)));
    }

    private linesToColors(lines: Set<string>): string[] {
        const rgbs: string[] = [];
        for (let vals = lines.values(), it = vals.next(); !it.done; it = vals.next()) {
            const line = it.value;
            rgbs.push(this.lineRules.get(line[0] === 'M' ? it.value : line[0]).stroke);
        }
        return rgbs;
    }

    private colorizePlatformCircle(ci: SVGCircleElement, lines: Set<string>) {
        if (lines.size === 0) return;
        if (lines.size === 1) {
            const line = lines.values().next().value;
            ci.classList.add(line[0] === 'M' ? line : line[0]);
            return;
        }
        ci.style.stroke = util.Color.mean(this.linesToColors(lines));
    }

    private makeWhiskers(platformIndex: number): Map<number, L.Point> {
        const platform = this.network.platforms[platformIndex];
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
            const idx = hints.hintContainsLine(this.network, dirHints, platform);
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
                    const span = this.network.spans[spanIndex];
                    const neighborIndex = span.source === platformIndex ? span.target : span.source;
                    const neighbor = this.network.platforms[neighborIndex];
                    const neighborPos = this.platformsOnSVG.get(neighborIndex);
                    const dirIdx = nextPlatformNames.indexOf(neighbor.name) > -1 ? 1 : 0;
                    points[dirIdx].push(neighborPos);
                    spanIds[dirIdx].push(spanIndex);
                }
            }
            const midPts = points.map(pts => posOnSVG
                .add(pts.length === 1 ? pts[0] : pts.length === 0 ? posOnSVG : getCenter(pts))
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

        // TODO: refactor this stuff, unify 2-span & >2-span platforms
        if (this.network.passingLines(platform).size === 2) {
            return wh.set(platform.spans[0], posOnSVG).set(platform.spans[1], posOnSVG);
        }

        // const firstSpan = this.network.spans[platform.spans[0]];
        // if (firstSpan.source === platformIndex) {
        //     platform.spans.reverse();
        // }
        // previous node should come first
        const midPts = [posOnSVG, posOnSVG], lens = [0, 0];
        for (let i = 0; i < 2; ++i) {
            const span = this.network.spans[platform.spans[i]];
            const neighborOnSVG = this.platformsOnSVG.get(span.other(platformIndex));
            lens[i] = posOnSVG.distanceTo(neighborOnSVG);
            midPts[i] = posOnSVG.add(neighborOnSVG).divideBy(2);
        }
        const mdiff = midPts[1].subtract(midPts[0]).multiplyBy(lens[0] / (lens[0] + lens[1])),
            mm = midPts[0].add(mdiff),
            diff = posOnSVG.subtract(mm);
        return wh.set(platform.spans[0], midPts[0].add(diff)).set(platform.spans[1], midPts[1].add(diff));
    }

    private makeTransferArc(transfer: nw.Transfer, cluster: nw.Platform[]): (SVGLineElement | SVGPathElement)[] {
        const nwPlatforms = this.network.platforms;
        const pl1 = nwPlatforms[transfer.source],
            pl2 = nwPlatforms[transfer.target];
        const pos1 = this.platformsOnSVG.get(transfer.source),
            pos2 = this.platformsOnSVG.get(transfer.target);
        const makeArc = (thirdIndex: number) => svg.makeTransferArc(pos1, pos2, this.platformsOnSVG.get(thirdIndex));
        if (cluster.length === 3) {
            const third = cluster.find(p => p !== pl1 && p !== pl2);
            return makeArc(nwPlatforms.indexOf(third));
        } else if (pl1 === cluster[2] && pl2 === cluster[3] || pl1 === cluster[3] && pl2 === cluster[2]) {
            return svg.makeTransferLine(pos1, pos2);
        }
        //const s = transfer.source;
        //const pl1neighbors = this.network.transfers.filter(t => t.source === s || t.target === s);
        //const pl1deg = pl1neighbors.length;
        const rarr: number[] = [];
        for (let t of this.network.transfers) {
            if (t === transfer) continue;
            if (transfer.has(t.source)) {
                rarr.push(t.target);
            } else if (transfer.has(t.target)) {
                rarr.push(t.source);
            }
        }
        let thirdIndex: number;
        if (rarr.length === 2) {
            if (rarr[0] !== rarr[1]) throw Error("FFFFUC");
            thirdIndex = rarr[0];
        } else if (rarr.length === 3) {
            thirdIndex = rarr[0] === rarr[1] ? rarr[2] : rarr[0] === rarr[2] ? rarr[1] : rarr[0];
        } else {
            throw new Error("111FUUFF");
        }
        return makeArc(thirdIndex);
    }

    private makePath(spanIndex: number) {
        const span = this.network.spans[spanIndex];
        const srcN = span.source, trgN = span.target;
        const routes = span.routes.map(n => this.network.routes[n]);
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
        
        const getNames = (platforms: nw.Platform[]) => [0, 1, 2]
            .map(no => util.uniquify(platforms.map(p => util.getPlatformNames(p)[no])).reduce(zip))
            .filter(s => s !== undefined && s.length > 0);
        const dummyCircles = document.getElementById('dummy-circles');
        dummyCircles.addEventListener('mouseover', e => {
            const dummy = e.target as SVGCircleElement;
            const platform = this.network.platforms[+dummy.id.slice(2)];
            const station = this.network.stations[platform.station];
            const names = this.map.getZoom() < this.config.detailedZoom && station.platforms.length > 1 ? 
                getNames(station.platforms.map(i => this.network.platforms[i])) :
                util.getPlatformNames(platform);
            this.highlightStation(station, names);
        });
        dummyCircles.addEventListener('mouseout', onMouseOut);
        const onTransferOver = (e: MouseEvent) => {
            const el = e.target as SVGPathElement | SVGLineElement;
            const transfer = this.network.transfers[+el.id.slice(3)];
            const source = this.network.platforms[transfer.source];
            const station = this.network.stations[source.station];
            this.highlightStation(station, getNames([source, this.network.platforms[transfer.target]]));
        };
        const transfersOuter = document.getElementById('transfers-outer'),
            transfersInner = document.getElementById('transfers-inner');
        transfersOuter.addEventListener('mouseover', onTransferOver);
        transfersInner.addEventListener('mouseover', onTransferOver);
        transfersOuter.addEventListener('mouseout', onMouseOut);
        transfersInner.addEventListener('mouseout', onMouseOut);
    }

    private highlightStation(station: nw.Station, names: string[]) {
        const scaleFactor = 1.25,
            nwPlatforms = this.network.platforms,
            stationPlatforms = station.platforms;
        let circle: SVGCircleElement,
            platform: nw.Platform;
        if (stationPlatforms.length === 1) {
            circle = util.circleByIndex(stationPlatforms[0]);
            svg.Scale.scaleCircle(circle, scaleFactor, true);
            platform = nwPlatforms[stationPlatforms[0]];
        } else {
            const transfers = this.map.getZoom() < this.config.detailedZoom ? undefined : this.network.transfers;
            svg.Scale.scaleStation(nwPlatforms, station, scaleFactor, transfers);

            const idx2lat = (i: number) => nwPlatforms[i].location.lat;
            const topmostIndex = stationPlatforms.reduce((prev, cur) => idx2lat(prev) < idx2lat(cur) ? cur : prev);
            circle = util.circleByIndex(topmostIndex);
            platform = nwPlatforms[topmostIndex];
        }
        this.plate.show(svg.circleOffset(circle), names);
    }

    private platformToModel(platform: nw.Platform|number, circles: Element[]) {
        const [idx, obj] = typeof platform === 'number'
            ? [platform, this.network.platforms[platform]]
            : [this.network.platforms.indexOf(platform), platform];
        const cached = obj.location;
        Object.defineProperty(obj, 'location', {
            get: () => obj['_location'],
            set: (location: L.LatLng) => {
                obj['_location'] = location;
                const locForPos = this.map.getZoom() < this.config.detailedZoom
                    ? this.network.getStationCenter(this.network.stations[obj.station])
                    : location;
                const pos = this.overlay.latLngToSvgPoint(locForPos);
                // const nw = this.bounds.getNorthWest();
                // const pos = this.map.latLngToContainerPoint(locForPos).subtract(this.map.latLngToContainerPoint(nw));
                for (let c of circles) {
                    c.setAttribute('cx', pos.x.toString());
                    c.setAttribute('cy', pos.y.toString());
                }
                this.whiskers.set(idx, this.makeWhiskers(idx));
                this.platformsOnSVG.set(idx, pos);
                const spansToChange = new Set<number>(obj.spans);
                for (let spanIndex of obj.spans) {
                    const span = this.network.spans[spanIndex];
                    const srcN = span.source, trgN = span.target;
                    const neighborIndex = idx === srcN ? trgN : srcN;
                    this.whiskers.set(neighborIndex, this.makeWhiskers(neighborIndex));
                    this.network.platforms[neighborIndex].spans.forEach(si => spansToChange.add(si));
                }
                spansToChange.forEach(spanIndex => {
                    const span = this.network.spans[spanIndex];
                    const srcN = span.source, trgN = span.target;
                    const controlPoints = [this.platformsOnSVG.get(srcN), this.whiskers.get(srcN).get(spanIndex), this.whiskers.get(trgN).get(spanIndex), this.platformsOnSVG.get(trgN)];
                    svg.setBezierPath(document.getElementById(`op-${spanIndex}`), controlPoints);
                    const inner = document.getElementById(`ip-${spanIndex}`);
                    if (inner) svg.setBezierPath(inner, controlPoints);
                });
                let oo = 0;
                for (let tr of this.network.transfers) {
                    if (tr.source === idx) {
                        tr.source = idx;
                        ++oo;
                    } else if (tr.target === idx) {
                        tr.target = idx;
                        ++oo;
                    }
                }
                console.log(oo);
            }
        });
        obj['_location'] = cached;
    }

    private transferToModel(transfer: nw.Transfer, elements: Element[]) {
        const cached =  [transfer.source, transfer.target];
        const transferIndex = this.network.transfers.indexOf(transfer);
        ['source', 'target'].forEach((prop, pi) => {
            Object.defineProperty(transfer, prop, {
                get: () => transfer['_' + prop],
                set: (platformIndex: number) => {
                    const circle: SVGCircleElement = document.getElementById('p-' + platformIndex) as any;
                    const circleTotalRadius = +circle.getAttribute('r') / 2 + parseFloat(getComputedStyle(circle).strokeWidth);
                    const pos = this.platformsOnSVG.get(platformIndex);
                    if (elements[0].tagName === 'line') {
                        const n = pi + 1;
                        const otherPos = this.platformsOnSVG.get(transfer.other(platformIndex));
                        for (let el of elements) {
                            el.setAttribute('x' + n, pos.x.toString());
                            el.setAttribute('y' + n, pos.y.toString());
                        }
                        const gradient: SVGLinearGradientElement = document.getElementById(`g-${transferIndex}`) as any;
                        const dir = prop === 'source' ? otherPos.subtract(pos) : pos.subtract(otherPos);
                        svg.Gradients.setDirection(gradient, dir);
                        const circlePortion = circleTotalRadius / pos.distanceTo(otherPos);
                        svg.Gradients.setOffset(gradient, circlePortion);
                    } else if (elements[0].tagName === 'path') {
                        const transfers: nw.Transfer[] = [];
                        const transferIndices: number[] = [];
                        for (let i = 0, len = this.network.transfers.length; i < len; ++i) {
                            const t = this.network.transfers[i];
                            if (transfer.isAdjacent(t)) {
                                transfers.push(t);
                                transferIndices.push(i);
                                if (transfers.length === 3) break;
                            }
                        }

                        const circular = new Set<number>();
                        for (let tr of transfers) {
                            circular.add(tr.source).add(tr.target);
                        }

                        const circumpoints = Array.from(circular).map(i => this.platformsOnSVG.get(i));
                        circular.forEach(i => circumpoints.push(this.platformsOnSVG.get(i)));

                        const outerArcs = transferIndices.map(i => document.getElementById('ot-' + i));
                        const innerArcs = transferIndices.map(i => document.getElementById('it-' + i));
                        for (let i = 0; i < 3; ++i) {
                            const tr = transfers[i],
                                outer = outerArcs[i],
                                inner = innerArcs[i];
                            var pos1 = this.platformsOnSVG.get(tr.source),
                                pos2 = this.platformsOnSVG.get(tr.target);
                            const thirdPos = circumpoints.find(pos => pos !== pos1 && pos !== pos2);
                            svg.setCircularPath(outer, pos1, pos2, thirdPos);
                            inner.setAttribute('d', outer.getAttribute('d'));
                            const gradient = document.getElementById(`g-${transferIndices[i]}`);
                            svg.Gradients.setDirection(gradient, pos2.subtract(pos1));
                            const circlePortion = circleTotalRadius / pos1.distanceTo(pos2);
                            svg.Gradients.setOffset(gradient, circlePortion);
                        }
                    } else {
                        throw new TypeError('wrong element type for transfer');
                    }
                }
            });
            transfer['_' + prop] = cached[pi];
        });
    }

}