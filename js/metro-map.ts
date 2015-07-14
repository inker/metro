import L = require('leaflet');
import svg = require('./svg');
import util = require('./util');
import po = require('../plain-objects');
import addons = require('./addons');

//import 'leaflet';
//import * as svg from './svg';
//import * as util from '../../util';
//import Plain from './plain-objects';

type Neighbor = {
    platform: L.Point;
    midPt: L.Point;
};

class MetroMap {
    private map: L.Map;
    private overlay: HTMLElement;
    private graph: po.Graph;
    private bounds: L.LatLngBounds;
    
    getMap(): L.Map {
        return this.map;
    }
    
    getOverlay(): HTMLElement {
        return this.overlay;
    }

    constructor(containerId: string, kml: string, tileLayers: L.TileLayer[]) {
        let graphPromise = this.fetchGraph(kml);
        this.map = new L.Map(containerId, { inertia: false })
            .addLayer(tileLayers[0])
            .setView(new L.LatLng(60, 30), 11)
            .addControl(new L.Control.Scale({ imperial: false }));
        
        let layers = {};
        for (let i = 0; i < tileLayers.length; ++i) {
            layers['Layer ' + i] = tileLayers[i];
        }
        new addons.LayerControl(this, layers);

        //L.Control['measureControl']().addTo(this.map);

        console.log('map should be created by now');
        this.addOverlay();
        //this.refillSVG(); not required here
        this.addListeners();
        graphPromise.then(text => this.handleJSON(text))
            .then(() => this.redrawNetwork())
            .catch(text => alert(text))
    }
    
    private addOverlay(): void {
        //this.map.getPanes().mapPane.innerHTML = '<svg id="overlay"></svg>' + this.map.getPanes().mapPane.innerHTML;
        this.overlay = document.getElementById('overlay');
        this.overlay.id = 'overlay';
        this.overlay.style.fill = 'white';
        this.overlay.style.zIndex = '10';
    }

    private addListeners(): void {
        let mapPane = this.map.getPanes().mapPane;
        let prevZoom: number;
        this.map.on('movestart', e => this.map.touchZoom.disable());
        this.map.on('move', e => this.overlay.style.transform = mapPane.style.transform);
        this.map.on('moveend', e => {
            this.map.touchZoom.enable();
            let t3d = util.parseTransform(mapPane.style.transform);
            this.overlay.style.transform = mapPane.style.transform = `translate(${t3d.x}px, ${t3d.y}px)`;
        });
        this.map.on('zoomstart', e => {
            this.map.dragging.disable();
            prevZoom = this.map.getZoom();
            //this.overlay.classList.add('leaflet-zoom-anim');
            this.overlay.style.opacity = '0.5';
            
        });
        this.map.on('zoomend', e => {
            this.redrawNetwork();
            //this.overlay.classList.remove('leaflet-zoom-anim');
            this.overlay.style.opacity = null;
            this.map.dragging.enable();
        });
    }

