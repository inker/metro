/// <reference path="../typings/tsd.d.ts" />;
import * as L from 'leaflet';
import * as nw from './network';
import * as ui from './ui';
import * as svg from './util/svg';
import * as util from './util/utilities';
import * as res from './res';
import pool from './objectpool';
import { Scale } from './util/sfx';
import { getCenter } from './util/math';
import { findCircle } from './util/algorithm';
import { mapbox, mapnik, osmFrance, cartoDBNoLabels, wikimapia } from './tilelayers';
import { tr } from './i18n';
import Mediator from './util/mediator';

export default class MetroMap extends Mediator {
    private config: res.Config;
    private map: L.Map;
    private overlay: ui.SvgOverlay;
    private contextMenu: ui.ContextMenu;

    private network: nw.Network;
    private lineRules: Map<string, CSSStyleDeclaration>;
    private whiskers = new WeakMap<nw.Platform, Map<nw.Span, L.Point>>();
    private platformsOnSVG = new WeakMap<nw.Platform, L.Point>();

    private plate: ui.TextPlate;

    //private routeWorker = new Worker('js/routeworker.js');

    getMap(): L.Map { return this.map; }
    getNetwork(): nw.Network { return this.network; }  

    constructor(config: res.Config) {
        super();
        (document.getElementById('scheme') as HTMLLinkElement).href = config.url['scheme'];
        const networkPromise = res.getJSON(config.url['graph']);
        const lineRulesPromise = res.getLineRules();
        const tileLoadPromise = new Promise(resolve => mapbox.once('load', e => resolve()));

        const faq = new ui.FAQ(config.url['data']);
        
        //wait.textContent = 'making map...';
        this.config = config;
        this.config.center = [0, 0];
        const mapOptions = Object.assign({}, config);
        if (L.version[0] === '1') {
            mapOptions['wheelPxPerZoomLevel'] = 75;
            mapOptions['inertiaMaxSpeed'] = 1500;
            mapOptions['fadeAnimation'] = false;
        }
        this.map = new L.Map(config.containerId, mapOptions)
            .addControl(new L.Control.Scale({ imperial: false }));
        const mapPaneStyle = this.map.getPanes().mapPane.style;
        mapPaneStyle.visibility = 'hidden';

        ui.addLayerSwitcher(this.map, [mapbox, mapnik, osmFrance, cartoDBNoLabels, wikimapia]);

        addEventListener('keydown', e => {
            if (!e.shiftKey || !e.ctrlKey || e.keyCode !== 82) return;
            this.resetNetwork();
        });
        //wait.textContent = 'loading graph...';
        this.addContextMenu();
        networkPromise.then(json => {
            this.network = new nw.Network(json);
            const bounds = new L.LatLngBounds(this.network.platforms.map(p => p.location));
            const center = bounds.getCenter();
            this.config.center = [center.lat, center.lng];
            this.overlay = new ui.SvgOverlay(bounds).addTo(this.map);
            const { defs } = this.overlay;
            svg.Filters.appendAll(defs);
            if (defs.textContent.length === 0) {
                alert(tr`Your browser doesn't seem to have capabilities to display some features of the map. Consider using Chrome or Firefox for the best experience.`);
            }
            return lineRulesPromise;
        }).then(lineRules => {
            this.lineRules = lineRules;
            //wait.textContent = 'adding content...';
            this.resetMapView();
            this.map.addLayer(mapbox);
            this.map.on('overlayupdate', overlay => {
                this.redrawNetwork();
                // console.time('conversion');
                // util.File.svgToPicture(document.getElementById('overlay') as any).then(img => {
                //     document.body.appendChild(img);
                //     console.timeEnd('conversion');
                // });
            });
            this.initNetwork();
            // TODO: fix the kludge making the grey area disappear
            this.map.invalidateSize(false);
            new ui.RoutePlanner().addTo(this);
            new ui.DistanceMeasure().addTo(this.map);
            //this.routeWorker.postMessage(this.network);
            //ui.drawZones(this.map, this.network.platforms);

            if (!L.Browser.mobile) {
                new ui.MapEditor(this.config.detailedZoom).addTo(this);
            }
            return faq.whenAvailable;
        }).then(() => {
            faq.addTo(this.map);
            //wait.textContent = 'loading tiles...';
            return tileLoadPromise;
        }).then(() => {
            //wait.parentElement.removeChild(wait);
            util.fixFontRendering();
            this.addMapListeners();
            this.map.on('layeradd layerremove', e => util.fixFontRendering());
            mapPaneStyle.visibility = '';
            // const img = util.File.svgToImg(document.getElementById('overlay') as any, true);
            // util.File.svgToCanvas(document.getElementById('overlay') as any)
            //     .then(canvas => util.File.downloadText('svg.txt', canvas.toDataURL('image/png')));
            // util.File.downloadText('img.txt', img.src);
        });
    }

