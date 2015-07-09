import L = require('leaflet');
import svg = require('./svg');
import util = require('./util');
import Plain = require('../plain-objects');
//import 'leaflet';
//import * as svg from './svg';
//import * as util from '../../util';
//import Plain from './plain-objects';

class MetroMap {
    private map: L.Map;
    private overlay: HTMLElement;
    private graph: Plain.Graph;
    private _tileLayer: L.TileLayer;
    private bounds: L.LatLngBounds;
    private tileLayersForZoom: (zoom: number) => L.TileLayer;

    constructor(containerId: string, kml: string, tileLayersForZoom: (zoom: number) => L.TileLayer) {
        const zoom = 11;
        this.tileLayersForZoom = tileLayersForZoom;
        this._tileLayer = tileLayersForZoom(11);
        this.map = new L.Map(containerId, {inertia: false})
            .addLayer(this._tileLayer)
            .setView(new L.LatLng(60, 30), zoom)
            .addControl(new L.Control.Scale({imperial: false}));

        let tileLayers = {
            'I': tileLayersForZoom(10),
            'II': tileLayersForZoom(16)
        };
        let layerControl = L.control['UniForm'](tileLayers, null, { collapsed: false, position: 'topright' });
        // add control widget to map and html dom.
        layerControl.addTo(this.map);
        // update the control widget to the specific theme.
        layerControl.renderUniformControl();

        L.Control['measureControl']().addTo(this.map);

        console.log('map should be created by now');
        //this.map.addLayer(L.circle(L.LatLng(60, 30), 10));
        //this.overlay = <HTMLElement>this.map.getPanes().overlayPane.children[0];
        this.overlay = document.createElement('svg');
        document.getElementsByClassName('leaflet-overlay-pane')[0].appendChild(this.overlay);
        //this.map.getContainer().appendChild(this.overlay);
        this.overlay.id = 'overlay';
        //console.log(this.overlay);
        this.overlay.style.fill = 'white';
        this.overlay.style.zIndex = '10';
        //this.refillSVG(); not required here
        this.addListeners();
        this.getGraphAndFillMap(kml);
    }

    private addListeners(): void {
        let mapPane = this.map.getPanes().mapPane;
        let prevZoom: number;
        this.map.on('movestart', e => this.map.touchZoom.disable());
        //this.map.on('move', e => this.overlay.style.transform = mapPane.style.transform);
        this.map.on('moveend', e => {
            this.map.touchZoom.enable();
        });
        this.map.on('zoomstart', e => {
            this.map.dragging.disable();
            prevZoom = this.map.getZoom();
            this.overlay.style.opacity = '0.5';
        });
        this.map.on('zoomend', e => {
            const possibleTileLayer = this.tileLayersForZoom(this.map.getZoom());
            if (this.tileLayersForZoom(prevZoom) != possibleTileLayer) {
                this.tileLayer = possibleTileLayer;
            }
            this.redrawNetwork();
            this.overlay.style.opacity = null;
            this.map.dragging.enable();
        });
    }

    private getGraphAndFillMap(kml: string): void {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status !== 200) {
                    return console.error(`couldn't fetch the graph:
${xhr.status}: ${xhr.statusText}`);
                }
                this.graph = JSON.parse(xhr.responseText);
                this.extendBounds();
                this.map.setView(this.bounds.getCenter());
                this.map.once('moveend', e => this.redrawNetwork());
            }
        };
        xhr.open('GET', kml, true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.send();
    }

    private refillSVG(): void {
        let child;
        while (child = this.overlay.firstChild) {
            this.overlay.removeChild(child);
        }
        let origin = svg.createSVGElement('g');
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

    get tileLayer(): L.TileLayer {
        return this._tileLayer;
    }

    set tileLayer(tileLayer: L.TileLayer) {
        this.map.addLayer(tileLayer);
        let oldLayer = this._tileLayer;
        tileLayer.once('load', () => this.map.removeLayer(oldLayer));
        this._tileLayer = tileLayer;
    }

    private showPlate(event: MouseEvent) {
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

    private updatePos() {

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
        origin.style.transform = `translate3d(${originShift.x}px, ${originShift.y}px, 0px)`;
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

        const zoom = this.map.getZoom();
        let nw = this.bounds.getNorthWest();
        let se = this.bounds.getSouthEast();
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
            let beziers: HTMLElement[] = [];

            let transferSegments = document.getElementById('transfers');

            this.graph.stations.forEach((station, stationIndex) => {
                let circular = util.findCircle(this.graph, station);
                let coords = [];
                station.platforms.forEach(platformNum => {
                    const platform = this.graph.platforms[platformNum];
                    const posOnSVG = this.posOnSVG(svgBounds, platform.location);

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
                    if (platform.spans.length === 2) {
                        let midPts = [posOnSVG, posOnSVG];
                        let lns = [0, 0];
                        for (let i = 0; i < 2; ++i) {
                            let incidentSpan = this.graph.spans[platform.spans[i]];
                            let neighborNum = (incidentSpan.source === platformNum) ? incidentSpan.target : incidentSpan.source;
                            let neighbor = this.graph.platforms[neighborNum];
                            let neighborOnSVG = this.posOnSVG(svgBounds, neighbor.location);
                            lns[i] = posOnSVG.distanceTo(neighborOnSVG);
                            midPts[i] = posOnSVG.add(neighborOnSVG).divideBy(2);
                        }
                        let mdiff = midPts[1].subtract(midPts[0]).multiplyBy(lns[0] / (lns[0] + lns[1]));
                        let mm = midPts[0].add(mdiff);
                        let diff = posOnSVG.subtract(mm);
                        whiskers[platformNum] = midPts.map(midPt => midPt.add(diff));
                    } else {
                        //
                    }
                    if (circular && circular.indexOf(platform) > -1) {
                        coords.push(posOnSVG);
                        platformsHavingCircles.add(platformNum);
                    }


                });

                if (circular) {
                    let circumcenter = util.getCircumcenter(coords);
                    let circumradius = circumcenter.distanceTo(coords[0]);
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
                let src = this.graph.platforms[span.source];
                let trg = this.graph.platforms[span.target];
                let transSrc = src, transTrg = trg;
                if (src.spans.length === 2) {
                    let otherSpanNum = (i == src.spans[0]) ? src.spans[1] : src.spans[0];
                    let otherSpan = this.graph.spans[otherSpanNum];
                    let transSrcNum = (otherSpan.source == span.source) ? otherSpan.target : otherSpan.source;
                    transSrc = this.graph.platforms[transSrcNum];
                }
                if (trg.spans.length === 2) {
                    let otherSpanNum = (i == trg.spans[0]) ? trg.spans[1] : trg.spans[0];
                    let otherSpan = this.graph.spans[otherSpanNum];
                    let transTrgNum = (otherSpan.source == span.target) ? otherSpan.target : otherSpan.source;
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
                let pl1 = this.graph.platforms[tr.source];
                let pl2 = this.graph.platforms[tr.target];
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