import L = require('leaflet');
import * as svg from './svg';
import * as util from '../util';
import * as po from '../plain-objects';
import * as addons from './addons';
import * as graph from '../metro-graph';

class MetroMap {
    private map: L.Map;
    private overlay: HTMLElement;
    private graph: po.Graph;
    private bounds: L.LatLngBounds;
    private hints: po.Hints;
    private textData: {};
    
    getMap(): L.Map {
        return this.map;
    }

    getOverlay(): HTMLElement {
        return this.overlay;
    }

    constructor(containerId: string, kml: string, tileLayers: {}) {
        const fetch = window['fetch'];
        let graphPromise = fetch(kml)
            .then(graphText => graphText.json())
            .then(graphJSON => this.graph = graphJSON);
        let hintsPromise = fetch('json/hints.json')
            .then(hintsText => hintsText.json())
            .then(hintsJSON => this.hints = hintsJSON);
        let dataPromise = fetch('json/data.json')
            .then(dataText => dataText.json())
            .then(dataJSON => this.textData = dataJSON);
        
        this.map = new L.Map(containerId, {
            layers: tileLayers[Object.keys(tileLayers)[0]],
            center: new L.LatLng(59.943556, 30.30452),
            zoom: 11,
            minZoom: 9,
            inertia: false
        }).addControl(new L.Control.Scale({ imperial: false }));
        new addons.LayerControl(tileLayers)
            .addTo(this.map);
        
        console.log('map should be created by now');
        this.overlay = document.getElementById('overlay');
        this.addMapListeners();
        graphPromise
            .catch(errText => alert(errText))
            .then(graphJson => this.extendBounds()) // because the previous assignment returns json
            .then(() => hintsPromise)
            .then(hintsJson => this.redrawNetwork())
            // TODO: fix the kludge making the grey area disappear
            .then(() => this.map.invalidateSize(false))
            .then(() => this.fixFontRendering(this.map.getPanes().mapPane))
            .then(() => dataPromise);
        
        Promise.all([graphPromise, hintsPromise])
            .then(results => util.verifyHints(this.graph, this.hints))
            .then(response => console.log(response));
    }