    public subscribe(type: string, listener: EventListener) {
        super.subscribe(type, listener);
        // forwarding map event to mediator
        this.map.on(type, e => this.publish(e as any));
    }

    private addContextMenu() {
        const arr = [{
            "event": "routefrom",
            "text": "Route from here"
        }, {
            "event": "routeto",
            "text": "Route to here"
        }, {
            "event": "clearroute",
            "text": "Clear route"
        }, {
            "event": "showheatmap",
            "text": "Show heatmap",
            "disabled": true
        }];
        this.contextMenu = new ui.ContextMenu(arr);
        for (let el of arr) {
            this.map.on(el.event, e => {
                console.log(e);
                this.publish(e as any)
            });
        }
        this.contextMenu.addTo(this.map);
    }

    private addMapListeners() {
        const relatedTargetToSpan = (rt: EventTarget) => {
            const path = rt as SVGPathElement;
            return (pool.outerEdgeBindings.getKey(path) || pool.innerEdgeBindings.getKey(path)) as nw.Span;
        };

        const relatedTargetToPlatform = (rt: EventTarget) => pool.dummyBindings.getKey(rt as SVGCircleElement);

        this.subscribe('distancemeasureinit', e => {
            this.contextMenu.insertItem({event: 'measuredistance', text: 'Measure distance'});
        });
        this.map.on('clearmeasurements', e => {
            this.contextMenu.removeItem('clearmeasurements');
            this.contextMenu.insertItem({event: 'measuredistance', text: 'Measure distance'});        
        });
        this.map.on('zoomstart', e => {
            this.plate.hide();
        });
        this.subscribe('measuredistance', (e: Event) => {
            this.contextMenu.removeItem('measuredistance');
            this.contextMenu.insertItem({event: 'clearmeasurements', text: 'Clear measurements'});
        });
        this.subscribe('platformrename', (e: MouseEvent) => {
            const platform = relatedTargetToPlatform(e.relatedTarget);
            this.plate.show(svg.circleOffset(e.relatedTarget as SVGCircleElement), util.getPlatformNames(platform));
            ui.platformRenameDialog(platform);
        });
        this.subscribe('platformmovestart', (e: MouseEvent) => {
            this.plate.disabled = true;
        });
        this.subscribe('platformmove', (e: MouseEvent) => {
            const platform = relatedTargetToPlatform(e.relatedTarget);
            platform.location = util.mouseToLatLng(this.map, e);
        });
        this.subscribe('platformmoveend', (e: MouseEvent) => {
            const platform = relatedTargetToPlatform(e.relatedTarget);
            this.plate.disabled = false;
            this.plate.show(svg.circleOffset(e.relatedTarget as SVGCircleElement), util.getPlatformNames(platform));   
        });
        this.subscribe('platformadd', (e: CustomEvent) => {
            console.log(e);
            const { detail } = e;
            const location = util.mouseToLatLng(this.map, detail);
            const newPlatform = new nw.Platform(tr`New station`, location, {});
            this.network.platforms.push(newPlatform);
            if (detail.relatedTarget !== undefined) {
                const span = relatedTargetToSpan(detail.relatedTarget);
                const prop = span.source === newPlatform ? 'target' : 'source';
                const newSpan = new nw.Span(newPlatform, span[prop], span.routes);
                span[prop] = newPlatform;
                this.network.spans.push(newSpan);
            }
            this.overlay.extendBounds(location);
            this.resetNetwork(JSON.parse(this.network.toJSON()));
        });
        this.subscribe('platformdelete', (e: MouseEvent) => {
            const platform = relatedTargetToPlatform(e.relatedTarget);
            this.network.deletePlatform(platform);
            this.redrawNetwork();
        });
        this.subscribe('spanroutechange', (e: MouseEvent) => {
            if (e.relatedTarget === undefined) return;
            const span = relatedTargetToSpan(e.relatedTarget);
            const routeSet = ui.askRoutes(this.network, new Set(span.routes));
            span.routes = Array.from(routeSet);
            this.resetNetwork(JSON.parse(this.network.toJSON()));
        });
        this.subscribe('spaninvert', (e: MouseEvent) => {
            if (e.relatedTarget === undefined) return;
            const span = relatedTargetToSpan(e.relatedTarget);
            span.invert();
            this.resetNetwork(JSON.parse(this.network.toJSON()));
        });        
        this.subscribe('spanend', (e: CustomEvent) => {
            const source = pool.dummyBindings.getKey(e.detail.source);
            const target = pool.dummyBindings.getKey(e.detail.target);
            console.log(source, target);
            this.contextMenu.removeItem('spanend');

            const sourceRoutes = source.passingRoutes();
            const targetRoutes = target.passingRoutes();
            const sn = sourceRoutes.size, tn = targetRoutes.size;
            
            const routeSet = sn > 0 && tn === 0 ? (sn === 1 ? sourceRoutes : ui.askRoutes(this.network, sourceRoutes)) :
                tn > 0 && sn === 0 ? (tn === 1 ? targetRoutes : ui.askRoutes(this.network, targetRoutes)) :
                ui.askRoutes(this.network, util.intersection(sourceRoutes, targetRoutes))
            
            this.network.spans.push(new nw.Span(source, target, Array.from(routeSet)));
            this.resetNetwork(JSON.parse(this.network.toJSON()));
        });
        this.subscribe('spandelete', (e: MouseEvent) => {
            if (e.relatedTarget === undefined) return;
            const span = relatedTargetToSpan(e.relatedTarget);
            util.deleteFromArray(this.network.spans, span);
            this.resetNetwork(JSON.parse(this.network.toJSON()));
        });  
        this.subscribe('transferend', (e: CustomEvent) => {
            const source = pool.dummyBindings.getKey(e.detail.source);
            const target = pool.dummyBindings.getKey(e.detail.target);
            console.log(source, target);
            this.contextMenu.removeItem('transferend');
            this.network.transfers.push(new nw.Transfer(source, target));
            this.resetNetwork(JSON.parse(this.network.toJSON()));           
        });
        this.subscribe('transferdelete', (e: MouseEvent) => {
            if (e.relatedTarget === undefined) return;
            const path = e.relatedTarget as SVGPathElement|SVGLineElement;
            const transfer = (pool.outerEdgeBindings.getKey(path) || pool.innerEdgeBindings.getKey(path)) as nw.Transfer;
            console.log(transfer);
            util.deleteFromArray(this.network.transfers, transfer);
            this.resetNetwork(JSON.parse(this.network.toJSON()));
        });  
        this.subscribe('editmapstart', (e: Event) => {
            if (this.map.getZoom() < this.config.detailedZoom) {
                this.map.setZoom(this.config.detailedZoom);
            }
            this.contextMenu.insertItem({text: 'New station', event: 'platformaddclick'});
            
            const trigger = (target: EventTarget) => (target as SVGElement).parentElement.id === 'dummy-circles';
            this.contextMenu.insertItem({text: 'Rename station', trigger, event: 'platformrename'});
            this.contextMenu.insertItem({text: 'Delete station', trigger, event: 'platformdelete'});
            this.contextMenu.insertItem({text: 'Span from here', trigger, event: 'spanstart'});
            this.contextMenu.insertItem({text: 'Transfer from here', trigger, event: 'transferstart'});
            
            const pathTrigger = (target: EventTarget) => {
                const parentId = (target as SVGElement).parentElement.id;
                return parentId === 'paths-outer' || parentId === 'paths-inner';
            }
            this.contextMenu.insertItem({text: 'Change route', event: 'spanroutechange', trigger: pathTrigger});
            this.contextMenu.insertItem({text: 'Invert span', event: 'spaninvert', trigger: pathTrigger});
            this.contextMenu.insertItem({text: 'Add station to line', event: 'platformaddtolineclick', trigger: pathTrigger });
            this.contextMenu.insertItem({text: 'Delete span', event: 'spandelete', trigger: pathTrigger });            
            this.contextMenu.insertItem({text: 'Delete transfer', event: 'transferdelete', trigger: target => {
                const parentId = (target as SVGElement).parentElement.id;
                return parentId === 'transfers-outer' || parentId === 'transfers-inner';                
            } });
        });
        this.subscribe('editmapend', (e: Event) => {
            this.contextMenu.removeItem('platformaddclick');
            this.contextMenu.removeItem('platformrename');
            this.contextMenu.removeItem('platformdelete');
            this.contextMenu.removeItem('spanstart');
            this.contextMenu.removeItem('transferstart');
            this.contextMenu.removeItem('platformaddtolineclick');
            this.contextMenu.removeItem('spanroutechange');
            this.contextMenu.removeItem('spandelete');
            this.contextMenu.removeItem('transferdelete');
        });
        this.subscribe('mapsave', (e: Event) => {
            util.File.downloadText('graph.json', this.network.toJSON());
        });
    }

