import L = require('leaflet');
import * as svg from './svg';
import * as util from '../util';
import * as po from '../plain-objects';
import * as addons from './addons';
import * as graph from '../metro-graph';
import * as geo from '../geo';
import TextPlate from './textplate';

class MetroMap {
    private map: L.Map;
    private overlay: HTMLElement;
    private graph: po.Graph;
    private bounds: L.LatLngBounds;
    private hints: po.Hints;
    private textData: {};
    
    private whiskers = [];
    private platformsOnSVG: L.Point[];
    
    private plate: TextPlate;
    
    getMap(): L.Map {
        return this.map;
    }

    getOverlay(): HTMLElement {
        return this.overlay;
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
            .then(() => document.getElementById('edit-map-button').addEventListener('click', this.editMapClick.bind(this)));
        
        Promise.all([graphPromise, hintsPromise])
            .then(results => util.verifyHints(this.graph, this.hints))
            .then(response => console.log(response))
            .catch(err => console.error(err));
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
            this.bindPlatformModel(i, [circle, dummyCircle]);
        }
    }
    
    private bindPlatformModel(platform: po.Platform|number, circles: Element[]) {
        const [idx, obj] = typeof platform === 'number' 
            ? [platform, this.graph.platforms[platform]]
            : [this.graph.platforms.indexOf(platform), platform];
        const cached = obj.location;
        Object.defineProperty(obj, 'location', {
            get: () => obj['_location'],
            set: (location: L.LatLng) => {
                obj['_location'] = location;
                const locForPos = this.map.getZoom() < 12
                    ? this.graph.stations[obj.station].location
                    : location;
                const pos = this.map.latLngToContainerPoint(locForPos).subtract(this.map.latLngToContainerPoint(this.bounds.getNorthWest()));
                for (let c of circles) {
                    c.setAttribute('cx', pos.x.toString());
                    c.setAttribute('cy', pos.y.toString());
                }
                this.whiskers[idx] = this.makeWhiskers(idx);
                this.platformsOnSVG[idx] = pos;
                const spansToChange = new Set<number>(obj.spans);
                for (let spanIndex of obj.spans) {
                    const span = this.graph.spans[spanIndex];
                    const srcN = span.source, trgN = span.target;
                    const neighborIndex = idx === srcN ? trgN : srcN;
                    this.whiskers[neighborIndex] = this.makeWhiskers(neighborIndex);
                    this.graph.platforms[neighborIndex].spans.forEach(si => spansToChange.add(si));
                }
                spansToChange.forEach(spanIndex => {
                    const span = this.graph.spans[spanIndex];
                    const srcN = span.source, trgN = span.target;
                    const controlPoints = [this.platformsOnSVG[srcN], this.whiskers[srcN][spanIndex], this.whiskers[trgN][spanIndex], this.platformsOnSVG[trgN]];
                    svg.setBezierPath(document.getElementById(`op-${spanIndex}`), controlPoints);
                    const inner = document.getElementById(`ip-${spanIndex}`);
                    if (inner) svg.setBezierPath(inner, controlPoints);
                });
                this.graph.transfers
                    .filter(tr => tr.source === idx || tr.target === idx)
                    .forEach(tr => tr[idx === tr.source ? 'source' : 'target'] = idx);
            }
        });
        obj['_location'] = cached;
    }
    
    private bindTransferModel(transfer: po.Transfer, elements: Element[]) {
        const cached =  [transfer.source, transfer.target];
        const props = ['source', 'target'];
        props.forEach((prop, pi) => {
            Object.defineProperty(transfer, prop, {
                get: () => transfer['_' + prop],
                set: (platformIndex: number) => {
                    if (elements[0].tagName === 'line') {
                        const circle = document.getElementById('p-' + platformIndex);
                        const n = pi + 1;
                        const x = circle.getAttribute('cx'),
                            y = circle.getAttribute('cy');
                        for (let el of elements) {
                            el.setAttribute('x' + n, x);
                            el.setAttribute('y' + n, y);
                        }
                    } else if (elements[0].tagName === 'path') {
                        const transfers: po.Transfer[] = [];
                        const transferIndices: number[] = [];
                        for (let i = 0; i < this.graph.transfers.length; ++i) {
                            const t = this.graph.transfers[i];
                            if (t.source === transfer.source
                                || t.target === transfer.target
                                || t.source === transfer.target
                                || t.target === transfer.source
                            ) {
                                transfers.push(t);
                                transferIndices.push(i);
                                if (transfers.length === 3) break;
                            }
                        }
                        const circular = new Set<number>();
                        for (let tr of transfers) {
                            circular.add(tr.source).add(tr.target);
                        }
                        if (circular.size !== 3) {
                            const name = this.graph.platforms[transfers[0].source].name;
                            throw new Error(`circle size is ${circular.size}: ${name}`);
                        }
                        
                        const circumpoints: L.Point[] = [];
                        circular.forEach(i => circumpoints.push(this.platformsOnSVG[i]));
                        
                        const cCenter = util.getCircumcenter(circumpoints);
                        const outerArcs = transferIndices.map(i => document.getElementById('ot-' + i));
                        const innerArcs = transferIndices.map(i => document.getElementById('it-' + i));
                        for (let i = 0; i < 3; ++i) {
                            const tr = transfers[i],
                                outer = outerArcs[i],
                                inner = innerArcs[i],
                                pos1 = this.platformsOnSVG[tr.source],
                                pos2 = this.platformsOnSVG[tr.target];
                            svg.setCircularPath(outer, cCenter, pos1, pos2);
                            inner.setAttribute('d', outer.getAttribute('d'));
                            const gradient = document.getElementById(`g-${transferIndices[i]}`);
                            svg.setGradientDirection(gradient, pos2.subtract(pos1));
                        }
                    } else {
                        throw new Error('wrong element type for transfer');
                    }
                }
            });
            transfer['_' + prop] = cached[pi];
        });
    }
    
    private editMapClick(event: MouseEvent) {
        // change station name (change -> model (platform))
        // drag station to new location (drag -> model (platform, spans) -> paths, )
        // create new station (create -> model)
        // drag line over the station to bind them
        
        const button: HTMLButtonElement = event.target as any;
        const textState = ['Edit Map', 'Save Map'];
        const dummyCircles = document.getElementById('dummy-circles');
        if (button.textContent === textState[0]) {
            dummyCircles.onmousedown = de => {
                if (de.button === 0) {
                    const platform = svg.platformByCircle(de.target as any, this.graph);
                    //const initialLocation = platform.location; // TODO: Ctrl+Z
                    this.map.dragging.disable();
                    this.map.on('mousemove', le => {
                        platform.location = (le as L.LeafletMouseEvent).latlng;
                        this.plate.disabled = true;
                    });
                    this.map.once('mouseup', le => {
                        this.map.off('mousemove').dragging.enable();
                        this.plate.disabled = false;
                        this.plate.show(svg.circleByDummy((le as L.LeafletMouseEvent).originalEvent.target as any));
                    });
                } else if (de.button === 1) {
                    const platform = svg.platformByCircle(de.target as any, this.graph);
                    const ru = platform.name,
                        fi = platform.altNames['fi'],
                        en = platform.altNames['en'];
                    this.plate.show(svg.circleByDummy(de.target as any));
                    const names = en ? [ru, fi, en] : fi ? [ru, fi] : [ru];
                    [platform.name, platform.altNames['fi'], platform.altNames['en']] = prompt('New name', names.join('|')).split('|');
                } else {
                    // open context menu maybe?
                }
            };
            button.textContent = textState[1];
        } else if (button.textContent === textState[1]) {
            const content = JSON.stringify(this.graph, (key, val) => key.startsWith('_') ? undefined : val);
            util.downloadAsFile('graph.json', content);
            dummyCircles.onmousedown = dummyCircles.onclick = null;
            button.textContent = textState[0];
        } else {
            throw new Error('Incorrect button text');
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

                const gradient = svg.makeGradient(pos2.subtract(pos1), colors);
                gradient.id = 'g-' + transferIndex;
                const defs = document.getElementsByTagName('defs')[0];
                defs.appendChild(gradient);
                paths[0].style.stroke = `url(#${gradient.id})`;
                docFrags['transfers-outer'].appendChild(paths[0]);
                docFrags['transfers-inner'].appendChild(paths[1]);
                this.bindTransferModel(transfer, paths);
                
            }
        }

        for (let i = 0; i < this.graph.spans.length; ++i) {
            const [outer, inner] = this.makePath(i, lineWidth);
            docFrags['paths-outer'].appendChild(outer);
            if (inner) {
                docFrags['paths-inner'].appendChild(inner);
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
    
    private makePath(spanIndex: number, lineWidth: number) {
        const span = this.graph.spans[spanIndex];
        const srcN = span.source, trgN = span.target;
        const routes = span.routes.map(n => this.graph.routes[n]);
        const [lineId, lineType, lineNum] = routes[0].line.match(/([MEL])(\d{0,2})/);
        const bezier = svg.makeCubicBezier([this.platformsOnSVG[srcN], this.whiskers[srcN][spanIndex], this.whiskers[trgN][spanIndex], this.platformsOnSVG[trgN]]);
        bezier.id = 'op-' + spanIndex;
        if (lineType === 'E') {
            bezier.classList.add('E');
            const inner: typeof bezier = bezier.cloneNode(true) as any;
            inner.id = 'ip-' + spanIndex;
            bezier.style.strokeWidth = lineWidth + 'px';
            inner.style.strokeWidth = lineWidth / 2+ 'px';
            return [bezier, inner];
        } else {
            bezier.style.strokeWidth = lineWidth + 'px';
            if (lineId) {
                bezier.classList.add(lineId);
            }
            bezier.classList.add(lineType + '-line');
            if (lineType === 'L') {
                bezier.style.strokeWidth = lineWidth * 0.75 + 'px';
            }
            return [bezier];
        }
    }
}

export default MetroMap;