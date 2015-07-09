(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var MetroMap = require('./metro-map');
//import MetroMap from './metro-map';
var mapbox = (function () {
    return new L.TileLayer('https://{s}.tiles.mapbox.com/v3/inker.mlo91c41/{z}/{x}/{y}.png', {
        minZoom: 9,
        id: 'inker.mlo91c41',
        //detectRetina: true,
        reuseTiles: true,
        bounds: null,
        attribution: 'Map data &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://mapbox.com">Mapbox</a>'
    });
})();
var openMapSurfer = (function () {
    return new L.TileLayer('http://openmapsurfer.uni-hd.de/tiles/roads/x={x}&y={y}&z={z}', {
        minZoom: 9,
        reuseTiles: true,
        attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });
})();
var metroMap = new MetroMap('map-container', 'json/graph.json', function (zoom) {
    return zoom < 15 ? mapbox : openMapSurfer;
});
console.log('user: ' + navigator.userLanguage);
console.log('language: ' + navigator.language);
console.log('browser: ' + navigator.browserLanguage);
console.log('system: ' + navigator.systemLanguage);


},{"./metro-map":2}],2:[function(require,module,exports){
'use strict';

var L = window.L;
var svg = require('./svg');
var util = require('./util');
//import 'leaflet';
//import * as svg from './svg';
//import * as util from '../../util';
//import Plain from './plain-objects';
var MetroMap = (function () {
    function MetroMap(containerId, kml, tileLayersForZoom) {
        var zoom = 11;
        this.tileLayersForZoom = tileLayersForZoom;
        this._tileLayer = tileLayersForZoom(11);
        this.map = new L.Map(containerId, { inertia: false }).addLayer(this._tileLayer).setView(new L.LatLng(60, 30), zoom).addControl(new L.Control.Scale({ imperial: false }));
        var tileLayers = {
            'I': tileLayersForZoom(10),
            'II': tileLayersForZoom(16)
        };
        var layerControl = L.control['UniForm'](tileLayers, null, { collapsed: false, position: 'topright' });
        // add control widget to map and html dom.
        layerControl.addTo(this.map);
        // update the control widget to the specific theme.
        layerControl.renderUniformControl();
        //L.Control['measureControl']().addTo(this.map);
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
        this.getGraphAndFillMap(kml);
    }
    MetroMap.prototype.addListeners = function () {
        var _this = this;
        var mapPane = this.map.getPanes().mapPane;
        var prevZoom = undefined;
        this.map.on('movestart', function (e) {
            return _this.map.touchZoom.disable();
        });
        this.map.on('move', function (e) {
            return _this.overlay.style.transform = mapPane.style.transform;
        });
        this.map.on('moveend', function (e) {
            _this.map.touchZoom.enable();
        });
        this.map.on('zoomstart', function (e) {
            _this.map.dragging.disable();
            prevZoom = _this.map.getZoom();
            _this.overlay.style.opacity = '0.5';
        });
        this.map.on('zoomend', function (e) {
            var possibleTileLayer = _this.tileLayersForZoom(_this.map.getZoom());
            if (_this.tileLayersForZoom(prevZoom) != possibleTileLayer) {
                _this.tileLayer = possibleTileLayer;
            }
            _this.redrawNetwork();
            _this.overlay.style.opacity = null;
            _this.map.dragging.enable();
        });
        (function () {
            var overlay = document.getElementById('overlay');
            var polyline = new L.Polyline([], { color: 'red' });
            polyline.addTo(_this.map);
            var marker = undefined;
            overlay.addEventListener('click', function (e) {
                if (!e.shiftKey) return;
                var pt = _this.map.containerPointToLatLng(new L.Point(e.x, e.y));
                polyline.addLatLng(pt).redraw();
                if (marker) {
                    var distance = 0;
                    var pts = polyline.getLatLngs();
                    for (var i = 1; i < pts.length; ++i) {
                        distance += pts[i - 1].distanceTo(pts[i]);
                    }
                    marker.setLatLng(pt).setPopupContent(distance.toPrecision(1) + 'm').update();
                } else {
                    marker = new L.Marker(pt).addTo(_this.map);
                    marker.on('dblclick', function (e) {
                        polyline.setLatLngs([]).redraw();
                        _this.map.removeLayer(marker);
                    });
                }
            });
        })();
    };
    MetroMap.prototype.getGraphAndFillMap = function (kml) {
        var _this = this;
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status !== 200) {
                    return console.error('couldn\'t fetch the graph:\n' + xhr.status + ': ' + xhr.statusText);
                }
                _this.graph = JSON.parse(xhr.responseText);
                _this.extendBounds();
                _this.map.setView(_this.bounds.getCenter());
                _this.map.once('moveend', function (e) {
                    return _this.redrawNetwork();
                });
            }
        };
        xhr.open('GET', kml, true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.send();
    };
    MetroMap.prototype.refillSVG = function () {
        var child = undefined;
        while (child = this.overlay.firstChild) {
            this.overlay.removeChild(child);
        }
        var origin = svg.createSVGElement('g');
        origin.id = 'origin';
        ['paths', 'transfers', 'station-circles', 'dummy-circles'].forEach(function (groupId) {
            var group = svg.createSVGElement('g');
            group.id = groupId;
            origin.appendChild(group);
        });
        this.overlay.appendChild(origin);
        var transfers = document.getElementById('transfers');
        transfers.classList.add('transfer');
    };
    MetroMap.prototype.extendBounds = function () {
        var _this = this;
        var a = this.graph.platforms[0].location;
        this.bounds = new L.LatLngBounds(a, a);
        this.graph.platforms.forEach(function (platform) {
            return _this.bounds.extend(platform.location);
        });
    };
    Object.defineProperty(MetroMap.prototype, 'tileLayer', {
        get: function get() {
            return this._tileLayer;
        },
        set: function set(tileLayer) {
            var _this = this;
            this.map.addLayer(tileLayer);
            var oldLayer = this._tileLayer;
            tileLayer.once('load', function () {
                return _this.map.removeLayer(oldLayer);
            });
            this._tileLayer = tileLayer;
        },
        enumerable: true,
        configurable: true
    });
    MetroMap.prototype.showPlate = function (event) {
        var dummyCircle = event.target;
        var dataset = util.getSVGDataset(dummyCircle);
        //const dataset = dummyCircle.dataset;
        var circle = document.getElementById(dataset['platformId'] || dataset['stationId']);
        var g = svg.makePlate(circle);
        var dummyCircles = dummyCircle.parentNode;
        var container = dummyCircles.parentNode;
        dummyCircle.onmouseout = function (e) {
            return container.removeChild(g);
        };
        container.insertBefore(g, dummyCircles);
    };
    /**
     *
     * @param SVGBounds
     * @param location
     * @returns {Point}
     */
    MetroMap.prototype.posOnSVG = function (SVGBounds, location) {
        var pos = this.map.latLngToContainerPoint(location);
        return pos.subtract(SVGBounds.min);
    };
    MetroMap.prototype.updatePos = function () {
        var nw = this.bounds.getNorthWest();
        var se = this.bounds.getSouthEast();
        // svg bounds in pixels relative to container
        var pixelBounds = new L.Bounds(this.map.latLngToContainerPoint(nw), this.map.latLngToContainerPoint(se));
        var transform = util.parseTransform(this.overlay.style.transform);
        var pixelBoundsSize = pixelBounds.getSize();
        var topLeft = pixelBounds.min.subtract(transform).subtract(pixelBoundsSize);
        this.overlay.style.left = topLeft.x + 'px';
        this.overlay.style.top = topLeft.y + 'px';
        var originShift = pixelBoundsSize;
        var origin = document.getElementById('origin');
        //TODO: test which one is faster
        origin.style.transform = 'translate3d(' + originShift.x + 'px, ' + originShift.y + 'px, 0px)';
        //origin.style.left = originShift.x + 'px';
        //origin.style.top = originShift.y + 'px';
        var tripleSvgBoundsSize = pixelBoundsSize.multiplyBy(3);
        this.overlay.style.width = tripleSvgBoundsSize.x + 'px';
        this.overlay.style.height = tripleSvgBoundsSize.y + 'px';
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
        var _this2 = this;

        var _this = this;
        this.refillSVG();
        this.updatePos();
        var whiskers = new Array(this.graph.platforms.length);
        var circleFrag = document.createDocumentFragment();
        var stationCircles = document.getElementById('station-circles');
        var dummyCircles = document.getElementById('dummy-circles');
        var transfers = document.getElementById('transfers');
        var zoom = this.map.getZoom();
        var nw = this.bounds.getNorthWest();
        var se = this.bounds.getSouthEast();
        var svgBounds = new L.Bounds(this.map.latLngToContainerPoint(nw), this.map.latLngToContainerPoint(se));
        if (zoom < 10) {} else if (zoom < 12) {
            (function () {
                // elements style parameters
                var lineWidth = (zoom - 7) * 0.5;
                var circleRadius = lineWidth * 1.25;
                var circleBorder = circleRadius * 0.4;
                var transfers = document.getElementById('transfers');
                _this2.graph.stations.forEach(function (station, stationIndex) {
                    var pos = _this.map.latLngToContainerPoint(station.location);
                    var posOnSVG = pos.subtract(svgBounds.min);
                    var ci = svg.makeCircle(posOnSVG, circleRadius);
                    svg.convertToStation(ci, 's-' + stationIndex, station, circleBorder);
                    stationCircles.appendChild(ci);
                    var dummyCircle = svg.makeCircle(posOnSVG, circleRadius * 2);
                    dummyCircle.classList.add('invisible-circle');
                    dummyCircle.setAttribute('data-stationId', ci.id);
                    //dummyCircle.dataset['stationId'] = ci.id;
                    dummyCircles.appendChild(dummyCircle);
                    dummyCircle.onmouseover = _this.showPlate;
                    //dummyCircle.onmouseout = e => this.overlay.removeChild(document.getElementById('plate'));
                });
            })();
        } else {
            (function () {
                var lineWidth = (zoom - 7) * 0.5;
                var circleRadius = (zoom - 7) * 0.5;
                var circleBorder = circleRadius * 0.4;
                var platformsHavingCircles = new Set();
                var beziers = [];
                var transferSegments = document.getElementById('transfers');
                _this2.graph.stations.forEach(function (station, stationIndex) {
                    var circular = util.findCircle(_this.graph, station);
                    var coords = [];
                    station.platforms.forEach(function (platformNum) {
                        var platform = _this.graph.platforms[platformNum];
                        var posOnSVG = _this.posOnSVG(svgBounds, platform.location);
                        var ci = svg.makeCircle(posOnSVG, circleRadius);
                        svg.convertToStation(ci, 'p-' + platformNum.toString(), platform, circleBorder);
                        ci.setAttribute('data-station', stationIndex.toString());
                        //ci.dataset['station'] = stationIndex.toString();
                        var dummyCircle = svg.makeCircle(posOnSVG, circleRadius * 2);
                        dummyCircle.classList.add('invisible-circle');
                        //dummyCircle.dataset['platformId'] = ci.id;
                        dummyCircle.setAttribute('data-platformId', ci.id);
                        circleFrag.appendChild(ci);
                        dummyCircles.appendChild(dummyCircle);
                        dummyCircle.onmouseover = _this.showPlate;
                        //dummyCircle.onmouseout = e => this.overlay.removeChild(document.getElementById('plate'));
                        // control points
                        if (platform.spans.length === 2) {
                            (function () {
                                var midPts = [posOnSVG, posOnSVG];
                                var lns = [0, 0];
                                for (var i = 0; i < 2; ++i) {
                                    var incidentSpan = _this.graph.spans[platform.spans[i]];
                                    var neighborNum = incidentSpan.source === platformNum ? incidentSpan.target : incidentSpan.source;
                                    var neighbor = _this.graph.platforms[neighborNum];
                                    var neighborOnSVG = _this.posOnSVG(svgBounds, neighbor.location);
                                    lns[i] = posOnSVG.distanceTo(neighborOnSVG);
                                    midPts[i] = posOnSVG.add(neighborOnSVG).divideBy(2);
                                }
                                var mdiff = midPts[1].subtract(midPts[0]).multiplyBy(lns[0] / (lns[0] + lns[1]));
                                var mm = midPts[0].add(mdiff);
                                var diff = posOnSVG.subtract(mm);
                                whiskers[platformNum] = midPts.map(function (midPt) {
                                    return midPt.add(diff);
                                });
                            })();
                        } else {}
                        if (circular && circular.indexOf(platform) > -1) {
                            coords.push(posOnSVG);
                            platformsHavingCircles.add(platformNum);
                        }
                    });
                    if (circular) {
                        var circumcenter = util.getCircumcenter(coords);
                        var circumradius = circumcenter.distanceTo(coords[0]);
                        var circumcircle = svg.makeCircle(circumcenter, circumradius);
                        circumcircle.classList.add('transfer');
                        circumcircle.style.strokeWidth = circleBorder.toString();
                        circumcircle.style.opacity = '0.5';
                        transferSegments.appendChild(circumcircle);
                    } else {}
                    stationCircles.appendChild(circleFrag);
                });
                for (var i = 0; i < _this2.graph.spans.length; ++i) {
                    var span = _this2.graph.spans[i];
                    var src = _this2.graph.platforms[span.source];
                    var trg = _this2.graph.platforms[span.target];
                    var transSrc = src,
                        transTrg = trg;
                    if (src.spans.length === 2) {
                        var otherSpanNum = i == src.spans[0] ? src.spans[1] : src.spans[0];
                        var otherSpan = _this2.graph.spans[otherSpanNum];
                        var transSrcNum = otherSpan.source == span.source ? otherSpan.target : otherSpan.source;
                        transSrc = _this2.graph.platforms[transSrcNum];
                    }
                    if (trg.spans.length === 2) {
                        var otherSpanNum = i == trg.spans[0] ? trg.spans[1] : trg.spans[0];
                        var otherSpan = _this2.graph.spans[otherSpanNum];
                        var transTrgNum = otherSpan.source == span.target ? otherSpan.target : otherSpan.source;
                        transTrg = _this2.graph.platforms[transTrgNum];
                    }
                    var posOnSVG = [transSrc, src, trg, transTrg].map(function (item) {
                        return _this.map.latLngToContainerPoint(item.location);
                    }).map(function (p) {
                        return new L.Point(p.x - svgBounds.min.x, p.y - svgBounds.min.y);
                    });
                }
                _this2.graph.transfers.forEach(function (tr) {
                    if (platformsHavingCircles.has(tr.source) && platformsHavingCircles.has(tr.target)) return;
                    var pl1 = _this.graph.platforms[tr.source];
                    var pl2 = _this.graph.platforms[tr.target];
                    var posOnSVG1 = _this.posOnSVG(svgBounds, pl1.location);
                    var posOnSVG2 = _this.posOnSVG(svgBounds, pl2.location);
                    var transfer = svg.createSVGElement('line');
                    transfer.setAttribute('x1', posOnSVG1.x.toString());
                    transfer.setAttribute('y1', posOnSVG1.y.toString());
                    transfer.setAttribute('x2', posOnSVG2.x.toString());
                    transfer.setAttribute('y2', posOnSVG2.y.toString());
                    transfer.classList.add('transfer');
                    transfer.style.strokeWidth = circleBorder.toString();
                    transfer.style.opacity = '0.5';
                    transfers.appendChild(transfer);
                });
            })();
        }
    };
    return MetroMap;
})();
module.exports = MetroMap;
//export default MetroMap;


},{"./svg":3,"./util":4}],3:[function(require,module,exports){
'use strict';

var L = window.L;
var svg = require('./svg');
var util = require('./util');
//import L from 'leaflet';
//import * as svg from './svg';
//import * as util from '../../util';
function makeCircle(position, radius) {
    var ci = createSVGElement('circle');
    ci.setAttribute('r', radius.toString());
    ci.setAttribute('cy', position.y.toString());
    ci.setAttribute('cx', position.x.toString());
    return ci;
}
exports.makeCircle = makeCircle;
function convertToStation(circle, id, s, circleBorder) {
    circle.id = id;
    circle.classList.add('station-circle');
    circle.style.strokeWidth = circleBorder.toString();
    util.setSVGDataset(circle, {
        lat: s.location.lat,
        lng: s.location.lng,
        ru: s.name,
        fi: s.altName
    });
    //circle.dataset['lat'] = s.location.lat.toString();
    //circle.dataset['lng'] = s.location.lng.toString();
    //circle.dataset['ru'] = s.name;
    //circle.dataset['fi'] = s.altName;
}
exports.convertToStation = convertToStation;
function makeCubicBezier(controlPoints) {
    if (controlPoints.length !== 4) {
        throw new Error('there should be 4 points');
    }
    var path = createSVGElement('path');
    var d = controlPoints.reduce(function (prev, cp, i) {
        return '' + prev + (i === 1 ? 'C' : ' ') + cp.x + ',' + cp.y;
    }, 'M');
    path.setAttribute('d', d);
    return path;
}
exports.makeCubicBezier = makeCubicBezier;
function createSVGElement(tagName) {
    return document.createElementNS('http://www.w3.org/2000/svg', tagName);
}
exports.createSVGElement = createSVGElement;
function makePlate(circle) {
    var plateGroup = svg.createSVGElement('g');
    var pole = svg.createSVGElement('line');
    var c = new L.Point(Number(circle.getAttribute('cx')), Number(circle.getAttribute('cy')));
    var r = Number(circle.getAttribute('r'));
    var poleSize = new L.Point(4, 8);
    var poleBounds = new L.Bounds(c, c.subtract(poleSize));
    pole.setAttribute('x1', poleBounds.min.x.toString());
    pole.setAttribute('y1', poleBounds.min.y.toString());
    pole.setAttribute('x2', poleBounds.max.x.toString());
    pole.setAttribute('y2', poleBounds.max.y.toString());
    pole.classList.add('plate-pole');
    var dataset = util.getSVGDataset(circle);
    var ru = dataset['ru'];
    var fi = dataset['fi'];
    var maxLen = fi ? Math.max(ru.length, fi.length) : ru.length;
    var rect = svg.createSVGElement('rect');
    var spacing = 12;
    var rectSize = new L.Point(10 + maxLen * 6, fi ? 18 + spacing : 18);
    rect.setAttribute('width', rectSize.x.toString());
    rect.setAttribute('height', rectSize.y.toString());
    var rectUpperLeft = poleBounds.min.subtract(rectSize);
    rect.setAttribute('x', rectUpperLeft.x.toString());
    rect.setAttribute('y', rectUpperLeft.y.toString());
    rect.classList.add('plate-box');
    var text = svg.createSVGElement('text');
    var t1 = svg.createSVGElement('tspan');
    //t1.classList.add('plate-text');
    var textUpperLeft = c.subtract(new L.Point(3, rectSize.y - 12)).subtract(poleBounds.getSize());
    t1.setAttribute('x', textUpperLeft.x.toString());
    t1.setAttribute('y', textUpperLeft.y.toString());
    var t2 = t1.cloneNode();
    t2.setAttribute('y', (textUpperLeft.y + spacing).toString());
    if (util.getUserLanguage() === 'fi') {
        t1.textContent = fi;
        t2.textContent = ru;
    } else {
        t1.textContent = ru;
        t2.textContent = fi;
    }
    text.setAttribute('fill', 'black');
    text.appendChild(t1);
    text.appendChild(t2);
    //text.style.color = 'black';
    text.classList.add('plate-text');
    plateGroup.appendChild(rect);
    plateGroup.appendChild(pole);
    plateGroup.appendChild(text);
    plateGroup.id = 'plate';
    return plateGroup;
}
exports.makePlate = makePlate;


},{"./svg":3,"./util":4}],4:[function(require,module,exports){
/// <reference path="./../typings/tsd.d.ts" />
'use strict';

var L = window.L;
function getUserLanguage() {
    return (navigator.userLanguage || navigator.language).slice(0, 2).toLowerCase();
}
exports.getUserLanguage = getUserLanguage;
function parseTransform(val) {
    var matches = val.match(/translate3d\((-?\d+)px,\s?(-?\d+)px,\s?(-?\d+)px\)/i);
    return matches ? new L.Point(Number(matches[1]), Number(matches[2])) : new L.Point(0, 0);
}
exports.parseTransform = parseTransform;
function findCircle(graph, station) {
    var platforms = [];
    station.platforms.forEach(function (platformNum) {
        return platforms.push(graph.platforms[platformNum]);
    });
    if (platforms.length === 3 && platforms.every(function (platform) {
        return platform.transfers.length === 2;
    })) {
        return platforms;
    }
    return null;
}
exports.findCircle = findCircle;
function getCircumcenter(positions) {
    if (positions.length !== 3) {
        throw new Error('must have 3 vertices');
    }
    console.log(positions[1]);
    var b = positions[1].subtract(positions[0]);
    var c = positions[2].subtract(positions[0]);
    var bDot = b.x * b.x + b.y * b.y;
    var cDot = c.x * c.x + c.y * c.y;
    return new L.Point(c.y * bDot - b.y * cDot, b.x * cDot - c.x * bDot).divideBy(2.0 * (b.x * c.y - b.y * c.x)).add(positions[0]);
}
exports.getCircumcenter = getCircumcenter;
function getSVGDataset(el) {
    // for webkit-based browsers
    if (el['dataset']) {
        return el['dataset'];
    }
    // for the rest
    var attrs = el.attributes;
    var dataset = {};
    for (var i = 0; i < attrs.length; ++i) {
        var attr = attrs[i].name;
        if (attr.startsWith('data-')) {
            dataset[attr.slice(5)] = el.getAttribute(attr);
        }
    }
    return dataset;
}
exports.getSVGDataset = getSVGDataset;
function setSVGDataset(el, dataset) {
    Object.keys(dataset).forEach(function (key) {
        return el.setAttribute('data-' + key, dataset[key]);
    });
}
exports.setSVGDataset = setSVGDataset;
//export function getSegmentLength(source: L.Point, target: L.Point): number {
//    const a = target.subtract(source);
//    return Math.sqrt(a.x * a.x + a.y * a.y);
//}


},{}]},{},[1]);
