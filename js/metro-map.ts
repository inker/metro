import L = require('leaflet');
import svg = require('./svg');
import util = require('../util');
import po = require('../plain-objects');
import addons = require('./addons');
import graph = require('../metro-graph');

//import 'leaflet';
//import * as svg from './svg';
//import * as util from '../../util';
//import Plain from './plain-objects';

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
        const circleBorder = circleRadius * 0.4;
        const transferWidth = lineWidth;
        
        let platformsInCircles: number[] = [];
        
        for (let stationIndex = 0; stationIndex < this.graph.stations.length; ++stationIndex) {
            let station = this.graph.stations[stationIndex];
            let circular = util.findCircle(this.graph, station);
            let circumpoints: L.Point[] = [];
            station.platforms.forEach(platformIndex => {
                const platform = this.graph.platforms[platformIndex];
                const posOnSVG = platformsOnSVG[platformIndex];
                
                if (zoom > 9) {
                    let ci = svg.makeCircle(posOnSVG, circleRadius);
                    svg.convertToStation(ci, 'p-' + platformIndex, platform, circleBorder);
                    let englishName = this.hints.englishNames[platform.name];
                    if (englishName) {
                        util.setSVGDataset(ci, { en: englishName });
                    }
                    ci.setAttribute('data-station', stationIndex.toString());
                    
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
                        let neighbor = this.graph.platforms[neighborNum];
                        let neighborOnSVG = platformsOnSVG[neighborNum];
                        lens[i] = posOnSVG.distanceTo(neighborOnSVG);
                        midPts[i] = posOnSVG.add(neighborOnSVG).divideBy(2);
                    }
                    let mdiff = midPts[1].subtract(midPts[0]).multiplyBy(lens[0] / (lens[0] + lens[1]));
                    let mm = midPts[0].add(mdiff);
                    let diff = posOnSVG.subtract(mm);
                    let whisker = {};
                    whisker[platform.spans[0]] = midPts[0].add(diff);
                    whisker[platform.spans[1]] = midPts[1].add(diff);
                    whiskers[platformIndex] = whisker;
                    //whiskers[platformIndex] = midPts.map(midPt => midPt.add(diff));
                } else if (platform.spans.length > 2) {
                    let nexts: L.Point[] = [],
                        prevs: L.Point[] = [];
                    let nextSpans: number[] = [],
                        prevSpans: number[] = [];
                    let dirHints = this.hints.crossPlatform;
                    let span = this.graph.spans[platform.spans[0]];
                    let line = this.graph.routes[span.routes[0]].line;
                    if (platform.name in dirHints 
                        && line in dirHints[platform.name] 
                        //&& Object.keys(dirHints[platform.name]).indexOf('E') < 0
                    ) {
                        let platformHints = dirHints[platform.name];
                        let nextPlatformNames: string[] = [];
                        Object.keys(platformHints).forEach(key => {
                            let val = platformHints[key];
                            if (typeof val === 'string') {
                                nextPlatformNames.push(val);
                            } else {
                                val.forEach(i => nextPlatformNames.push(i));
                            }
                        });
                        for (let i = 0; i < platform.spans.length; ++i) {
                            let span = this.graph.spans[platform.spans[i]];
                            let neighborIndex = span.source === platformIndex ? span.target : span.source;
                            let neighbor = this.graph.platforms[neighborIndex];
                            let neighborPos = platformsOnSVG[neighborIndex];
                            if (nextPlatformNames.indexOf(neighbor.name) > -1) {
                                nexts.push(neighborPos);
                                nextSpans.push(platform.spans[i]);
                            } else {
                                prevs.push(neighborPos);
                                prevSpans.push(platform.spans[i]);
                            }
                        }
                    } else {
                        console.log('this place is left for compatibility: ');
                        console.log(span.routes.map(rtIdx => this.graph.routes[rtIdx]));
                        console.log([span.source, span.target].map(plIdx => this.graph.platforms[plIdx].name));
                        
                        for (let i = 0; i < platform.spans.length; ++i) {
                            let span = this.graph.spans[platform.spans[i]];
                            if (span.source === platformIndex) {
                                let neighbor = this.graph.platforms[span.target];
                                let neighborPos = platformsOnSVG[span.target];
                                nexts.push(neighborPos);
                                nextSpans.push(platform.spans[i]);
                            } else {
                                let neighbor = this.graph.platforms[span.source];
                                let neighborPos = platformsOnSVG[span.source];
                                prevs.push(neighborPos);
                                prevSpans.push(platform.spans[i]);
                            }
                            //(span.source === platformNum ? nextNeighbors : prevNeighbors).push(span);
                        }
                    }
                    const prev = (prevs.length === 1) ? prevs[0] : util.getCenter(prevs),
                        next = (nexts.length === 1) ? nexts[0] : util.getCenter(nexts);
                    const distToPrev = posOnSVG.distanceTo(prev),
                        distToNext = posOnSVG.distanceTo(next);
                    const midPtPrev = posOnSVG.add(prev).divideBy(2),
                        midPtNext = posOnSVG.add(next).divideBy(2);
                    const mdiff = midPtNext.subtract(midPtPrev).multiplyBy(distToPrev / (distToPrev + distToNext));
                    const mm = midPtPrev.add(mdiff);
                    const diff = posOnSVG.subtract(mm);
                    let whisker = {};
                    prevSpans.forEach(spanIndex => whisker[spanIndex] = midPtPrev.add(diff));
                    nextSpans.forEach(spanIndex => whisker[spanIndex] = midPtNext.add(diff));
                    whiskers[platformIndex] = whisker;
                    //whiskers[platformIndex] = [midPtPrev.add(diff), midPtNext.add(diff)];
                } else {
                    //whiskers[platformIndex] = [posOnSVG, posOnSVG];
                    let whisker = {};
                    whisker[platform.spans[0]] = posOnSVG;
                    whiskers[platformIndex] = whisker;
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
            const srcN = span.source,
                trgN = span.target;
            const src = this.graph.platforms[srcN],
                trg = this.graph.platforms[trgN];
            let bezier = svg.makeCubicBezier([platformsOnSVG[srcN], whiskers[srcN][i], whiskers[trgN][i], platformsOnSVG[trgN]]);
            let routes = span.routes.map(n => this.graph.routes[n]);
            let matches = routes[0].line.match(/[MEL](\d{1,2})/);
            bezier.style.strokeWidth = lineWidth.toString();
            if (matches) {
                bezier.classList.add(matches[0]);
            }
            bezier.classList.add(routes[0].line.charAt(0) + '-line');
            docFrags['paths'].appendChild(bezier);
        }
        
        Object.keys(docFrags).forEach(i => document.getElementById(i).appendChild(docFrags[i]));
        //this.resetView();

    }
}

export = MetroMap;
//export default MetroMap;