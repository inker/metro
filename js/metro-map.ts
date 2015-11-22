import L = require('leaflet');
import * as svg from './svg';
import * as util from '../util';
import * as po from '../plain-objects';
import * as addons from './addons';
import * as graph from '../metro-graph';
import * as geo from '../geo';
import * as bind from './bind';
import MapEditor from './mapeditor';
import TextPlate from './textplate';
import ContextMenu from './contextmenu';

class MetroMap implements EventTarget {
    
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
        const fetch = window['fetch'];
        const graphPromise = fetch(kml)
            .then(graphText => graphText.json())
            .then(graphJSON => this.graph = graphJSON);
        const hintsPromise = fetch('json/hints.json')
            .then(hintsText => hintsText.json()) 
            .then(hintsJSON => this.hints = hintsJSON);
        const dataPromise = fetch('json/data.json')
            .then(dataText => dataText.json())
            .then(dataJSON => this.textData = dataJSON);
        
        this.map = new L.Map(containerId, {
            //layers: tileLayers[Object.keys(tileLayers)[0]],
            center: new L.LatLng(59.943556, 30.30452),
            zoom: L.Browser.retina ? 12 : 11,
            minZoom: 9,
            inertia: false
        }).addControl(new L.Control.Scale({ imperial: false }));
        console.log(tileLayers[Object.keys(tileLayers)[0]][0]);
        tileLayers[Object.keys(tileLayers)[0]].addTo(this.map);
        
        new addons.LayerControl(tileLayers).addTo(this.map);
        
        console.log('map should be created by now');
        this.overlay = document.getElementById('overlay');
        const container = this.map.getContainer();
        container.removeChild(this.overlay);
        container.appendChild(this.overlay);
        this.addMapListeners();
        graphPromise
            .catch(errText => alert(errText))
            .then(graphJson => this.extendBounds()) // because the previous assignment returns json
            .then(() => hintsPromise)
            .then(hintsJson => this.redrawNetwork())
            // TODO: fix the kludge making the grey area disappear
            .then(() => this.map.invalidateSize(false))
            .then(() => this.resetMapView())
            .then(() => this.fixFontRendering(this.map.getPanes().mapPane))
            .then(() => dataPromise)
            .then(() => new MapEditor(this))
            .then(() => new ContextMenu(this));
        