    /** call only once! */
    private initNetwork() {
        let { origin } = this.overlay;
        const groupIds = [
            'paths-outer',
            'paths-inner',
            'transfers-outer',
            'station-circles',
            'transfers-inner',
            'dummy-circles'
        ];

        for (let groupId of groupIds) {
            const g = svg.createSVGElement('g') as SVGGElement;
            g.id = groupId;
            origin.appendChild(g);
        }

        this.plate = new ui.TextPlate();
        origin.insertBefore(this.plate.element, document.getElementById('dummy-circles'));
        this.redrawNetwork();
        this.addStationListeners();
    }

    private resetMapView(): void {
        //const fitness = (points, pt) => points.reduce((prev, cur) => this.bounds., 0);
        //const center = geo.calculateGeoMean(this.network.platforms.map(p => p.location), fitness, 0.1);
        const { center, zoom } = this.config;
        const options = {
            pan: { animate: false },
            zoom: { animate: false }
        };
        this.map.setView(center, zoom + 1, options);
        this.map.setView(center, zoom, options);
    }   

    private getGraph(): Promise<nw.GraphJSON> {
        return res.getJSON(this.config.url['graph']);
    }

    private resetNetwork(json?: nw.GraphJSON): void {
        (json === undefined ? this.getGraph() : Promise.resolve(json)).then(json => {
            //this.cleanPool();
            this.network = new nw.Network(json);
            this.redrawNetwork();            
        });
    }