    private addMapListeners(): void {
        let mapPane = this.map.getPanes().mapPane;
        this.map.on('movestart', e => this.map.touchZoom.disable());
        this.map.on('move', e => {
            //this.overlay.style['-webkit-transition'] = mapPane.style['-webkit-transition'];
            //this.overlay.style.transition = mapPane.style.transition;
            this.overlay.style.transform = mapPane.style.transform
        });
        
        // the secret of correct positioning is the movend transform check for corrent transform
        this.map.on('moveend', e => {
            console.log('move ended');
            this.map.touchZoom.enable();
            //this.overlay.style['-webkit-transition'] = null;
            //this.overlay.style.transition = null;
            this.fixFontRendering(mapPane);
        });
        this.map.on('zoomstart', e => {
            this.map.dragging.disable();
            //this.overlay.classList.add('leaflet-zoom-anim');
            this.overlay.style.opacity = '0.5';
        });
        this.map.on('zoomend', e => {
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
        let t3d = util.parseTransform(mapPane.style.transform);
        this.overlay.style.transform = mapPane.style.transform = `translate(${t3d.x}px, ${t3d.y}px)`;
    }

    private resetMapView(): void {
        //this.map.addLayer(L.circle(L.LatLng(60, 30), 10));
        //this.overlay = <HTMLElement>this.map.getPanes().overlayPane.children[0];
        this.map.setView(this.bounds.getCenter(), 11, {
            pan: { animate: false },
            zoom: { animate: false }
        });
    }

    private resetOverlayStructure(): void {
        let child;
        while (child = this.overlay.firstChild) {
            this.overlay.removeChild(child);
        }
        
        let defs = svg.createSVGElement('defs');
        defs.id = 'defs';
        defs.appendChild(svg.makeDropShadow());
        this.overlay.appendChild(defs);
        // svg element won't work because it does not have negative dimensions
        // (top-left station is partially visible)
        let origin = svg.createSVGElement('g');
        origin.id = 'origin';
        ['paths', 'transfers', 'station-circles', 'dummy-circles'].forEach(groupId => {
            let group = svg.createSVGElement('g');
            group.id = groupId;
            origin.appendChild(group);
        });
        this.overlay.appendChild(origin);
        let stationCircles = document.getElementById('station-circles');
        stationCircles.classList.add('station-circle');
        origin.insertBefore(svg.makePlate(), stationCircles.nextElementSibling);
    }


    private extendBounds(): void {
        let a = this.graph.platforms[0].location;
        this.bounds = new L.LatLngBounds(a, a);
        this.graph.platforms.forEach(platform => this.bounds.extend(platform.location));
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
        let origin = document.getElementById('origin');
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
        
        let docFrags = {
            'station-circles': document.createDocumentFragment(),
            'dummy-circles': document.createDocumentFragment(),
            'transfers': document.createDocumentFragment(),
            'paths': document.createDocumentFragment(),
        };
        
        let stationPlate = document.getElementById('station-plate');

        let whiskers = new Array<{}>(this.graph.platforms.length);

        const zoom = this.map.getZoom();
        const nw = this.bounds.getNorthWest();
        const se = this.bounds.getSouthEast();
        const svgBounds = new L.Bounds(this.map.latLngToContainerPoint(nw), this.map.latLngToContainerPoint(se));
        let posTransform = zoom < 12
            ? platform => this.posOnSVG(svgBounds, this.graph.stations[platform.station].location)
            : platform => this.posOnSVG(svgBounds, platform.location);
        let platformsOnSVG = this.graph.platforms.map(posTransform);

        const lineWidth = (zoom - 7) * 0.5;
        const circleRadius = zoom < 12 ? lineWidth * 1.25 : lineWidth;
        const circleBorder = zoom < 12 ? circleRadius * 0.4 : circleRadius * 0.5;
        const transferWidth = lineWidth;
        
        document.getElementById('station-circles').style.strokeWidth = circleBorder + 'px';
        
        let platformsInCircles: number[] = [];
        
        for (var stationIndex = 0; stationIndex < this.graph.stations.length; ++stationIndex) {
            const station = this.graph.stations[stationIndex];
            var circular = util.findCircle(this.graph, station);
            var circumpoints: L.Point[] = [];
            station.platforms.forEach(platformIndex => {
                const platform = this.graph.platforms[platformIndex];
                const posOnSVG = platformsOnSVG[platformIndex];
                
                if (zoom > 9) {
                    let ci = svg.makeCircle(posOnSVG, circleRadius);
                    ci.id = 'p-' + platformIndex;
                    util.setSVGDataset(ci, {
                        station: stationIndex,
                        lat: platform.location.lat,
                        lng: platform.location.lng,
                        ru: platform.name,
                        fi: platform.altNames['fi'],
                    });
                    const en = this.hints.englishNames[platform.name];
                    if (en) {
                        util.setSVGDataset(ci, { en: en });
                    }
                    if (zoom > 11) {
                        let lines: string[] = [];
                        platform.spans.forEach(i => this.graph.spans[i].routes.forEach(ri => lines.push(this.graph.routes[ri].line)));
                        if (lines.length > 0 && lines.every(line => line === lines[0])) {
                            const matches = lines[0].match(/([MEL])(\d{0,2})/);
                            if (matches) {
                                ci.classList.add(matches[1] === 'M' ? matches[0] : matches[1] + '-line');
                            }
                        }
                    }
                    
                    let dummyCircle = svg.makeCircle(posOnSVG, circleRadius * 2);
                    dummyCircle.classList.add('invisible-circle');
                    dummyCircle.setAttribute('data-platformId', ci.id);
                    dummyCircle.onmouseover = svg.showPlate;
                    dummyCircle.onmouseout = e => stationPlate.style.display = 'none';
                    
                    docFrags['station-circles'].appendChild(ci);
                    docFrags['dummy-circles'].appendChild(dummyCircle);
                }
                
                // control points
                if (platform.spans.length === 2) {
                    let lines = platform.spans.map(i => this.graph.routes[this.graph.spans[i].routes[0]].line);
                    // TODO: refactor this stuff, unify 2-span & >2-span platforms
                    if (lines[0] !== lines[1]) {
                        whiskers[platformIndex] = {
                            [platform.spans[0]]: posOnSVG,
                            [platform.spans[1]]: posOnSVG
                        };
                    } else {
                        let midPts = [posOnSVG, posOnSVG];
                        let lens = [0, 0];
                        let firstSpan = this.graph.spans[platform.spans[0]];
                        if (firstSpan.source === platformIndex) {
                            platform.spans.reverse();
                        }
                        // previous node should come first
                        for (let i = 0; i < 2; ++i) {
                            let span = this.graph.spans[platform.spans[i]];
                            let neighborNum = (span.source === platformIndex) ? span.target : span.source;
                            let neighborOnSVG = platformsOnSVG[neighborNum];
                            lens[i] = posOnSVG.distanceTo(neighborOnSVG);
                            midPts[i] = posOnSVG.add(neighborOnSVG).divideBy(2);
                        }
                        const mdiff = midPts[1].subtract(midPts[0]).multiplyBy(lens[0] / (lens[0] + lens[1]));
                        const mm = midPts[0].add(mdiff);
                        const diff = posOnSVG.subtract(mm);
                        whiskers[platformIndex] = {
                            [platform.spans[0]]: midPts[0].add(diff),
                            [platform.spans[1]]: midPts[1].add(diff)
                        };
                    }
                } else if (platform.spans.length > 2) {
                    // 0 - prev, 1 - next
                    let points: L.Point[][] = [[], []]; 
                    let spanIds: number[][] = [[], []];
                    
                    const dirHints = this.hints.crossPlatform;
                    const idx = util.hintContainsLine(this.graph, dirHints, platform);
                    if (platform.name in dirHints && idx !== null) {
                        // array or object
                        const platformHints = idx > -1 ? dirHints[platform.name][idx] : dirHints[platform.name];
                        let nextPlatformNames: string[] = [];
                        Object.keys(platformHints).forEach(key => {
                            const val = platformHints[key];
                            if (typeof val === 'string') {
                                nextPlatformNames.push(val);
                            } else {
                                val.forEach(i => nextPlatformNames.push(i));
                            }
                        });
                        for (let i = 0; i < platform.spans.length; ++i) {
                            const span = this.graph.spans[platform.spans[i]];
                            const neighborIndex = span.source === platformIndex ? span.target : span.source;
                            const neighbor = this.graph.platforms[neighborIndex];
                            const neighborPos = platformsOnSVG[neighborIndex];
                            const dirIdx = nextPlatformNames.indexOf(neighbor.name) > -1 ? 1 : 0;
                            points[dirIdx].push(neighborPos);
                            spanIds[dirIdx].push(platform.spans[i]);
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
                    let whisker = {};
                    spanIds[0].forEach(spanIndex => whisker[spanIndex] = midPts[0].add(diff));
                    spanIds[1].forEach(spanIndex => whisker[spanIndex] = midPts[1].add(diff));
                    whiskers[platformIndex] = whisker;
                } else {
                    whiskers[platformIndex] = {
                        [platform.spans[0]]: posOnSVG
                    };
                }
                
                if (circular && circular.indexOf(platform) > -1) {
                    circumpoints.push(posOnSVG);
                    platformsInCircles.push(platformIndex);
                }

            });
            if (zoom > 11 && circular) {
                const cCenter = util.getCircumcenter(circumpoints);
                const cRadius = cCenter.distanceTo(circumpoints[0]);
                const cCircle = svg.makeTransferRing(cCenter, cRadius, transferWidth, circleBorder);
                docFrags['transfers'].appendChild(cCircle);
            }
        }
        
        if (zoom > 11) {
            this.graph.transfers.forEach(tr => {
                if (platformsInCircles.indexOf(tr.source) > -1 && platformsInCircles.indexOf(tr.target) > -1) return;
                const pl1 = this.graph.platforms[tr.source],
                    pl2 = this.graph.platforms[tr.target];
                const transferPos = [this.posOnSVG(svgBounds, pl1.location), this.posOnSVG(svgBounds, pl2.location)];
                const transfer = svg.makeTransfer(transferPos[0], transferPos[1], transferWidth, circleBorder);
                docFrags['transfers'].appendChild(transfer);
            });
        }

        for (let i = 0; i < this.graph.spans.length; ++i) {
            const span = this.graph.spans[i];
            const srcN = span.source, trgN = span.target;
            const routes = span.routes.map(n => this.graph.routes[n]);
            const matches = routes[0].line.match(/([MEL])(\d{0,2})/);
            let bezier: HTMLElement;
            if (matches[1] === 'E') {
                let inner = svg.makeCubicBezier([platformsOnSVG[srcN], whiskers[srcN][i], whiskers[trgN][i], platformsOnSVG[trgN]]);
                let outer: typeof inner = <any>inner.cloneNode(true);
                outer.style.strokeWidth = lineWidth + 'px';
                inner.style.strokeWidth = lineWidth / 2 + 'px';
                bezier = svg.createSVGElement('g');
                bezier.classList.add('E');
                bezier.appendChild(outer);
                bezier.appendChild(inner);
            } else {
                bezier = svg.makeCubicBezier([platformsOnSVG[srcN], whiskers[srcN][i], whiskers[trgN][i], platformsOnSVG[trgN]]);
                bezier.style.strokeWidth = lineWidth.toString();
                if (matches) {
                    bezier.classList.add(matches[0]);
                }
                bezier.classList.add(matches[1] + '-line');
                if (matches[1] === 'L') {
                    bezier.style.strokeWidth = lineWidth * 0.75 + 'px';
                }
            }
            util.setSVGDataset(bezier, {
                source: span.source,
                target: span.target
            });
            docFrags['paths'].appendChild(bezier);

        }
        
        Object.keys(docFrags).forEach(i => document.getElementById(i).appendChild(docFrags[i]));
        //this.resetView();

    }
}

//export = MetroMap;
export default MetroMap;