        Promise.all([graphPromise, hintsPromise])
            .then(results => util.verifyHints(this.graph, this.hints))
            .then(response => console.log(response))
            .catch(err => console.error(err));
        this.map.addLayer(this.fromMarker).addLayer(this.toMarker);
    }
    
    addEventListener(type: string, listener: EventListener) { }
    
    dispatchEvent(event: Event): boolean {
        if (event.type === 'clearroute') {
            this.fromMarker.setLatLng([0, 0]);
            this.toMarker.setLatLng([0, 0]);
            this.resetStyle();
            return;
        }
        this.handleMenuFromTo(event as any as MouseEvent);
        return false;
    }
    
    removeEventListener(type: string, listener: EventListener) { }
    
    private resetStyle() {
        const selector = '#paths-inner *, #paths-outer *, #transfers-inner *, #transfers-outer *, #station-circles *';
        const els = document.querySelectorAll(selector) as any as HTMLElement[];
        for (let i = 0; i < els.length; ++i) {
            els[i].style.opacity = null;
            els[i].removeAttribute('filter');
        }
    }
    
    private handleMenuFromTo(e: MouseEvent) {
        const clientPos = new L.Point(e.clientX, e.clientY);
        const rect = this.map.getContainer().getBoundingClientRect();
        const containerPos = new L.Point(rect.left, rect.top);
        const coors = this.map.containerPointToLatLng(clientPos.subtract(containerPos));
        console.log(coors);
        const marker = e.type === 'fromclick' ? this.fromMarker : this.toMarker;
        marker.setLatLng(coors);
        console.log(this.fromMarker, this.toMarker);
        const zero = new L.LatLng(0, 0);
        if (!this.fromMarker.getLatLng().equals(zero) && !this.toMarker.getLatLng().equals(zero)) {
            this.visualizeShortestPath(this.fromMarker.getLatLng(), this.toMarker.getLatLng());
        }
    }

    private addMapListeners(): void {
        const mapPane = this.map.getPanes().mapPane;
        this.map.on('movestart', e => {
            console.log('move start');
            this.map.touchZoom.disable();
            if (L.Browser.webkit) {
                svg.removeGradients();
            }
        }).on('move', e => {
            //this.overlay.style['-webkit-transition'] = mapPane.style['-webkit-transition'];
            //this.overlay.style.transition = mapPane.style.transition;
            this.overlay.style.transform = mapPane.style.transform;
        }).on('moveend', e => {
            // the secret of correct positioning is the movend transform check for corrent transform
            console.log('move ended');
            this.map.touchZoom.enable();
            //this.overlay.style['-webkit-transition'] = null;
            //this.overlay.style.transition = null;
            if (L.Browser.webkit) {
                svg.addGradients();
            }
            this.fixFontRendering(mapPane);
        }).on('zoomstart', e => {
            this.map.dragging.disable();
            console.log(e);
            //this.overlay.classList.add('leaflet-zoom-anim');
            this.overlay.style.opacity = '0.5';
        }).on('zoomend', e => {
            console.log(e);
            console.log('zoom ended');
            this.redrawNetwork();
            //this.overlay.classList.remove('leaflet-zoom-anim');
            this.overlay.style.opacity = null;
            this.map.dragging.enable();
        });

    }

    /**
     * Fixes blurry font due to 'transform3d' CSS property. Changes everything to 'transform' when the map is not moving
     * @param mapPane
     */
    private fixFontRendering(mapPane: HTMLElement): void {
        const t3d = util.parseTransform(mapPane.style.transform);
        this.overlay.style.transform = mapPane.style.transform = `translate(${t3d.x}px, ${t3d.y}px)`;
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
        let child;
        while (child = this.overlay.firstChild) {
            this.overlay.removeChild(child);
        }
        
        const defs = svg.createSVGElement('defs');
        defs.appendChild(svg.makeDropShadow());
        defs.appendChild(svg.makeShadowGlow());
        this.overlay.appendChild(defs);
        // svg element won't work because it does not have negative dimensions
        // (top-left station is partially visible)
        const origin = svg.createSVGElement('g');
        origin.id = 'origin';
        // paths-outer, paths-inner, transfers-outer, station-circles, transfers-inner, dummy-circles
        for (let groupId of ['paths-outer', 'paths-inner', 'transfers-outer', 'station-circles', 'transfers-inner', 'dummy-circles']) {
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
        const pixelBounds = new L.Bounds(this.map.latLngToContainerPoint(nw), this.map.latLngToContainerPoint(se));
        const transform = util.parseTransform(this.overlay.style.transform);

        const pixelBoundsSize = pixelBounds.getSize();
        const topLeft = pixelBounds.min.subtract(transform).subtract(pixelBoundsSize);
        this.overlay.style.left = topLeft.x + 'px';
        this.overlay.style.top = topLeft.y + 'px';
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
        this.overlay.style.width = tripleSvgBoundsSize.x + 'px';
        this.overlay.style.height = tripleSvgBoundsSize.y + 'px';
    }

    /**
     *  lineWidth = (zoom - 7) * 0.5
     *  9 - only lines (1px)
     *  10 - lines (1.5px) & roundels (2+1px)
     *  11 - lines (2px) & roundels (2+2px)
     *  12 - lines (2.5px), platforms (2+1px) & transfers (2px)
     *  ...
     */
    private redrawNetwork(): void {
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

        (document.getElementById('edit-map-button') as HTMLButtonElement).disabled = zoom < 12;

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
            [lineWidth, circleRadius, circleBorder, transferWidth] = [lineWidth, circleRadius, circleBorder, transferWidth].map(item => item * 1.5);
        }
        
        document.getElementById('station-circles').style.strokeWidth = circleBorder + 'px';
        document.getElementById('transfers-outer').style.strokeWidth = transferWidth + transferBorder / 2 + 'px';
        document.getElementById('transfers-inner').style.strokeWidth = transferWidth - transferBorder / 2 + 'px';
        document.getElementById('paths-outer').style.strokeWidth = lineWidth + 'px';
        document.getElementById('paths-inner').style.strokeWidth = lineWidth / 2 + 'px';
        
        const platformsInCircles = new Set<number>();
        const stationCircumCenters = new Map<number, L.Point>();
        
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
                                ci.classList.add(matches[1] === 'M' ? matches[0] : matches[1] + '-line');
                            }
                        }
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
                const cCenter = util.getCircumcenter(circumpoints);
                stationCircumCenters.set(stationIndex, cCenter);
            }

        }
        
        if (zoom > 11) {
            for (let transferIndex = 0; transferIndex < this.graph.transfers.length; ++transferIndex) {
                const transfer = this.graph.transfers[transferIndex];
                let paths: HTMLElement[];
                const pl1 = this.graph.platforms[transfer.source],
                    pl2 = this.graph.platforms[transfer.target];
                let pos1 = this.platformsOnSVG[transfer.source],
                    pos2 = this.platformsOnSVG[transfer.target];
                if (platformsInCircles.has(transfer.source) && platformsInCircles.has(transfer.target)) {
                    const center = stationCircumCenters.get(pl1.station);
                    paths = svg.makeTransferArc(center, pos1, pos2);
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
                const colors = [pl1, pl2].map(p => {
                    const span = this.graph.spans[p.spans[0]];
                    const routes = span.routes.map(n => this.graph.routes[n]);
                    const [lineId, lineType, lineNum] = routes[0].line.match(/([MEL])(\d{0,2})/);
                    return util.lineRules[lineType === 'L' ? lineType : lineId];
                });
                ///console.log(docFrags['station-circles'][transfer.so]);
                //const colors = [transfer.source, transfer.target].map(i => getComputedStyle(docFrags['station-circles'].childNodes[i] as Element, null).getPropertyValue('stroke'));
                const circlePortion = (circleRadius + circleBorder / 2) / pos1.distanceTo(pos2); 
                const gradient = svg.makeGradient(pos2.subtract(pos1), colors, circlePortion);
                gradient.id = 'g-' + transferIndex;
                const defs = document.getElementsByTagName('defs')[0];
                defs.appendChild(gradient);
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
            bezier.classList.add(lineType + '-line');
            return [bezier];
        }
    }

    visualizeShortestPath(departure: L.LatLng, arrival: L.LatLng) {
        this.resetStyle();
        const { platforms, path, time } = this.shortestPath(departure, arrival);
        const selector = '#paths-inner *, #paths-outer *, #transfers-inner *, #transfers-outer *, #station-circles *';
        const els = document.querySelectorAll(selector) as any as HTMLElement[];
        for (let i = 0; i < els.length; ++i) {
            //els[i].style['-webkit-filter'] = 'grayscale(1)';
            els[i].style.opacity = '0.25';
        }
        console.log(path);
        console.log(platforms.map(p => this.graph.platforms[p].name));
        const foo = (i: number) => {
            document.getElementById('p-' + platforms[i]).style.opacity = null;
            if (i >= path.length) {
                return alert('time:\n' + Math.round(time.walkTo / 60) + ' mins on foot\n' + Math.round(time.metro / 60) + ' mins by metro\n' + Math.round(time.walkFrom / 60) + ' mins on foot\nTOTAL: ' + Math.round(time.total / 60) + ' mins');
            }
            const outerOld: SVGPathElement|SVGLineElement = document.getElementById('o' + path[i]) as any;
            if (outerOld === null) {
                return foo(i + 1);
            }
            const innerOld: typeof outerOld = document.getElementById('i' + path[i]) as any;
            const outer: typeof outerOld = outerOld.cloneNode(true) as any;
            const inner: typeof outer = innerOld === null ? null : innerOld.cloneNode(true) as any;
            document.getElementById('paths-outer').appendChild(outer);
            if (inner) document.getElementById('paths-inner').appendChild(inner);
            const length = outer instanceof SVGLineElement
                ? L.point(Number(outer.x1), Number(outer.y1)).distanceTo(L.point(Number(outer.x2), Number(outer.y2)))
                : outer['getTotalLength']();

            const span = this.graph.spans[parseInt(path[i].slice(2))];
            if (span.source !== platforms[i]) {
                const points = svg.getBezierPath(outer).reverse();
                console.log(points);
                if (points.length === 4) {
                    svg.setBezierPath(outer, points);
                    if (inner) svg.setBezierPath(inner, points);
                }
            }
            const duration = length;
            outer.setAttribute('filter', 'url(#black-glow)');
            for (let p of (inner === null ? [outer] : [outer, inner])) {
                p.style.transition = null;
                p.style.strokeDasharray = length + ' ' + length;
                p.style.strokeDashoffset = length.toString();
                p.style.opacity = null;
                p.getBoundingClientRect();
                p.style.transition = `stroke-dashoffset ${duration}ms linear`;
                p.style.strokeDashoffset = '0';
            }
            setTimeout(() => {
                outerOld.style.opacity = null;
                outerOld.setAttribute('filter', 'url(#black-glow)');
                document.getElementById('paths-outer').removeChild(outer);
                if (inner) {
                    innerOld.style.opacity = null;
                    innerOld.setAttribute('filter', 'url(#black-glow)');
                    if (inner) document.getElementById('paths-inner').removeChild(inner);
                }
                foo(i + 1);
            }, duration);
            console.log(outer);
        };
        foo(0);
    }
    
    private shortestPath(p1: L.LatLng, p2: L.LatLng) {
        const objects = this.graph.platforms;
        // time to travel from station to the p1 location
        const dist: number[] = [], timesOnFoot: number[] = [];
        for (let o of objects) {
            const distance = L.LatLng.prototype.distanceTo.call(p1, o.location);
            const time = distance / (1.3 * 1.4);
            dist.push(time);
            timesOnFoot.push(L.LatLng.prototype.distanceTo.call(o.location, p2) / (1.3 * 1.4));
        }
        // pick the closest one so far
        let currentIndex = objects.indexOf(geo.findClosestObject(p1, objects));
        const objectSet = new Set<number>(objects.map((o, i) => i)),
            prev = objects.map(i => null);
        // time on foot between locations
        const onFoot =  L.LatLng.prototype.distanceTo.call(p1, p2) / (1.3 * 1.4);
        while (objectSet.size > 0) {
            var minDist = Infinity;
            objectSet.forEach(i => {
                if (dist[i] < minDist) {
                    currentIndex = i;
                    minDist = dist[i];
                }
            });
            const currentNode = objects[currentIndex];
            objectSet.delete(currentIndex);
            //console.log('current:', currentIndex, currentNode.name);
            const neighborIndices: number[] = [],
                neighbors: po.Platform[] = [],
                times: number[] = [];
            for (let i of currentNode.spans) {
                const s = this.graph.spans[i];
                const neighborIndex = currentIndex === s.source ? s.target : s.source;
                if (!objectSet.has(neighborIndex)) continue;
                const neighbor = objects[neighborIndex];
                neighborIndices.push(neighborIndex);
                neighbors.push(neighbor);
                const distance = L.LatLng.prototype.distanceTo.call(currentNode.location, neighbor.location);
                // TODO: lower priority for E-lines
                const callTime = this.graph.routes[s.routes[0]].line.startsWith('E') ? 90 : 45;
                times.push(util.timeToTravel(distance, 18, 1.4) + callTime);
            }
            // pain in the ass
            const transferIndices = this.graph.transfers
                .map((t, i) => i)
                .filter(t => this.graph.transfers[t].source === currentIndex || this.graph.transfers[t].target === currentIndex);
            for (let i of transferIndices) {
                // TODO: make ALL platforms from the junction visible, not just the neighbors
                // TODO: if transferring to an E-line, wait more
                const t = this.graph.transfers[i];
                const neighborIndex = currentIndex === t.source ? t.target : t.source;
                if (!objectSet.has(neighborIndex)) continue;
                const neighbor = objects[neighborIndex];
                neighborIndices.push(neighborIndex);
                neighbors.push(neighbor);
                const distance = L.LatLng.prototype.distanceTo.call(currentNode.location, neighbor.location);
                times.push(distance / (1.3 * 1.4) + 60); // variable time depending on the transfer's length
            }
            //console.log('neighbors: ', neighborIndices);
            for (let i = 0; i < neighborIndices.length; ++i) {
                const neighborIndex = neighborIndices[i],
                    alt = dist[currentIndex] + times[i];
                if (alt < dist[neighborIndex]) {
                    dist[neighborIndex] = alt;
                    prev[neighborIndex] = currentIndex;
                }
            }
            const alt = dist[currentIndex] + timesOnFoot[currentIndex];
        }
        // find the shortest time & the exit station
        let shortestTime = Infinity;
        for (let i = 0; i < dist.length; ++i) {
            const alt = dist[i] + timesOnFoot[i];
            if (alt < shortestTime) {
                shortestTime = alt;
                currentIndex = i;
            }
        }
        // if walking on foot is faster, then why take the underground?
        if (onFoot < shortestTime) {
            alert('walk on foot, lazybag');
            throw new Error('on foot!');
        }
        const path: string[] = [],
            platformPath = [currentIndex];
        console.log('making path');
        console.log(prev);
        // remove later
        let euristics = 0;
        while (true) {
            const currentNode = objects[currentIndex];
            console.log('current', currentNode.name);
            const prevIndex = prev[currentIndex];
            if (prevIndex === null) break;
            //console.log('prev', objects[prevIndex].name);
            let p = '';
            for (let i of currentNode.spans) {
                const s = this.graph.spans[i];
                if (s.source === currentIndex && s.target === prevIndex || s.target === currentIndex && s.source === prevIndex) {
                    p = 'p-' + i;
                    break;
                }
            }
            if (p === '') {
                for (let i = 0; i < this.graph.transfers.length; ++i) {
                    const t = this.graph.transfers[i];
                    if (t.source === currentIndex && t.target === prevIndex || t.target === currentIndex && t.source === prevIndex) {
                        p = 't-' + i;
                        break;
                    }
                }
            }
            path.push(p);
            platformPath.push(prevIndex);
            if (++euristics > objects.length) throw new Error('overflow!');
            currentIndex = prevIndex;
        }
        console.log('returning');
        platformPath.reverse();
        path.reverse();
        const walkFromTime = timesOnFoot[platformPath[platformPath.length - 1]];
        const walkToTime = dist[platformPath[0]];
        const metroTime = shortestTime - walkFromTime - walkToTime;
        return {
            platforms: platformPath,
            path: path,
            time: {
                walkTo: walkToTime,
                metro: metroTime,
                walkFrom: walkFromTime,
                total: shortestTime
            }
        };
    }
}

export default MetroMap;