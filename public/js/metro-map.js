var L = require('leaflet');
var svg = require('./svg');
var util = require('./util');
//import 'leaflet';
//import * as svg from './svg';
//import * as util from '../../util';
//import Plain from './plain-objects';
var MetroMap = (function () {
    function MetroMap(containerId, tileLayersForZoom) {
        const zoom = 11;
        this.tileLayersForZoom = tileLayersForZoom;
        this._tileLayer = tileLayersForZoom(11);
        this.map = new L.Map(containerId, { inertia: false }).addLayer(this._tileLayer).setView(new L.LatLng(60, 30), zoom).addControl(new L.Control.Scale({ imperial: false }));
        console.log('map should be created by now');
        //this.map.addLayer(L.circle(L.LatLng(60, 30), 10));
        //this.overlay = <HTMLElement>this.map.getPanes().overlayPane.children[0];
        this.overlay = document.getElementById('overlay');
        //this.map.getContainer().appendChild(this.overlay);
        this.overlay.id = 'overlay';
        //console.log(this.overlay);
        this.overlay.style.fill = 'white';
        this.overlay.style.zIndex = '10';
        //this.refillSVG(); not required here
        this.addListeners();
    }
    MetroMap.prototype.addListeners = function () {
        var _this = this;
        let mapPane = this.map.getPanes().mapPane;
        let prevZoom;
        this.map.on('move', function () { return _this.overlay.style.transform = mapPane.style.transform; });
        this.map.on('moveend', function () { return _this.exTranslate = util.parseTransform(_this.overlay.style.transform); });
        this.map.on('zoomstart', function () {
            prevZoom = _this.map.getZoom();
            _this.overlay.style.opacity = '0.5';
        });
        this.map.on('zoomend', function () {
            const possibleTileLayer = _this.tileLayersForZoom(_this.map.getZoom());
            if (_this.tileLayersForZoom(prevZoom) != possibleTileLayer) {
                _this.tileLayer = possibleTileLayer;
            }
            _this.redrawNetwork();
            _this.overlay.style.opacity = null;
        });
    };
    MetroMap.prototype.refillSVG = function () {
        var _this = this;
        let child;
        while (child = this.overlay.firstChild) {
            this.overlay.removeChild(child);
        }
        ['paths', 'transfers', 'station-circles', 'dummy-circles'].forEach(function (groupId) {
            let group = svg.createSVGElement('g');
            group.id = groupId;
            _this.overlay.appendChild(group);
        });
        let transfers = document.getElementById('transfers');
        transfers.classList.add('transfer');
    };
    MetroMap.prototype.getGraphAndFillMap = function () {
        var _this = this;
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status !== 200) {
                    return console.error(`couldn't fetch the graph:
${xhr.status}: ${xhr.statusText}`);
                }
                _this.graph = JSON.parse(xhr.responseText);
                _this.extendBounds();
                _this.map.setView(_this.bounds.getCenter());
                _this.map.once('moveend', function (e) { return _this.redrawNetwork(); });
            }
        };
        xhr.open('GET', '/metrograph', true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.send();
    };
    MetroMap.prototype.extendBounds = function () {
        var _this = this;
        let a = this.graph.platforms[0].location;
        this.bounds = new L.LatLngBounds(a, a);
        this.graph.platforms.forEach(function (platform) { return _this.bounds.extend(platform.location); });
    };
    Object.defineProperty(MetroMap.prototype, "tileLayer", {
        get: function () {
            return this._tileLayer;
        },
        set: function (tileLayer) {
            var _this = this;
            this.map.addLayer(tileLayer);
            let oldLayer = this._tileLayer;
            tileLayer.once('load', function () { return _this.map.removeLayer(oldLayer); });
            this._tileLayer = tileLayer;
        },
        enumerable: true,
        configurable: true
    });
    MetroMap.prototype.showPlate = function (e) {
        let dummyCircle = e.target;
        const dataset = dummyCircle.dataset;
        let circle = document.getElementById(dataset['platformId'] || dataset['stationId']);
        let g = svg.makePlate(circle);
        let dummyCircles = dummyCircle.parentNode;
        let overlay = dummyCircles.parentNode;
        //dummyCircle.onmouseout = ev => overlay.removeChild(g);
        overlay.insertBefore(g, dummyCircles);
    };
    /**
     *
     * @param SVGBounds
     * @param location
     * @returns {Point}
     */
    MetroMap.prototype.posOnSVG = function (SVGBounds, location) {
        const pos = this.map.latLngToContainerPoint(location);
        return pos.subtract(SVGBounds.min);
    };
    /**
     *  lineWidth = (zoom - 7) * 0.5
     *  9 - only lines (1px)
     *  10 - lines (1.5px) & roundels (2+1px)
     *  11 - lines (2px) & roundels (2+2px)
     *  12 - lines (2.5px), platforms (2+1px) & transfers (2px)
     *  ...
     */
    MetroMap.prototype.redrawNetwork = function () {
        var _this = this;
        this.refillSVG();
        //console.log('user: ' + navigator.userLanguage);
        //console.log('language: ' + navigator.language);
        //console.log('browser: ' + navigator.browserLanguage);
        //console.log('system: ' + navigator.systemLanguage);
        console.log(util.getUserLanguage());
        console.log(this.graph.platforms.length);
        //d3.select('#overlay').attr('x', '0').attr('y', '0').attr('width', '150px').attr('height', '150px')
        //  .append('circle').attr('cx', '50').attr('cy', '50').attr('r', '50')
        // .attr('stroke-width', '1').attr('fill', 'blue');
        const zoom = this.map.getZoom();
        let nw = this.bounds.getNorthWest();
        let se = this.bounds.getSouthEast();
        // svg bounds in pixels relative to container
        let svgBounds = new L.Bounds(this.map.latLngToContainerPoint(nw), this.map.latLngToContainerPoint(se));
        console.log('bounds: ' + svgBounds.min);
        //this.overlay.setAttribute('width', svgBounds.getSize().x.toString());
        //this.overlay.setAttribute('height', svgBounds.getSize().y.toString());
        //this.overlay.setAttribute('x', svgBounds.min.x.toString());
        //this.overlay.setAttribute('y', svgBounds.min.y.toString());
        console.log(this.overlay.style.transform);
        let transform = util.parseTransform(this.overlay.style.transform);
        //console.log('transform: ' + transform);
        this.overlay.style.left = (svgBounds.min.x - transform.x).toString() + 'px';
        this.overlay.style.top = (svgBounds.min.y - transform.y).toString() + 'px';
        let svgBoundsSize = svgBounds.getSize();
        this.overlay.style.width = svgBoundsSize.x + 'px';
        this.overlay.style.height = svgBoundsSize.y + 'px';
        let whiskers = new Array(this.graph.platforms.length);
        let circleFrag = document.createDocumentFragment();
        let stationCircles = document.getElementById('station-circles');
        let dummyCircles = document.getElementById('dummy-circles');
        if (zoom < 10) {
        }
        else if (zoom < 12) {
            // elements style parameters
            const lineWidth = (zoom - 7) * 0.5;
            const circleRadius = lineWidth * 1.25;
            const circleBorder = circleRadius * 0.4;
            let transfers = document.getElementById('transfers');
            this.graph.stations.forEach(function (station, stationIndex) {
                let pos = _this.map.latLngToContainerPoint(station.location);
                let posOnSVG = pos.subtract(svgBounds.min);
                let ci = svg.makeCircle(posOnSVG, circleRadius);
                svg.convertToStation(ci, 's-' + stationIndex, station, circleBorder);
                stationCircles.appendChild(ci);
                let dummyCircle = svg.makeCircle(posOnSVG, circleRadius * 2);
                dummyCircle.classList.add('invisible-circle');
                dummyCircle.dataset['stationId'] = ci.id;
                dummyCircles.appendChild(dummyCircle);
                dummyCircle.onmouseover = _this.showPlate;
                dummyCircle.onmouseout = function (e) { return _this.overlay.removeChild(document.getElementById('plate')); };
            });
        }
        else {
            const lineWidth = (zoom - 7) * 0.5;
            const circleRadius = (zoom - 7) * 0.5;
            const circleBorder = circleRadius * 0.4;
            let platformsHavingCircles = new Set();
            let beziers = [];
            let transferSegments = document.getElementById('transfers');
            this.graph.stations.forEach(function (station, stationIndex) {
                let circular = util.findCircle(_this.graph, station);
                let coords = [];
                station.platforms.forEach(function (platformNum) {
                    const platform = _this.graph.platforms[platformNum];
                    const posOnSVG = _this.posOnSVG(svgBounds, platform.location);
                    let ci = svg.makeCircle(posOnSVG, circleRadius);
                    svg.convertToStation(ci, 'p-' + platformNum.toString(), platform, circleBorder);
                    ci.dataset['station'] = stationIndex.toString();
                    let dummyCircle = svg.makeCircle(posOnSVG, circleRadius * 2);
                    dummyCircle.classList.add('invisible-circle');
                    dummyCircle.dataset['platformId'] = ci.id;
                    circleFrag.appendChild(ci);
                    dummyCircles.appendChild(dummyCircle);
                    //this.overlay.appendChild(ci);
                    //this.overlay.appendChild(inv);
                    dummyCircle.onmouseover = _this.showPlate;
                    dummyCircle.onmouseout = function (e) { return _this.overlay.removeChild(document.getElementById('plate')); };
                    // control points
                    if (platform.spans.length === 2) {
                        let midPts = [posOnSVG, posOnSVG];
                        let lns = [0, 0];
                        for (let i = 0; i < 2; ++i) {
                            let incidentSpan = _this.graph.spans[platform.spans[i]];
                            let neighborNum = (incidentSpan.source === platformNum) ? incidentSpan.target : incidentSpan.source;
                            let neighbor = _this.graph.platforms[neighborNum];
                            let neighborOnSVG = _this.posOnSVG(svgBounds, neighbor.location);
                            lns[i] = util.getSegmentLength(posOnSVG, neighborOnSVG);
                            midPts[i] = posOnSVG.add(neighborOnSVG).divideBy(2);
                        }
                        let mdiff = midPts[1].subtract(midPts[0]).multiplyBy(lns[0] / (lns[0] + lns[1]));
                        let mm = midPts[0].add(mdiff);
                        let diff = posOnSVG.subtract(mm);
                        whiskers[platformNum] = [midPts[0].add(diff), midPts[1].add(diff)];
                    }
                    else {
                    }
                    if (circular && circular.indexOf(platform) > -1) {
                        coords.push(posOnSVG);
                        platformsHavingCircles.add(platformNum);
                    }
                });
                if (circular) {
                    let circumcenter = util.getCircumcenter(coords);
                    let circumradius = util.getSegmentLength(circumcenter, coords[0]);
                    let circumcircle = svg.makeCircle(circumcenter, circumradius);
                    circumcircle.classList.add('transfer');
                    circumcircle.style.strokeWidth = circleBorder.toString();
                    circumcircle.style.opacity = '0.5';
                    transferSegments.appendChild(circumcircle);
                }
                else {
                }
                document.getElementById('station-circles').appendChild(circleFrag);
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
                let posOnSVG = [transSrc, src, trg, transTrg].map(function (item) { return _this.map.latLngToContainerPoint(item.location); }).map(function (p) { return new L.Point(p.x - svgBounds.min.x, p.y - svgBounds.min.y); });
            }
            this.graph.transfers.forEach(function (tr) {
                if (platformsHavingCircles.has(tr.source) && platformsHavingCircles.has(tr.target))
                    return;
                let pl1 = _this.graph.platforms[tr.source];
                let pl2 = _this.graph.platforms[tr.target];
                const posOnSVG1 = _this.posOnSVG(svgBounds, pl1.location);
                const posOnSVG2 = _this.posOnSVG(svgBounds, pl2.location);
                let transfer = svg.createSVGElement('line');
                transfer.setAttribute('x1', posOnSVG1.x.toString());
                transfer.setAttribute('y1', posOnSVG1.y.toString());
                transfer.setAttribute('x2', posOnSVG2.x.toString());
                transfer.setAttribute('y2', posOnSVG2.y.toString());
                transfer.classList.add('transfer');
                transfer.style.strokeWidth = circleBorder.toString();
                transfer.style.opacity = '0.5';
                document.getElementById('transfers').appendChild(transfer);
            });
        }
    };
    return MetroMap;
})();
module.exports = MetroMap;
//export default MetroMap; 
//# sourceMappingURL=metro-map.js.map