    private fetchGraph(kml: string): Promise<string> {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = () => {
                if (xhr.readyState !== 4) return;
                if (xhr.status === 200) {
                    resolve(xhr.responseText);
                } else {
                    reject(`couldn't fetch the graph: ${xhr.status}: ${xhr.statusText}`);
                }
            };
            xhr.open('GET', kml, true);
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.send();
        });
    }
    
    private handleJSON(json: string) : void {
        //this.map.addLayer(L.circle(L.LatLng(60, 30), 10));
        //this.overlay = <HTMLElement>this.map.getPanes().overlayPane.children[0];
        this.graph = JSON.parse(json);
        this.extendBounds();
        this.map.setView(this.bounds.getCenter(), 11, {
            pan: { animate: false },
            zoom: { animate: false }
        });
    }

    private refillSVG(): void {
        let child;
        while (child = this.overlay.firstChild) {
            this.overlay.removeChild(child);
        }
        let origin = svg.createSVGElement('svg');
        origin.id = 'origin';
        ['paths', 'transfers', 'station-circles', 'dummy-circles'].forEach(groupId => {
            let group = svg.createSVGElement('g');
            group.id = groupId;
            origin.appendChild(group);
        });
        this.overlay.appendChild(origin);
        let transfers = document.getElementById('transfers');
        transfers.classList.add('transfer');
    }


    private extendBounds(): void {
        let a = this.graph.platforms[0].location;
        this.bounds = new L.LatLngBounds(a, a);
        this.graph.platforms.forEach(platform => this.bounds.extend(platform.location));
    }

    private showPlate(event: MouseEvent): void {
        let dummyCircle: SVGElement = <any>event.target;
        const dataset = util.getSVGDataset(dummyCircle);
        //const dataset = dummyCircle.dataset;
        let circle = document.getElementById(dataset['platformId'] || dataset['stationId']);
        let g = svg.makePlate(circle);

        let dummyCircles = dummyCircle.parentNode;
        let container = dummyCircles.parentNode;
        dummyCircle.onmouseout = e => container.removeChild(g);
        container.insertBefore(g, dummyCircles);
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

    private updatePos(): void {

        let nw = this.bounds.getNorthWest();
        let se = this.bounds.getSouthEast();
        // svg bounds in pixels relative to container
        let pixelBounds = new L.Bounds(this.map.latLngToContainerPoint(nw), this.map.latLngToContainerPoint(se));
        let transform = util.parseTransform(this.overlay.style.transform);

        let pixelBoundsSize = pixelBounds.getSize();
        let topLeft = pixelBounds.min.subtract(transform).subtract(pixelBoundsSize);
        this.overlay.style.left = topLeft.x + 'px';
        this.overlay.style.top = topLeft.y + 'px';
        let originShift = pixelBoundsSize;
        let origin = document.getElementById('origin');
        //TODO: test which one is faster
        // transform may not work with svg elements
        origin.setAttribute('x', originShift.x + 'px');
        origin.setAttribute('y', originShift.y + 'px');
        //origin.style.transform = `translate3d(${originShift.x}px, ${originShift.y}px, 0px)`;
        //origin.style.left = originShift.x + 'px';
        //origin.style.top = originShift.y + 'px';

        let tripleSvgBoundsSize = pixelBoundsSize.multiplyBy(3);
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
        this.refillSVG();
        this.updatePos();

        let whiskers = new Array<L.Point[]>(this.graph.platforms.length);

        let circleFrag = document.createDocumentFragment();
        let stationCircles = document.getElementById('station-circles');
        let dummyCircles = document.getElementById('dummy-circles');
        let transfers = document.getElementById('transfers');
        let paths = document.getElementById('paths');

        const zoom = this.map.getZoom();
        const nw = this.bounds.getNorthWest();
        const se = this.bounds.getSouthEast();
        let svgBounds = new L.Bounds(this.map.latLngToContainerPoint(nw), this.map.latLngToContainerPoint(se));
        if (zoom < 10) {

        } else if (zoom < 12) {
            // elements style parameters
            const lineWidth = (zoom - 7) * 0.5;
            const circleRadius = lineWidth * 1.25;
            const circleBorder = circleRadius * 0.4;

            let transfers = document.getElementById('transfers');

            this.graph.stations.forEach((station, stationIndex) => {
                let pos = this.map.latLngToContainerPoint(station.location);
                let posOnSVG = pos.subtract(svgBounds.min);
                let ci = svg.makeCircle(posOnSVG, circleRadius);
                svg.convertToStation(ci, 's-' + stationIndex, station, circleBorder);

                stationCircles.appendChild(ci);

                let dummyCircle = svg.makeCircle(posOnSVG, circleRadius * 2);
                dummyCircle.classList.add('invisible-circle');
                dummyCircle.setAttribute('data-stationId', ci.id);
                //dummyCircle.dataset['stationId'] = ci.id;
                dummyCircles.appendChild(dummyCircle);

                dummyCircle.onmouseover = this.showPlate;
                //dummyCircle.onmouseout = e => this.overlay.removeChild(document.getElementById('plate'));

            });
        } else {
            const lineWidth = (zoom - 7) * 0.5;
            const circleRadius = (zoom - 7) * 0.5;
            const circleBorder = circleRadius * 0.4;
            let platformsHavingCircles = new Set<number>();
            let platformsOnSVG = this.graph.platforms.map(platform => this.posOnSVG(svgBounds, platform.location));
            let beziers: HTMLElement[] = [];

            let transferSegments = document.getElementById('transfers');

            this.graph.stations.forEach((station, stationIndex) => {
                let circular = util.findCircle(this.graph, station);
                let coords: L.Point[] = [];
                station.platforms.forEach((platformNum) => {
                    const platform = this.graph.platforms[platformNum];
                    const posOnSVG = platformsOnSVG[platformNum];

                    let ci = svg.makeCircle(posOnSVG, circleRadius);
                    svg.convertToStation(ci, 'p-' + platformNum.toString(), platform, circleBorder);
                    ci.setAttribute('data-station', stationIndex.toString());
                    //ci.dataset['station'] = stationIndex.toString();

                    let dummyCircle = svg.makeCircle(posOnSVG, circleRadius * 2);
                    dummyCircle.classList.add('invisible-circle');
                    //dummyCircle.dataset['platformId'] = ci.id;
                    dummyCircle.setAttribute('data-platformId', ci.id);
                    circleFrag.appendChild(ci);
                    dummyCircles.appendChild(dummyCircle);

                    dummyCircle.onmouseover = this.showPlate;
                    //dummyCircle.onmouseout = e => this.overlay.removeChild(document.getElementById('plate'));

                    // control points
                    switch (platform.spans.length) {
                        case 2:
                        {
                            let midPts = [posOnSVG, posOnSVG];
                            let lens = [0, 0];
                            let firstSpan = this.graph.spans[platform.spans[0]];
                            if (firstSpan.source === platformNum) {
                                platform.spans.reverse();
                            }
                            // previous node should come first
                            for (let i = 0; i < 2; ++i) {
                                let span = this.graph.spans[platform.spans[i]];
                                let neighborNum = (span.source === platformNum) ? span.target : span.source;
                                let neighbor = this.graph.platforms[neighborNum];
                                let neighborOnSVG = platformsOnSVG[neighborNum]
                                lens[i] = posOnSVG.distanceTo(neighborOnSVG);
                                midPts[i] = posOnSVG.add(neighborOnSVG).divideBy(2);
                            }
                            let mdiff = midPts[1].subtract(midPts[0]).multiplyBy(lens[0] / (lens[0] + lens[1]));
                            let mm = midPts[0].add(mdiff);
                            let diff = posOnSVG.subtract(mm);
                            whiskers[platformNum] = midPts.map(midPt => midPt.add(diff));
                            break;
                        }
                        case 3:
                        {
                            let midPts = [posOnSVG, posOnSVG];
                            let lens = [0, 0];
                            //// true = is source of the span
                            //let patterns = this.graph.spans.map(span => span.source === platformNum);
                            //// true = ⅄, false - Y
                            //let reversed = patterns.reduce((p: boolean, c: boolean) => p ? !c : c);
                            //let outSpans: po.Span[] = [], inSpans: typeof outSpans = [];

                            let nexts: L.Point[] = [], prevs: L.Point[] = [];
                            for (let i = 0; i < 3; ++i) {
                                let span = this.graph.spans[platform.spans[i]];
                                //(span.source === platformNum ? outSpans : inSpans).push(span);
                                if (span.source === platformNum) {
                                    let neighbor = this.graph.platforms[span.target];
                                    let neighborPos = platformsOnSVG[span.target]
                                    nexts.push(neighborPos);
                                } else {
                                    let neighbor = this.graph.platforms[span.source];
                                    let neighborPos = platformsOnSVG[span.source]
                                    prevs.push(neighborPos);
                                }
                                //(span.source === platformNum ? nextNeighbors : prevNeighbors).push(span);
                            }
                            let prev = (prevs.length === 1) ? prevs[0] : prevs[0].add(prevs[1]).divideBy(2);
                            let next = (nexts.length === 1) ? nexts[0] : nexts[0].add(nexts[1]).divideBy(2);
                            let distToPrev = posOnSVG.distanceTo(prev), distToNext = posOnSVG.distanceTo(next);
                            let midPtPrev = posOnSVG.add(prev).divideBy(2), midPtNext = posOnSVG.add(next).divideBy(2);
                            let mdiff = midPtNext.subtract(midPtPrev).multiplyBy(distToPrev / (distToPrev + distToNext));
                            let mm = midPtPrev.add(mdiff);
                            let diff = posOnSVG.subtract(mm);
                            whiskers[platformNum] = [midPtPrev.add(diff), midPtNext.add(diff)];
                            break;
                        }
                        default:
                            whiskers[platformNum] = [posOnSVG, posOnSVG];
                    }

                    if (circular && circular.indexOf(platform) > -1) {
                        coords.push(posOnSVG);
                        platformsHavingCircles.add(platformNum);
                    }


                });

                if (circular) {
                    const circumcenter = util.getCircumcenter(coords);
                    const circumradius = circumcenter.distanceTo(coords[0]);
                    let circumcircle = svg.makeCircle(circumcenter, circumradius);
                    circumcircle.classList.add('transfer');
                    circumcircle.style.strokeWidth = circleBorder.toString();
                    circumcircle.style.opacity = '0.5';
                    transferSegments.appendChild(circumcircle);
                } else {
    
                }

                stationCircles.appendChild(circleFrag);
            });

            for (let i = 0; i < this.graph.spans.length; ++i) {
                let span = this.graph.spans[i];
                let srcN = span.source, trgN = span.target;
                let src = this.graph.platforms[srcN];
                let trg = this.graph.platforms[trgN];
                let foo = whiskers[srcN];
                try {
                    let bezier = svg.makeCubicBezier([platformsOnSVG[srcN], whiskers[srcN][1], whiskers[trgN][0], platformsOnSVG[trgN]]);
                    let routes = span.routes.map(n => this.graph.routes[n]);
                    let matches = routes[0].line.match(/M(\d{1,2})/);
                    bezier.style.strokeWidth = lineWidth.toString();
                    if (matches) {
                        bezier.classList.add(matches[0]);
                    }
                    paths.appendChild(bezier);
                } catch (err) {
                    console.error(span);
                    console.error(src.name, trg.name);
                }
            }

            for (let i = 0; i < this.graph.spans.length; ++i) {
                let span = this.graph.spans[i];
                let src = this.graph.platforms[span.source];
                let trg = this.graph.platforms[span.target];
                let transSrc = src, transTrg = trg;
                if (src.spans.length === 2) {
                    let otherSpanNum = src.spans[i === src.spans[0] ? 1 : 0];
                    let otherSpan = this.graph.spans[otherSpanNum];
                    let transSrcNum = (otherSpan.source === span.source) ? otherSpan.target : otherSpan.source;
                    transSrc = this.graph.platforms[transSrcNum];
                }
                if (trg.spans.length === 2) {
                    let otherSpanNum = trg.spans[i === trg.spans[0] ? 1 : 0];
                    let otherSpan = this.graph.spans[otherSpanNum];
                    let transTrgNum = (otherSpan.source === span.target) ? otherSpan.target : otherSpan.source;
                    transTrg = this.graph.platforms[transTrgNum];
                }
                let posOnSVG = [transSrc, src, trg, transTrg]
                    .map(item => this.map.latLngToContainerPoint(item.location))
                    .map(p => new L.Point(p.x - svgBounds.min.x, p.y - svgBounds.min.y));

                //let m1 = posOnSVG.add(posOnSVG[1]).divideBy(2);
                //let m2 = posOnSVG.add(posOnSVG[2]).divideBy(2);
                //let v1 = posOnSVG
                //let mm = m1.add(m2).divideBy(2);
            }

            this.graph.transfers.forEach(tr => {
                if (platformsHavingCircles.has(tr.source) && platformsHavingCircles.has(tr.target)) return;
                const pl1 = this.graph.platforms[tr.source];
                const pl2 = this.graph.platforms[tr.target];
                const posOnSVG1 = this.posOnSVG(svgBounds, pl1.location);
                const posOnSVG2 = this.posOnSVG(svgBounds, pl2.location);
                let transfer = svg.createSVGElement('line');
                transfer.setAttribute('x1', posOnSVG1.x.toString());
                transfer.setAttribute('y1', posOnSVG1.y.toString());
                transfer.setAttribute('x2', posOnSVG2.x.toString());
                transfer.setAttribute('y2', posOnSVG2.y.toString());
                transfer.classList.add('transfer');
                transfer.style.strokeWidth = circleBorder.toString();
                transfer.style.opacity = '0.5';
                transfers.appendChild(transfer);
            });

        }

    }
}

export = MetroMap;
//export default MetroMap;