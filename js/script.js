(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var LayerControl = (function () {
    function LayerControl(metroMap, tileLayers, otherLayers) {
        var layerControl = L.control['UniForm'](tileLayers, otherLayers || null, {
            collapsed: false,
            position: 'topright'
        });
        // add control widget to map and html dom.
        layerControl.addTo(metroMap.getMap());
        // update the control widget to the specific theme.
        layerControl.renderUniformControl();
    }
    return LayerControl;
})();
exports.LayerControl = LayerControl;
var Measurement = (function () {
    function Measurement(metroMap) {
        var overlay = metroMap.getOverlay();
        var map = metroMap.getMap();
        var polyline = new L.Polyline([], { color: 'red' });
        polyline.addTo(map);
        var marker = new L.CircleMarker([60, 30]);
        var text = '0m';
        //marker.on('mouseover', e => popup.)
        overlay.addEventListener('click', function (e) {
            if (!e.shiftKey) return;
            var pt = map.containerPointToLatLng(new L.Point(e.x, e.y));
            polyline.addLatLng(pt).redraw();
            marker.on('mouseout', function (e) {
                return marker.closePopup();
            });
            //.on('dblclick', e => {
            //    polyline.setLatLngs([]).redraw();
            //    this.map.removeLayer(marker);
            //})
            marker.addTo(map);
            var pts = polyline.getLatLngs();
            if (pts.length > 1) {
                var distance = 0;
                for (var i = 1; i < pts.length; ++i) {
                    distance += pts[i - 1].distanceTo(pts[i]);
                }
                L.popup().setLatLng(pt).setContent('Popup').openOn(map);
            }
        });
    }
    return Measurement;
})();
exports.Measurement = Measurement;


},{}],2:[function(require,module,exports){
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
var metroMap = new MetroMap('map-container', 'json/graph.json', {
    'Mapbox': mapbox,
    'OpenMapSurfer': openMapSurfer
});
(function () {
    var titles = ['Plan metro Sankt-Peterburga', 'Pietarin metron hankesuunnitelma', 'St Petersburg metro plan proposal'];
    var i = 0;
    setInterval(function () {
        return document.title = titles[++i % titles.length];
    }, 3000);
})();
console.log('user: ' + navigator.userLanguage);
console.log('language: ' + navigator.language);
console.log('browser: ' + navigator.browserLanguage);
console.log('system: ' + navigator.systemLanguage);


},{"./metro-map":3}],3:[function(require,module,exports){
'use strict';

var L = window.L;
var svg = require('./svg');
var util = require('./util');
var addons = require('./addons');
var MetroMap = (function () {
    function MetroMap(containerId, kml, tileLayers) {
        var _this = this;
        var graphPromise = this.fetch(kml);
        var hintsPromise = this.fetch('json/hints.json');
        this.map = new L.Map(containerId, { inertia: false }).addLayer(tileLayers['Mapbox'] || tileLayers[Object.keys(tileLayers).toString()]).setView(new L.LatLng(60, 30), 11).addControl(new L.Control.Scale({ imperial: false }));
        new addons.LayerControl(this, tileLayers);
        //L.Control['measureControl']().addTo(this.map);
        console.log('map should be created by now');
        this.addOverlay();
        //this.refillSVG(); not required here
        this.addListeners();
        graphPromise.then(function (graphText) {
            return _this.handleJSON(graphText);
        }).then(function () {
            return hintsPromise;
        }).then(function (hintsText) {
            return _this.appendHintsToGraph(hintsText);
        }).then(function () {
            return _this.redrawNetwork();
        })['catch'](function (text) {
            return alert(text);
        });
    }
    MetroMap.prototype.getMap = function () {
        return this.map;
    };
    MetroMap.prototype.getOverlay = function () {
        return this.overlay;
    };
    MetroMap.prototype.addOverlay = function () {
        //this.map.getPanes().mapPane.innerHTML = '<svg id="overlay"></svg>' + this.map.getPanes().mapPane.innerHTML;
        this.overlay = document.getElementById('overlay');
        this.overlay.id = 'overlay';
        this.overlay.style.fill = 'white';
        this.overlay.style.zIndex = '10';
    };
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
            var t3d = util.parseTransform(mapPane.style.transform);
            _this.overlay.style.transform = mapPane.style.transform = 'translate(' + t3d.x + 'px, ' + t3d.y + 'px)';
        });
        this.map.on('zoomstart', function (e) {
            _this.map.dragging.disable();
            prevZoom = _this.map.getZoom();
            //this.overlay.classList.add('leaflet-zoom-anim');
            _this.overlay.style.opacity = '0.5';
        });
        this.map.on('zoomend', function (e) {
            _this.redrawNetwork();
            //this.overlay.classList.remove('leaflet-zoom-anim');
            _this.overlay.style.opacity = null;
            _this.map.dragging.enable();
        });
    };
    MetroMap.prototype.fetch = function (resource) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState !== 4) return;
                if (xhr.status === 200) {
                    resolve(xhr.responseText);
                } else {
                    reject('couldn\'t fetch ' + resource + ': ' + xhr.status + ': ' + xhr.statusText);
                }
            };
            xhr.open('GET', resource, true);
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.send();
        });
    };
    MetroMap.prototype.handleJSON = function (json) {
        //this.map.addLayer(L.circle(L.LatLng(60, 30), 10));
        //this.overlay = <HTMLElement>this.map.getPanes().overlayPane.children[0];
        this.graph = JSON.parse(json);
        this.extendBounds();
        this.map.setView(this.bounds.getCenter(), 11, {
            pan: { animate: false },
            zoom: { animate: false }
        });
    };
    MetroMap.prototype.appendHintsToGraph = function (json) {
        this.graph.hints = JSON.parse(json);
        console.log(this.graph.hints);
    };
    MetroMap.prototype.refillSVG = function () {
        var child = undefined;
        while (child = this.overlay.firstChild) {
            this.overlay.removeChild(child);
        }
        var defs = svg.createSVGElement('defs');
        defs.id = 'defs';
        defs.appendChild(svg.makeDropShadow());
        this.overlay.appendChild(defs);
        // svg element won't work because it does not have negative dimensions (top-left station is partially visible)
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
        // transform may not work with svg elements
        //origin.setAttribute('x', originShift.x + 'px');
        //origin.setAttribute('y', originShift.y + 'px');
        origin.style.transform = 'translate(' + originShift.x + 'px, ' + originShift.y + 'px)';
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
        var stationCirclesFrag = document.createDocumentFragment();
        var dummyCirclesFrag = document.createDocumentFragment();
        var pathsFrag = document.createDocumentFragment();
        var transfersFrag = document.createDocumentFragment();
        var stationCircles = document.getElementById('station-circles');
        var dummyCircles = document.getElementById('dummy-circles');
        var transfers = document.getElementById('transfers');
        var paths = document.getElementById('paths');
        var whiskers = new Array(this.graph.platforms.length);
        var zoom = this.map.getZoom();
        var nw = this.bounds.getNorthWest();
        var se = this.bounds.getSouthEast();
        var svgBounds = new L.Bounds(this.map.latLngToContainerPoint(nw), this.map.latLngToContainerPoint(se));
        if (zoom < 10) {} else {
            (function () {
                var lineWidth = (zoom - 7) * 0.5;
                var circleRadius = zoom < 12 ? lineWidth * 1.25 : lineWidth;
                var circleBorder = circleRadius * 0.4;
                var transferWidth = lineWidth;
                var platformsHavingCircles = new Set();
                var posTransform = zoom < 12 ? function (platform) {
                    return _this.posOnSVG(svgBounds, _this.graph.stations[platform.station].location);
                } : function (platform) {
                    return _this.posOnSVG(svgBounds, platform.location);
                };
                var platformsOnSVG = _this2.graph.platforms.map(posTransform);

                var _loop = function (stationIndex) {
                    var station = _this2.graph.stations[stationIndex];
                    var circular = util.findCircle(_this2.graph, station);
                    var coords = [];
                    station.platforms.forEach(function (platformNum) {
                        var platform = _this.graph.platforms[platformNum];
                        var posOnSVG = platformsOnSVG[platformNum];
                        var ci = svg.makeCircle(posOnSVG, circleRadius);
                        svg.convertToStation(ci, 'p-' + platformNum, platform, circleBorder);
                        ci.setAttribute('data-station', stationIndex.toString());
                        //ci.dataset['station'] = stationIndex.toString();
                        var dummyCircle = svg.makeCircle(posOnSVG, circleRadius * 2);
                        dummyCircle.classList.add('invisible-circle');
                        //dummyCircle.dataset['platformId'] = ci.id;
                        dummyCircle.setAttribute('data-platformId', ci.id);
                        stationCirclesFrag.appendChild(ci);
                        dummyCirclesFrag.appendChild(dummyCircle);
                        dummyCircle.onmouseover = _this.showPlate;
                        //dummyCircle.onmouseout = e => this.overlay.removeChild(document.getElementById('plate'));
                        // control points
                        if (platform.spans.length === 2) {
                            (function () {
                                var midPts = [posOnSVG, posOnSVG];
                                var lens = [0, 0];
                                var firstSpan = _this.graph.spans[platform.spans[0]];
                                if (firstSpan.source === platformNum) {
                                    platform.spans.reverse();
                                }
                                for (var i = 0; i < 2; ++i) {
                                    var span = _this.graph.spans[platform.spans[i]];
                                    var neighborNum = span.source === platformNum ? span.target : span.source;
                                    var neighbor = _this.graph.platforms[neighborNum];
                                    var neighborOnSVG = platformsOnSVG[neighborNum];
                                    lens[i] = posOnSVG.distanceTo(neighborOnSVG);
                                    midPts[i] = posOnSVG.add(neighborOnSVG).divideBy(2);
                                }
                                var mdiff = midPts[1].subtract(midPts[0]).multiplyBy(lens[0] / (lens[0] + lens[1]));
                                var mm = midPts[0].add(mdiff);
                                var diff = posOnSVG.subtract(mm);
                                whiskers[platformNum] = midPts.map(function (midPt) {
                                    return midPt.add(diff);
                                });
                            })();
                        } else if (platform.spans.length === 3) {
                            var midPts = [posOnSVG, posOnSVG];
                            var lens = [0, 0];
                            var nexts = [],
                                prevs = [];
                            for (var i = 0; i < 3; ++i) {
                                var span = _this.graph.spans[platform.spans[i]];
                                //(span.source === platformNum ? outSpans : inSpans).push(span);
                                if (span.source === platformNum) {
                                    var neighbor = _this.graph.platforms[span.target];
                                    var neighborPos = platformsOnSVG[span.target];
                                    nexts.push(neighborPos);
                                } else {
                                    var neighbor = _this.graph.platforms[span.source];
                                    var neighborPos = platformsOnSVG[span.source];
                                    prevs.push(neighborPos);
                                }
                            }
                            var prev = prevs.length === 1 ? prevs[0] : prevs[0].add(prevs[1]).divideBy(2);
                            var next = nexts.length === 1 ? nexts[0] : nexts[0].add(nexts[1]).divideBy(2);
                            var distToPrev = posOnSVG.distanceTo(prev),
                                distToNext = posOnSVG.distanceTo(next);
                            var midPtPrev = posOnSVG.add(prev).divideBy(2),
                                midPtNext = posOnSVG.add(next).divideBy(2);
                            var mdiff = midPtNext.subtract(midPtPrev).multiplyBy(distToPrev / (distToPrev + distToNext));
                            var mm = midPtPrev.add(mdiff);
                            var diff = posOnSVG.subtract(mm);
                            whiskers[platformNum] = [midPtPrev.add(diff), midPtNext.add(diff)];
                        } else {
                            whiskers[platformNum] = [posOnSVG, posOnSVG];
                        }
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
                        circumcircle.style.strokeWidth = transferWidth.toString();
                        circumcircle.style.opacity = '0.25';
                        transfersFrag.appendChild(circumcircle);
                    }
                };

                for (var stationIndex = 0; stationIndex < _this2.graph.stations.length; ++stationIndex) {
                    _loop(stationIndex);
                }
                for (var i = 0; i < _this2.graph.spans.length; ++i) {
                    var span = _this2.graph.spans[i];
                    var srcN = span.source,
                        trgN = span.target;
                    var src = _this2.graph.platforms[srcN];
                    var trg = _this2.graph.platforms[trgN];
                    var bezier = svg.makeCubicBezier([platformsOnSVG[srcN], whiskers[srcN][1], whiskers[trgN][0], platformsOnSVG[trgN]]);
                    var routes = span.routes.map(function (n) {
                        return _this.graph.routes[n];
                    });
                    var matches = routes[0].line.match(/[MEL](\d{1,2})/);
                    bezier.style.strokeWidth = lineWidth.toString();
                    if (matches) {
                        bezier.classList.add(matches[0]);
                    }
                    bezier.classList.add(routes[0].line.charAt(0) + '-line');
                    pathsFrag.appendChild(bezier);
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
                    transfer.style.strokeWidth = transferWidth.toString();
                    transfer.style.opacity = '0.25';
                    transfersFrag.appendChild(transfer);
                });
            })();
        }
        stationCircles.appendChild(stationCirclesFrag);
        dummyCircles.appendChild(dummyCirclesFrag);
        paths.appendChild(pathsFrag);
        document.getElementById('transfers').appendChild(transfersFrag);
    };
    return MetroMap;
})();
module.exports = MetroMap;
//export default MetroMap;


},{"./addons":1,"./svg":4,"./util":5}],4:[function(require,module,exports){
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
function convertToStation(circle, id, data, circleBorder) {
    circle.id = id;
    circle.classList.add('station-circle');
    circle.style.strokeWidth = circleBorder.toString();
    util.setSVGDataset(circle, {
        lat: data.location.lat,
        lng: data.location.lng,
        ru: data.name,
        fi: data.altName
    });
}
exports.convertToStation = convertToStation;
function makeCubicBezier(controlPoints) {
    if (controlPoints.length !== 4) {
        throw new Error('there should be 4 points');
    }
    var path = createSVGElement('path');
    var s = controlPoints.map(function (pt) {
        return pt.x + ',' + pt.y;
    });
    s.unshift('M');
    s.splice(2, 0, 'C');
    //let d = controlPoints.reduce((prev, cp, i) => `${prev}${i === 1 ? ' C ' : ' '}${cp.x},${cp.y}`, 'M');
    path.setAttribute('d', s.join(' '));
    return path;
}
exports.makeCubicBezier = makeCubicBezier;
function createSVGElement(tagName) {
    return document.createElementNS('http://www.w3.org/2000/svg', tagName);
}
exports.createSVGElement = createSVGElement;
function makeForeignDiv(topLeft, text) {
    var foreign = createSVGElement('foreignObject');
    //foreign.setAttribute('requiredExtensions', 'http://www.w3.org/1999/xhtml');
    foreign.setAttribute('x', topLeft.x.toString());
    foreign.setAttribute('y', topLeft.y.toString());
    foreign.setAttribute('width', '200');
    foreign.setAttribute('height', '50');
    //let div = <HTMLElement>document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
    var div = document.createElement('div');
    div.innerHTML = text;
    div.classList.add('plate-box');
    div.classList.add('plate-text');
    foreign.appendChild(div);
    return foreign;
}
function makeDropShadow() {
    var filter = createSVGElement('filter');
    filter.id = 'shadow';
    filter.setAttribute('width', '200%');
    filter.setAttribute('height', '200%');
    filter.innerHTML = '\n        <feOffset result="offOut" in="SourceAlpha" dx="0" dy="2" />\n        <feGaussianBlur result="blurOut" in="offOut" stdDeviation="2" />\n        <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />\n    ';
    return filter;
}
exports.makeDropShadow = makeDropShadow;
function makeFittingRect(bottomRight, lines) {
    var rect = svg.createSVGElement('rect');
    var spacing = 12;
    var longest = lines.reduce(function (prev, cur) {
        return prev.length < cur.length ? cur : prev;
    });
    var rectSize = new L.Point(10 + longest.length * 6, 6 + spacing * lines.length);
    rect.setAttribute('width', rectSize.x.toString());
    rect.setAttribute('height', rectSize.y.toString());
    var rectTopLeft = bottomRight.subtract(rectSize);
    rect.setAttribute('x', rectTopLeft.x.toString());
    rect.setAttribute('y', rectTopLeft.y.toString());
    rect.setAttribute('filter', 'url(#shadow)');
    rect.classList.add('plate-box');
    var text = svg.createSVGElement('text');
    text.setAttribute('fill', 'black');
    text.classList.add('plate-text');
    for (var i = 0; i < lines.length; ++i) {
        var textTopLeft = bottomRight.subtract(new L.Point(3, rectSize.y - (i + 1) * spacing));
        var t = svg.createSVGElement('tspan');
        t.setAttribute('x', textTopLeft.x.toString());
        t.setAttribute('y', textTopLeft.y.toString());
        t.textContent = lines[i];
        text.appendChild(t);
    }
    var plate = svg.createSVGElement('g');
    plate.appendChild(rect);
    plate.appendChild(text);
    return plate;
}
function makePlate(circle) {
    var plateGroup = svg.createSVGElement('g');
    var pole = svg.createSVGElement('line');
    var c = new L.Point(Number(circle.getAttribute('cx')), Number(circle.getAttribute('cy')));
    var r = Number(circle.getAttribute('r'));
    var iR = Math.trunc(r);
    var poleSize = new L.Point(4 + iR, 8 + iR);
    var poleBounds = new L.Bounds(c, c.subtract(poleSize));
    pole.setAttribute('x1', poleBounds.min.x.toString());
    pole.setAttribute('y1', poleBounds.min.y.toString());
    pole.setAttribute('x2', poleBounds.max.x.toString());
    pole.setAttribute('y2', poleBounds.max.y.toString());
    pole.classList.add('plate-pole');
    var dataset = util.getSVGDataset(circle);
    var ru = dataset['ru'];
    var fi = dataset['fi'];
    var names = !fi ? [ru] : util.getUserLanguage() === 'fi' ? [fi, ru] : [ru, fi];
    if (ru in util.englishStationNames) {
        names.push(util.englishStationNames[ru]);
    }
    var plate = makeFittingRect(poleBounds.min, names);
    //let foreignObject = makeForeignDiv(rectTopLeft, !fi ? ru : util.getUserLanguage() === 'fi' ? fi + '<br>' + ru : ru + '<br>' + fi);
    var sw = svg.createSVGElement('switch');
    //sw.appendChild(foreignObject); // to fix later
    sw.appendChild(plate);
    plateGroup.appendChild(pole);
    plateGroup.appendChild(sw);
    plateGroup.id = 'plate';
    return plateGroup;
}
exports.makePlate = makePlate;


},{"./svg":4,"./util":5}],5:[function(require,module,exports){
/// <reference path="./../typings/tsd.d.ts" />
'use strict';

var L = window.L;
function getUserLanguage() {
    return (navigator.userLanguage || navigator.language).slice(0, 2).toLowerCase();
}
exports.getUserLanguage = getUserLanguage;
function parseTransform(val) {
    var matches = val.match(/translate(3d)?\((-?\d+).*?,\s?(-?\d+).*?(,\s?(-?\d+).*?)?\)/i);
    return matches ? new L.Point(Number(matches[2]), Number(matches[3])) : new L.Point(0, 0);
}
exports.parseTransform = parseTransform;
function findCircle(graph, station) {
    var platforms = station.platforms.map(function (platformNum) {
        return graph.platforms[platformNum];
    });
    return platforms.length === 3 && platforms.every(function (platform) {
        return platform.transfers.length === 2;
    }) ? platforms : null;
}
exports.findCircle = findCircle;
function getCircumcenter(positions) {
    if (positions.length !== 3) {
        throw new Error('must have 3 vertices');
    }
    console.log(positions[1]);
    var b = positions[1].subtract(positions[0]);
    var c = positions[2].subtract(positions[0]);
    var bb = b.x * b.x + b.y * b.y;
    var cc = c.x * c.x + c.y * c.y;
    return new L.Point(c.y * bb - b.y * cc, b.x * cc - c.x * bb).divideBy(2.0 * (b.x * c.y - b.y * c.x)).add(positions[0]);
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
exports.englishStationNames = {
    'Centraľnyj voxal': 'Central Raiway Station',
    'Aeroport': 'Airport'
};
function dot(a, b) {
    return a.x * b.x + a.y * b.y;
}
exports.dot = dot;
function angle(v1, v2) {
    return dot(v1, v2) / v1.distanceTo(v2);
}
exports.angle = angle;
//export function getSegmentLength(source: L.Point, target: L.Point): number {
//    const a = target.subtract(source);
//    return Math.sqrt(a.x * a.x + a.y * a.y);
//}


},{}]},{},[2]);