    private cleanElements(): void {
        for (let child of (this.overlay.origin.childNodes as any)) {
            if (child !== this.plate.element) {
                util.removeAllChildren(child);
            }
        }
    }

    private addBindings() {
        const nPlatforms = this.network.platforms.length;
        for (let platform of this.network.platforms) {
            this.platformToModel(platform, [pool.platformBindings.get(platform), pool.dummyBindings.get(platform)]);
        }
    }

    private redrawNetwork() {
        console.time('pre');
        this.cleanElements();
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
            for (let platform of station.platforms) {
                const posOnSVG = this.platformsOnSVG.get(platform);
                //const posOnSVG = this.overlay.latLngToSvgPoint(platform.location);
                if (zoom > 9) {
                    const ci = svg.makeCircle(posOnSVG, circleRadius);
                    //ci.id = 'p-' + platformIndex;
                    pool.platformBindings.set(platform, ci);
                    if (zoom >= detailedZoom) {
                        this.colorizePlatformCircle(ci, platform.passingLines());
                    }
                    // else {
                    //     ci.style.stroke = stationMeanColor;
                    // }
                    const dummyCircle = svg.makeCircle(posOnSVG, dummyCircleRadius);
                    //dummyCircle.id = 'd-' + platformIndex;
                    pool.dummyBindings.set(platform, dummyCircle);

                    stationCirclesFrag.appendChild(ci);
                    dummyCirclesFrag.appendChild(dummyCircle);
                }

                this.whiskers.set(platform, this.makeWhiskers(platform));
            }

            const circular = findCircle(this.network, station);
            if (circular.length > 0) {
                for (let platform of station.platforms) {
                    if (circular.includes(platform)) {
                        circumpoints.push(this.platformsOnSVG.get(platform));
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
            for (let transfer of this.network.transfers) {
                const pl1 = transfer.source,
                    pl2 = transfer.target;
                const pos1 = this.platformsOnSVG.get(transfer.source),
                    pos2 = this.platformsOnSVG.get(transfer.target);
                const scp = stationCircumpoints.get(pl1.station);
                const paths = scp !== undefined && scp.includes(pl1) && scp.includes(pl2)
                    ? this.makeTransferArc(transfer, scp)
                    : svg.makeTransferLine(pos1, pos2);
                pool.outerEdgeBindings.set(transfer, paths[0]);
                pool.innerEdgeBindings.set(transfer, paths[1]);
                // paths[0].id = 'ot-' + transferIndex;
                // paths[1].id = 'it-' + transferIndex;
                const gradientColors = [pl1, pl2].map(p => this.getPlatformColor(p));
                // const colors = [transfer.source, transfer.target].map(i => getComputedStyle(stationCirclesFrag.childNodes[i] as Element, null).stroke);
                // console.log(colors);
                const circlePortion = fullCircleRadius / pos1.distanceTo(pos2);
                const gradientVector = pos2.subtract(pos1);
                let gradient = pool.gradientBindings.get(transfer);
                if (gradient === undefined) {
                    gradient = svg.Gradients.makeLinear(gradientVector, gradientColors, circlePortion);
                    gradient.id = util.generateId(id => document.getElementById(id) !== null);
                    pool.gradientBindings.set(transfer, gradient);
                    defs.appendChild(gradient);
                } else {
                    svg.Gradients.setDirection(gradient, gradientVector);
                    svg.Gradients.setOffset(gradient, circlePortion);
                }
                paths[0].style.stroke = `url(#${gradient.id})`;

                transfersOuterFrag.appendChild(paths[0]);
                transfersInnerFrag.appendChild(paths[1]);
                //this.transferToModel(transfer, paths);
            }
        }

        console.timeEnd('transfer preparation');
        console.time('span preparation');
        // paths

        const pathsOuterFrag = docFrags.get('paths-outer');
        const pathsInnerFrag = docFrags.get('paths-inner');
        for (let span of this.network.spans) {
            const [outer, inner] = this.makePath(span);
            pathsOuterFrag.appendChild(outer);
            if (inner) {
                pathsInnerFrag.appendChild(inner);
            }
        }

        console.timeEnd('span preparation');

        console.time('appending');

        docFrags.forEach((val, key) => document.getElementById(key).appendChild(val));

        this.addBindings();
        console.timeEnd('appending');

    }

    private updatePlatformsPositionOnOverlay(zoom = this.map.getZoom()) {
        const detailed = zoom < this.config.detailedZoom;
        for (let station of this.network.stations) {
            const center = detailed ? this.overlay.latLngToSvgPoint(station.getCenter()) : undefined;
            for (let platform of station.platforms) {
                const pos = center || this.overlay.latLngToSvgPoint(platform.location);
                this.platformsOnSVG.set(platform, pos);
            }
        }
    }

    private getPlatformColor(platform: nw.Platform): string {
        return util.Color.mean(this.linesToColors(platform.passingLines()));
    }

    private linesToColors(lines: Set<string>): string[] {
        const rgbs: string[] = [];
        lines.forEach(line => rgbs.push(this.lineRules.get(line[0] === 'M' ? line : line[0]).stroke));
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

    private makeWhiskers(platform: nw.Platform): Map<nw.Span, L.Point> {
        const posOnSVG = this.platformsOnSVG.get(platform);
        const whiskers = new Map<nw.Span, L.Point>();
        if (platform.spans.length === 0) {
            return whiskers;
        }
        if (platform.spans.length === 1) {
            return whiskers.set(platform.spans[0], posOnSVG);
        }

        if (platform.spans.length > 2) {
            // 0 - prev, 1 - next
            const points: L.Point[][] = [[], []];
            const spanIds: nw.Span[][] = [[], []];
            for (let span of platform.spans) {
                const neighbor = span.other(platform);
                const neighborPos = this.platformsOnSVG.get(neighbor);
                //const dirIdx = nextPlatformNames.includes(neighbor.name) ? 1 : 0;
                const dirIdx = span.source === platform ? 0 : 1;
                points[dirIdx].push(neighborPos);
                spanIds[dirIdx].push(span);
            }
            const midPts = points.map(pts => posOnSVG
                .add(pts.length === 1 ? pts[0] : pts.length === 0 ? posOnSVG : getCenter(pts))
                .divideBy(2)
            );
            const lens = midPts.map(midPt => posOnSVG.distanceTo(midPt));
            const midOfMidsWeighted = midPts[1]
                .subtract(midPts[0])
                .multiplyBy(lens[0] / (lens[0] + lens[1]))
                .add(midPts[0]);
            const offset = posOnSVG.subtract(midOfMidsWeighted);
            const ends = midPts.map(v => util.roundPoint(v.add(offset), 2));
            spanIds[0].forEach(i => whiskers.set(i, ends[0]));
            spanIds[1].forEach(i => whiskers.set(i, ends[1]));
            return whiskers;
        }

        // TODO: refactor this stuff, unify 2-span & >2-span platforms
        if (platform.passingLines().size === 2) {
            return whiskers.set(platform.spans[0], posOnSVG).set(platform.spans[1], posOnSVG);
        }

        // const firstSpan = this.network.spans[platform.spans[0]];
        // if (firstSpan.source === platformIndex) {
        //     platform.spans.reverse();
        // }
        // previous node should come first
        const midPts = [posOnSVG, posOnSVG], lens = [0, 0];
        for (let i = 0; i < 2; ++i) {
            const span = platform.spans[i];
            const neighbor = span.other(platform);
            const neighborOnSVG = this.platformsOnSVG.get(neighbor);
            lens[i] = posOnSVG.distanceTo(neighborOnSVG);
            midPts[i] = posOnSVG.add(neighborOnSVG).divideBy(2);
        }
        const midOfMidsWeighted = midPts[1]
            .subtract(midPts[0])
            .multiplyBy(lens[0] / (lens[0] + lens[1]))
            .add(midPts[0]);
        const offset = posOnSVG.subtract(midOfMidsWeighted);
        const ends = midPts.map(v => util.roundPoint(v.add(offset), 2));
        return whiskers.set(platform.spans[0], ends[0]).set(platform.spans[1], ends[1]);
    }

    private makeTransferArc(transfer: nw.Transfer, cluster: nw.Platform[]): SVGLineElement[]|SVGPathElement[] {
        const pl1 = transfer.source,
            pl2 = transfer.target;
        const pos1 = this.platformsOnSVG.get(transfer.source),
            pos2 = this.platformsOnSVG.get(transfer.target);
        const makeArc = (third: nw.Platform) => svg.makeTransferArc(pos1, pos2, this.platformsOnSVG.get(third));
        if (cluster.length === 3) {
            const third = cluster.find(p => p !== pl1 && p !== pl2);
            return makeArc(third);
        } else if (pl1 === cluster[2] && pl2 === cluster[3] || pl1 === cluster[3] && pl2 === cluster[2]) {
            return svg.makeTransferLine(pos1, pos2);
        }
        //const s = transfer.source;
        //const pl1neighbors = this.network.transfers.filter(t => t.source === s || t.target === s);
        //const pl1deg = pl1neighbors.length;
        const rarr: nw.Platform[] = [];
        for (let t of this.network.transfers) {
            if (t === transfer) continue;
            if (transfer.has(t.source)) {
                rarr.push(t.target);
            } else if (transfer.has(t.target)) {
                rarr.push(t.source);
            }
        }
        let third: nw.Platform;
        if (rarr.length === 2) {
            if (rarr[0] !== rarr[1]) throw Error("FFFFUC");
            third = rarr[0];
        } else if (rarr.length === 3) {
            third = rarr[0] === rarr[1] ? rarr[2] : rarr[0] === rarr[2] ? rarr[1] : rarr[0];
        } else {
            throw new Error("111FUUFF");
        }
        return makeArc(third);
    }

    private makePath(span: nw.Span) {
        const { routes } = span;
        let lineId: string, lineType: string, lineNum: string;
        if (routes.length > 0) {
            [lineId, lineType, lineNum] = span.routes[0].line.match(/([MEL])(\d{0,2})/);
        } else {
            console.error(span, 'span has no routes!');          
        }
        //console.log(span.source, span.target);
        const controlPoints = [
            this.platformsOnSVG.get(span.source),
            this.whiskers.get(span.source).get(span),
            this.whiskers.get(span.target).get(span),
            this.platformsOnSVG.get(span.target)
        ];
        //console.log(span, this.whiskers.get(span.target), controlPoints);
        const bezier = svg.makeCubicBezier(controlPoints);
        //bezier.id = 'op-' + spanIndex;
        if (lineType === 'E') {
            bezier.classList.add('E');
            const inner = bezier.cloneNode(true) as typeof bezier;
            //inner.id = 'ip-' + spanIndex;
            pool.outerEdgeBindings.set(span, bezier);
            pool.innerEdgeBindings.set(span, inner);
            return [bezier, inner];
        }
        if (lineId !== undefined) {
            bezier.classList.add(lineId);
        }
        if (lineType !== undefined) {
            bezier.classList.add(lineType);
        } else {
            bezier.style.stroke = 'black';
        }
        pool.outerEdgeBindings.set(span, bezier);
        return [bezier];
    }

    private addStationListeners() {
        const onMouseOut = (e: MouseEvent) => {
            this.plate.hide();
            Scale.unscaleAll();
        };
        const dummyCircles = document.getElementById('dummy-circles');
        dummyCircles.addEventListener('mouseover', e => {
            const dummy = e.target as SVGCircleElement;
            const platform = pool.dummyBindings.getKey(dummy);
            const { station } = platform;
            const names = this.map.getZoom() < this.config.detailedZoom && station.platforms.length > 1 ?
                station.getNames() :
                util.getPlatformNames(platform);
            this.highlightStation(station, names);
        });
        dummyCircles.addEventListener('mouseout', onMouseOut);
        const onTransferOver = (e: MouseEvent) => {
            const el = e.target as SVGPathElement | SVGLineElement;
            const transfer = pool.outerEdgeBindings.getKey(el) || pool.innerEdgeBindings.getKey(el);
            const names = util.getPlatformNamesZipped([transfer.source, transfer.target]);
            this.highlightStation(transfer.source.station, names);
        };
        const transfersOuter = document.getElementById('transfers-outer'),
            transfersInner = document.getElementById('transfers-inner');
        transfersOuter.addEventListener('mouseover', onTransferOver);
        transfersInner.addEventListener('mouseover', onTransferOver);
        transfersOuter.addEventListener('mouseout', onMouseOut);
        transfersInner.addEventListener('mouseout', onMouseOut);
    }

    private highlightStation(station: nw.Station, names: string[]) {
        const scaleFactor = 1.25;
        let circle: SVGCircleElement,
            platform: nw.Platform;
        if (station.platforms.length === 1) {
            platform = station.platforms[0];
            circle = pool.platformBindings.get(platform);
            Scale.scaleCircle(circle, scaleFactor, true);
        } else {
            const transfers = this.map.getZoom() < this.config.detailedZoom ? undefined : this.network.transfers;
            Scale.scaleStation(station, scaleFactor, transfers);
            platform = station.platforms.reduce((prev, cur) => prev.location.lat < cur.location.lat ? cur : prev);
            circle = pool.platformBindings.get(platform); 
        }
        this.plate.show(svg.circleOffset(circle), names);
    }

    private platformToModel(platform: nw.Platform, circles: Element[]) {
        const cached = platform.location;
        Object.defineProperty(platform, 'location', {
            get: () => platform['_location'],
            set: (location: L.LatLng) => {
                platform['_location'] = location;
                const locForPos = this.map.getZoom() < this.config.detailedZoom
                    ? platform.station.getCenter()
                    : location;
                const pos = this.overlay.latLngToSvgPoint(locForPos);
                // const nw = this.bounds.getNorthWest();
                // const pos = this.map.latLngToContainerPoint(locForPos).subtract(this.map.latLngToContainerPoint(nw));
                for (let c of circles) {
                    c.setAttribute('cx', pos.x.toString());
                    c.setAttribute('cy', pos.y.toString());
                }
                this.whiskers.set(platform, this.makeWhiskers(platform));
                this.platformsOnSVG.set(platform, pos);
                const spansToChange = new Set<nw.Span>(platform.spans);
                for (let span of platform.spans) {
                    const neighbor = span.other(platform);
                    this.whiskers.set(neighbor, this.makeWhiskers(neighbor));
                    neighbor.spans.forEach(si => spansToChange.add(si));
                }
                spansToChange.forEach(span => {
                    const controlPoints = [
                        this.platformsOnSVG.get(span.source),
                        this.whiskers.get(span.source).get(span),
                        this.whiskers.get(span.target).get(span),
                        this.platformsOnSVG.get(span.target)
                    ];
                    const outer = pool.outerEdgeBindings.get(span);
                    const inner = pool.innerEdgeBindings.get(span);
                    svg.setBezierPath(outer, controlPoints);
                    if (inner !== undefined) svg.setBezierPath(inner, controlPoints);
                });
                for (let tr of platform.transfers) {
                    tr[tr.source === platform ? 'source' : 'target'] = platform
                }
            }
        });
        platform['_location'] = cached;
    }

    private transferToModel(transfer: nw.Transfer, elements: Element[]) {
        const cached =  [transfer.source, transfer.target];
        const { tagName } = elements[0];
        ['source', 'target'].forEach((prop, pi) => {
            Object.defineProperty(transfer, prop, {
                get: () => transfer['_' + prop],
                set: (platform: nw.Platform) => {
                    transfer['_' + prop] = platform;
                    const circle = pool.platformBindings.get(platform),
                        circleBorderWidth = parseFloat(getComputedStyle(circle).strokeWidth),
                        circleTotalRadius = +circle.getAttribute('r') / 2 + circleBorderWidth;
                    const pos = this.platformsOnSVG.get(platform);
                    if (tagName === 'line') {
                        const n = pi + 1;
                        const otherPos = this.platformsOnSVG.get(transfer.other(platform));
                        for (let el of elements) {
                            el.setAttribute('x' + n, pos.x.toString());
                            el.setAttribute('y' + n, pos.y.toString());
                        }
                        const gradient = pool.gradientBindings.get(transfer);
                        const dir = prop === 'source' ? otherPos.subtract(pos) : pos.subtract(otherPos);
                        svg.Gradients.setDirection(gradient, dir);
                        const circlePortion = circleTotalRadius / pos.distanceTo(otherPos);
                        svg.Gradients.setOffset(gradient, circlePortion);
                    } else if (tagName === 'path') {
                        const transfers: nw.Transfer[] = [];
                        for (let i = 0, len = this.network.transfers.length; i < len; ++i) {
                            const t = this.network.transfers[i];
                            if (transfer.isAdjacent(t)) {
                                transfers.push(t);
                                if (transfers.length === 3) break;
                            }
                        }

                        const circular = new Set<nw.Platform>();
                        for (let tr of transfers) {
                            circular.add(tr.source).add(tr.target);
                        }

                        const circumpoints = Array.from(circular).map(i => this.platformsOnSVG.get(i));
                        circular.forEach(i => circumpoints.push(this.platformsOnSVG.get(i)));
                        const outerArcs = transfers.map(t => pool.outerEdgeBindings.get(t));
                        const innerArcs = transfers.map(t => pool.innerEdgeBindings.get(t));
                        for (let i = 0; i < 3; ++i) {
                            const tr = transfers[i],
                                outer = outerArcs[i],
                                inner = innerArcs[i];
                            var pos1 = this.platformsOnSVG.get(tr.source),
                                pos2 = this.platformsOnSVG.get(tr.target);
                            const thirdPos = circumpoints.find(pos => pos !== pos1 && pos !== pos2);
                            svg.setCircularPath(outer, pos1, pos2, thirdPos);
                            inner.setAttribute('d', outer.getAttribute('d'));
                            const gradient = pool.gradientBindings.get(tr);
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