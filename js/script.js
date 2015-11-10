(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
var __awaiter = this && this.__awaiter || function (thisArg, _arguments, Promise, generator) {
    return new Promise(function (resolve, reject) {
        generator = generator.call(thisArg, _arguments);
        function cast(value) {
            return value instanceof Promise && value.constructor === Promise ? value : new Promise(function (resolve) {
                resolve(value);
            });
        }
        function onfulfill(value) {
            try {
                step("next", value);
            } catch (e) {
                reject(e);
            }
        }
        function onreject(value) {
            try {
                step("throw", value);
            } catch (e) {
                reject(e);
            }
        }
        function step(verb, value) {
            var result = generator[verb](value);
            result.done ? resolve(result.value) : cast(result.value).then(onfulfill, onreject);
        }
        step("next", void 0);
    });
};
var L = window.L;
var LayerControl = (function () {
    function LayerControl(tileLayers, otherLayers) {
        if (otherLayers === void 0) {
            otherLayers = null;
        }
        this.layerControl = L.control['UniForm'](tileLayers, otherLayers, {
            collapsed: false,
            position: 'topright'
        });
    }
    LayerControl.prototype.addTo = function (map) {
        // add control widget to map and html dom.
        this.layerControl.addTo(map);
        // update the control widget to the specific theme.
        this.layerControl.renderUniformControl();
    };
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


},{}],3:[function(require,module,exports){
var __awaiter = this && this.__awaiter || function (thisArg, _arguments, Promise, generator) {
    return new Promise(function (resolve, reject) {
        generator = generator.call(thisArg, _arguments);
        function cast(value) {
            return value instanceof Promise && value.constructor === Promise ? value : new Promise(function (resolve) {
                resolve(value);
            });
        }
        function onfulfill(value) {
            try {
                step("next", value);
            } catch (e) {
                reject(e);
            }
        }
        function onreject(value) {
            try {
                step("throw", value);
            } catch (e) {
                reject(e);
            }
        }
        function step(verb, value) {
            var result = generator[verb](value);
            result.done ? resolve(result.value) : cast(result.value).then(onfulfill, onreject);
        }
        step("next", void 0);
    });
};
var metro_map_1 = require('./metro-map');
var util = require('../util');
//import MetroMap from './metro-map';
if (L.Browser.ie) {
    alert("Does not work in IE (yet)");
} else if (L.Browser.mobile) {
    alert("May work incorrectly in mobile browser");
}
var polyfills_1 = require('./polyfills');
polyfills_1.default();
var tilelayers_1 = require('./tilelayers');
var metroMap = new metro_map_1.default('map-container', 'json/graph.json', tilelayers_1.default);
util.flashTitle(['Plan metro Sankt-Peterburga', 'Pietarin metron hankesuunnitelma', 'St Petersburg metro plan proposal'], 3000);
console.log('user: ' + navigator.userLanguage);
console.log('language: ' + navigator.language);
console.log('browser: ' + navigator.browserLanguage);
console.log('system: ' + navigator.systemLanguage);
/* TODO:
1. FAQ with user with the following questions:
a. why is everything in latinica
b. why have some stations been renamed
c. why have new stations been embedded between old ones
d. st petersburg's climate not suited for overground railway (there are suburban trains... look at helsinki)
e. wtf is ingria, why are the stations dubbed in finnish
f. there's no money for it (whose fault is it?)
g. i do not agree with the network, where's the station near my home (propose your own)
h. malfunctioning in IE (get a normal browser ffs)
i. why junctions have single name
 */ /**/


},{"../util":62,"./metro-map":4,"./polyfills":5,"./tilelayers":7}],4:[function(require,module,exports){
var __awaiter = this && this.__awaiter || function (thisArg, _arguments, Promise, generator) {
    return new Promise(function (resolve, reject) {
        generator = generator.call(thisArg, _arguments);
        function cast(value) {
            return value instanceof Promise && value.constructor === Promise ? value : new Promise(function (resolve) {
                resolve(value);
            });
        }
        function onfulfill(value) {
            try {
                step("next", value);
            } catch (e) {
                reject(e);
            }
        }
        function onreject(value) {
            try {
                step("throw", value);
            } catch (e) {
                reject(e);
            }
        }
        function step(verb, value) {
            var result = generator[verb](value);
            result.done ? resolve(result.value) : cast(result.value).then(onfulfill, onreject);
        }
        step("next", void 0);
    });
};
var L = window.L;
var svg = require('./svg');
var util = require('../util');
var addons = require('./addons');
var MetroMap = (function () {
    function MetroMap(containerId, kml, tileLayers) {
        var _this = this;
        this.whiskers = [];
        var fetch = window['fetch'];
        var graphPromise = fetch(kml).then(function (graphText) {
            return graphText.json();
        }).then(function (graphJSON) {
            return _this.graph = graphJSON;
        });
        var hintsPromise = fetch('json/hints.json').then(function (hintsText) {
            return hintsText.json();
        }).then(function (hintsJSON) {
            return _this.hints = hintsJSON;
        });
        var dataPromise = fetch('json/data.json').then(function (dataText) {
            return dataText.json();
        }).then(function (dataJSON) {
            return _this.textData = dataJSON;
        });
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
        var container = this.map.getContainer();
        container.removeChild(this.overlay);
        container.appendChild(this.overlay);
        this.addMapListeners();
        graphPromise.catch(function (errText) {
            return alert(errText);
        }).then(function (graphJson) {
            return _this.extendBounds();
        }) // because the previous assignment returns json
        .then(function () {
            return hintsPromise;
        }).then(function (hintsJson) {
            return _this.redrawNetwork();
        }).then(function () {
            return _this.map.invalidateSize(false);
        }).then(function () {
            return _this.resetMapView();
        }).then(function () {
            return _this.fixFontRendering(_this.map.getPanes().mapPane);
        }).then(function () {
            return dataPromise;
        }).then(function () {
            return document.getElementById('edit-map-button').addEventListener('click', _this.editMapClick.bind(_this));
        });
        Promise.all([graphPromise, hintsPromise]).then(function (results) {
            return util.verifyHints(_this.graph, _this.hints);
        }).then(function (response) {
            return console.log(response);
        }).catch(function (err) {
            return console.error(err);
        });
    }
    MetroMap.prototype.getMap = function () {
        return this.map;
    };
    MetroMap.prototype.getOverlay = function () {
        return this.overlay;
    };
    MetroMap.prototype.addMapListeners = function () {
        var _this = this;
        var mapPane = this.map.getPanes().mapPane;
        this.map.on('movestart', function (e) {
            return _this.map.touchZoom.disable();
        });
        this.map.on('move', function (e) {
            //this.overlay.style['-webkit-transition'] = mapPane.style['-webkit-transition'];
            //this.overlay.style.transition = mapPane.style.transition;
            _this.overlay.style.transform = mapPane.style.transform;
        });
        // the secret of correct positioning is the movend transform check for corrent transform
        this.map.on('moveend', function (e) {
            console.log('move ended');
            _this.map.touchZoom.enable();
            //this.overlay.style['-webkit-transition'] = null;
            //this.overlay.style.transition = null;
            _this.fixFontRendering(mapPane);
        });
        this.map.on('zoomstart', function (e) {
            _this.map.dragging.disable();
            console.log(e);
            //this.overlay.classList.add('leaflet-zoom-anim');
            _this.overlay.style.opacity = '0.5';
        });
        this.map.on('zoomend', function (e) {
            console.log(e);
            console.log('zoom ended');
            _this.redrawNetwork();
            //this.overlay.classList.remove('leaflet-zoom-anim');
            _this.overlay.style.opacity = null;
            _this.map.dragging.enable();
        });
    };
    /**
     * Fixes blurry font due to 'transform3d' CSS property. Changes everything to 'transform' when the map is not moving
     * @param mapPane
     */
    MetroMap.prototype.fixFontRendering = function (mapPane) {
        var t3d = util.parseTransform(mapPane.style.transform);
        this.overlay.style.transform = mapPane.style.transform = "translate(" + t3d.x + "px, " + t3d.y + "px)";
    };
    MetroMap.prototype.resetMapView = function () {
        //this.map.addLayer(L.circle(L.LatLng(60, 30), 10));
        //this.overlay = <HTMLElement>this.map.getPanes().overlayPane.children[0];
        this.map.setView(this.bounds.getCenter(), L.Browser.retina ? 12 : 11, {
            pan: { animate: false },
            zoom: { animate: false }
        });
    };
    MetroMap.prototype.resetOverlayStructure = function () {
        var child;
        while (child = this.overlay.firstChild) {
            this.overlay.removeChild(child);
        }
        var defs = svg.createSVGElement('defs');
        defs.appendChild(svg.makeDropShadow());
        this.overlay.appendChild(defs);
        // svg element won't work because it does not have negative dimensions
        // (top-left station is partially visible)
        var origin = svg.createSVGElement('g');
        origin.id = 'origin';
        // paths-outer, paths-inner, transfers-outer, station-circles, transfers-inner, dummy-circles
        for (var _i = 0, _a = ['paths-outer', 'paths-inner', 'transfers-outer', 'station-circles', 'transfers-inner', 'dummy-circles']; _i < _a.length; _i++) {
            var groupId = _a[_i];
            var group = svg.createSVGElement('g');
            group.id = groupId;
            origin.appendChild(group);
        }
        this.overlay.appendChild(origin);
        var stationCircles = document.getElementById('station-circles');
        stationCircles.classList.add('station-circle');
        origin.insertBefore(svg.makePlate(), document.getElementById('dummy-circles'));
    };
    MetroMap.prototype.extendBounds = function () {
        var _this = this;
        var a = this.graph.platforms[0].location;
        this.bounds = new L.LatLngBounds(a, a);
        this.graph.platforms.forEach(function (platform) {
            return _this.bounds.extend(platform.location);
        });
    };
    MetroMap.prototype.addBindings = function () {
        var _this = this;
        this.graph.platforms.forEach(function (platform, i) {
            var circle = document.getElementById('p-' + i);
            var dummyCircle = document.getElementById('d-' + i);
            var cached = platform.location; // bring down
            Object.defineProperty(platform, 'location', {
                get: function () {
                    return platform['_location'];
                },
                set: function (location) {
                    platform['_location'] = location;
                    var locForPos = _this.map.getZoom() < 12 ? _this.graph.stations[platform.station].location : location;
                    var pos = _this.map.latLngToContainerPoint(locForPos).subtract(_this.map.latLngToContainerPoint(_this.bounds.getNorthWest()));
                    circle.setAttribute('cx', pos.x.toString());
                    circle.setAttribute('cy', pos.y.toString());
                    dummyCircle.setAttribute('cx', pos.x.toString());
                    dummyCircle.setAttribute('cy', pos.y.toString());
                    _this.whiskers[i] = _this.makeWhiskers(i);
                    for (var _i = 0, _a = platform.spans; _i < _a.length; _i++) {
                        var spanIndex = _a[_i];
                        var paths = document.querySelectorAll("[id$=\"er-" + spanIndex + "\"]");
                        var span = _this.graph.spans[spanIndex];
                        var srcN = span.source,
                            trgN = span.target;
                        if (platform === _this.graph.platforms[srcN]) {
                            _this.platformsOnSVG[srcN] = pos;
                        } else {
                            _this.platformsOnSVG[trgN] = pos;
                        }
                        var controlPoints = [_this.platformsOnSVG[srcN], _this.whiskers[srcN][spanIndex], _this.whiskers[trgN][spanIndex], _this.platformsOnSVG[trgN]];
                        for (var pi = 0; pi < paths.length; ++pi) {
                            svg.setBezierPath(paths[pi], controlPoints);
                        }
                    }
                }
            });
            platform['_location'] = cached;
        });
    };
    MetroMap.prototype.connectSpanToPlatform = function (platform, span) {
        Object.defineProperty(platform, 'location', {
            get: function () {
                return platform.location;
            },
            set: function (location) {}
        });
    };
    MetroMap.prototype.editMapClick = function (e) {
        // change station name (change -> model (platform))
        // drag station to new location (drag -> model (platform, spans) -> paths, )
        // create new station (create -> model)
        // drag line over the station to bind them
        var _this = this;
        var button = e.target;
        var textState = ['Edit Map', 'Save Map'];
        var dummyCircles = document.getElementById('dummy-circles');
        if (button.textContent === textState[0]) {
            dummyCircles.onmousedown = function (evt) {
                if (evt.button !== 0) return;
                var circle = svg.circleByDummy(evt.target);
                var platform = svg.platformByCircle(circle, _this.graph);
                _this.map.dragging.disable();
                _this.map.on('mousemove', function (le) {
                    return platform.location = le.latlng;
                });
                _this.map.once('mouseup', function (le) {
                    return _this.map.off('mousemove');
                });
            };
            dummyCircles.onclick = function (evt) {
                if (evt.button === 3) {
                    var platform = svg.platformByDummy(evt.target, _this.graph);
                    var ru = platform.name;
                    var fi = platform.altNames['fi'];
                    var en = platform.altNames['en'];
                    var names = !fi ? [ru] : util.getUserLanguage() === 'fi' ? [fi, ru] : [ru, fi];
                    if (en) names.push(en);
                    _a = prompt('New name', names.join('|')).split('|'), ru = _a[0], fi = _a[1], en = _a[2];
                    platform.name = ru;
                    platform.altNames['fi'] = fi;
                    if (en) {
                        platform.altNames['en'] = en;
                    }
                }
                var _a;
            };
            button.textContent = textState[1];
        } else if (button.textContent === textState[1]) {
            var content = JSON.stringify(this.graph, function (key, val) {
                return key.startsWith('_') ? undefined : val;
            });
            util.downloadAsFile('graph.json', content);
            dummyCircles.onmousedown = dummyCircles.onclick = null;
            button.textContent = textState[0];
        } else {
            throw new Error('Incorrect button text');
        }
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
    MetroMap.prototype.updateOverlayPositioning = function () {
        var nw = this.bounds.getNorthWest(),
            se = this.bounds.getSouthEast();
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
        origin.style.transform = "translate(" + originShift.x + "px, " + originShift.y + "px)";
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
        var _this = this;
        this.resetOverlayStructure();
        this.updateOverlayPositioning();
        var docFrags = {
            'station-circles': document.createDocumentFragment(),
            'dummy-circles': document.createDocumentFragment(),
            'paths-inner': document.createDocumentFragment(),
            'paths-outer': document.createDocumentFragment(),
            'transfers-inner': document.createDocumentFragment(),
            'transfers-outer': document.createDocumentFragment()
        };
        var stationPlate = document.getElementById('station-plate');
        var zoom = this.map.getZoom();
        var nw = this.bounds.getNorthWest();
        var se = this.bounds.getSouthEast();
        var svgBounds = new L.Bounds(this.map.latLngToContainerPoint(nw), this.map.latLngToContainerPoint(se));
        document.getElementById('edit-map-button').disabled = zoom < 12;
        var posTransform = zoom < 12 ? function (platform) {
            return _this.posOnSVG(svgBounds, _this.graph.stations[platform.station].location);
        } : function (platform) {
            return _this.posOnSVG(svgBounds, platform.location);
        };
        this.platformsOnSVG = this.graph.platforms.map(posTransform);
        var lineWidth = (zoom - 7) * 0.5;
        var circleRadius = zoom < 12 ? lineWidth * 1.25 : lineWidth;
        var circleBorder = zoom < 12 ? circleRadius * 0.4 : circleRadius * 0.6;
        var transferWidth = lineWidth;
        if (L.Browser.retina) {
            _a = [lineWidth, circleRadius, circleBorder, transferWidth].map(function (item) {
                return item * 1.5;
            }), lineWidth = _a[0], circleRadius = _a[1], circleBorder = _a[2], transferWidth = _a[3];
        }
        document.getElementById('station-circles').style.strokeWidth = circleBorder + 'px';
        var platformsInCircles = new Set();
        for (var stationIndex = 0; stationIndex < this.graph.stations.length; ++stationIndex) {
            var station = this.graph.stations[stationIndex];
            var circular = util.findCircle(this.graph, station);
            var circumpoints = [];
            station.platforms.forEach(function (platformIndex) {
                var platform = _this.graph.platforms[platformIndex];
                var posOnSVG = _this.platformsOnSVG[platformIndex];
                if (zoom > 9) {
                    var ci = svg.makeCircle(posOnSVG, circleRadius);
                    ci.id = 'p-' + platformIndex;
                    //util.setSVGDataset(ci, {
                    //    station: stationIndex,
                    //    lat: platform.location.lat,
                    //    lng: platform.location.lng,
                    //    ru: platform.name,
                    //    fi: platform.altNames['fi'],
                    //});
                    //const en = this.hints.englishNames[platform.name];
                    //if (en) {
                    //    util.setSVGDataset(ci, { en: en });
                    //}
                    if (zoom > 11) {
                        var lines = new Set();
                        for (var _i = 0, _a = platform.spans; _i < _a.length; _i++) {
                            var spanIndex = _a[_i];
                            for (var _b = 0, _c = _this.graph.spans[spanIndex].routes; _b < _c.length; _b++) {
                                var routeIndex = _c[_b];
                                lines.add(_this.graph.routes[routeIndex].line);
                            }
                        }
                        if (lines.size === 1) {
                            var matches = lines.values().next().value.match(/([MEL])(\d{0,2})/);
                            if (matches) {
                                ci.classList.add(matches[1] === 'M' ? matches[0] : matches[1] + '-line');
                            }
                        }
                    }
                    var dummyCircle = svg.makeCircle(posOnSVG, circleRadius * 2);
                    dummyCircle.id = 'd-' + platformIndex;
                    dummyCircle.classList.add('invisible-circle');
                    dummyCircle.setAttribute('data-platformId', ci.id);
                    //dummyCircle.onmouseover = svg.showPlate;
                    //dummyCircle.onmouseout = e => stationPlate.style.display = 'none';
                    docFrags['station-circles'].appendChild(ci);
                    docFrags['dummy-circles'].appendChild(dummyCircle);
                }
                _this.whiskers[platformIndex] = _this.makeWhiskers(platformIndex);
                if (circular && circular.indexOf(platform) > -1) {
                    circumpoints.push(posOnSVG);
                    platformsInCircles.add(platformIndex);
                }
            });
            var dummyCircles = document.getElementById('dummy-circles');
            dummyCircles.addEventListener('mouseover', function (e) {
                var circle = svg.circleByDummy(e.target);
                var g = svg.modifyPlate(circle, _this.graph);
                g.style.display = null;
            });
            dummyCircles.onmouseout = function (e) {
                return stationPlate.style.display = 'none';
            };
            if (zoom > 11 && circular) {
                var cCenter = util.getCircumcenter(circumpoints);
                var cRadius = cCenter.distanceTo(circumpoints[0]);
                var cCircle = svg.makeTransferRing(cCenter, cRadius, transferWidth, circleBorder);
                docFrags['transfers-outer'].appendChild(cCircle[0]);
                docFrags['transfers-inner'].appendChild(cCircle[1]);
            }
        }
        if (zoom > 11) {
            this.graph.transfers.forEach(function (tr) {
                if (platformsInCircles.has(tr.source) && platformsInCircles.has(tr.target)) return;
                var pl1 = _this.graph.platforms[tr.source],
                    pl2 = _this.graph.platforms[tr.target],
                    transferPos = [_this.posOnSVG(svgBounds, pl1.location), _this.posOnSVG(svgBounds, pl2.location)],
                    transfer = svg.makeTransfer(transferPos[0], transferPos[1], transferWidth, circleBorder);
                docFrags['transfers-outer'].appendChild(transfer[0]);
                docFrags['transfers-inner'].appendChild(transfer[1]);
            });
        }
        for (var i = 0; i < this.graph.spans.length; ++i) {
            var paths = this.makePath(i, lineWidth);
            docFrags['paths-outer'].appendChild(paths[0]);
            if (paths.length > 1) {
                docFrags['paths-inner'].appendChild(paths[1]);
            }
        }
        for (var _i = 0, _b = Object.keys(docFrags); _i < _b.length; _i++) {
            var i = _b[_i];
            document.getElementById(i).appendChild(docFrags[i]);
        }
        this.addBindings();
        var _a;
    };
    MetroMap.prototype.makeWhiskers = function (platformIndex) {
        var _this = this;
        var platform = this.graph.platforms[platformIndex];
        var posOnSVG = this.platformsOnSVG[platformIndex];
        if (platform.spans.length < 2) {
            return _a = {}, _a[platform.spans[0]] = posOnSVG, _a;
        }
        if (platform.spans.length > 2) {
            // 0 - prev, 1 - next
            var points = [[], []];
            var spanIds = [[], []];
            var dirHints = this.hints.crossPlatform;
            var idx = util.hintContainsLine(this.graph, dirHints, platform);
            if (platform.name in dirHints && idx !== null) {
                // array or object
                var platformHints = idx > -1 ? dirHints[platform.name][idx] : dirHints[platform.name];
                var nextPlatformNames = [];
                for (var _i = 0, _b = Object.keys(platformHints); _i < _b.length; _i++) {
                    var key = _b[_i];
                    var val = platformHints[key];
                    if (typeof val === 'string') {
                        nextPlatformNames.push(val);
                    } else {
                        val.forEach(function (i) {
                            return nextPlatformNames.push(i);
                        });
                    }
                }
                for (var _c = 0, _d = platform.spans; _c < _d.length; _c++) {
                    var spanIndex = _d[_c];
                    var span = this.graph.spans[spanIndex];
                    var neighborIndex = span.source === platformIndex ? span.target : span.source;
                    var neighbor = this.graph.platforms[neighborIndex];
                    var neighborPos = this.platformsOnSVG[neighborIndex];
                    var dirIdx = nextPlatformNames.indexOf(neighbor.name) > -1 ? 1 : 0;
                    points[dirIdx].push(neighborPos);
                    spanIds[dirIdx].push(spanIndex);
                }
            }
            var midPts_1 = points.map(function (pts) {
                return posOnSVG.add(pts.length === 1 ? pts[0] : pts.length === 0 ? posOnSVG : util.getCenter(pts)).divideBy(2);
            });
            var lens_1 = midPts_1.map(function (midPt) {
                return posOnSVG.distanceTo(midPt);
            });
            var mdiff_1 = midPts_1[1].subtract(midPts_1[0]).multiplyBy(lens_1[0] / (lens_1[0] + lens_1[1]));
            var mm_1 = midPts_1[0].add(mdiff_1);
            var diff_1 = posOnSVG.subtract(mm_1);
            var whisker = {};
            spanIds[0].forEach(function (spanIndex) {
                return whisker[spanIndex] = midPts_1[0].add(diff_1);
            });
            spanIds[1].forEach(function (spanIndex) {
                return whisker[spanIndex] = midPts_1[1].add(diff_1);
            });
            return whisker;
        }
        var lines = platform.spans.map(function (i) {
            return _this.graph.routes[_this.graph.spans[i].routes[0]].line;
        });
        // TODO: refactor this stuff, unify 2-span & >2-span platforms
        if (lines[0] !== lines[1]) {
            return _e = {}, _e[platform.spans[0]] = posOnSVG, _e[platform.spans[1]] = posOnSVG, _e;
        }
        var midPts = [posOnSVG, posOnSVG];
        var lens = [0, 0];
        var firstSpan = this.graph.spans[platform.spans[0]];
        if (firstSpan.source === platformIndex) {
            platform.spans.reverse();
        }
        // previous node should come first
        for (var i = 0; i < 2; ++i) {
            var span = this.graph.spans[platform.spans[i]];
            var neighborNum = span.source === platformIndex ? span.target : span.source;
            var neighborOnSVG = this.platformsOnSVG[neighborNum];
            lens[i] = posOnSVG.distanceTo(neighborOnSVG);
            midPts[i] = posOnSVG.add(neighborOnSVG).divideBy(2);
        }
        var mdiff = midPts[1].subtract(midPts[0]).multiplyBy(lens[0] / (lens[0] + lens[1]));
        var mm = midPts[0].add(mdiff);
        var diff = posOnSVG.subtract(mm);
        return _f = {}, _f[platform.spans[0]] = midPts[0].add(diff), _f[platform.spans[1]] = midPts[1].add(diff), _f;
        var _a, _e, _f;
    };
    MetroMap.prototype.makePath = function (spanIndex, lineWidth) {
        var _this = this;
        var span = this.graph.spans[spanIndex];
        var srcN = span.source,
            trgN = span.target;
        var routes = span.routes.map(function (n) {
            return _this.graph.routes[n];
        });
        var matches = routes[0].line.match(/([MEL])(\d{0,2})/);
        var bezier = svg.makeCubicBezier([this.platformsOnSVG[srcN], this.whiskers[srcN][spanIndex], this.whiskers[trgN][spanIndex], this.platformsOnSVG[trgN]]);
        bezier.id = 'inner-' + spanIndex;
        if (matches[1] === 'E') {
            var outer = bezier.cloneNode(true);
            outer.style.strokeWidth = lineWidth + 'px';
            bezier.style.strokeWidth = lineWidth / 2 + 'px';
            outer.classList.add('E');
            outer.id = 'outer-' + spanIndex;
            bezier.classList.add('E');
            return [outer, bezier];
        } else {
            bezier.style.strokeWidth = lineWidth.toString();
            if (matches) {
                bezier.classList.add(matches[0]);
            }
            bezier.classList.add(matches[1] + '-line');
            if (matches[1] === 'L') {
                bezier.style.strokeWidth = lineWidth * 0.75 + 'px';
            }
            //util.setSVGDataset(bezier, {
            //    source: span.source,
            //    target: span.target
            //});
            return [bezier];
        }
    };
    return MetroMap;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MetroMap;


},{"../util":62,"./addons":2,"./svg":6}],5:[function(require,module,exports){
var __awaiter = this && this.__awaiter || function (thisArg, _arguments, Promise, generator) {
    return new Promise(function (resolve, reject) {
        generator = generator.call(thisArg, _arguments);
        function cast(value) {
            return value instanceof Promise && value.constructor === Promise ? value : new Promise(function (resolve) {
                resolve(value);
            });
        }
        function onfulfill(value) {
            try {
                step("next", value);
            } catch (e) {
                reject(e);
            }
        }
        function onreject(value) {
            try {
                step("throw", value);
            } catch (e) {
                reject(e);
            }
        }
        function step(verb, value) {
            var result = generator[verb](value);
            result.done ? resolve(result.value) : cast(result.value).then(onfulfill, onreject);
        }
        step("next", void 0);
    });
};
/// <reference path="./../typings/tsd.d.ts" />
function addPolyfills() {
    if (!('Promise' in window) || !('then' in Promise.prototype) || !('catch' in Promise.prototype)) {
        console.log('promises not present, using a polyfill');
        require('es6-promise').polyfill();
    }
    if (!('Set' in window) || !('add' in Set.prototype) || !('has' in Set.prototype)) {
        console.log('set not present, using a polyfill');
        require('es6-set/implement');
    }
    if (!('classList' in HTMLElement.prototype)) {
        console.log('classlist not present, using a polyfill');
        require('classlist-polyfill');
    }
    if (!Array.prototype.find) {
        Array.prototype.find = function (predicate) {
            if (this == null) {
                throw new TypeError('Array.prototype.find called on null or undefined');
            }
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }
            var list = Object(this);
            var length = list.length >>> 0;
            var thisArg = arguments[1];
            var value;
            for (var i = 0; i < length; i++) {
                value = list[i];
                if (predicate.call(thisArg, value, i, list)) {
                    return value;
                }
            }
            return undefined;
        };
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = addPolyfills;


},{"classlist-polyfill":8,"es6-promise":50,"es6-set/implement":51}],6:[function(require,module,exports){
var __awaiter = this && this.__awaiter || function (thisArg, _arguments, Promise, generator) {
    return new Promise(function (resolve, reject) {
        generator = generator.call(thisArg, _arguments);
        function cast(value) {
            return value instanceof Promise && value.constructor === Promise ? value : new Promise(function (resolve) {
                resolve(value);
            });
        }
        function onfulfill(value) {
            try {
                step("next", value);
            } catch (e) {
                reject(e);
            }
        }
        function onreject(value) {
            try {
                step("throw", value);
            } catch (e) {
                reject(e);
            }
        }
        function step(verb, value) {
            var result = generator[verb](value);
            result.done ? resolve(result.value) : cast(result.value).then(onfulfill, onreject);
        }
        step("next", void 0);
    });
};
var L = window.L;
var util = require('../util');
function makeCircle(position, radius) {
    var ci = createSVGElement('circle');
    ci.setAttribute('r', radius.toString());
    ci.setAttribute('cy', position.y.toString());
    ci.setAttribute('cx', position.x.toString());
    return ci;
}
exports.makeCircle = makeCircle;
function getBezierPath(path) {
    var matches = path.getAttribute('d').match(/M\s*(.+?),(.+?)\s*C\s*(.+?),(.+?)\s(.+?),(.+?)\s(.+?),(.+?)/);
    var numbers = matches.slice(1).map(function (m) {
        return Number(m);
    });
    var ret = [];
    for (var i = 0; i < 8; i += 2) {
        ret.push(new L.Point(numbers[i], numbers[i + 1]));
    }
    return ret;
}
exports.getBezierPath = getBezierPath;
function setBezierPath(el, controlPoints) {
    if (controlPoints.length !== 4) {
        throw new Error('there should be 4 points');
    }
    var path = createSVGElement('path');
    var s = ['M'].concat(controlPoints.map(function (pt) {
        return pt.x + "," + pt.y;
    }));
    s.splice(2, 0, 'C');
    el.setAttribute('d', s.join(' '));
}
exports.setBezierPath = setBezierPath;
function makeCubicBezier(controlPoints) {
    var path = createSVGElement('path');
    setBezierPath(path, controlPoints);
    return path;
}
exports.makeCubicBezier = makeCubicBezier;
function cutCubicBezier(controlPoints, fraction) {
    function red(cps) {
        var pts = new Array(cps.length - 1);
        for (var i = 0; i < pts.length; ++i) {
            pts[0] = cps[i].add(cps[i + 1].subtract(cps[i]).multiplyBy(fraction));
        }
        return pts;
    }
    var newArr = new Array(controlPoints.length);
    var pts = controlPoints.slice(0, controlPoints.length);
    do {
        newArr.push(pts[0]);
        pts = red(pts);
    } while (pts.length > 0);
    return newArr;
}
exports.cutCubicBezier = cutCubicBezier;
function makeTransferRing(center, radius, thickness, borderWidth) {
    var classes = ['transfer-outer', 'transfer-inner'];
    var halfBorder = borderWidth * 0.5;
    return [thickness + halfBorder, thickness - halfBorder].map(function (t, index) {
        var ring = makeCircle(center, radius);
        ring.style.strokeWidth = t + 'px';
        ring.classList.add(classes[index]);
        return ring;
    });
}
exports.makeTransferRing = makeTransferRing;
function makeTransfer(start, end, thickness, borderWidth) {
    var classes = ['transfer-outer', 'transfer-inner'];
    var halfBorder = borderWidth * 0.5;
    return [thickness + halfBorder, thickness - halfBorder].map(function (t, index) {
        var line = createSVGElement('line');
        line.setAttribute('x1', start.x.toString());
        line.setAttribute('y1', start.y.toString());
        line.setAttribute('x2', end.x.toString());
        line.setAttribute('y2', end.y.toString());
        line.style.strokeWidth = t + 'px';
        line.classList.add(classes[index]);
        return line;
    });
}
exports.makeTransfer = makeTransfer;
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
    filter.innerHTML = "\n        <feOffset result=\"offOut\" in=\"SourceAlpha\" dx=\"0\" dy=\"2\" />\n        <feGaussianBlur result=\"blurOut\" in=\"offOut\" stdDeviation=\"2\" />\n        <feBlend in=\"SourceGraphic\" in2=\"blurOut\" mode=\"normal\" />\n    ";
    return filter;
}
exports.makeDropShadow = makeDropShadow;
function makePlate() {
    var stationPlate = createSVGElement('g');
    stationPlate.id = 'station-plate';
    stationPlate.style.display = 'none';
    stationPlate.innerHTML = "<line id=\"pole\" class=\"plate-pole\"/>\n            <g>\n                <rect id=\"plate-box\" class=\"plate-box\" filter=\"url(#shadow)\"/>\n                <text id=\"plate-text\" fill=\"black\" class=\"plate-text\"><tspan/><tspan/><tspan/></text>\n            </g>";
    return stationPlate;
}
exports.makePlate = makePlate;
function circleByDummy(dummy) {
    return document.getElementById('p-' + dummy.id.slice(2));
}
exports.circleByDummy = circleByDummy;
function platformByCircle(circle, graph) {
    return graph.platforms[parseInt(circle.id.slice(2))];
}
exports.platformByCircle = platformByCircle;
function platformByDummy(dummy, graph) {
    return graph.platforms[parseInt(dummy.id.slice(2))];
}
exports.platformByDummy = platformByDummy;
/**
 * modifies & returns the modified plate
 */
function modifyPlate(circle, graph) {
    var plateGroup = document.getElementById('station-plate');
    var c = new L.Point(Number(circle.getAttribute('cx')), Number(circle.getAttribute('cy')));
    var r = Number(circle.getAttribute('r'));
    var iR = Math.trunc(r);
    var pole = plateGroup.children[0];
    var poleSize = new L.Point(4 + iR, 8 + iR);
    var poleEnd = c.subtract(poleSize);
    pole.setAttribute('x1', c.x.toString());
    pole.setAttribute('y1', c.y.toString());
    pole.setAttribute('x2', poleEnd.x.toString());
    pole.setAttribute('y2', poleEnd.y.toString());
    var platform = graph.platforms[parseInt(circle.id.slice(2))];
    var ru = platform.name;
    var fi = platform.altNames['fi'];
    var en = platform.altNames['en'];
    var names = !fi ? [ru] : util.getUserLanguage() === 'fi' ? [fi, ru] : [ru, fi];
    if (en) names.push(en);
    modifyPlateBox(poleEnd, names);
    return plateGroup;
}
exports.modifyPlate = modifyPlate;
function modifyPlateBox(bottomRight, lines) {
    var rect = document.getElementById('plate-box');
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
    var text = document.getElementById('plate-text');
    for (var i = 0; i < lines.length; ++i) {
        var textTopLeft = bottomRight.subtract(new L.Point(3, rectSize.y - (i + 1) * spacing));
        var t = text.children[i];
        t.setAttribute('x', textTopLeft.x.toString());
        t.setAttribute('y', textTopLeft.y.toString());
        t.textContent = lines[i];
    }
    while (i < text.children.length) {
        text.children[i++].textContent = null;
    }
}


},{"../util":62}],7:[function(require,module,exports){
var __awaiter = this && this.__awaiter || function (thisArg, _arguments, Promise, generator) {
    return new Promise(function (resolve, reject) {
        generator = generator.call(thisArg, _arguments);
        function cast(value) {
            return value instanceof Promise && value.constructor === Promise ? value : new Promise(function (resolve) {
                resolve(value);
            });
        }
        function onfulfill(value) {
            try {
                step("next", value);
            } catch (e) {
                reject(e);
            }
        }
        function onreject(value) {
            try {
                step("throw", value);
            } catch (e) {
                reject(e);
            }
        }
        function step(verb, value) {
            var result = generator[verb](value);
            result.done ? resolve(result.value) : cast(result.value).then(onfulfill, onreject);
        }
        step("next", void 0);
    });
};
/// <reference path="./../typings/tsd.d.ts" />
var L = window.L;
var tileLayers = {
    Mapbox: new L.TileLayer('https://{s}.tiles.mapbox.com/v3/inker.mlo91c41/{z}/{x}/{y}.png', {
        minZoom: 9,
        //id: 'inker.mlo91c41',
        detectRetina: true,
        //reuseTiles: true,
        bounds: null,
        attribution: "Map data &copy; <a href=\"https://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://mapbox.com\">Mapbox</a>"
    }),
    OpenMapSurfer: new L.TileLayer('http://openmapsurfer.uni-hd.de/tiles/roads/x={x}&y={y}&z={z}', {
        minZoom: 9,
        detectRetina: true,
        //reuseTiles: true,
        attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data &copy; <a href="https://server.ts.openstreetmap.org/copyright">OpenStreetMap</a>'
    }),
    HyddaBase: L.tileLayer('http://{s}.tile.openstreetmap.se/hydda/base/{z}/{x}/{y}.png', {
        minZoom: 9,
        detectRetina: true,
        attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="http://server.ts.openstreetmap.org/copyright">OpenStreetMap</a>'
    }),
    EsriGrey: L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        minZoom: 9,
        detectRetina: true
    })
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = tileLayers;


},{}],8:[function(require,module,exports){
/*
 * classList.js: Cross-browser full element.classList implementation.
 * 2014-07-23
 *
 * By Eli Grey, http://eligrey.com
 * Public Domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */

/*global self, document, DOMException */

/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js*/

/* Copied from MDN:
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
 */

if ("document" in window.self) {

  // Full polyfill for browsers with no classList support
  if (!("classList" in document.createElement("_"))) {

  (function (view) {

    "use strict";

    if (!('Element' in view)) return;

    var
        classListProp = "classList"
      , protoProp = "prototype"
      , elemCtrProto = view.Element[protoProp]
      , objCtr = Object
      , strTrim = String[protoProp].trim || function () {
        return this.replace(/^\s+|\s+$/g, "");
      }
      , arrIndexOf = Array[protoProp].indexOf || function (item) {
        var
            i = 0
          , len = this.length
        ;
        for (; i < len; i++) {
          if (i in this && this[i] === item) {
            return i;
          }
        }
        return -1;
      }
      // Vendors: please allow content code to instantiate DOMExceptions
      , DOMEx = function (type, message) {
        this.name = type;
        this.code = DOMException[type];
        this.message = message;
      }
      , checkTokenAndGetIndex = function (classList, token) {
        if (token === "") {
          throw new DOMEx(
              "SYNTAX_ERR"
            , "An invalid or illegal string was specified"
          );
        }
        if (/\s/.test(token)) {
          throw new DOMEx(
              "INVALID_CHARACTER_ERR"
            , "String contains an invalid character"
          );
        }
        return arrIndexOf.call(classList, token);
      }
      , ClassList = function (elem) {
        var
            trimmedClasses = strTrim.call(elem.getAttribute("class") || "")
          , classes = trimmedClasses ? trimmedClasses.split(/\s+/) : []
          , i = 0
          , len = classes.length
        ;
        for (; i < len; i++) {
          this.push(classes[i]);
        }
        this._updateClassName = function () {
          elem.setAttribute("class", this.toString());
        };
      }
      , classListProto = ClassList[protoProp] = []
      , classListGetter = function () {
        return new ClassList(this);
      }
    ;
    // Most DOMException implementations don't allow calling DOMException's toString()
    // on non-DOMExceptions. Error's toString() is sufficient here.
    DOMEx[protoProp] = Error[protoProp];
    classListProto.item = function (i) {
      return this[i] || null;
    };
    classListProto.contains = function (token) {
      token += "";
      return checkTokenAndGetIndex(this, token) !== -1;
    };
    classListProto.add = function () {
      var
          tokens = arguments
        , i = 0
        , l = tokens.length
        , token
        , updated = false
      ;
      do {
        token = tokens[i] + "";
        if (checkTokenAndGetIndex(this, token) === -1) {
          this.push(token);
          updated = true;
        }
      }
      while (++i < l);

      if (updated) {
        this._updateClassName();
      }
    };
    classListProto.remove = function () {
      var
          tokens = arguments
        , i = 0
        , l = tokens.length
        , token
        , updated = false
        , index
      ;
      do {
        token = tokens[i] + "";
        index = checkTokenAndGetIndex(this, token);
        while (index !== -1) {
          this.splice(index, 1);
          updated = true;
          index = checkTokenAndGetIndex(this, token);
        }
      }
      while (++i < l);

      if (updated) {
        this._updateClassName();
      }
    };
    classListProto.toggle = function (token, force) {
      token += "";

      var
          result = this.contains(token)
        , method = result ?
          force !== true && "remove"
        :
          force !== false && "add"
      ;

      if (method) {
        this[method](token);
      }

      if (force === true || force === false) {
        return force;
      } else {
        return !result;
      }
    };
    classListProto.toString = function () {
      return this.join(" ");
    };

    if (objCtr.defineProperty) {
      var classListPropDesc = {
          get: classListGetter
        , enumerable: true
        , configurable: true
      };
      try {
        objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
      } catch (ex) { // IE 8 doesn't support enumerable:true
        if (ex.number === -0x7FF5EC54) {
          classListPropDesc.enumerable = false;
          objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
        }
      }
    } else if (objCtr[protoProp].__defineGetter__) {
      elemCtrProto.__defineGetter__(classListProp, classListGetter);
    }

    }(window.self));

    } else {
    // There is full or partial native classList support, so just check if we need
    // to normalize the add/remove and toggle APIs.

    (function () {
      "use strict";

      var testElement = document.createElement("_");

      testElement.classList.add("c1", "c2");

      // Polyfill for IE 10/11 and Firefox <26, where classList.add and
      // classList.remove exist but support only one argument at a time.
      if (!testElement.classList.contains("c2")) {
        var createMethod = function(method) {
          var original = DOMTokenList.prototype[method];

          DOMTokenList.prototype[method] = function(token) {
            var i, len = arguments.length;

            for (i = 0; i < len; i++) {
              token = arguments[i];
              original.call(this, token);
            }
          };
        };
        createMethod('add');
        createMethod('remove');
      }

      testElement.classList.toggle("c3", false);

      // Polyfill for IE 10 and Firefox <24, where classList.toggle does not
      // support the second argument.
      if (testElement.classList.contains("c3")) {
        var _toggle = DOMTokenList.prototype.toggle;

        DOMTokenList.prototype.toggle = function(token, force) {
          if (1 in arguments && !this.contains(token) === !force) {
            return force;
          } else {
            return _toggle.call(this, token);
          }
        };

      }

      testElement = null;
    }());
  }
}

},{}],9:[function(require,module,exports){
'use strict';

var copy       = require('es5-ext/object/copy')
  , map        = require('es5-ext/object/map')
  , callable   = require('es5-ext/object/valid-callable')
  , validValue = require('es5-ext/object/valid-value')

  , bind = Function.prototype.bind, defineProperty = Object.defineProperty
  , hasOwnProperty = Object.prototype.hasOwnProperty
  , define;

define = function (name, desc, bindTo) {
	var value = validValue(desc) && callable(desc.value), dgs;
	dgs = copy(desc);
	delete dgs.writable;
	delete dgs.value;
	dgs.get = function () {
		if (hasOwnProperty.call(this, name)) return value;
		desc.value = bind.call(value, (bindTo == null) ? this : this[bindTo]);
		defineProperty(this, name, desc);
		return this[name];
	};
	return dgs;
};

module.exports = function (props/*, bindTo*/) {
	var bindTo = arguments[1];
	return map(props, function (desc, name) {
		return define(name, desc, bindTo);
	});
};

},{"es5-ext/object/copy":24,"es5-ext/object/map":32,"es5-ext/object/valid-callable":37,"es5-ext/object/valid-value":38}],10:[function(require,module,exports){
'use strict';

var assign        = require('es5-ext/object/assign')
  , normalizeOpts = require('es5-ext/object/normalize-options')
  , isCallable    = require('es5-ext/object/is-callable')
  , contains      = require('es5-ext/string/#/contains')

  , d;

d = module.exports = function (dscr, value/*, options*/) {
	var c, e, w, options, desc;
	if ((arguments.length < 2) || (typeof dscr !== 'string')) {
		options = value;
		value = dscr;
		dscr = null;
	} else {
		options = arguments[2];
	}
	if (dscr == null) {
		c = w = true;
		e = false;
	} else {
		c = contains.call(dscr, 'c');
		e = contains.call(dscr, 'e');
		w = contains.call(dscr, 'w');
	}

	desc = { value: value, configurable: c, enumerable: e, writable: w };
	return !options ? desc : assign(normalizeOpts(options), desc);
};

d.gs = function (dscr, get, set/*, options*/) {
	var c, e, options, desc;
	if (typeof dscr !== 'string') {
		options = set;
		set = get;
		get = dscr;
		dscr = null;
	} else {
		options = arguments[3];
	}
	if (get == null) {
		get = undefined;
	} else if (!isCallable(get)) {
		options = get;
		get = set = undefined;
	} else if (set == null) {
		set = undefined;
	} else if (!isCallable(set)) {
		options = set;
		set = undefined;
	}
	if (dscr == null) {
		c = true;
		e = false;
	} else {
		c = contains.call(dscr, 'c');
		e = contains.call(dscr, 'e');
	}

	desc = { get: get, set: set, configurable: c, enumerable: e };
	return !options ? desc : assign(normalizeOpts(options), desc);
};

},{"es5-ext/object/assign":21,"es5-ext/object/is-callable":27,"es5-ext/object/normalize-options":33,"es5-ext/string/#/contains":39}],11:[function(require,module,exports){
// Inspired by Google Closure:
// http://closure-library.googlecode.com/svn/docs/
// closure_goog_array_array.js.html#goog.array.clear

'use strict';

var value = require('../../object/valid-value');

module.exports = function () {
	value(this).length = 0;
	return this;
};

},{"../../object/valid-value":38}],12:[function(require,module,exports){
'use strict';

var toPosInt = require('../../number/to-pos-integer')
  , value    = require('../../object/valid-value')

  , indexOf = Array.prototype.indexOf
  , hasOwnProperty = Object.prototype.hasOwnProperty
  , abs = Math.abs, floor = Math.floor;

module.exports = function (searchElement/*, fromIndex*/) {
	var i, l, fromIndex, val;
	if (searchElement === searchElement) { //jslint: ignore
		return indexOf.apply(this, arguments);
	}

	l = toPosInt(value(this).length);
	fromIndex = arguments[1];
	if (isNaN(fromIndex)) fromIndex = 0;
	else if (fromIndex >= 0) fromIndex = floor(fromIndex);
	else fromIndex = toPosInt(this.length) - floor(abs(fromIndex));

	for (i = fromIndex; i < l; ++i) {
		if (hasOwnProperty.call(this, i)) {
			val = this[i];
			if (val !== val) return i; //jslint: ignore
		}
	}
	return -1;
};

},{"../../number/to-pos-integer":19,"../../object/valid-value":38}],13:[function(require,module,exports){
'use strict';

var toString = Object.prototype.toString

  , id = toString.call((function () { return arguments; }()));

module.exports = function (x) { return (toString.call(x) === id); };

},{}],14:[function(require,module,exports){
'use strict';

module.exports = new Function("return this")();

},{}],15:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? Math.sign
	: require('./shim');

},{"./is-implemented":16,"./shim":17}],16:[function(require,module,exports){
'use strict';

module.exports = function () {
	var sign = Math.sign;
	if (typeof sign !== 'function') return false;
	return ((sign(10) === 1) && (sign(-20) === -1));
};

},{}],17:[function(require,module,exports){
'use strict';

module.exports = function (value) {
	value = Number(value);
	if (isNaN(value) || (value === 0)) return value;
	return (value > 0) ? 1 : -1;
};

},{}],18:[function(require,module,exports){
'use strict';

var sign = require('../math/sign')

  , abs = Math.abs, floor = Math.floor;

module.exports = function (value) {
	if (isNaN(value)) return 0;
	value = Number(value);
	if ((value === 0) || !isFinite(value)) return value;
	return sign(value) * floor(abs(value));
};

},{"../math/sign":15}],19:[function(require,module,exports){
'use strict';

var toInteger = require('./to-integer')

  , max = Math.max;

module.exports = function (value) { return max(0, toInteger(value)); };

},{"./to-integer":18}],20:[function(require,module,exports){
// Internal method, used by iteration functions.
// Calls a function for each key-value pair found in object
// Optionally takes compareFn to iterate object in specific order

'use strict';

var callable = require('./valid-callable')
  , value    = require('./valid-value')

  , bind = Function.prototype.bind, call = Function.prototype.call, keys = Object.keys
  , propertyIsEnumerable = Object.prototype.propertyIsEnumerable;

module.exports = function (method, defVal) {
	return function (obj, cb/*, thisArg, compareFn*/) {
		var list, thisArg = arguments[2], compareFn = arguments[3];
		obj = Object(value(obj));
		callable(cb);

		list = keys(obj);
		if (compareFn) {
			list.sort((typeof compareFn === 'function') ? bind.call(compareFn, obj) : undefined);
		}
		if (typeof method !== 'function') method = list[method];
		return call.call(method, list, function (key, index) {
			if (!propertyIsEnumerable.call(obj, key)) return defVal;
			return call.call(cb, thisArg, obj[key], key, obj, index);
		});
	};
};

},{"./valid-callable":37,"./valid-value":38}],21:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? Object.assign
	: require('./shim');

},{"./is-implemented":22,"./shim":23}],22:[function(require,module,exports){
'use strict';

module.exports = function () {
	var assign = Object.assign, obj;
	if (typeof assign !== 'function') return false;
	obj = { foo: 'raz' };
	assign(obj, { bar: 'dwa' }, { trzy: 'trzy' });
	return (obj.foo + obj.bar + obj.trzy) === 'razdwatrzy';
};

},{}],23:[function(require,module,exports){
'use strict';

var keys  = require('../keys')
  , value = require('../valid-value')

  , max = Math.max;

module.exports = function (dest, src/*, …srcn*/) {
	var error, i, l = max(arguments.length, 2), assign;
	dest = Object(value(dest));
	assign = function (key) {
		try { dest[key] = src[key]; } catch (e) {
			if (!error) error = e;
		}
	};
	for (i = 1; i < l; ++i) {
		src = arguments[i];
		keys(src).forEach(assign);
	}
	if (error !== undefined) throw error;
	return dest;
};

},{"../keys":29,"../valid-value":38}],24:[function(require,module,exports){
'use strict';

var assign = require('./assign')
  , value  = require('./valid-value');

module.exports = function (obj) {
	var copy = Object(value(obj));
	if (copy !== obj) return copy;
	return assign({}, obj);
};

},{"./assign":21,"./valid-value":38}],25:[function(require,module,exports){
// Workaround for http://code.google.com/p/v8/issues/detail?id=2804

'use strict';

var create = Object.create, shim;

if (!require('./set-prototype-of/is-implemented')()) {
	shim = require('./set-prototype-of/shim');
}

module.exports = (function () {
	var nullObject, props, desc;
	if (!shim) return create;
	if (shim.level !== 1) return create;

	nullObject = {};
	props = {};
	desc = { configurable: false, enumerable: false, writable: true,
		value: undefined };
	Object.getOwnPropertyNames(Object.prototype).forEach(function (name) {
		if (name === '__proto__') {
			props[name] = { configurable: true, enumerable: false, writable: true,
				value: undefined };
			return;
		}
		props[name] = desc;
	});
	Object.defineProperties(nullObject, props);

	Object.defineProperty(shim, 'nullPolyfill', { configurable: false,
		enumerable: false, writable: false, value: nullObject });

	return function (prototype, props) {
		return create((prototype === null) ? nullObject : prototype, props);
	};
}());

},{"./set-prototype-of/is-implemented":35,"./set-prototype-of/shim":36}],26:[function(require,module,exports){
'use strict';

module.exports = require('./_iterate')('forEach');

},{"./_iterate":20}],27:[function(require,module,exports){
// Deprecated

'use strict';

module.exports = function (obj) { return typeof obj === 'function'; };

},{}],28:[function(require,module,exports){
'use strict';

var map = { function: true, object: true };

module.exports = function (x) {
	return ((x != null) && map[typeof x]) || false;
};

},{}],29:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? Object.keys
	: require('./shim');

},{"./is-implemented":30,"./shim":31}],30:[function(require,module,exports){
'use strict';

module.exports = function () {
	try {
		Object.keys('primitive');
		return true;
	} catch (e) { return false; }
};

},{}],31:[function(require,module,exports){
'use strict';

var keys = Object.keys;

module.exports = function (object) {
	return keys(object == null ? object : Object(object));
};

},{}],32:[function(require,module,exports){
'use strict';

var callable = require('./valid-callable')
  , forEach  = require('./for-each')

  , call = Function.prototype.call;

module.exports = function (obj, cb/*, thisArg*/) {
	var o = {}, thisArg = arguments[2];
	callable(cb);
	forEach(obj, function (value, key, obj, index) {
		o[key] = call.call(cb, thisArg, value, key, obj, index);
	});
	return o;
};

},{"./for-each":26,"./valid-callable":37}],33:[function(require,module,exports){
'use strict';

var forEach = Array.prototype.forEach, create = Object.create;

var process = function (src, obj) {
	var key;
	for (key in src) obj[key] = src[key];
};

module.exports = function (options/*, …options*/) {
	var result = create(null);
	forEach.call(arguments, function (options) {
		if (options == null) return;
		process(Object(options), result);
	});
	return result;
};

},{}],34:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? Object.setPrototypeOf
	: require('./shim');

},{"./is-implemented":35,"./shim":36}],35:[function(require,module,exports){
'use strict';

var create = Object.create, getPrototypeOf = Object.getPrototypeOf
  , x = {};

module.exports = function (/*customCreate*/) {
	var setPrototypeOf = Object.setPrototypeOf
	  , customCreate = arguments[0] || create;
	if (typeof setPrototypeOf !== 'function') return false;
	return getPrototypeOf(setPrototypeOf(customCreate(null), x)) === x;
};

},{}],36:[function(require,module,exports){
// Big thanks to @WebReflection for sorting this out
// https://gist.github.com/WebReflection/5593554

'use strict';

var isObject      = require('../is-object')
  , value         = require('../valid-value')

  , isPrototypeOf = Object.prototype.isPrototypeOf
  , defineProperty = Object.defineProperty
  , nullDesc = { configurable: true, enumerable: false, writable: true,
		value: undefined }
  , validate;

validate = function (obj, prototype) {
	value(obj);
	if ((prototype === null) || isObject(prototype)) return obj;
	throw new TypeError('Prototype must be null or an object');
};

module.exports = (function (status) {
	var fn, set;
	if (!status) return null;
	if (status.level === 2) {
		if (status.set) {
			set = status.set;
			fn = function (obj, prototype) {
				set.call(validate(obj, prototype), prototype);
				return obj;
			};
		} else {
			fn = function (obj, prototype) {
				validate(obj, prototype).__proto__ = prototype;
				return obj;
			};
		}
	} else {
		fn = function self(obj, prototype) {
			var isNullBase;
			validate(obj, prototype);
			isNullBase = isPrototypeOf.call(self.nullPolyfill, obj);
			if (isNullBase) delete self.nullPolyfill.__proto__;
			if (prototype === null) prototype = self.nullPolyfill;
			obj.__proto__ = prototype;
			if (isNullBase) defineProperty(self.nullPolyfill, '__proto__', nullDesc);
			return obj;
		};
	}
	return Object.defineProperty(fn, 'level', { configurable: false,
		enumerable: false, writable: false, value: status.level });
}((function () {
	var x = Object.create(null), y = {}, set
	  , desc = Object.getOwnPropertyDescriptor(Object.prototype, '__proto__');

	if (desc) {
		try {
			set = desc.set; // Opera crashes at this point
			set.call(x, y);
		} catch (ignore) { }
		if (Object.getPrototypeOf(x) === y) return { set: set, level: 2 };
	}

	x.__proto__ = y;
	if (Object.getPrototypeOf(x) === y) return { level: 2 };

	x = {};
	x.__proto__ = y;
	if (Object.getPrototypeOf(x) === y) return { level: 1 };

	return false;
}())));

require('../create');

},{"../create":25,"../is-object":28,"../valid-value":38}],37:[function(require,module,exports){
'use strict';

module.exports = function (fn) {
	if (typeof fn !== 'function') throw new TypeError(fn + " is not a function");
	return fn;
};

},{}],38:[function(require,module,exports){
'use strict';

module.exports = function (value) {
	if (value == null) throw new TypeError("Cannot use null or undefined");
	return value;
};

},{}],39:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? String.prototype.contains
	: require('./shim');

},{"./is-implemented":40,"./shim":41}],40:[function(require,module,exports){
'use strict';

var str = 'razdwatrzy';

module.exports = function () {
	if (typeof str.contains !== 'function') return false;
	return ((str.contains('dwa') === true) && (str.contains('foo') === false));
};

},{}],41:[function(require,module,exports){
'use strict';

var indexOf = String.prototype.indexOf;

module.exports = function (searchString/*, position*/) {
	return indexOf.call(this, searchString, arguments[1]) > -1;
};

},{}],42:[function(require,module,exports){
'use strict';

var toString = Object.prototype.toString

  , id = toString.call('');

module.exports = function (x) {
	return (typeof x === 'string') || (x && (typeof x === 'object') &&
		((x instanceof String) || (toString.call(x) === id))) || false;
};

},{}],43:[function(require,module,exports){
'use strict';

var setPrototypeOf = require('es5-ext/object/set-prototype-of')
  , contains       = require('es5-ext/string/#/contains')
  , d              = require('d')
  , Iterator       = require('./')

  , defineProperty = Object.defineProperty
  , ArrayIterator;

ArrayIterator = module.exports = function (arr, kind) {
	if (!(this instanceof ArrayIterator)) return new ArrayIterator(arr, kind);
	Iterator.call(this, arr);
	if (!kind) kind = 'value';
	else if (contains.call(kind, 'key+value')) kind = 'key+value';
	else if (contains.call(kind, 'key')) kind = 'key';
	else kind = 'value';
	defineProperty(this, '__kind__', d('', kind));
};
if (setPrototypeOf) setPrototypeOf(ArrayIterator, Iterator);

ArrayIterator.prototype = Object.create(Iterator.prototype, {
	constructor: d(ArrayIterator),
	_resolve: d(function (i) {
		if (this.__kind__ === 'value') return this.__list__[i];
		if (this.__kind__ === 'key+value') return [i, this.__list__[i]];
		return i;
	}),
	toString: d(function () { return '[object Array Iterator]'; })
});

},{"./":46,"d":10,"es5-ext/object/set-prototype-of":34,"es5-ext/string/#/contains":39}],44:[function(require,module,exports){
'use strict';

var isArguments = require('es5-ext/function/is-arguments')
  , callable    = require('es5-ext/object/valid-callable')
  , isString    = require('es5-ext/string/is-string')
  , get         = require('./get')

  , isArray = Array.isArray, call = Function.prototype.call
  , some = Array.prototype.some;

module.exports = function (iterable, cb/*, thisArg*/) {
	var mode, thisArg = arguments[2], result, doBreak, broken, i, l, char, code;
	if (isArray(iterable) || isArguments(iterable)) mode = 'array';
	else if (isString(iterable)) mode = 'string';
	else iterable = get(iterable);

	callable(cb);
	doBreak = function () { broken = true; };
	if (mode === 'array') {
		some.call(iterable, function (value) {
			call.call(cb, thisArg, value, doBreak);
			if (broken) return true;
		});
		return;
	}
	if (mode === 'string') {
		l = iterable.length;
		for (i = 0; i < l; ++i) {
			char = iterable[i];
			if ((i + 1) < l) {
				code = char.charCodeAt(0);
				if ((code >= 0xD800) && (code <= 0xDBFF)) char += iterable[++i];
			}
			call.call(cb, thisArg, char, doBreak);
			if (broken) break;
		}
		return;
	}
	result = iterable.next();

	while (!result.done) {
		call.call(cb, thisArg, result.value, doBreak);
		if (broken) return;
		result = iterable.next();
	}
};

},{"./get":45,"es5-ext/function/is-arguments":13,"es5-ext/object/valid-callable":37,"es5-ext/string/is-string":42}],45:[function(require,module,exports){
'use strict';

var isArguments    = require('es5-ext/function/is-arguments')
  , isString       = require('es5-ext/string/is-string')
  , ArrayIterator  = require('./array')
  , StringIterator = require('./string')
  , iterable       = require('./valid-iterable')
  , iteratorSymbol = require('es6-symbol').iterator;

module.exports = function (obj) {
	if (typeof iterable(obj)[iteratorSymbol] === 'function') return obj[iteratorSymbol]();
	if (isArguments(obj)) return new ArrayIterator(obj);
	if (isString(obj)) return new StringIterator(obj);
	return new ArrayIterator(obj);
};

},{"./array":43,"./string":48,"./valid-iterable":49,"es5-ext/function/is-arguments":13,"es5-ext/string/is-string":42,"es6-symbol":56}],46:[function(require,module,exports){
'use strict';

var clear    = require('es5-ext/array/#/clear')
  , assign   = require('es5-ext/object/assign')
  , callable = require('es5-ext/object/valid-callable')
  , value    = require('es5-ext/object/valid-value')
  , d        = require('d')
  , autoBind = require('d/auto-bind')
  , Symbol   = require('es6-symbol')

  , defineProperty = Object.defineProperty
  , defineProperties = Object.defineProperties
  , Iterator;

module.exports = Iterator = function (list, context) {
	if (!(this instanceof Iterator)) return new Iterator(list, context);
	defineProperties(this, {
		__list__: d('w', value(list)),
		__context__: d('w', context),
		__nextIndex__: d('w', 0)
	});
	if (!context) return;
	callable(context.on);
	context.on('_add', this._onAdd);
	context.on('_delete', this._onDelete);
	context.on('_clear', this._onClear);
};

defineProperties(Iterator.prototype, assign({
	constructor: d(Iterator),
	_next: d(function () {
		var i;
		if (!this.__list__) return;
		if (this.__redo__) {
			i = this.__redo__.shift();
			if (i !== undefined) return i;
		}
		if (this.__nextIndex__ < this.__list__.length) return this.__nextIndex__++;
		this._unBind();
	}),
	next: d(function () { return this._createResult(this._next()); }),
	_createResult: d(function (i) {
		if (i === undefined) return { done: true, value: undefined };
		return { done: false, value: this._resolve(i) };
	}),
	_resolve: d(function (i) { return this.__list__[i]; }),
	_unBind: d(function () {
		this.__list__ = null;
		delete this.__redo__;
		if (!this.__context__) return;
		this.__context__.off('_add', this._onAdd);
		this.__context__.off('_delete', this._onDelete);
		this.__context__.off('_clear', this._onClear);
		this.__context__ = null;
	}),
	toString: d(function () { return '[object Iterator]'; })
}, autoBind({
	_onAdd: d(function (index) {
		if (index >= this.__nextIndex__) return;
		++this.__nextIndex__;
		if (!this.__redo__) {
			defineProperty(this, '__redo__', d('c', [index]));
			return;
		}
		this.__redo__.forEach(function (redo, i) {
			if (redo >= index) this.__redo__[i] = ++redo;
		}, this);
		this.__redo__.push(index);
	}),
	_onDelete: d(function (index) {
		var i;
		if (index >= this.__nextIndex__) return;
		--this.__nextIndex__;
		if (!this.__redo__) return;
		i = this.__redo__.indexOf(index);
		if (i !== -1) this.__redo__.splice(i, 1);
		this.__redo__.forEach(function (redo, i) {
			if (redo > index) this.__redo__[i] = --redo;
		}, this);
	}),
	_onClear: d(function () {
		if (this.__redo__) clear.call(this.__redo__);
		this.__nextIndex__ = 0;
	})
})));

defineProperty(Iterator.prototype, Symbol.iterator, d(function () {
	return this;
}));
defineProperty(Iterator.prototype, Symbol.toStringTag, d('', 'Iterator'));

},{"d":10,"d/auto-bind":9,"es5-ext/array/#/clear":11,"es5-ext/object/assign":21,"es5-ext/object/valid-callable":37,"es5-ext/object/valid-value":38,"es6-symbol":56}],47:[function(require,module,exports){
'use strict';

var isArguments    = require('es5-ext/function/is-arguments')
  , isString       = require('es5-ext/string/is-string')
  , iteratorSymbol = require('es6-symbol').iterator

  , isArray = Array.isArray;

module.exports = function (value) {
	if (value == null) return false;
	if (isArray(value)) return true;
	if (isString(value)) return true;
	if (isArguments(value)) return true;
	return (typeof value[iteratorSymbol] === 'function');
};

},{"es5-ext/function/is-arguments":13,"es5-ext/string/is-string":42,"es6-symbol":56}],48:[function(require,module,exports){
// Thanks @mathiasbynens
// http://mathiasbynens.be/notes/javascript-unicode#iterating-over-symbols

'use strict';

var setPrototypeOf = require('es5-ext/object/set-prototype-of')
  , d              = require('d')
  , Iterator       = require('./')

  , defineProperty = Object.defineProperty
  , StringIterator;

StringIterator = module.exports = function (str) {
	if (!(this instanceof StringIterator)) return new StringIterator(str);
	str = String(str);
	Iterator.call(this, str);
	defineProperty(this, '__length__', d('', str.length));

};
if (setPrototypeOf) setPrototypeOf(StringIterator, Iterator);

StringIterator.prototype = Object.create(Iterator.prototype, {
	constructor: d(StringIterator),
	_next: d(function () {
		if (!this.__list__) return;
		if (this.__nextIndex__ < this.__length__) return this.__nextIndex__++;
		this._unBind();
	}),
	_resolve: d(function (i) {
		var char = this.__list__[i], code;
		if (this.__nextIndex__ === this.__length__) return char;
		code = char.charCodeAt(0);
		if ((code >= 0xD800) && (code <= 0xDBFF)) return char + this.__list__[this.__nextIndex__++];
		return char;
	}),
	toString: d(function () { return '[object String Iterator]'; })
});

},{"./":46,"d":10,"es5-ext/object/set-prototype-of":34}],49:[function(require,module,exports){
'use strict';

var isIterable = require('./is-iterable');

module.exports = function (value) {
	if (!isIterable(value)) throw new TypeError(value + " is not iterable");
	return value;
};

},{"./is-iterable":47}],50:[function(require,module,exports){
(function (process,global){
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/jakearchibald/es6-promise/master/LICENSE
 * @version   3.0.2
 */

(function() {
    "use strict";
    function lib$es6$promise$utils$$objectOrFunction(x) {
      return typeof x === 'function' || (typeof x === 'object' && x !== null);
    }

    function lib$es6$promise$utils$$isFunction(x) {
      return typeof x === 'function';
    }

    function lib$es6$promise$utils$$isMaybeThenable(x) {
      return typeof x === 'object' && x !== null;
    }

    var lib$es6$promise$utils$$_isArray;
    if (!Array.isArray) {
      lib$es6$promise$utils$$_isArray = function (x) {
        return Object.prototype.toString.call(x) === '[object Array]';
      };
    } else {
      lib$es6$promise$utils$$_isArray = Array.isArray;
    }

    var lib$es6$promise$utils$$isArray = lib$es6$promise$utils$$_isArray;
    var lib$es6$promise$asap$$len = 0;
    var lib$es6$promise$asap$$toString = {}.toString;
    var lib$es6$promise$asap$$vertxNext;
    var lib$es6$promise$asap$$customSchedulerFn;

    var lib$es6$promise$asap$$asap = function asap(callback, arg) {
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len] = callback;
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len + 1] = arg;
      lib$es6$promise$asap$$len += 2;
      if (lib$es6$promise$asap$$len === 2) {
        // If len is 2, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        if (lib$es6$promise$asap$$customSchedulerFn) {
          lib$es6$promise$asap$$customSchedulerFn(lib$es6$promise$asap$$flush);
        } else {
          lib$es6$promise$asap$$scheduleFlush();
        }
      }
    }

    function lib$es6$promise$asap$$setScheduler(scheduleFn) {
      lib$es6$promise$asap$$customSchedulerFn = scheduleFn;
    }

    function lib$es6$promise$asap$$setAsap(asapFn) {
      lib$es6$promise$asap$$asap = asapFn;
    }

    var lib$es6$promise$asap$$browserWindow = (typeof window !== 'undefined') ? window : undefined;
    var lib$es6$promise$asap$$browserGlobal = lib$es6$promise$asap$$browserWindow || {};
    var lib$es6$promise$asap$$BrowserMutationObserver = lib$es6$promise$asap$$browserGlobal.MutationObserver || lib$es6$promise$asap$$browserGlobal.WebKitMutationObserver;
    var lib$es6$promise$asap$$isNode = typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

    // test for web worker but not in IE10
    var lib$es6$promise$asap$$isWorker = typeof Uint8ClampedArray !== 'undefined' &&
      typeof importScripts !== 'undefined' &&
      typeof MessageChannel !== 'undefined';

    // node
    function lib$es6$promise$asap$$useNextTick() {
      // node version 0.10.x displays a deprecation warning when nextTick is used recursively
      // see https://github.com/cujojs/when/issues/410 for details
      return function() {
        process.nextTick(lib$es6$promise$asap$$flush);
      };
    }

    // vertx
    function lib$es6$promise$asap$$useVertxTimer() {
      return function() {
        lib$es6$promise$asap$$vertxNext(lib$es6$promise$asap$$flush);
      };
    }

    function lib$es6$promise$asap$$useMutationObserver() {
      var iterations = 0;
      var observer = new lib$es6$promise$asap$$BrowserMutationObserver(lib$es6$promise$asap$$flush);
      var node = document.createTextNode('');
      observer.observe(node, { characterData: true });

      return function() {
        node.data = (iterations = ++iterations % 2);
      };
    }

    // web worker
    function lib$es6$promise$asap$$useMessageChannel() {
      var channel = new MessageChannel();
      channel.port1.onmessage = lib$es6$promise$asap$$flush;
      return function () {
        channel.port2.postMessage(0);
      };
    }

    function lib$es6$promise$asap$$useSetTimeout() {
      return function() {
        setTimeout(lib$es6$promise$asap$$flush, 1);
      };
    }

    var lib$es6$promise$asap$$queue = new Array(1000);
    function lib$es6$promise$asap$$flush() {
      for (var i = 0; i < lib$es6$promise$asap$$len; i+=2) {
        var callback = lib$es6$promise$asap$$queue[i];
        var arg = lib$es6$promise$asap$$queue[i+1];

        callback(arg);

        lib$es6$promise$asap$$queue[i] = undefined;
        lib$es6$promise$asap$$queue[i+1] = undefined;
      }

      lib$es6$promise$asap$$len = 0;
    }

    function lib$es6$promise$asap$$attemptVertx() {
      try {
        var r = require;
        var vertx = r('vertx');
        lib$es6$promise$asap$$vertxNext = vertx.runOnLoop || vertx.runOnContext;
        return lib$es6$promise$asap$$useVertxTimer();
      } catch(e) {
        return lib$es6$promise$asap$$useSetTimeout();
      }
    }

    var lib$es6$promise$asap$$scheduleFlush;
    // Decide what async method to use to triggering processing of queued callbacks:
    if (lib$es6$promise$asap$$isNode) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useNextTick();
    } else if (lib$es6$promise$asap$$BrowserMutationObserver) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMutationObserver();
    } else if (lib$es6$promise$asap$$isWorker) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMessageChannel();
    } else if (lib$es6$promise$asap$$browserWindow === undefined && typeof require === 'function') {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$attemptVertx();
    } else {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useSetTimeout();
    }

    function lib$es6$promise$$internal$$noop() {}

    var lib$es6$promise$$internal$$PENDING   = void 0;
    var lib$es6$promise$$internal$$FULFILLED = 1;
    var lib$es6$promise$$internal$$REJECTED  = 2;

    var lib$es6$promise$$internal$$GET_THEN_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$selfFulfillment() {
      return new TypeError("You cannot resolve a promise with itself");
    }

    function lib$es6$promise$$internal$$cannotReturnOwn() {
      return new TypeError('A promises callback cannot return that same promise.');
    }

    function lib$es6$promise$$internal$$getThen(promise) {
      try {
        return promise.then;
      } catch(error) {
        lib$es6$promise$$internal$$GET_THEN_ERROR.error = error;
        return lib$es6$promise$$internal$$GET_THEN_ERROR;
      }
    }

    function lib$es6$promise$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler) {
      try {
        then.call(value, fulfillmentHandler, rejectionHandler);
      } catch(e) {
        return e;
      }
    }

    function lib$es6$promise$$internal$$handleForeignThenable(promise, thenable, then) {
       lib$es6$promise$asap$$asap(function(promise) {
        var sealed = false;
        var error = lib$es6$promise$$internal$$tryThen(then, thenable, function(value) {
          if (sealed) { return; }
          sealed = true;
          if (thenable !== value) {
            lib$es6$promise$$internal$$resolve(promise, value);
          } else {
            lib$es6$promise$$internal$$fulfill(promise, value);
          }
        }, function(reason) {
          if (sealed) { return; }
          sealed = true;

          lib$es6$promise$$internal$$reject(promise, reason);
        }, 'Settle: ' + (promise._label || ' unknown promise'));

        if (!sealed && error) {
          sealed = true;
          lib$es6$promise$$internal$$reject(promise, error);
        }
      }, promise);
    }

    function lib$es6$promise$$internal$$handleOwnThenable(promise, thenable) {
      if (thenable._state === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, thenable._result);
      } else if (thenable._state === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, thenable._result);
      } else {
        lib$es6$promise$$internal$$subscribe(thenable, undefined, function(value) {
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      }
    }

    function lib$es6$promise$$internal$$handleMaybeThenable(promise, maybeThenable) {
      if (maybeThenable.constructor === promise.constructor) {
        lib$es6$promise$$internal$$handleOwnThenable(promise, maybeThenable);
      } else {
        var then = lib$es6$promise$$internal$$getThen(maybeThenable);

        if (then === lib$es6$promise$$internal$$GET_THEN_ERROR) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$GET_THEN_ERROR.error);
        } else if (then === undefined) {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        } else if (lib$es6$promise$utils$$isFunction(then)) {
          lib$es6$promise$$internal$$handleForeignThenable(promise, maybeThenable, then);
        } else {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        }
      }
    }

    function lib$es6$promise$$internal$$resolve(promise, value) {
      if (promise === value) {
        lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$selfFulfillment());
      } else if (lib$es6$promise$utils$$objectOrFunction(value)) {
        lib$es6$promise$$internal$$handleMaybeThenable(promise, value);
      } else {
        lib$es6$promise$$internal$$fulfill(promise, value);
      }
    }

    function lib$es6$promise$$internal$$publishRejection(promise) {
      if (promise._onerror) {
        promise._onerror(promise._result);
      }

      lib$es6$promise$$internal$$publish(promise);
    }

    function lib$es6$promise$$internal$$fulfill(promise, value) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }

      promise._result = value;
      promise._state = lib$es6$promise$$internal$$FULFILLED;

      if (promise._subscribers.length !== 0) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, promise);
      }
    }

    function lib$es6$promise$$internal$$reject(promise, reason) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }
      promise._state = lib$es6$promise$$internal$$REJECTED;
      promise._result = reason;

      lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publishRejection, promise);
    }

    function lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
      var subscribers = parent._subscribers;
      var length = subscribers.length;

      parent._onerror = null;

      subscribers[length] = child;
      subscribers[length + lib$es6$promise$$internal$$FULFILLED] = onFulfillment;
      subscribers[length + lib$es6$promise$$internal$$REJECTED]  = onRejection;

      if (length === 0 && parent._state) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, parent);
      }
    }

    function lib$es6$promise$$internal$$publish(promise) {
      var subscribers = promise._subscribers;
      var settled = promise._state;

      if (subscribers.length === 0) { return; }

      var child, callback, detail = promise._result;

      for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];

        if (child) {
          lib$es6$promise$$internal$$invokeCallback(settled, child, callback, detail);
        } else {
          callback(detail);
        }
      }

      promise._subscribers.length = 0;
    }

    function lib$es6$promise$$internal$$ErrorObject() {
      this.error = null;
    }

    var lib$es6$promise$$internal$$TRY_CATCH_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$tryCatch(callback, detail) {
      try {
        return callback(detail);
      } catch(e) {
        lib$es6$promise$$internal$$TRY_CATCH_ERROR.error = e;
        return lib$es6$promise$$internal$$TRY_CATCH_ERROR;
      }
    }

    function lib$es6$promise$$internal$$invokeCallback(settled, promise, callback, detail) {
      var hasCallback = lib$es6$promise$utils$$isFunction(callback),
          value, error, succeeded, failed;

      if (hasCallback) {
        value = lib$es6$promise$$internal$$tryCatch(callback, detail);

        if (value === lib$es6$promise$$internal$$TRY_CATCH_ERROR) {
          failed = true;
          error = value.error;
          value = null;
        } else {
          succeeded = true;
        }

        if (promise === value) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$cannotReturnOwn());
          return;
        }

      } else {
        value = detail;
        succeeded = true;
      }

      if (promise._state !== lib$es6$promise$$internal$$PENDING) {
        // noop
      } else if (hasCallback && succeeded) {
        lib$es6$promise$$internal$$resolve(promise, value);
      } else if (failed) {
        lib$es6$promise$$internal$$reject(promise, error);
      } else if (settled === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, value);
      } else if (settled === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, value);
      }
    }

    function lib$es6$promise$$internal$$initializePromise(promise, resolver) {
      try {
        resolver(function resolvePromise(value){
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function rejectPromise(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      } catch(e) {
        lib$es6$promise$$internal$$reject(promise, e);
      }
    }

    function lib$es6$promise$enumerator$$Enumerator(Constructor, input) {
      var enumerator = this;

      enumerator._instanceConstructor = Constructor;
      enumerator.promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (enumerator._validateInput(input)) {
        enumerator._input     = input;
        enumerator.length     = input.length;
        enumerator._remaining = input.length;

        enumerator._init();

        if (enumerator.length === 0) {
          lib$es6$promise$$internal$$fulfill(enumerator.promise, enumerator._result);
        } else {
          enumerator.length = enumerator.length || 0;
          enumerator._enumerate();
          if (enumerator._remaining === 0) {
            lib$es6$promise$$internal$$fulfill(enumerator.promise, enumerator._result);
          }
        }
      } else {
        lib$es6$promise$$internal$$reject(enumerator.promise, enumerator._validationError());
      }
    }

    lib$es6$promise$enumerator$$Enumerator.prototype._validateInput = function(input) {
      return lib$es6$promise$utils$$isArray(input);
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._validationError = function() {
      return new Error('Array Methods must be provided an Array');
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._init = function() {
      this._result = new Array(this.length);
    };

    var lib$es6$promise$enumerator$$default = lib$es6$promise$enumerator$$Enumerator;

    lib$es6$promise$enumerator$$Enumerator.prototype._enumerate = function() {
      var enumerator = this;

      var length  = enumerator.length;
      var promise = enumerator.promise;
      var input   = enumerator._input;

      for (var i = 0; promise._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        enumerator._eachEntry(input[i], i);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._eachEntry = function(entry, i) {
      var enumerator = this;
      var c = enumerator._instanceConstructor;

      if (lib$es6$promise$utils$$isMaybeThenable(entry)) {
        if (entry.constructor === c && entry._state !== lib$es6$promise$$internal$$PENDING) {
          entry._onerror = null;
          enumerator._settledAt(entry._state, i, entry._result);
        } else {
          enumerator._willSettleAt(c.resolve(entry), i);
        }
      } else {
        enumerator._remaining--;
        enumerator._result[i] = entry;
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._settledAt = function(state, i, value) {
      var enumerator = this;
      var promise = enumerator.promise;

      if (promise._state === lib$es6$promise$$internal$$PENDING) {
        enumerator._remaining--;

        if (state === lib$es6$promise$$internal$$REJECTED) {
          lib$es6$promise$$internal$$reject(promise, value);
        } else {
          enumerator._result[i] = value;
        }
      }

      if (enumerator._remaining === 0) {
        lib$es6$promise$$internal$$fulfill(promise, enumerator._result);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._willSettleAt = function(promise, i) {
      var enumerator = this;

      lib$es6$promise$$internal$$subscribe(promise, undefined, function(value) {
        enumerator._settledAt(lib$es6$promise$$internal$$FULFILLED, i, value);
      }, function(reason) {
        enumerator._settledAt(lib$es6$promise$$internal$$REJECTED, i, reason);
      });
    };
    function lib$es6$promise$promise$all$$all(entries) {
      return new lib$es6$promise$enumerator$$default(this, entries).promise;
    }
    var lib$es6$promise$promise$all$$default = lib$es6$promise$promise$all$$all;
    function lib$es6$promise$promise$race$$race(entries) {
      /*jshint validthis:true */
      var Constructor = this;

      var promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (!lib$es6$promise$utils$$isArray(entries)) {
        lib$es6$promise$$internal$$reject(promise, new TypeError('You must pass an array to race.'));
        return promise;
      }

      var length = entries.length;

      function onFulfillment(value) {
        lib$es6$promise$$internal$$resolve(promise, value);
      }

      function onRejection(reason) {
        lib$es6$promise$$internal$$reject(promise, reason);
      }

      for (var i = 0; promise._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        lib$es6$promise$$internal$$subscribe(Constructor.resolve(entries[i]), undefined, onFulfillment, onRejection);
      }

      return promise;
    }
    var lib$es6$promise$promise$race$$default = lib$es6$promise$promise$race$$race;
    function lib$es6$promise$promise$resolve$$resolve(object) {
      /*jshint validthis:true */
      var Constructor = this;

      if (object && typeof object === 'object' && object.constructor === Constructor) {
        return object;
      }

      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$resolve(promise, object);
      return promise;
    }
    var lib$es6$promise$promise$resolve$$default = lib$es6$promise$promise$resolve$$resolve;
    function lib$es6$promise$promise$reject$$reject(reason) {
      /*jshint validthis:true */
      var Constructor = this;
      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$reject(promise, reason);
      return promise;
    }
    var lib$es6$promise$promise$reject$$default = lib$es6$promise$promise$reject$$reject;

    var lib$es6$promise$promise$$counter = 0;

    function lib$es6$promise$promise$$needsResolver() {
      throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
    }

    function lib$es6$promise$promise$$needsNew() {
      throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
    }

    var lib$es6$promise$promise$$default = lib$es6$promise$promise$$Promise;
    /**
      Promise objects represent the eventual result of an asynchronous operation. The
      primary way of interacting with a promise is through its `then` method, which
      registers callbacks to receive either a promise's eventual value or the reason
      why the promise cannot be fulfilled.

      Terminology
      -----------

      - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
      - `thenable` is an object or function that defines a `then` method.
      - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
      - `exception` is a value that is thrown using the throw statement.
      - `reason` is a value that indicates why a promise was rejected.
      - `settled` the final resting state of a promise, fulfilled or rejected.

      A promise can be in one of three states: pending, fulfilled, or rejected.

      Promises that are fulfilled have a fulfillment value and are in the fulfilled
      state.  Promises that are rejected have a rejection reason and are in the
      rejected state.  A fulfillment value is never a thenable.

      Promises can also be said to *resolve* a value.  If this value is also a
      promise, then the original promise's settled state will match the value's
      settled state.  So a promise that *resolves* a promise that rejects will
      itself reject, and a promise that *resolves* a promise that fulfills will
      itself fulfill.


      Basic Usage:
      ------------

      ```js
      var promise = new Promise(function(resolve, reject) {
        // on success
        resolve(value);

        // on failure
        reject(reason);
      });

      promise.then(function(value) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Advanced Usage:
      ---------------

      Promises shine when abstracting away asynchronous interactions such as
      `XMLHttpRequest`s.

      ```js
      function getJSON(url) {
        return new Promise(function(resolve, reject){
          var xhr = new XMLHttpRequest();

          xhr.open('GET', url);
          xhr.onreadystatechange = handler;
          xhr.responseType = 'json';
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.send();

          function handler() {
            if (this.readyState === this.DONE) {
              if (this.status === 200) {
                resolve(this.response);
              } else {
                reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
              }
            }
          };
        });
      }

      getJSON('/posts.json').then(function(json) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Unlike callbacks, promises are great composable primitives.

      ```js
      Promise.all([
        getJSON('/posts'),
        getJSON('/comments')
      ]).then(function(values){
        values[0] // => postsJSON
        values[1] // => commentsJSON

        return values;
      });
      ```

      @class Promise
      @param {function} resolver
      Useful for tooling.
      @constructor
    */
    function lib$es6$promise$promise$$Promise(resolver) {
      this._id = lib$es6$promise$promise$$counter++;
      this._state = undefined;
      this._result = undefined;
      this._subscribers = [];

      if (lib$es6$promise$$internal$$noop !== resolver) {
        if (!lib$es6$promise$utils$$isFunction(resolver)) {
          lib$es6$promise$promise$$needsResolver();
        }

        if (!(this instanceof lib$es6$promise$promise$$Promise)) {
          lib$es6$promise$promise$$needsNew();
        }

        lib$es6$promise$$internal$$initializePromise(this, resolver);
      }
    }

    lib$es6$promise$promise$$Promise.all = lib$es6$promise$promise$all$$default;
    lib$es6$promise$promise$$Promise.race = lib$es6$promise$promise$race$$default;
    lib$es6$promise$promise$$Promise.resolve = lib$es6$promise$promise$resolve$$default;
    lib$es6$promise$promise$$Promise.reject = lib$es6$promise$promise$reject$$default;
    lib$es6$promise$promise$$Promise._setScheduler = lib$es6$promise$asap$$setScheduler;
    lib$es6$promise$promise$$Promise._setAsap = lib$es6$promise$asap$$setAsap;
    lib$es6$promise$promise$$Promise._asap = lib$es6$promise$asap$$asap;

    lib$es6$promise$promise$$Promise.prototype = {
      constructor: lib$es6$promise$promise$$Promise,

    /**
      The primary way of interacting with a promise is through its `then` method,
      which registers callbacks to receive either a promise's eventual value or the
      reason why the promise cannot be fulfilled.

      ```js
      findUser().then(function(user){
        // user is available
      }, function(reason){
        // user is unavailable, and you are given the reason why
      });
      ```

      Chaining
      --------

      The return value of `then` is itself a promise.  This second, 'downstream'
      promise is resolved with the return value of the first promise's fulfillment
      or rejection handler, or rejected if the handler throws an exception.

      ```js
      findUser().then(function (user) {
        return user.name;
      }, function (reason) {
        return 'default name';
      }).then(function (userName) {
        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
        // will be `'default name'`
      });

      findUser().then(function (user) {
        throw new Error('Found user, but still unhappy');
      }, function (reason) {
        throw new Error('`findUser` rejected and we're unhappy');
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
        // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
      });
      ```
      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.

      ```js
      findUser().then(function (user) {
        throw new PedagogicalException('Upstream error');
      }).then(function (value) {
        // never reached
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // The `PedgagocialException` is propagated all the way down to here
      });
      ```

      Assimilation
      ------------

      Sometimes the value you want to propagate to a downstream promise can only be
      retrieved asynchronously. This can be achieved by returning a promise in the
      fulfillment or rejection handler. The downstream promise will then be pending
      until the returned promise is settled. This is called *assimilation*.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // The user's comments are now available
      });
      ```

      If the assimliated promise rejects, then the downstream promise will also reject.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // If `findCommentsByAuthor` fulfills, we'll have the value here
      }, function (reason) {
        // If `findCommentsByAuthor` rejects, we'll have the reason here
      });
      ```

      Simple Example
      --------------

      Synchronous Example

      ```javascript
      var result;

      try {
        result = findResult();
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js
      findResult(function(result, err){
        if (err) {
          // failure
        } else {
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findResult().then(function(result){
        // success
      }, function(reason){
        // failure
      });
      ```

      Advanced Example
      --------------

      Synchronous Example

      ```javascript
      var author, books;

      try {
        author = findAuthor();
        books  = findBooksByAuthor(author);
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js

      function foundBooks(books) {

      }

      function failure(reason) {

      }

      findAuthor(function(author, err){
        if (err) {
          failure(err);
          // failure
        } else {
          try {
            findBoooksByAuthor(author, function(books, err) {
              if (err) {
                failure(err);
              } else {
                try {
                  foundBooks(books);
                } catch(reason) {
                  failure(reason);
                }
              }
            });
          } catch(error) {
            failure(err);
          }
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findAuthor().
        then(findBooksByAuthor).
        then(function(books){
          // found books
      }).catch(function(reason){
        // something went wrong
      });
      ```

      @method then
      @param {Function} onFulfilled
      @param {Function} onRejected
      Useful for tooling.
      @return {Promise}
    */
      then: function(onFulfillment, onRejection) {
        var parent = this;
        var state = parent._state;

        if (state === lib$es6$promise$$internal$$FULFILLED && !onFulfillment || state === lib$es6$promise$$internal$$REJECTED && !onRejection) {
          return this;
        }

        var child = new this.constructor(lib$es6$promise$$internal$$noop);
        var result = parent._result;

        if (state) {
          var callback = arguments[state - 1];
          lib$es6$promise$asap$$asap(function(){
            lib$es6$promise$$internal$$invokeCallback(state, child, callback, result);
          });
        } else {
          lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection);
        }

        return child;
      },

    /**
      `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
      as the catch block of a try/catch statement.

      ```js
      function findAuthor(){
        throw new Error('couldn't find that author');
      }

      // synchronous
      try {
        findAuthor();
      } catch(reason) {
        // something went wrong
      }

      // async with promises
      findAuthor().catch(function(reason){
        // something went wrong
      });
      ```

      @method catch
      @param {Function} onRejection
      Useful for tooling.
      @return {Promise}
    */
      'catch': function(onRejection) {
        return this.then(null, onRejection);
      }
    };
    function lib$es6$promise$polyfill$$polyfill() {
      var local;

      if (typeof global !== 'undefined') {
          local = global;
      } else if (typeof self !== 'undefined') {
          local = self;
      } else {
          try {
              local = Function('return this')();
          } catch (e) {
              throw new Error('polyfill failed because global object is unavailable in this environment');
          }
      }

      var P = local.Promise;

      if (P && Object.prototype.toString.call(P.resolve()) === '[object Promise]' && !P.cast) {
        return;
      }

      local.Promise = lib$es6$promise$promise$$default;
    }
    var lib$es6$promise$polyfill$$default = lib$es6$promise$polyfill$$polyfill;

    var lib$es6$promise$umd$$ES6Promise = {
      'Promise': lib$es6$promise$promise$$default,
      'polyfill': lib$es6$promise$polyfill$$default
    };

    /* global define:true module:true window: true */
    if (typeof define === 'function' && define['amd']) {
      define(function() { return lib$es6$promise$umd$$ES6Promise; });
    } else if (typeof module !== 'undefined' && module['exports']) {
      module['exports'] = lib$es6$promise$umd$$ES6Promise;
    } else if (typeof this !== 'undefined') {
      this['ES6Promise'] = lib$es6$promise$umd$$ES6Promise;
    }

    lib$es6$promise$polyfill$$default();
}).call(this);


}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":1}],51:[function(require,module,exports){
'use strict';

if (!require('./is-implemented')()) {
	Object.defineProperty(require('es5-ext/global'), 'Set',
		{ value: require('./polyfill'), configurable: true, enumerable: false,
			writable: true });
}

},{"./is-implemented":52,"./polyfill":55,"es5-ext/global":14}],52:[function(require,module,exports){
'use strict';

module.exports = function () {
	var set, iterator, result;
	if (typeof Set !== 'function') return false;
	if (String(Set.prototype) !== '[object Set]') return false;
	set = new Set(['raz', 'dwa', 'trzy']);
	if (set.size !== 3) return false;
	if (typeof set.add !== 'function') return false;
	if (typeof set.clear !== 'function') return false;
	if (typeof set.delete !== 'function') return false;
	if (typeof set.entries !== 'function') return false;
	if (typeof set.forEach !== 'function') return false;
	if (typeof set.has !== 'function') return false;
	if (typeof set.keys !== 'function') return false;
	if (typeof set.values !== 'function') return false;

	iterator = set.values();
	result = iterator.next();
	if (result.done !== false) return false;
	if (result.value !== 'raz') return false;

	return true;
};

},{}],53:[function(require,module,exports){
// Exports true if environment provides native `Set` implementation,
// whatever that is.

'use strict';

module.exports = (function () {
	if (typeof Set === 'undefined') return false;
	return (Object.prototype.toString.call(Set.prototype) === '[object Set]');
}());

},{}],54:[function(require,module,exports){
'use strict';

var setPrototypeOf    = require('es5-ext/object/set-prototype-of')
  , contains          = require('es5-ext/string/#/contains')
  , d                 = require('d')
  , Iterator          = require('es6-iterator')
  , toStringTagSymbol = require('es6-symbol').toStringTag

  , defineProperty = Object.defineProperty
  , SetIterator;

SetIterator = module.exports = function (set, kind) {
	if (!(this instanceof SetIterator)) return new SetIterator(set, kind);
	Iterator.call(this, set.__setData__, set);
	if (!kind) kind = 'value';
	else if (contains.call(kind, 'key+value')) kind = 'key+value';
	else kind = 'value';
	defineProperty(this, '__kind__', d('', kind));
};
if (setPrototypeOf) setPrototypeOf(SetIterator, Iterator);

SetIterator.prototype = Object.create(Iterator.prototype, {
	constructor: d(SetIterator),
	_resolve: d(function (i) {
		if (this.__kind__ === 'value') return this.__list__[i];
		return [this.__list__[i], this.__list__[i]];
	}),
	toString: d(function () { return '[object Set Iterator]'; })
});
defineProperty(SetIterator.prototype, toStringTagSymbol, d('c', 'Set Iterator'));

},{"d":10,"es5-ext/object/set-prototype-of":34,"es5-ext/string/#/contains":39,"es6-iterator":46,"es6-symbol":56}],55:[function(require,module,exports){
'use strict';

var clear          = require('es5-ext/array/#/clear')
  , eIndexOf       = require('es5-ext/array/#/e-index-of')
  , setPrototypeOf = require('es5-ext/object/set-prototype-of')
  , callable       = require('es5-ext/object/valid-callable')
  , d              = require('d')
  , ee             = require('event-emitter')
  , Symbol         = require('es6-symbol')
  , iterator       = require('es6-iterator/valid-iterable')
  , forOf          = require('es6-iterator/for-of')
  , Iterator       = require('./lib/iterator')
  , isNative       = require('./is-native-implemented')

  , call = Function.prototype.call
  , defineProperty = Object.defineProperty, getPrototypeOf = Object.getPrototypeOf
  , SetPoly, getValues;

module.exports = SetPoly = function (/*iterable*/) {
	var iterable = arguments[0], self;
	if (!(this instanceof SetPoly)) throw new TypeError('Constructor requires \'new\'');
	if (isNative && setPrototypeOf) self = setPrototypeOf(new Set(), getPrototypeOf(this));
	else self = this;
	if (iterable != null) iterator(iterable);
	defineProperty(self, '__setData__', d('c', []));
	if (!iterable) return self;
	forOf(iterable, function (value) {
		if (eIndexOf.call(this, value) !== -1) return;
		this.push(value);
	}, self.__setData__);
	return self;
};

if (isNative) {
	if (setPrototypeOf) setPrototypeOf(SetPoly, Set);
	SetPoly.prototype = Object.create(Set.prototype, { constructor: d(SetPoly) });
}

ee(Object.defineProperties(SetPoly.prototype, {
	add: d(function (value) {
		if (this.has(value)) return this;
		this.emit('_add', this.__setData__.push(value) - 1, value);
		return this;
	}),
	clear: d(function () {
		if (!this.__setData__.length) return;
		clear.call(this.__setData__);
		this.emit('_clear');
	}),
	delete: d(function (value) {
		var index = eIndexOf.call(this.__setData__, value);
		if (index === -1) return false;
		this.__setData__.splice(index, 1);
		this.emit('_delete', index, value);
		return true;
	}),
	entries: d(function () { return new Iterator(this, 'key+value'); }),
	forEach: d(function (cb/*, thisArg*/) {
		var thisArg = arguments[1], iterator, result, value;
		callable(cb);
		iterator = this.values();
		result = iterator._next();
		while (result !== undefined) {
			value = iterator._resolve(result);
			call.call(cb, thisArg, value, value, this);
			result = iterator._next();
		}
	}),
	has: d(function (value) {
		return (eIndexOf.call(this.__setData__, value) !== -1);
	}),
	keys: d(getValues = function () { return this.values(); }),
	size: d.gs(function () { return this.__setData__.length; }),
	values: d(function () { return new Iterator(this); }),
	toString: d(function () { return '[object Set]'; })
}));
defineProperty(SetPoly.prototype, Symbol.iterator, d(getValues));
defineProperty(SetPoly.prototype, Symbol.toStringTag, d('c', 'Set'));

},{"./is-native-implemented":53,"./lib/iterator":54,"d":10,"es5-ext/array/#/clear":11,"es5-ext/array/#/e-index-of":12,"es5-ext/object/set-prototype-of":34,"es5-ext/object/valid-callable":37,"es6-iterator/for-of":44,"es6-iterator/valid-iterable":49,"es6-symbol":56,"event-emitter":61}],56:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')() ? Symbol : require('./polyfill');

},{"./is-implemented":57,"./polyfill":59}],57:[function(require,module,exports){
'use strict';

module.exports = function () {
	var symbol;
	if (typeof Symbol !== 'function') return false;
	symbol = Symbol('test symbol');
	try { String(symbol); } catch (e) { return false; }
	if (typeof Symbol.iterator === 'symbol') return true;

	// Return 'true' for polyfills
	if (typeof Symbol.isConcatSpreadable !== 'object') return false;
	if (typeof Symbol.iterator !== 'object') return false;
	if (typeof Symbol.toPrimitive !== 'object') return false;
	if (typeof Symbol.toStringTag !== 'object') return false;
	if (typeof Symbol.unscopables !== 'object') return false;

	return true;
};

},{}],58:[function(require,module,exports){
'use strict';

module.exports = function (x) {
	return (x && ((typeof x === 'symbol') || (x['@@toStringTag'] === 'Symbol'))) || false;
};

},{}],59:[function(require,module,exports){
'use strict';

var d              = require('d')
  , validateSymbol = require('./validate-symbol')

  , create = Object.create, defineProperties = Object.defineProperties
  , defineProperty = Object.defineProperty, objPrototype = Object.prototype
  , NativeSymbol, SymbolPolyfill, HiddenSymbol, globalSymbols = create(null);

if (typeof Symbol === 'function') NativeSymbol = Symbol;

var generateName = (function () {
	var created = create(null);
	return function (desc) {
		var postfix = 0, name, ie11BugWorkaround;
		while (created[desc + (postfix || '')]) ++postfix;
		desc += (postfix || '');
		created[desc] = true;
		name = '@@' + desc;
		defineProperty(objPrototype, name, d.gs(null, function (value) {
			// For IE11 issue see:
			// https://connect.microsoft.com/IE/feedbackdetail/view/1928508/
			//    ie11-broken-getters-on-dom-objects
			// https://github.com/medikoo/es6-symbol/issues/12
			if (ie11BugWorkaround) return;
			ie11BugWorkaround = true;
			defineProperty(this, name, d(value));
			ie11BugWorkaround = false;
		}));
		return name;
	};
}());

HiddenSymbol = function Symbol(description) {
	if (this instanceof HiddenSymbol) throw new TypeError('TypeError: Symbol is not a constructor');
	return SymbolPolyfill(description);
};
module.exports = SymbolPolyfill = function Symbol(description) {
	var symbol;
	if (this instanceof Symbol) throw new TypeError('TypeError: Symbol is not a constructor');
	symbol = create(HiddenSymbol.prototype);
	description = (description === undefined ? '' : String(description));
	return defineProperties(symbol, {
		__description__: d('', description),
		__name__: d('', generateName(description))
	});
};
defineProperties(SymbolPolyfill, {
	for: d(function (key) {
		if (globalSymbols[key]) return globalSymbols[key];
		return (globalSymbols[key] = SymbolPolyfill(String(key)));
	}),
	keyFor: d(function (s) {
		var key;
		validateSymbol(s);
		for (key in globalSymbols) if (globalSymbols[key] === s) return key;
	}),
	hasInstance: d('', (NativeSymbol && NativeSymbol.hasInstance) || SymbolPolyfill('hasInstance')),
	isConcatSpreadable: d('', (NativeSymbol && NativeSymbol.isConcatSpreadable) ||
		SymbolPolyfill('isConcatSpreadable')),
	iterator: d('', (NativeSymbol && NativeSymbol.iterator) || SymbolPolyfill('iterator')),
	match: d('', (NativeSymbol && NativeSymbol.match) || SymbolPolyfill('match')),
	replace: d('', (NativeSymbol && NativeSymbol.replace) || SymbolPolyfill('replace')),
	search: d('', (NativeSymbol && NativeSymbol.search) || SymbolPolyfill('search')),
	species: d('', (NativeSymbol && NativeSymbol.species) || SymbolPolyfill('species')),
	split: d('', (NativeSymbol && NativeSymbol.split) || SymbolPolyfill('split')),
	toPrimitive: d('', (NativeSymbol && NativeSymbol.toPrimitive) || SymbolPolyfill('toPrimitive')),
	toStringTag: d('', (NativeSymbol && NativeSymbol.toStringTag) || SymbolPolyfill('toStringTag')),
	unscopables: d('', (NativeSymbol && NativeSymbol.unscopables) || SymbolPolyfill('unscopables'))
});
defineProperties(HiddenSymbol.prototype, {
	constructor: d(SymbolPolyfill),
	toString: d('', function () { return this.__name__; })
});

defineProperties(SymbolPolyfill.prototype, {
	toString: d(function () { return 'Symbol (' + validateSymbol(this).__description__ + ')'; }),
	valueOf: d(function () { return validateSymbol(this); })
});
defineProperty(SymbolPolyfill.prototype, SymbolPolyfill.toPrimitive, d('',
	function () { return validateSymbol(this); }));
defineProperty(SymbolPolyfill.prototype, SymbolPolyfill.toStringTag, d('c', 'Symbol'));

defineProperty(HiddenSymbol.prototype, SymbolPolyfill.toPrimitive,
	d('c', SymbolPolyfill.prototype[SymbolPolyfill.toPrimitive]));
defineProperty(HiddenSymbol.prototype, SymbolPolyfill.toStringTag,
	d('c', SymbolPolyfill.prototype[SymbolPolyfill.toStringTag]));

},{"./validate-symbol":60,"d":10}],60:[function(require,module,exports){
'use strict';

var isSymbol = require('./is-symbol');

module.exports = function (value) {
	if (!isSymbol(value)) throw new TypeError(value + " is not a symbol");
	return value;
};

},{"./is-symbol":58}],61:[function(require,module,exports){
'use strict';

var d        = require('d')
  , callable = require('es5-ext/object/valid-callable')

  , apply = Function.prototype.apply, call = Function.prototype.call
  , create = Object.create, defineProperty = Object.defineProperty
  , defineProperties = Object.defineProperties
  , hasOwnProperty = Object.prototype.hasOwnProperty
  , descriptor = { configurable: true, enumerable: false, writable: true }

  , on, once, off, emit, methods, descriptors, base;

on = function (type, listener) {
	var data;

	callable(listener);

	if (!hasOwnProperty.call(this, '__ee__')) {
		data = descriptor.value = create(null);
		defineProperty(this, '__ee__', descriptor);
		descriptor.value = null;
	} else {
		data = this.__ee__;
	}
	if (!data[type]) data[type] = listener;
	else if (typeof data[type] === 'object') data[type].push(listener);
	else data[type] = [data[type], listener];

	return this;
};

once = function (type, listener) {
	var once, self;

	callable(listener);
	self = this;
	on.call(this, type, once = function () {
		off.call(self, type, once);
		apply.call(listener, this, arguments);
	});

	once.__eeOnceListener__ = listener;
	return this;
};

off = function (type, listener) {
	var data, listeners, candidate, i;

	callable(listener);

	if (!hasOwnProperty.call(this, '__ee__')) return this;
	data = this.__ee__;
	if (!data[type]) return this;
	listeners = data[type];

	if (typeof listeners === 'object') {
		for (i = 0; (candidate = listeners[i]); ++i) {
			if ((candidate === listener) ||
					(candidate.__eeOnceListener__ === listener)) {
				if (listeners.length === 2) data[type] = listeners[i ? 0 : 1];
				else listeners.splice(i, 1);
			}
		}
	} else {
		if ((listeners === listener) ||
				(listeners.__eeOnceListener__ === listener)) {
			delete data[type];
		}
	}

	return this;
};

emit = function (type) {
	var i, l, listener, listeners, args;

	if (!hasOwnProperty.call(this, '__ee__')) return;
	listeners = this.__ee__[type];
	if (!listeners) return;

	if (typeof listeners === 'object') {
		l = arguments.length;
		args = new Array(l - 1);
		for (i = 1; i < l; ++i) args[i - 1] = arguments[i];

		listeners = listeners.slice();
		for (i = 0; (listener = listeners[i]); ++i) {
			apply.call(listener, this, args);
		}
	} else {
		switch (arguments.length) {
		case 1:
			call.call(listeners, this);
			break;
		case 2:
			call.call(listeners, this, arguments[1]);
			break;
		case 3:
			call.call(listeners, this, arguments[1], arguments[2]);
			break;
		default:
			l = arguments.length;
			args = new Array(l - 1);
			for (i = 1; i < l; ++i) {
				args[i - 1] = arguments[i];
			}
			apply.call(listeners, this, args);
		}
	}
};

methods = {
	on: on,
	once: once,
	off: off,
	emit: emit
};

descriptors = {
	on: d(on),
	once: d(once),
	off: d(off),
	emit: d(emit)
};

base = defineProperties({}, descriptors);

module.exports = exports = function (o) {
	return (o == null) ? create(base) : defineProperties(Object(o), descriptors);
};
exports.methods = methods;

},{"d":10,"es5-ext/object/valid-callable":37}],62:[function(require,module,exports){
/// <reference path="./typings/tsd.d.ts" />
'use strict';

var L = window.L;
function diffByOne(a, b) {
    var diff = 0;
    if (a !== '' && b !== '' && a.length === b.length) {
        for (var i = 0, j = 0; i < a.length && j < b.length; ++i, ++j) {
            if (a[i] != b[j]) {
                ++diff;
                if (a[i + 1] === b[j]) {
                    ++i;
                } else if (a[i] === b[j + 1]) {
                    ++j;
                } else if (a[i + 1] === b[j + 1]) {
                    ++i; //
                    ++j;
                }
            }
        }
    }
    return diff === 1;
}
exports.diffByOne = diffByOne;
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
    if (station.platforms.length !== 3) return null;
    var platforms = station.platforms.map(function (platformNum) {
        return graph.platforms[platformNum];
    });
    return platforms.every(function (platform) {
        return platform.transfers.length === 2;
    }) ? platforms : null;
}
exports.findCircle = findCircle;
function getCircumcenter(positions) {
    if (positions.length !== 3) {
        throw new Error('must have 3 vertices');
    }
    var b = positions[1].subtract(positions[0]);
    var c = positions[2].subtract(positions[0]);
    var bb = dot(b, b);
    var cc = dot(c, c);
    return new L.Point(c.y * bb - b.y * cc, b.x * cc - c.x * bb).divideBy(2.0 * (b.x * c.y - b.y * c.x)).add(positions[0]);
}
exports.getCircumcenter = getCircumcenter;
function getSVGDataset(el) {
    // for webkit-based browsers
    if ('dataset' in el) {
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
function flashTitle(titles, duration) {
    var i = 0;
    setInterval(function () {
        return document.title = titles[++i % titles.length];
    }, duration);
}
exports.flashTitle = flashTitle;
function dot(a, b) {
    return a.x * b.x + a.y * b.y;
}
exports.dot = dot;
function angle(v1, v2) {
    return dot(v1, v2) / v1.distanceTo(v2);
}
exports.angle = angle;
function getCenter(pts) {
    return pts.reduce(function (prev, cur) {
        return prev.add(cur);
    }).divideBy(pts.length);
}
exports.getCenter = getCenter;
function verifyHints(graph, hints) {
    function checkPlatformHintObject(obj) {
        Object.keys(obj).forEach(function (line) {
            var val = obj[line];
            if (typeof val === 'string') {
                if (graph.platforms.find(function (el) {
                    return el.name === val;
                }) === undefined) {
                    throw new Error("platform " + val + " doesn't exist");
                }
            } else {
                val.forEach(function (item) {
                    if (graph.platforms.find(function (el) {
                        return el.name === item;
                    }) === undefined) {
                        throw new Error("platform " + item + " doesn't exist");
                    }
                });
            }
        });
    }
    return new Promise(function (resolve, reject) {
        var crossPlatform = hints.crossPlatform;
        Object.keys(crossPlatform).forEach(function (platformName) {
            if (graph.platforms.find(function (el) {
                return el.name === platformName;
            }) === undefined) {
                reject("platform " + platformName + " doesn't exist");
            }
            var obj = crossPlatform[platformName];
            if ('forEach' in obj) {
                obj.forEach(function (o) {
                    return checkPlatformHintObject;
                });
            } else {
                checkPlatformHintObject(obj);
            }
        });
        Object.keys(hints.englishNames).forEach(function (platformName) {
            if (graph.platforms.find(function (el) {
                return el.name === platformName;
            }) === undefined) {
                reject("platform " + platformName + " doesn't exist");
            }
        });
        resolve('hints json seems okay');
    });
}
exports.verifyHints = verifyHints;
/**
 * null: doesn't contain
 * -1: is an object
 * >=0: is an array
 */
function hintContainsLine(graph, dirHints, platform) {
    var spans = platform.spans.map(function (i) {
        return graph.spans[i];
    });
    var routes = [];
    spans.forEach(function (span) {
        return span.routes.forEach(function (i) {
            return routes.push(graph.routes[i]);
        });
    });
    var lines = routes.map(function (rt) {
        return rt.line;
    });
    var platformHints = dirHints[platform.name];
    if (platformHints) {
        if ('forEach' in platformHints) {
            for (var idx = 0; idx < platformHints.length; ++idx) {
                if (Object.keys(platformHints[idx]).some(function (key) {
                    return lines.indexOf(key) > -1;
                })) {
                    return idx;
                }
            }
        } else if (Object.keys(platformHints).some(function (key) {
            return lines.indexOf(key) > -1;
        })) {
            return -1;
        }
    }
    return null;
}
exports.hintContainsLine = hintContainsLine;
function downloadAsFile(title, content) {
    var a = document.createElement('a');
    var blob = new Blob([content], { type: "octet/stream" });
    var url = window.URL.createObjectURL(blob);
    a.href = url;
    a['download'] = title;
    a.click();
    window.URL.revokeObjectURL(url);
}
exports.downloadAsFile = downloadAsFile;


},{}]},{},[3]);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJzY3JpcHQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkoezE6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG5cbn0se31dLDI6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xudmFyIF9fYXdhaXRlciA9IHRoaXMgJiYgdGhpcy5fX2F3YWl0ZXIgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIF9hcmd1bWVudHMsIFByb21pc2UsIGdlbmVyYXRvcikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGdlbmVyYXRvciA9IGdlbmVyYXRvci5jYWxsKHRoaXNBcmcsIF9hcmd1bWVudHMpO1xuICAgICAgICBmdW5jdGlvbiBjYXN0KHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQcm9taXNlICYmIHZhbHVlLmNvbnN0cnVjdG9yID09PSBQcm9taXNlID8gdmFsdWUgOiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUodmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gb25mdWxmaWxsKHZhbHVlKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHN0ZXAoXCJuZXh0XCIsIHZhbHVlKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gb25yZWplY3QodmFsdWUpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgc3RlcChcInRocm93XCIsIHZhbHVlKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcCh2ZXJiLCB2YWx1ZSkge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGdlbmVyYXRvclt2ZXJiXSh2YWx1ZSk7XG4gICAgICAgICAgICByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IGNhc3QocmVzdWx0LnZhbHVlKS50aGVuKG9uZnVsZmlsbCwgb25yZWplY3QpO1xuICAgICAgICB9XG4gICAgICAgIHN0ZXAoXCJuZXh0XCIsIHZvaWQgMCk7XG4gICAgfSk7XG59O1xudmFyIEwgPSB3aW5kb3cuTDtcbnZhciBMYXllckNvbnRyb2wgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIExheWVyQ29udHJvbCh0aWxlTGF5ZXJzLCBvdGhlckxheWVycykge1xuICAgICAgICBpZiAob3RoZXJMYXllcnMgPT09IHZvaWQgMCkge1xuICAgICAgICAgICAgb3RoZXJMYXllcnMgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGF5ZXJDb250cm9sID0gTC5jb250cm9sWydVbmlGb3JtJ10odGlsZUxheWVycywgb3RoZXJMYXllcnMsIHtcbiAgICAgICAgICAgIGNvbGxhcHNlZDogZmFsc2UsXG4gICAgICAgICAgICBwb3NpdGlvbjogJ3RvcHJpZ2h0J1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgTGF5ZXJDb250cm9sLnByb3RvdHlwZS5hZGRUbyA9IGZ1bmN0aW9uIChtYXApIHtcbiAgICAgICAgLy8gYWRkIGNvbnRyb2wgd2lkZ2V0IHRvIG1hcCBhbmQgaHRtbCBkb20uXG4gICAgICAgIHRoaXMubGF5ZXJDb250cm9sLmFkZFRvKG1hcCk7XG4gICAgICAgIC8vIHVwZGF0ZSB0aGUgY29udHJvbCB3aWRnZXQgdG8gdGhlIHNwZWNpZmljIHRoZW1lLlxuICAgICAgICB0aGlzLmxheWVyQ29udHJvbC5yZW5kZXJVbmlmb3JtQ29udHJvbCgpO1xuICAgIH07XG4gICAgcmV0dXJuIExheWVyQ29udHJvbDtcbn0pKCk7XG5leHBvcnRzLkxheWVyQ29udHJvbCA9IExheWVyQ29udHJvbDtcbnZhciBNZWFzdXJlbWVudCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTWVhc3VyZW1lbnQobWV0cm9NYXApIHtcbiAgICAgICAgdmFyIG92ZXJsYXkgPSBtZXRyb01hcC5nZXRPdmVybGF5KCk7XG4gICAgICAgIHZhciBtYXAgPSBtZXRyb01hcC5nZXRNYXAoKTtcbiAgICAgICAgdmFyIHBvbHlsaW5lID0gbmV3IEwuUG9seWxpbmUoW10sIHsgY29sb3I6ICdyZWQnIH0pO1xuICAgICAgICBwb2x5bGluZS5hZGRUbyhtYXApO1xuICAgICAgICB2YXIgbWFya2VyID0gbmV3IEwuQ2lyY2xlTWFya2VyKFs2MCwgMzBdKTtcbiAgICAgICAgdmFyIHRleHQgPSAnMG0nO1xuICAgICAgICAvL21hcmtlci5vbignbW91c2VvdmVyJywgZSA9PiBwb3B1cC4pXG4gICAgICAgIG92ZXJsYXkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKCFlLnNoaWZ0S2V5KSByZXR1cm47XG4gICAgICAgICAgICB2YXIgcHQgPSBtYXAuY29udGFpbmVyUG9pbnRUb0xhdExuZyhuZXcgTC5Qb2ludChlLngsIGUueSkpO1xuICAgICAgICAgICAgcG9seWxpbmUuYWRkTGF0TG5nKHB0KS5yZWRyYXcoKTtcbiAgICAgICAgICAgIG1hcmtlci5vbignbW91c2VvdXQnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBtYXJrZXIuY2xvc2VQb3B1cCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLy5vbignZGJsY2xpY2snLCBlID0+IHtcbiAgICAgICAgICAgIC8vICAgIHBvbHlsaW5lLnNldExhdExuZ3MoW10pLnJlZHJhdygpO1xuICAgICAgICAgICAgLy8gICAgdGhpcy5tYXAucmVtb3ZlTGF5ZXIobWFya2VyKTtcbiAgICAgICAgICAgIC8vfSlcbiAgICAgICAgICAgIG1hcmtlci5hZGRUbyhtYXApO1xuICAgICAgICAgICAgdmFyIHB0cyA9IHBvbHlsaW5lLmdldExhdExuZ3MoKTtcbiAgICAgICAgICAgIGlmIChwdHMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgIHZhciBkaXN0YW5jZSA9IDA7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBwdHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgZGlzdGFuY2UgKz0gcHRzW2kgLSAxXS5kaXN0YW5jZVRvKHB0c1tpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIEwucG9wdXAoKS5zZXRMYXRMbmcocHQpLnNldENvbnRlbnQoJ1BvcHVwJykub3Blbk9uKG1hcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gTWVhc3VyZW1lbnQ7XG59KSgpO1xuZXhwb3J0cy5NZWFzdXJlbWVudCA9IE1lYXN1cmVtZW50O1xuXG5cbn0se31dLDM6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xudmFyIF9fYXdhaXRlciA9IHRoaXMgJiYgdGhpcy5fX2F3YWl0ZXIgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIF9hcmd1bWVudHMsIFByb21pc2UsIGdlbmVyYXRvcikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGdlbmVyYXRvciA9IGdlbmVyYXRvci5jYWxsKHRoaXNBcmcsIF9hcmd1bWVudHMpO1xuICAgICAgICBmdW5jdGlvbiBjYXN0KHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQcm9taXNlICYmIHZhbHVlLmNvbnN0cnVjdG9yID09PSBQcm9taXNlID8gdmFsdWUgOiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUodmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gb25mdWxmaWxsKHZhbHVlKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHN0ZXAoXCJuZXh0XCIsIHZhbHVlKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gb25yZWplY3QodmFsdWUpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgc3RlcChcInRocm93XCIsIHZhbHVlKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcCh2ZXJiLCB2YWx1ZSkge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGdlbmVyYXRvclt2ZXJiXSh2YWx1ZSk7XG4gICAgICAgICAgICByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IGNhc3QocmVzdWx0LnZhbHVlKS50aGVuKG9uZnVsZmlsbCwgb25yZWplY3QpO1xuICAgICAgICB9XG4gICAgICAgIHN0ZXAoXCJuZXh0XCIsIHZvaWQgMCk7XG4gICAgfSk7XG59O1xudmFyIG1ldHJvX21hcF8xID0gcmVxdWlyZSgnLi9tZXRyby1tYXAnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuLy9pbXBvcnQgTWV0cm9NYXAgZnJvbSAnLi9tZXRyby1tYXAnO1xuaWYgKEwuQnJvd3Nlci5pZSkge1xuICAgIGFsZXJ0KFwiRG9lcyBub3Qgd29yayBpbiBJRSAoeWV0KVwiKTtcbn0gZWxzZSBpZiAoTC5Ccm93c2VyLm1vYmlsZSkge1xuICAgIGFsZXJ0KFwiTWF5IHdvcmsgaW5jb3JyZWN0bHkgaW4gbW9iaWxlIGJyb3dzZXJcIik7XG59XG52YXIgcG9seWZpbGxzXzEgPSByZXF1aXJlKCcuL3BvbHlmaWxscycpO1xucG9seWZpbGxzXzEuZGVmYXVsdCgpO1xudmFyIHRpbGVsYXllcnNfMSA9IHJlcXVpcmUoJy4vdGlsZWxheWVycycpO1xudmFyIG1ldHJvTWFwID0gbmV3IG1ldHJvX21hcF8xLmRlZmF1bHQoJ21hcC1jb250YWluZXInLCAnanNvbi9ncmFwaC5qc29uJywgdGlsZWxheWVyc18xLmRlZmF1bHQpO1xudXRpbC5mbGFzaFRpdGxlKFsnUGxhbiBtZXRybyBTYW5rdC1QZXRlcmJ1cmdhJywgJ1BpZXRhcmluIG1ldHJvbiBoYW5rZXN1dW5uaXRlbG1hJywgJ1N0IFBldGVyc2J1cmcgbWV0cm8gcGxhbiBwcm9wb3NhbCddLCAzMDAwKTtcbmNvbnNvbGUubG9nKCd1c2VyOiAnICsgbmF2aWdhdG9yLnVzZXJMYW5ndWFnZSk7XG5jb25zb2xlLmxvZygnbGFuZ3VhZ2U6ICcgKyBuYXZpZ2F0b3IubGFuZ3VhZ2UpO1xuY29uc29sZS5sb2coJ2Jyb3dzZXI6ICcgKyBuYXZpZ2F0b3IuYnJvd3Nlckxhbmd1YWdlKTtcbmNvbnNvbGUubG9nKCdzeXN0ZW06ICcgKyBuYXZpZ2F0b3Iuc3lzdGVtTGFuZ3VhZ2UpO1xuLyogVE9ETzpcclxuMS4gRkFRIHdpdGggdXNlciB3aXRoIHRoZSBmb2xsb3dpbmcgcXVlc3Rpb25zOlxyXG5hLiB3aHkgaXMgZXZlcnl0aGluZyBpbiBsYXRpbmljYVxyXG5iLiB3aHkgaGF2ZSBzb21lIHN0YXRpb25zIGJlZW4gcmVuYW1lZFxyXG5jLiB3aHkgaGF2ZSBuZXcgc3RhdGlvbnMgYmVlbiBlbWJlZGRlZCBiZXR3ZWVuIG9sZCBvbmVzXHJcbmQuIHN0IHBldGVyc2J1cmcncyBjbGltYXRlIG5vdCBzdWl0ZWQgZm9yIG92ZXJncm91bmQgcmFpbHdheSAodGhlcmUgYXJlIHN1YnVyYmFuIHRyYWlucy4uLiBsb29rIGF0IGhlbHNpbmtpKVxyXG5lLiB3dGYgaXMgaW5ncmlhLCB3aHkgYXJlIHRoZSBzdGF0aW9ucyBkdWJiZWQgaW4gZmlubmlzaFxyXG5mLiB0aGVyZSdzIG5vIG1vbmV5IGZvciBpdCAod2hvc2UgZmF1bHQgaXMgaXQ/KVxyXG5nLiBpIGRvIG5vdCBhZ3JlZSB3aXRoIHRoZSBuZXR3b3JrLCB3aGVyZSdzIHRoZSBzdGF0aW9uIG5lYXIgbXkgaG9tZSAocHJvcG9zZSB5b3VyIG93bilcclxuaC4gbWFsZnVuY3Rpb25pbmcgaW4gSUUgKGdldCBhIG5vcm1hbCBicm93c2VyIGZmcylcclxuaS4gd2h5IGp1bmN0aW9ucyBoYXZlIHNpbmdsZSBuYW1lXHJcbiAqLyAvKiovXG5cblxufSx7XCIuLi91dGlsXCI6NjIsXCIuL21ldHJvLW1hcFwiOjQsXCIuL3BvbHlmaWxsc1wiOjUsXCIuL3RpbGVsYXllcnNcIjo3fV0sNDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG52YXIgX19hd2FpdGVyID0gdGhpcyAmJiB0aGlzLl9fYXdhaXRlciB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUHJvbWlzZSwgZ2VuZXJhdG9yKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmNhbGwodGhpc0FyZywgX2FyZ3VtZW50cyk7XG4gICAgICAgIGZ1bmN0aW9uIGNhc3QodmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFByb21pc2UgJiYgdmFsdWUuY29uc3RydWN0b3IgPT09IFByb21pc2UgPyB2YWx1ZSA6IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh2YWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBvbmZ1bGZpbGwodmFsdWUpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgc3RlcChcIm5leHRcIiwgdmFsdWUpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHJlamVjdChlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBvbnJlamVjdCh2YWx1ZSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBzdGVwKFwidGhyb3dcIiwgdmFsdWUpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHJlamVjdChlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHZlcmIsIHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gZ2VuZXJhdG9yW3ZlcmJdKHZhbHVlKTtcbiAgICAgICAgICAgIHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogY2FzdChyZXN1bHQudmFsdWUpLnRoZW4ob25mdWxmaWxsLCBvbnJlamVjdCk7XG4gICAgICAgIH1cbiAgICAgICAgc3RlcChcIm5leHRcIiwgdm9pZCAwKTtcbiAgICB9KTtcbn07XG52YXIgTCA9IHdpbmRvdy5MO1xudmFyIHN2ZyA9IHJlcXVpcmUoJy4vc3ZnJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcbnZhciBhZGRvbnMgPSByZXF1aXJlKCcuL2FkZG9ucycpO1xudmFyIE1ldHJvTWFwID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBNZXRyb01hcChjb250YWluZXJJZCwga21sLCB0aWxlTGF5ZXJzKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMud2hpc2tlcnMgPSBbXTtcbiAgICAgICAgdmFyIGZldGNoID0gd2luZG93WydmZXRjaCddO1xuICAgICAgICB2YXIgZ3JhcGhQcm9taXNlID0gZmV0Y2goa21sKS50aGVuKGZ1bmN0aW9uIChncmFwaFRleHQpIHtcbiAgICAgICAgICAgIHJldHVybiBncmFwaFRleHQuanNvbigpO1xuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChncmFwaEpTT04pIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5ncmFwaCA9IGdyYXBoSlNPTjtcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBoaW50c1Byb21pc2UgPSBmZXRjaCgnanNvbi9oaW50cy5qc29uJykudGhlbihmdW5jdGlvbiAoaGludHNUZXh0KSB7XG4gICAgICAgICAgICByZXR1cm4gaGludHNUZXh0Lmpzb24oKTtcbiAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoaGludHNKU09OKSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuaGludHMgPSBoaW50c0pTT047XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgZGF0YVByb21pc2UgPSBmZXRjaCgnanNvbi9kYXRhLmpzb24nKS50aGVuKGZ1bmN0aW9uIChkYXRhVGV4dCkge1xuICAgICAgICAgICAgcmV0dXJuIGRhdGFUZXh0Lmpzb24oKTtcbiAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoZGF0YUpTT04pIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy50ZXh0RGF0YSA9IGRhdGFKU09OO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5tYXAgPSBuZXcgTC5NYXAoY29udGFpbmVySWQsIHtcbiAgICAgICAgICAgIC8vbGF5ZXJzOiB0aWxlTGF5ZXJzW09iamVjdC5rZXlzKHRpbGVMYXllcnMpWzBdXSxcbiAgICAgICAgICAgIGNlbnRlcjogbmV3IEwuTGF0TG5nKDU5Ljk0MzU1NiwgMzAuMzA0NTIpLFxuICAgICAgICAgICAgem9vbTogTC5Ccm93c2VyLnJldGluYSA/IDEyIDogMTEsXG4gICAgICAgICAgICBtaW5ab29tOiA5LFxuICAgICAgICAgICAgaW5lcnRpYTogZmFsc2VcbiAgICAgICAgfSkuYWRkQ29udHJvbChuZXcgTC5Db250cm9sLlNjYWxlKHsgaW1wZXJpYWw6IGZhbHNlIH0pKTtcbiAgICAgICAgY29uc29sZS5sb2codGlsZUxheWVyc1tPYmplY3Qua2V5cyh0aWxlTGF5ZXJzKVswXV1bMF0pO1xuICAgICAgICB0aWxlTGF5ZXJzW09iamVjdC5rZXlzKHRpbGVMYXllcnMpWzBdXS5hZGRUbyh0aGlzLm1hcCk7XG4gICAgICAgIG5ldyBhZGRvbnMuTGF5ZXJDb250cm9sKHRpbGVMYXllcnMpLmFkZFRvKHRoaXMubWFwKTtcbiAgICAgICAgY29uc29sZS5sb2coJ21hcCBzaG91bGQgYmUgY3JlYXRlZCBieSBub3cnKTtcbiAgICAgICAgdGhpcy5vdmVybGF5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ292ZXJsYXknKTtcbiAgICAgICAgdmFyIGNvbnRhaW5lciA9IHRoaXMubWFwLmdldENvbnRhaW5lcigpO1xuICAgICAgICBjb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5vdmVybGF5KTtcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMub3ZlcmxheSk7XG4gICAgICAgIHRoaXMuYWRkTWFwTGlzdGVuZXJzKCk7XG4gICAgICAgIGdyYXBoUHJvbWlzZS5jYXRjaChmdW5jdGlvbiAoZXJyVGV4dCkge1xuICAgICAgICAgICAgcmV0dXJuIGFsZXJ0KGVyclRleHQpO1xuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChncmFwaEpzb24pIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5leHRlbmRCb3VuZHMoKTtcbiAgICAgICAgfSkgLy8gYmVjYXVzZSB0aGUgcHJldmlvdXMgYXNzaWdubWVudCByZXR1cm5zIGpzb25cbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGhpbnRzUHJvbWlzZTtcbiAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoaGludHNKc29uKSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMucmVkcmF3TmV0d29yaygpO1xuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5tYXAuaW52YWxpZGF0ZVNpemUoZmFsc2UpO1xuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5yZXNldE1hcFZpZXcoKTtcbiAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuZml4Rm9udFJlbmRlcmluZyhfdGhpcy5tYXAuZ2V0UGFuZXMoKS5tYXBQYW5lKTtcbiAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZGF0YVByb21pc2U7XG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdlZGl0LW1hcC1idXR0b24nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIF90aGlzLmVkaXRNYXBDbGljay5iaW5kKF90aGlzKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBQcm9taXNlLmFsbChbZ3JhcGhQcm9taXNlLCBoaW50c1Byb21pc2VdKS50aGVuKGZ1bmN0aW9uIChyZXN1bHRzKSB7XG4gICAgICAgICAgICByZXR1cm4gdXRpbC52ZXJpZnlIaW50cyhfdGhpcy5ncmFwaCwgX3RoaXMuaGludHMpO1xuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIE1ldHJvTWFwLnByb3RvdHlwZS5nZXRNYXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcDtcbiAgICB9O1xuICAgIE1ldHJvTWFwLnByb3RvdHlwZS5nZXRPdmVybGF5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vdmVybGF5O1xuICAgIH07XG4gICAgTWV0cm9NYXAucHJvdG90eXBlLmFkZE1hcExpc3RlbmVycyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIG1hcFBhbmUgPSB0aGlzLm1hcC5nZXRQYW5lcygpLm1hcFBhbmU7XG4gICAgICAgIHRoaXMubWFwLm9uKCdtb3Zlc3RhcnQnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzLm1hcC50b3VjaFpvb20uZGlzYWJsZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5tYXAub24oJ21vdmUnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgLy90aGlzLm92ZXJsYXkuc3R5bGVbJy13ZWJraXQtdHJhbnNpdGlvbiddID0gbWFwUGFuZS5zdHlsZVsnLXdlYmtpdC10cmFuc2l0aW9uJ107XG4gICAgICAgICAgICAvL3RoaXMub3ZlcmxheS5zdHlsZS50cmFuc2l0aW9uID0gbWFwUGFuZS5zdHlsZS50cmFuc2l0aW9uO1xuICAgICAgICAgICAgX3RoaXMub3ZlcmxheS5zdHlsZS50cmFuc2Zvcm0gPSBtYXBQYW5lLnN0eWxlLnRyYW5zZm9ybTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIHRoZSBzZWNyZXQgb2YgY29ycmVjdCBwb3NpdGlvbmluZyBpcyB0aGUgbW92ZW5kIHRyYW5zZm9ybSBjaGVjayBmb3IgY29ycmVudCB0cmFuc2Zvcm1cbiAgICAgICAgdGhpcy5tYXAub24oJ21vdmVlbmQnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ21vdmUgZW5kZWQnKTtcbiAgICAgICAgICAgIF90aGlzLm1hcC50b3VjaFpvb20uZW5hYmxlKCk7XG4gICAgICAgICAgICAvL3RoaXMub3ZlcmxheS5zdHlsZVsnLXdlYmtpdC10cmFuc2l0aW9uJ10gPSBudWxsO1xuICAgICAgICAgICAgLy90aGlzLm92ZXJsYXkuc3R5bGUudHJhbnNpdGlvbiA9IG51bGw7XG4gICAgICAgICAgICBfdGhpcy5maXhGb250UmVuZGVyaW5nKG1hcFBhbmUpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5tYXAub24oJ3pvb21zdGFydCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBfdGhpcy5tYXAuZHJhZ2dpbmcuZGlzYWJsZSgpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coZSk7XG4gICAgICAgICAgICAvL3RoaXMub3ZlcmxheS5jbGFzc0xpc3QuYWRkKCdsZWFmbGV0LXpvb20tYW5pbScpO1xuICAgICAgICAgICAgX3RoaXMub3ZlcmxheS5zdHlsZS5vcGFjaXR5ID0gJzAuNSc7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLm1hcC5vbignem9vbWVuZCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCd6b29tIGVuZGVkJyk7XG4gICAgICAgICAgICBfdGhpcy5yZWRyYXdOZXR3b3JrKCk7XG4gICAgICAgICAgICAvL3RoaXMub3ZlcmxheS5jbGFzc0xpc3QucmVtb3ZlKCdsZWFmbGV0LXpvb20tYW5pbScpO1xuICAgICAgICAgICAgX3RoaXMub3ZlcmxheS5zdHlsZS5vcGFjaXR5ID0gbnVsbDtcbiAgICAgICAgICAgIF90aGlzLm1hcC5kcmFnZ2luZy5lbmFibGUoKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICAvKipcclxuICAgICAqIEZpeGVzIGJsdXJyeSBmb250IGR1ZSB0byAndHJhbnNmb3JtM2QnIENTUyBwcm9wZXJ0eS4gQ2hhbmdlcyBldmVyeXRoaW5nIHRvICd0cmFuc2Zvcm0nIHdoZW4gdGhlIG1hcCBpcyBub3QgbW92aW5nXHJcbiAgICAgKiBAcGFyYW0gbWFwUGFuZVxyXG4gICAgICovXG4gICAgTWV0cm9NYXAucHJvdG90eXBlLmZpeEZvbnRSZW5kZXJpbmcgPSBmdW5jdGlvbiAobWFwUGFuZSkge1xuICAgICAgICB2YXIgdDNkID0gdXRpbC5wYXJzZVRyYW5zZm9ybShtYXBQYW5lLnN0eWxlLnRyYW5zZm9ybSk7XG4gICAgICAgIHRoaXMub3ZlcmxheS5zdHlsZS50cmFuc2Zvcm0gPSBtYXBQYW5lLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgdDNkLnggKyBcInB4LCBcIiArIHQzZC55ICsgXCJweClcIjtcbiAgICB9O1xuICAgIE1ldHJvTWFwLnByb3RvdHlwZS5yZXNldE1hcFZpZXcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vdGhpcy5tYXAuYWRkTGF5ZXIoTC5jaXJjbGUoTC5MYXRMbmcoNjAsIDMwKSwgMTApKTtcbiAgICAgICAgLy90aGlzLm92ZXJsYXkgPSA8SFRNTEVsZW1lbnQ+dGhpcy5tYXAuZ2V0UGFuZXMoKS5vdmVybGF5UGFuZS5jaGlsZHJlblswXTtcbiAgICAgICAgdGhpcy5tYXAuc2V0Vmlldyh0aGlzLmJvdW5kcy5nZXRDZW50ZXIoKSwgTC5Ccm93c2VyLnJldGluYSA/IDEyIDogMTEsIHtcbiAgICAgICAgICAgIHBhbjogeyBhbmltYXRlOiBmYWxzZSB9LFxuICAgICAgICAgICAgem9vbTogeyBhbmltYXRlOiBmYWxzZSB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgTWV0cm9NYXAucHJvdG90eXBlLnJlc2V0T3ZlcmxheVN0cnVjdHVyZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNoaWxkO1xuICAgICAgICB3aGlsZSAoY2hpbGQgPSB0aGlzLm92ZXJsYXkuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgdGhpcy5vdmVybGF5LnJlbW92ZUNoaWxkKGNoaWxkKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZGVmcyA9IHN2Zy5jcmVhdGVTVkdFbGVtZW50KCdkZWZzJyk7XG4gICAgICAgIGRlZnMuYXBwZW5kQ2hpbGQoc3ZnLm1ha2VEcm9wU2hhZG93KCkpO1xuICAgICAgICB0aGlzLm92ZXJsYXkuYXBwZW5kQ2hpbGQoZGVmcyk7XG4gICAgICAgIC8vIHN2ZyBlbGVtZW50IHdvbid0IHdvcmsgYmVjYXVzZSBpdCBkb2VzIG5vdCBoYXZlIG5lZ2F0aXZlIGRpbWVuc2lvbnNcbiAgICAgICAgLy8gKHRvcC1sZWZ0IHN0YXRpb24gaXMgcGFydGlhbGx5IHZpc2libGUpXG4gICAgICAgIHZhciBvcmlnaW4gPSBzdmcuY3JlYXRlU1ZHRWxlbWVudCgnZycpO1xuICAgICAgICBvcmlnaW4uaWQgPSAnb3JpZ2luJztcbiAgICAgICAgLy8gcGF0aHMtb3V0ZXIsIHBhdGhzLWlubmVyLCB0cmFuc2ZlcnMtb3V0ZXIsIHN0YXRpb24tY2lyY2xlcywgdHJhbnNmZXJzLWlubmVyLCBkdW1teS1jaXJjbGVzXG4gICAgICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSBbJ3BhdGhzLW91dGVyJywgJ3BhdGhzLWlubmVyJywgJ3RyYW5zZmVycy1vdXRlcicsICdzdGF0aW9uLWNpcmNsZXMnLCAndHJhbnNmZXJzLWlubmVyJywgJ2R1bW15LWNpcmNsZXMnXTsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIHZhciBncm91cElkID0gX2FbX2ldO1xuICAgICAgICAgICAgdmFyIGdyb3VwID0gc3ZnLmNyZWF0ZVNWR0VsZW1lbnQoJ2cnKTtcbiAgICAgICAgICAgIGdyb3VwLmlkID0gZ3JvdXBJZDtcbiAgICAgICAgICAgIG9yaWdpbi5hcHBlbmRDaGlsZChncm91cCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vdmVybGF5LmFwcGVuZENoaWxkKG9yaWdpbik7XG4gICAgICAgIHZhciBzdGF0aW9uQ2lyY2xlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdGF0aW9uLWNpcmNsZXMnKTtcbiAgICAgICAgc3RhdGlvbkNpcmNsZXMuY2xhc3NMaXN0LmFkZCgnc3RhdGlvbi1jaXJjbGUnKTtcbiAgICAgICAgb3JpZ2luLmluc2VydEJlZm9yZShzdmcubWFrZVBsYXRlKCksIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkdW1teS1jaXJjbGVzJykpO1xuICAgIH07XG4gICAgTWV0cm9NYXAucHJvdG90eXBlLmV4dGVuZEJvdW5kcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGEgPSB0aGlzLmdyYXBoLnBsYXRmb3Jtc1swXS5sb2NhdGlvbjtcbiAgICAgICAgdGhpcy5ib3VuZHMgPSBuZXcgTC5MYXRMbmdCb3VuZHMoYSwgYSk7XG4gICAgICAgIHRoaXMuZ3JhcGgucGxhdGZvcm1zLmZvckVhY2goZnVuY3Rpb24gKHBsYXRmb3JtKSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuYm91bmRzLmV4dGVuZChwbGF0Zm9ybS5sb2NhdGlvbik7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgTWV0cm9NYXAucHJvdG90eXBlLmFkZEJpbmRpbmdzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLmdyYXBoLnBsYXRmb3Jtcy5mb3JFYWNoKGZ1bmN0aW9uIChwbGF0Zm9ybSwgaSkge1xuICAgICAgICAgICAgdmFyIGNpcmNsZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwLScgKyBpKTtcbiAgICAgICAgICAgIHZhciBkdW1teUNpcmNsZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkLScgKyBpKTtcbiAgICAgICAgICAgIHZhciBjYWNoZWQgPSBwbGF0Zm9ybS5sb2NhdGlvbjsgLy8gYnJpbmcgZG93blxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHBsYXRmb3JtLCAnbG9jYXRpb24nLCB7XG4gICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwbGF0Zm9ybVsnX2xvY2F0aW9uJ107XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uIChsb2NhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBwbGF0Zm9ybVsnX2xvY2F0aW9uJ10gPSBsb2NhdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxvY0ZvclBvcyA9IF90aGlzLm1hcC5nZXRab29tKCkgPCAxMiA/IF90aGlzLmdyYXBoLnN0YXRpb25zW3BsYXRmb3JtLnN0YXRpb25dLmxvY2F0aW9uIDogbG9jYXRpb247XG4gICAgICAgICAgICAgICAgICAgIHZhciBwb3MgPSBfdGhpcy5tYXAubGF0TG5nVG9Db250YWluZXJQb2ludChsb2NGb3JQb3MpLnN1YnRyYWN0KF90aGlzLm1hcC5sYXRMbmdUb0NvbnRhaW5lclBvaW50KF90aGlzLmJvdW5kcy5nZXROb3J0aFdlc3QoKSkpO1xuICAgICAgICAgICAgICAgICAgICBjaXJjbGUuc2V0QXR0cmlidXRlKCdjeCcsIHBvcy54LnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgICAgICBjaXJjbGUuc2V0QXR0cmlidXRlKCdjeScsIHBvcy55LnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgICAgICBkdW1teUNpcmNsZS5zZXRBdHRyaWJ1dGUoJ2N4JywgcG9zLngudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgICAgIGR1bW15Q2lyY2xlLnNldEF0dHJpYnV0ZSgnY3knLCBwb3MueS50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMud2hpc2tlcnNbaV0gPSBfdGhpcy5tYWtlV2hpc2tlcnMoaSk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSBwbGF0Zm9ybS5zcGFuczsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzcGFuSW5kZXggPSBfYVtfaV07XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGF0aHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiW2lkJD1cXFwiZXItXCIgKyBzcGFuSW5kZXggKyBcIlxcXCJdXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNwYW4gPSBfdGhpcy5ncmFwaC5zcGFuc1tzcGFuSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNyY04gPSBzcGFuLnNvdXJjZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmdOID0gc3Bhbi50YXJnZXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGxhdGZvcm0gPT09IF90aGlzLmdyYXBoLnBsYXRmb3Jtc1tzcmNOXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnBsYXRmb3Jtc09uU1ZHW3NyY05dID0gcG9zO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5wbGF0Zm9ybXNPblNWR1t0cmdOXSA9IHBvcztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb250cm9sUG9pbnRzID0gW190aGlzLnBsYXRmb3Jtc09uU1ZHW3NyY05dLCBfdGhpcy53aGlza2Vyc1tzcmNOXVtzcGFuSW5kZXhdLCBfdGhpcy53aGlza2Vyc1t0cmdOXVtzcGFuSW5kZXhdLCBfdGhpcy5wbGF0Zm9ybXNPblNWR1t0cmdOXV07XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBwaSA9IDA7IHBpIDwgcGF0aHMubGVuZ3RoOyArK3BpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ZnLnNldEJlemllclBhdGgocGF0aHNbcGldLCBjb250cm9sUG9pbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcGxhdGZvcm1bJ19sb2NhdGlvbiddID0gY2FjaGVkO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIE1ldHJvTWFwLnByb3RvdHlwZS5jb25uZWN0U3BhblRvUGxhdGZvcm0gPSBmdW5jdGlvbiAocGxhdGZvcm0sIHNwYW4pIHtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHBsYXRmb3JtLCAnbG9jYXRpb24nLCB7XG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGxhdGZvcm0ubG9jYXRpb247XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbiAobG9jYXRpb24pIHt9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgTWV0cm9NYXAucHJvdG90eXBlLmVkaXRNYXBDbGljayA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIC8vIGNoYW5nZSBzdGF0aW9uIG5hbWUgKGNoYW5nZSAtPiBtb2RlbCAocGxhdGZvcm0pKVxuICAgICAgICAvLyBkcmFnIHN0YXRpb24gdG8gbmV3IGxvY2F0aW9uIChkcmFnIC0+IG1vZGVsIChwbGF0Zm9ybSwgc3BhbnMpIC0+IHBhdGhzLCApXG4gICAgICAgIC8vIGNyZWF0ZSBuZXcgc3RhdGlvbiAoY3JlYXRlIC0+IG1vZGVsKVxuICAgICAgICAvLyBkcmFnIGxpbmUgb3ZlciB0aGUgc3RhdGlvbiB0byBiaW5kIHRoZW1cbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGJ1dHRvbiA9IGUudGFyZ2V0O1xuICAgICAgICB2YXIgdGV4dFN0YXRlID0gWydFZGl0IE1hcCcsICdTYXZlIE1hcCddO1xuICAgICAgICB2YXIgZHVtbXlDaXJjbGVzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2R1bW15LWNpcmNsZXMnKTtcbiAgICAgICAgaWYgKGJ1dHRvbi50ZXh0Q29udGVudCA9PT0gdGV4dFN0YXRlWzBdKSB7XG4gICAgICAgICAgICBkdW1teUNpcmNsZXMub25tb3VzZWRvd24gPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2dC5idXR0b24gIT09IDApIHJldHVybjtcbiAgICAgICAgICAgICAgICB2YXIgY2lyY2xlID0gc3ZnLmNpcmNsZUJ5RHVtbXkoZXZ0LnRhcmdldCk7XG4gICAgICAgICAgICAgICAgdmFyIHBsYXRmb3JtID0gc3ZnLnBsYXRmb3JtQnlDaXJjbGUoY2lyY2xlLCBfdGhpcy5ncmFwaCk7XG4gICAgICAgICAgICAgICAgX3RoaXMubWFwLmRyYWdnaW5nLmRpc2FibGUoKTtcbiAgICAgICAgICAgICAgICBfdGhpcy5tYXAub24oJ21vdXNlbW92ZScsIGZ1bmN0aW9uIChsZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGxhdGZvcm0ubG9jYXRpb24gPSBsZS5sYXRsbmc7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgX3RoaXMubWFwLm9uY2UoJ21vdXNldXAnLCBmdW5jdGlvbiAobGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLm1hcC5vZmYoJ21vdXNlbW92ZScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGR1bW15Q2lyY2xlcy5vbmNsaWNrID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgIGlmIChldnQuYnV0dG9uID09PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwbGF0Zm9ybSA9IHN2Zy5wbGF0Zm9ybUJ5RHVtbXkoZXZ0LnRhcmdldCwgX3RoaXMuZ3JhcGgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcnUgPSBwbGF0Zm9ybS5uYW1lO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZmkgPSBwbGF0Zm9ybS5hbHROYW1lc1snZmknXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGVuID0gcGxhdGZvcm0uYWx0TmFtZXNbJ2VuJ107XG4gICAgICAgICAgICAgICAgICAgIHZhciBuYW1lcyA9ICFmaSA/IFtydV0gOiB1dGlsLmdldFVzZXJMYW5ndWFnZSgpID09PSAnZmknID8gW2ZpLCBydV0gOiBbcnUsIGZpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVuKSBuYW1lcy5wdXNoKGVuKTtcbiAgICAgICAgICAgICAgICAgICAgX2EgPSBwcm9tcHQoJ05ldyBuYW1lJywgbmFtZXMuam9pbignfCcpKS5zcGxpdCgnfCcpLCBydSA9IF9hWzBdLCBmaSA9IF9hWzFdLCBlbiA9IF9hWzJdO1xuICAgICAgICAgICAgICAgICAgICBwbGF0Zm9ybS5uYW1lID0gcnU7XG4gICAgICAgICAgICAgICAgICAgIHBsYXRmb3JtLmFsdE5hbWVzWydmaSddID0gZmk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGxhdGZvcm0uYWx0TmFtZXNbJ2VuJ10gPSBlbjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgX2E7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYnV0dG9uLnRleHRDb250ZW50ID0gdGV4dFN0YXRlWzFdO1xuICAgICAgICB9IGVsc2UgaWYgKGJ1dHRvbi50ZXh0Q29udGVudCA9PT0gdGV4dFN0YXRlWzFdKSB7XG4gICAgICAgICAgICB2YXIgY29udGVudCA9IEpTT04uc3RyaW5naWZ5KHRoaXMuZ3JhcGgsIGZ1bmN0aW9uIChrZXksIHZhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBrZXkuc3RhcnRzV2l0aCgnXycpID8gdW5kZWZpbmVkIDogdmFsO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB1dGlsLmRvd25sb2FkQXNGaWxlKCdncmFwaC5qc29uJywgY29udGVudCk7XG4gICAgICAgICAgICBkdW1teUNpcmNsZXMub25tb3VzZWRvd24gPSBkdW1teUNpcmNsZXMub25jbGljayA9IG51bGw7XG4gICAgICAgICAgICBidXR0b24udGV4dENvbnRlbnQgPSB0ZXh0U3RhdGVbMF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luY29ycmVjdCBidXR0b24gdGV4dCcpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gU1ZHQm91bmRzXHJcbiAgICAgKiBAcGFyYW0gbG9jYXRpb25cclxuICAgICAqIEByZXR1cm5zIHtQb2ludH1cclxuICAgICAqL1xuICAgIE1ldHJvTWFwLnByb3RvdHlwZS5wb3NPblNWRyA9IGZ1bmN0aW9uIChTVkdCb3VuZHMsIGxvY2F0aW9uKSB7XG4gICAgICAgIHZhciBwb3MgPSB0aGlzLm1hcC5sYXRMbmdUb0NvbnRhaW5lclBvaW50KGxvY2F0aW9uKTtcbiAgICAgICAgcmV0dXJuIHBvcy5zdWJ0cmFjdChTVkdCb3VuZHMubWluKTtcbiAgICB9O1xuICAgIE1ldHJvTWFwLnByb3RvdHlwZS51cGRhdGVPdmVybGF5UG9zaXRpb25pbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBudyA9IHRoaXMuYm91bmRzLmdldE5vcnRoV2VzdCgpLFxuICAgICAgICAgICAgc2UgPSB0aGlzLmJvdW5kcy5nZXRTb3V0aEVhc3QoKTtcbiAgICAgICAgLy8gc3ZnIGJvdW5kcyBpbiBwaXhlbHMgcmVsYXRpdmUgdG8gY29udGFpbmVyXG4gICAgICAgIHZhciBwaXhlbEJvdW5kcyA9IG5ldyBMLkJvdW5kcyh0aGlzLm1hcC5sYXRMbmdUb0NvbnRhaW5lclBvaW50KG53KSwgdGhpcy5tYXAubGF0TG5nVG9Db250YWluZXJQb2ludChzZSkpO1xuICAgICAgICB2YXIgdHJhbnNmb3JtID0gdXRpbC5wYXJzZVRyYW5zZm9ybSh0aGlzLm92ZXJsYXkuc3R5bGUudHJhbnNmb3JtKTtcbiAgICAgICAgdmFyIHBpeGVsQm91bmRzU2l6ZSA9IHBpeGVsQm91bmRzLmdldFNpemUoKTtcbiAgICAgICAgdmFyIHRvcExlZnQgPSBwaXhlbEJvdW5kcy5taW4uc3VidHJhY3QodHJhbnNmb3JtKS5zdWJ0cmFjdChwaXhlbEJvdW5kc1NpemUpO1xuICAgICAgICB0aGlzLm92ZXJsYXkuc3R5bGUubGVmdCA9IHRvcExlZnQueCArICdweCc7XG4gICAgICAgIHRoaXMub3ZlcmxheS5zdHlsZS50b3AgPSB0b3BMZWZ0LnkgKyAncHgnO1xuICAgICAgICB2YXIgb3JpZ2luU2hpZnQgPSBwaXhlbEJvdW5kc1NpemU7XG4gICAgICAgIHZhciBvcmlnaW4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnb3JpZ2luJyk7XG4gICAgICAgIC8vVE9ETzogdGVzdCB3aGljaCBvbmUgaXMgZmFzdGVyXG4gICAgICAgIC8vIHRyYW5zZm9ybSBtYXkgbm90IHdvcmsgd2l0aCBzdmcgZWxlbWVudHNcbiAgICAgICAgLy9vcmlnaW4uc2V0QXR0cmlidXRlKCd4Jywgb3JpZ2luU2hpZnQueCArICdweCcpO1xuICAgICAgICAvL29yaWdpbi5zZXRBdHRyaWJ1dGUoJ3knLCBvcmlnaW5TaGlmdC55ICsgJ3B4Jyk7XG4gICAgICAgIG9yaWdpbi5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArIG9yaWdpblNoaWZ0LnggKyBcInB4LCBcIiArIG9yaWdpblNoaWZ0LnkgKyBcInB4KVwiO1xuICAgICAgICAvL29yaWdpbi5zdHlsZS5sZWZ0ID0gb3JpZ2luU2hpZnQueCArICdweCc7XG4gICAgICAgIC8vb3JpZ2luLnN0eWxlLnRvcCA9IG9yaWdpblNoaWZ0LnkgKyAncHgnO1xuICAgICAgICB2YXIgdHJpcGxlU3ZnQm91bmRzU2l6ZSA9IHBpeGVsQm91bmRzU2l6ZS5tdWx0aXBseUJ5KDMpO1xuICAgICAgICB0aGlzLm92ZXJsYXkuc3R5bGUud2lkdGggPSB0cmlwbGVTdmdCb3VuZHNTaXplLnggKyAncHgnO1xuICAgICAgICB0aGlzLm92ZXJsYXkuc3R5bGUuaGVpZ2h0ID0gdHJpcGxlU3ZnQm91bmRzU2l6ZS55ICsgJ3B4JztcbiAgICB9O1xuICAgIC8qKlxyXG4gICAgICogIGxpbmVXaWR0aCA9ICh6b29tIC0gNykgKiAwLjVcclxuICAgICAqICA5IC0gb25seSBsaW5lcyAoMXB4KVxyXG4gICAgICogIDEwIC0gbGluZXMgKDEuNXB4KSAmIHJvdW5kZWxzICgyKzFweClcclxuICAgICAqICAxMSAtIGxpbmVzICgycHgpICYgcm91bmRlbHMgKDIrMnB4KVxyXG4gICAgICogIDEyIC0gbGluZXMgKDIuNXB4KSwgcGxhdGZvcm1zICgyKzFweCkgJiB0cmFuc2ZlcnMgKDJweClcclxuICAgICAqICAuLi5cclxuICAgICAqL1xuICAgIE1ldHJvTWFwLnByb3RvdHlwZS5yZWRyYXdOZXR3b3JrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLnJlc2V0T3ZlcmxheVN0cnVjdHVyZSgpO1xuICAgICAgICB0aGlzLnVwZGF0ZU92ZXJsYXlQb3NpdGlvbmluZygpO1xuICAgICAgICB2YXIgZG9jRnJhZ3MgPSB7XG4gICAgICAgICAgICAnc3RhdGlvbi1jaXJjbGVzJzogZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpLFxuICAgICAgICAgICAgJ2R1bW15LWNpcmNsZXMnOiBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCksXG4gICAgICAgICAgICAncGF0aHMtaW5uZXInOiBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCksXG4gICAgICAgICAgICAncGF0aHMtb3V0ZXInOiBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCksXG4gICAgICAgICAgICAndHJhbnNmZXJzLWlubmVyJzogZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpLFxuICAgICAgICAgICAgJ3RyYW5zZmVycy1vdXRlcic6IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKVxuICAgICAgICB9O1xuICAgICAgICB2YXIgc3RhdGlvblBsYXRlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0YXRpb24tcGxhdGUnKTtcbiAgICAgICAgdmFyIHpvb20gPSB0aGlzLm1hcC5nZXRab29tKCk7XG4gICAgICAgIHZhciBudyA9IHRoaXMuYm91bmRzLmdldE5vcnRoV2VzdCgpO1xuICAgICAgICB2YXIgc2UgPSB0aGlzLmJvdW5kcy5nZXRTb3V0aEVhc3QoKTtcbiAgICAgICAgdmFyIHN2Z0JvdW5kcyA9IG5ldyBMLkJvdW5kcyh0aGlzLm1hcC5sYXRMbmdUb0NvbnRhaW5lclBvaW50KG53KSwgdGhpcy5tYXAubGF0TG5nVG9Db250YWluZXJQb2ludChzZSkpO1xuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZWRpdC1tYXAtYnV0dG9uJykuZGlzYWJsZWQgPSB6b29tIDwgMTI7XG4gICAgICAgIHZhciBwb3NUcmFuc2Zvcm0gPSB6b29tIDwgMTIgPyBmdW5jdGlvbiAocGxhdGZvcm0pIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5wb3NPblNWRyhzdmdCb3VuZHMsIF90aGlzLmdyYXBoLnN0YXRpb25zW3BsYXRmb3JtLnN0YXRpb25dLmxvY2F0aW9uKTtcbiAgICAgICAgfSA6IGZ1bmN0aW9uIChwbGF0Zm9ybSkge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzLnBvc09uU1ZHKHN2Z0JvdW5kcywgcGxhdGZvcm0ubG9jYXRpb24pO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLnBsYXRmb3Jtc09uU1ZHID0gdGhpcy5ncmFwaC5wbGF0Zm9ybXMubWFwKHBvc1RyYW5zZm9ybSk7XG4gICAgICAgIHZhciBsaW5lV2lkdGggPSAoem9vbSAtIDcpICogMC41O1xuICAgICAgICB2YXIgY2lyY2xlUmFkaXVzID0gem9vbSA8IDEyID8gbGluZVdpZHRoICogMS4yNSA6IGxpbmVXaWR0aDtcbiAgICAgICAgdmFyIGNpcmNsZUJvcmRlciA9IHpvb20gPCAxMiA/IGNpcmNsZVJhZGl1cyAqIDAuNCA6IGNpcmNsZVJhZGl1cyAqIDAuNjtcbiAgICAgICAgdmFyIHRyYW5zZmVyV2lkdGggPSBsaW5lV2lkdGg7XG4gICAgICAgIGlmIChMLkJyb3dzZXIucmV0aW5hKSB7XG4gICAgICAgICAgICBfYSA9IFtsaW5lV2lkdGgsIGNpcmNsZVJhZGl1cywgY2lyY2xlQm9yZGVyLCB0cmFuc2ZlcldpZHRoXS5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaXRlbSAqIDEuNTtcbiAgICAgICAgICAgIH0pLCBsaW5lV2lkdGggPSBfYVswXSwgY2lyY2xlUmFkaXVzID0gX2FbMV0sIGNpcmNsZUJvcmRlciA9IF9hWzJdLCB0cmFuc2ZlcldpZHRoID0gX2FbM107XG4gICAgICAgIH1cbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0YXRpb24tY2lyY2xlcycpLnN0eWxlLnN0cm9rZVdpZHRoID0gY2lyY2xlQm9yZGVyICsgJ3B4JztcbiAgICAgICAgdmFyIHBsYXRmb3Jtc0luQ2lyY2xlcyA9IG5ldyBTZXQoKTtcbiAgICAgICAgZm9yICh2YXIgc3RhdGlvbkluZGV4ID0gMDsgc3RhdGlvbkluZGV4IDwgdGhpcy5ncmFwaC5zdGF0aW9ucy5sZW5ndGg7ICsrc3RhdGlvbkluZGV4KSB7XG4gICAgICAgICAgICB2YXIgc3RhdGlvbiA9IHRoaXMuZ3JhcGguc3RhdGlvbnNbc3RhdGlvbkluZGV4XTtcbiAgICAgICAgICAgIHZhciBjaXJjdWxhciA9IHV0aWwuZmluZENpcmNsZSh0aGlzLmdyYXBoLCBzdGF0aW9uKTtcbiAgICAgICAgICAgIHZhciBjaXJjdW1wb2ludHMgPSBbXTtcbiAgICAgICAgICAgIHN0YXRpb24ucGxhdGZvcm1zLmZvckVhY2goZnVuY3Rpb24gKHBsYXRmb3JtSW5kZXgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGxhdGZvcm0gPSBfdGhpcy5ncmFwaC5wbGF0Zm9ybXNbcGxhdGZvcm1JbmRleF07XG4gICAgICAgICAgICAgICAgdmFyIHBvc09uU1ZHID0gX3RoaXMucGxhdGZvcm1zT25TVkdbcGxhdGZvcm1JbmRleF07XG4gICAgICAgICAgICAgICAgaWYgKHpvb20gPiA5KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjaSA9IHN2Zy5tYWtlQ2lyY2xlKHBvc09uU1ZHLCBjaXJjbGVSYWRpdXMpO1xuICAgICAgICAgICAgICAgICAgICBjaS5pZCA9ICdwLScgKyBwbGF0Zm9ybUluZGV4O1xuICAgICAgICAgICAgICAgICAgICAvL3V0aWwuc2V0U1ZHRGF0YXNldChjaSwge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICBzdGF0aW9uOiBzdGF0aW9uSW5kZXgsXG4gICAgICAgICAgICAgICAgICAgIC8vICAgIGxhdDogcGxhdGZvcm0ubG9jYXRpb24ubGF0LFxuICAgICAgICAgICAgICAgICAgICAvLyAgICBsbmc6IHBsYXRmb3JtLmxvY2F0aW9uLmxuZyxcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgcnU6IHBsYXRmb3JtLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIC8vICAgIGZpOiBwbGF0Zm9ybS5hbHROYW1lc1snZmknXSxcbiAgICAgICAgICAgICAgICAgICAgLy99KTtcbiAgICAgICAgICAgICAgICAgICAgLy9jb25zdCBlbiA9IHRoaXMuaGludHMuZW5nbGlzaE5hbWVzW3BsYXRmb3JtLm5hbWVdO1xuICAgICAgICAgICAgICAgICAgICAvL2lmIChlbikge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICB1dGlsLnNldFNWR0RhdGFzZXQoY2ksIHsgZW46IGVuIH0pO1xuICAgICAgICAgICAgICAgICAgICAvL31cbiAgICAgICAgICAgICAgICAgICAgaWYgKHpvb20gPiAxMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxpbmVzID0gbmV3IFNldCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IHBsYXRmb3JtLnNwYW5zOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzcGFuSW5kZXggPSBfYVtfaV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgX2IgPSAwLCBfYyA9IF90aGlzLmdyYXBoLnNwYW5zW3NwYW5JbmRleF0ucm91dGVzOyBfYiA8IF9jLmxlbmd0aDsgX2IrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcm91dGVJbmRleCA9IF9jW19iXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZXMuYWRkKF90aGlzLmdyYXBoLnJvdXRlc1tyb3V0ZUluZGV4XS5saW5lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGluZXMuc2l6ZSA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtYXRjaGVzID0gbGluZXMudmFsdWVzKCkubmV4dCgpLnZhbHVlLm1hdGNoKC8oW01FTF0pKFxcZHswLDJ9KS8pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaGVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNpLmNsYXNzTGlzdC5hZGQobWF0Y2hlc1sxXSA9PT0gJ00nID8gbWF0Y2hlc1swXSA6IG1hdGNoZXNbMV0gKyAnLWxpbmUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIGR1bW15Q2lyY2xlID0gc3ZnLm1ha2VDaXJjbGUocG9zT25TVkcsIGNpcmNsZVJhZGl1cyAqIDIpO1xuICAgICAgICAgICAgICAgICAgICBkdW1teUNpcmNsZS5pZCA9ICdkLScgKyBwbGF0Zm9ybUluZGV4O1xuICAgICAgICAgICAgICAgICAgICBkdW1teUNpcmNsZS5jbGFzc0xpc3QuYWRkKCdpbnZpc2libGUtY2lyY2xlJyk7XG4gICAgICAgICAgICAgICAgICAgIGR1bW15Q2lyY2xlLnNldEF0dHJpYnV0ZSgnZGF0YS1wbGF0Zm9ybUlkJywgY2kuaWQpO1xuICAgICAgICAgICAgICAgICAgICAvL2R1bW15Q2lyY2xlLm9ubW91c2VvdmVyID0gc3ZnLnNob3dQbGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgLy9kdW1teUNpcmNsZS5vbm1vdXNlb3V0ID0gZSA9PiBzdGF0aW9uUGxhdGUuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICAgICAgZG9jRnJhZ3NbJ3N0YXRpb24tY2lyY2xlcyddLmFwcGVuZENoaWxkKGNpKTtcbiAgICAgICAgICAgICAgICAgICAgZG9jRnJhZ3NbJ2R1bW15LWNpcmNsZXMnXS5hcHBlbmRDaGlsZChkdW1teUNpcmNsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF90aGlzLndoaXNrZXJzW3BsYXRmb3JtSW5kZXhdID0gX3RoaXMubWFrZVdoaXNrZXJzKHBsYXRmb3JtSW5kZXgpO1xuICAgICAgICAgICAgICAgIGlmIChjaXJjdWxhciAmJiBjaXJjdWxhci5pbmRleE9mKHBsYXRmb3JtKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGNpcmN1bXBvaW50cy5wdXNoKHBvc09uU1ZHKTtcbiAgICAgICAgICAgICAgICAgICAgcGxhdGZvcm1zSW5DaXJjbGVzLmFkZChwbGF0Zm9ybUluZGV4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciBkdW1teUNpcmNsZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZHVtbXktY2lyY2xlcycpO1xuICAgICAgICAgICAgZHVtbXlDaXJjbGVzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNpcmNsZSA9IHN2Zy5jaXJjbGVCeUR1bW15KGUudGFyZ2V0KTtcbiAgICAgICAgICAgICAgICB2YXIgZyA9IHN2Zy5tb2RpZnlQbGF0ZShjaXJjbGUsIF90aGlzLmdyYXBoKTtcbiAgICAgICAgICAgICAgICBnLnN0eWxlLmRpc3BsYXkgPSBudWxsO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBkdW1teUNpcmNsZXMub25tb3VzZW91dCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRpb25QbGF0ZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmICh6b29tID4gMTEgJiYgY2lyY3VsYXIpIHtcbiAgICAgICAgICAgICAgICB2YXIgY0NlbnRlciA9IHV0aWwuZ2V0Q2lyY3VtY2VudGVyKGNpcmN1bXBvaW50cyk7XG4gICAgICAgICAgICAgICAgdmFyIGNSYWRpdXMgPSBjQ2VudGVyLmRpc3RhbmNlVG8oY2lyY3VtcG9pbnRzWzBdKTtcbiAgICAgICAgICAgICAgICB2YXIgY0NpcmNsZSA9IHN2Zy5tYWtlVHJhbnNmZXJSaW5nKGNDZW50ZXIsIGNSYWRpdXMsIHRyYW5zZmVyV2lkdGgsIGNpcmNsZUJvcmRlcik7XG4gICAgICAgICAgICAgICAgZG9jRnJhZ3NbJ3RyYW5zZmVycy1vdXRlciddLmFwcGVuZENoaWxkKGNDaXJjbGVbMF0pO1xuICAgICAgICAgICAgICAgIGRvY0ZyYWdzWyd0cmFuc2ZlcnMtaW5uZXInXS5hcHBlbmRDaGlsZChjQ2lyY2xlWzFdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoem9vbSA+IDExKSB7XG4gICAgICAgICAgICB0aGlzLmdyYXBoLnRyYW5zZmVycy5mb3JFYWNoKGZ1bmN0aW9uICh0cikge1xuICAgICAgICAgICAgICAgIGlmIChwbGF0Zm9ybXNJbkNpcmNsZXMuaGFzKHRyLnNvdXJjZSkgJiYgcGxhdGZvcm1zSW5DaXJjbGVzLmhhcyh0ci50YXJnZXQpKSByZXR1cm47XG4gICAgICAgICAgICAgICAgdmFyIHBsMSA9IF90aGlzLmdyYXBoLnBsYXRmb3Jtc1t0ci5zb3VyY2VdLFxuICAgICAgICAgICAgICAgICAgICBwbDIgPSBfdGhpcy5ncmFwaC5wbGF0Zm9ybXNbdHIudGFyZ2V0XSxcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNmZXJQb3MgPSBbX3RoaXMucG9zT25TVkcoc3ZnQm91bmRzLCBwbDEubG9jYXRpb24pLCBfdGhpcy5wb3NPblNWRyhzdmdCb3VuZHMsIHBsMi5sb2NhdGlvbildLFxuICAgICAgICAgICAgICAgICAgICB0cmFuc2ZlciA9IHN2Zy5tYWtlVHJhbnNmZXIodHJhbnNmZXJQb3NbMF0sIHRyYW5zZmVyUG9zWzFdLCB0cmFuc2ZlcldpZHRoLCBjaXJjbGVCb3JkZXIpO1xuICAgICAgICAgICAgICAgIGRvY0ZyYWdzWyd0cmFuc2ZlcnMtb3V0ZXInXS5hcHBlbmRDaGlsZCh0cmFuc2ZlclswXSk7XG4gICAgICAgICAgICAgICAgZG9jRnJhZ3NbJ3RyYW5zZmVycy1pbm5lciddLmFwcGVuZENoaWxkKHRyYW5zZmVyWzFdKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5ncmFwaC5zcGFucy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgdmFyIHBhdGhzID0gdGhpcy5tYWtlUGF0aChpLCBsaW5lV2lkdGgpO1xuICAgICAgICAgICAgZG9jRnJhZ3NbJ3BhdGhzLW91dGVyJ10uYXBwZW5kQ2hpbGQocGF0aHNbMF0pO1xuICAgICAgICAgICAgaWYgKHBhdGhzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICBkb2NGcmFnc1sncGF0aHMtaW5uZXInXS5hcHBlbmRDaGlsZChwYXRoc1sxXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBfYiA9IE9iamVjdC5rZXlzKGRvY0ZyYWdzKTsgX2kgPCBfYi5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIHZhciBpID0gX2JbX2ldO1xuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaSkuYXBwZW5kQ2hpbGQoZG9jRnJhZ3NbaV0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYWRkQmluZGluZ3MoKTtcbiAgICAgICAgdmFyIF9hO1xuICAgIH07XG4gICAgTWV0cm9NYXAucHJvdG90eXBlLm1ha2VXaGlza2VycyA9IGZ1bmN0aW9uIChwbGF0Zm9ybUluZGV4KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBwbGF0Zm9ybSA9IHRoaXMuZ3JhcGgucGxhdGZvcm1zW3BsYXRmb3JtSW5kZXhdO1xuICAgICAgICB2YXIgcG9zT25TVkcgPSB0aGlzLnBsYXRmb3Jtc09uU1ZHW3BsYXRmb3JtSW5kZXhdO1xuICAgICAgICBpZiAocGxhdGZvcm0uc3BhbnMubGVuZ3RoIDwgMikge1xuICAgICAgICAgICAgcmV0dXJuIF9hID0ge30sIF9hW3BsYXRmb3JtLnNwYW5zWzBdXSA9IHBvc09uU1ZHLCBfYTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGxhdGZvcm0uc3BhbnMubGVuZ3RoID4gMikge1xuICAgICAgICAgICAgLy8gMCAtIHByZXYsIDEgLSBuZXh0XG4gICAgICAgICAgICB2YXIgcG9pbnRzID0gW1tdLCBbXV07XG4gICAgICAgICAgICB2YXIgc3BhbklkcyA9IFtbXSwgW11dO1xuICAgICAgICAgICAgdmFyIGRpckhpbnRzID0gdGhpcy5oaW50cy5jcm9zc1BsYXRmb3JtO1xuICAgICAgICAgICAgdmFyIGlkeCA9IHV0aWwuaGludENvbnRhaW5zTGluZSh0aGlzLmdyYXBoLCBkaXJIaW50cywgcGxhdGZvcm0pO1xuICAgICAgICAgICAgaWYgKHBsYXRmb3JtLm5hbWUgaW4gZGlySGludHMgJiYgaWR4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgLy8gYXJyYXkgb3Igb2JqZWN0XG4gICAgICAgICAgICAgICAgdmFyIHBsYXRmb3JtSGludHMgPSBpZHggPiAtMSA/IGRpckhpbnRzW3BsYXRmb3JtLm5hbWVdW2lkeF0gOiBkaXJIaW50c1twbGF0Zm9ybS5uYW1lXTtcbiAgICAgICAgICAgICAgICB2YXIgbmV4dFBsYXRmb3JtTmFtZXMgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9iID0gT2JqZWN0LmtleXMocGxhdGZvcm1IaW50cyk7IF9pIDwgX2IubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBrZXkgPSBfYltfaV07XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWwgPSBwbGF0Zm9ybUhpbnRzW2tleV07XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dFBsYXRmb3JtTmFtZXMucHVzaCh2YWwpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsLmZvckVhY2goZnVuY3Rpb24gKGkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV4dFBsYXRmb3JtTmFtZXMucHVzaChpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvciAodmFyIF9jID0gMCwgX2QgPSBwbGF0Zm9ybS5zcGFuczsgX2MgPCBfZC5sZW5ndGg7IF9jKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNwYW5JbmRleCA9IF9kW19jXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNwYW4gPSB0aGlzLmdyYXBoLnNwYW5zW3NwYW5JbmRleF07XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZWlnaGJvckluZGV4ID0gc3Bhbi5zb3VyY2UgPT09IHBsYXRmb3JtSW5kZXggPyBzcGFuLnRhcmdldCA6IHNwYW4uc291cmNlO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmVpZ2hib3IgPSB0aGlzLmdyYXBoLnBsYXRmb3Jtc1tuZWlnaGJvckluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5laWdoYm9yUG9zID0gdGhpcy5wbGF0Zm9ybXNPblNWR1tuZWlnaGJvckluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpcklkeCA9IG5leHRQbGF0Zm9ybU5hbWVzLmluZGV4T2YobmVpZ2hib3IubmFtZSkgPiAtMSA/IDEgOiAwO1xuICAgICAgICAgICAgICAgICAgICBwb2ludHNbZGlySWR4XS5wdXNoKG5laWdoYm9yUG9zKTtcbiAgICAgICAgICAgICAgICAgICAgc3Bhbklkc1tkaXJJZHhdLnB1c2goc3BhbkluZGV4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbWlkUHRzXzEgPSBwb2ludHMubWFwKGZ1bmN0aW9uIChwdHMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcG9zT25TVkcuYWRkKHB0cy5sZW5ndGggPT09IDEgPyBwdHNbMF0gOiBwdHMubGVuZ3RoID09PSAwID8gcG9zT25TVkcgOiB1dGlsLmdldENlbnRlcihwdHMpKS5kaXZpZGVCeSgyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdmFyIGxlbnNfMSA9IG1pZFB0c18xLm1hcChmdW5jdGlvbiAobWlkUHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcG9zT25TVkcuZGlzdGFuY2VUbyhtaWRQdCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciBtZGlmZl8xID0gbWlkUHRzXzFbMV0uc3VidHJhY3QobWlkUHRzXzFbMF0pLm11bHRpcGx5QnkobGVuc18xWzBdIC8gKGxlbnNfMVswXSArIGxlbnNfMVsxXSkpO1xuICAgICAgICAgICAgdmFyIG1tXzEgPSBtaWRQdHNfMVswXS5hZGQobWRpZmZfMSk7XG4gICAgICAgICAgICB2YXIgZGlmZl8xID0gcG9zT25TVkcuc3VidHJhY3QobW1fMSk7XG4gICAgICAgICAgICB2YXIgd2hpc2tlciA9IHt9O1xuICAgICAgICAgICAgc3Bhbklkc1swXS5mb3JFYWNoKGZ1bmN0aW9uIChzcGFuSW5kZXgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gd2hpc2tlcltzcGFuSW5kZXhdID0gbWlkUHRzXzFbMF0uYWRkKGRpZmZfMSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHNwYW5JZHNbMV0uZm9yRWFjaChmdW5jdGlvbiAoc3BhbkluZGV4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHdoaXNrZXJbc3BhbkluZGV4XSA9IG1pZFB0c18xWzFdLmFkZChkaWZmXzEpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gd2hpc2tlcjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbGluZXMgPSBwbGF0Zm9ybS5zcGFucy5tYXAoZnVuY3Rpb24gKGkpIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5ncmFwaC5yb3V0ZXNbX3RoaXMuZ3JhcGguc3BhbnNbaV0ucm91dGVzWzBdXS5saW5lO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gVE9ETzogcmVmYWN0b3IgdGhpcyBzdHVmZiwgdW5pZnkgMi1zcGFuICYgPjItc3BhbiBwbGF0Zm9ybXNcbiAgICAgICAgaWYgKGxpbmVzWzBdICE9PSBsaW5lc1sxXSkge1xuICAgICAgICAgICAgcmV0dXJuIF9lID0ge30sIF9lW3BsYXRmb3JtLnNwYW5zWzBdXSA9IHBvc09uU1ZHLCBfZVtwbGF0Zm9ybS5zcGFuc1sxXV0gPSBwb3NPblNWRywgX2U7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG1pZFB0cyA9IFtwb3NPblNWRywgcG9zT25TVkddO1xuICAgICAgICB2YXIgbGVucyA9IFswLCAwXTtcbiAgICAgICAgdmFyIGZpcnN0U3BhbiA9IHRoaXMuZ3JhcGguc3BhbnNbcGxhdGZvcm0uc3BhbnNbMF1dO1xuICAgICAgICBpZiAoZmlyc3RTcGFuLnNvdXJjZSA9PT0gcGxhdGZvcm1JbmRleCkge1xuICAgICAgICAgICAgcGxhdGZvcm0uc3BhbnMucmV2ZXJzZSgpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHByZXZpb3VzIG5vZGUgc2hvdWxkIGNvbWUgZmlyc3RcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAyOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBzcGFuID0gdGhpcy5ncmFwaC5zcGFuc1twbGF0Zm9ybS5zcGFuc1tpXV07XG4gICAgICAgICAgICB2YXIgbmVpZ2hib3JOdW0gPSBzcGFuLnNvdXJjZSA9PT0gcGxhdGZvcm1JbmRleCA/IHNwYW4udGFyZ2V0IDogc3Bhbi5zb3VyY2U7XG4gICAgICAgICAgICB2YXIgbmVpZ2hib3JPblNWRyA9IHRoaXMucGxhdGZvcm1zT25TVkdbbmVpZ2hib3JOdW1dO1xuICAgICAgICAgICAgbGVuc1tpXSA9IHBvc09uU1ZHLmRpc3RhbmNlVG8obmVpZ2hib3JPblNWRyk7XG4gICAgICAgICAgICBtaWRQdHNbaV0gPSBwb3NPblNWRy5hZGQobmVpZ2hib3JPblNWRykuZGl2aWRlQnkoMik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG1kaWZmID0gbWlkUHRzWzFdLnN1YnRyYWN0KG1pZFB0c1swXSkubXVsdGlwbHlCeShsZW5zWzBdIC8gKGxlbnNbMF0gKyBsZW5zWzFdKSk7XG4gICAgICAgIHZhciBtbSA9IG1pZFB0c1swXS5hZGQobWRpZmYpO1xuICAgICAgICB2YXIgZGlmZiA9IHBvc09uU1ZHLnN1YnRyYWN0KG1tKTtcbiAgICAgICAgcmV0dXJuIF9mID0ge30sIF9mW3BsYXRmb3JtLnNwYW5zWzBdXSA9IG1pZFB0c1swXS5hZGQoZGlmZiksIF9mW3BsYXRmb3JtLnNwYW5zWzFdXSA9IG1pZFB0c1sxXS5hZGQoZGlmZiksIF9mO1xuICAgICAgICB2YXIgX2EsIF9lLCBfZjtcbiAgICB9O1xuICAgIE1ldHJvTWFwLnByb3RvdHlwZS5tYWtlUGF0aCA9IGZ1bmN0aW9uIChzcGFuSW5kZXgsIGxpbmVXaWR0aCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgc3BhbiA9IHRoaXMuZ3JhcGguc3BhbnNbc3BhbkluZGV4XTtcbiAgICAgICAgdmFyIHNyY04gPSBzcGFuLnNvdXJjZSxcbiAgICAgICAgICAgIHRyZ04gPSBzcGFuLnRhcmdldDtcbiAgICAgICAgdmFyIHJvdXRlcyA9IHNwYW4ucm91dGVzLm1hcChmdW5jdGlvbiAobikge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzLmdyYXBoLnJvdXRlc1tuXTtcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBtYXRjaGVzID0gcm91dGVzWzBdLmxpbmUubWF0Y2goLyhbTUVMXSkoXFxkezAsMn0pLyk7XG4gICAgICAgIHZhciBiZXppZXIgPSBzdmcubWFrZUN1YmljQmV6aWVyKFt0aGlzLnBsYXRmb3Jtc09uU1ZHW3NyY05dLCB0aGlzLndoaXNrZXJzW3NyY05dW3NwYW5JbmRleF0sIHRoaXMud2hpc2tlcnNbdHJnTl1bc3BhbkluZGV4XSwgdGhpcy5wbGF0Zm9ybXNPblNWR1t0cmdOXV0pO1xuICAgICAgICBiZXppZXIuaWQgPSAnaW5uZXItJyArIHNwYW5JbmRleDtcbiAgICAgICAgaWYgKG1hdGNoZXNbMV0gPT09ICdFJykge1xuICAgICAgICAgICAgdmFyIG91dGVyID0gYmV6aWVyLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICAgIG91dGVyLnN0eWxlLnN0cm9rZVdpZHRoID0gbGluZVdpZHRoICsgJ3B4JztcbiAgICAgICAgICAgIGJlemllci5zdHlsZS5zdHJva2VXaWR0aCA9IGxpbmVXaWR0aCAvIDIgKyAncHgnO1xuICAgICAgICAgICAgb3V0ZXIuY2xhc3NMaXN0LmFkZCgnRScpO1xuICAgICAgICAgICAgb3V0ZXIuaWQgPSAnb3V0ZXItJyArIHNwYW5JbmRleDtcbiAgICAgICAgICAgIGJlemllci5jbGFzc0xpc3QuYWRkKCdFJyk7XG4gICAgICAgICAgICByZXR1cm4gW291dGVyLCBiZXppZXJdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYmV6aWVyLnN0eWxlLnN0cm9rZVdpZHRoID0gbGluZVdpZHRoLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICBpZiAobWF0Y2hlcykge1xuICAgICAgICAgICAgICAgIGJlemllci5jbGFzc0xpc3QuYWRkKG1hdGNoZXNbMF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYmV6aWVyLmNsYXNzTGlzdC5hZGQobWF0Y2hlc1sxXSArICctbGluZScpO1xuICAgICAgICAgICAgaWYgKG1hdGNoZXNbMV0gPT09ICdMJykge1xuICAgICAgICAgICAgICAgIGJlemllci5zdHlsZS5zdHJva2VXaWR0aCA9IGxpbmVXaWR0aCAqIDAuNzUgKyAncHgnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy91dGlsLnNldFNWR0RhdGFzZXQoYmV6aWVyLCB7XG4gICAgICAgICAgICAvLyAgICBzb3VyY2U6IHNwYW4uc291cmNlLFxuICAgICAgICAgICAgLy8gICAgdGFyZ2V0OiBzcGFuLnRhcmdldFxuICAgICAgICAgICAgLy99KTtcbiAgICAgICAgICAgIHJldHVybiBbYmV6aWVyXTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIE1ldHJvTWFwO1xufSkoKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IE1ldHJvTWFwO1xuXG5cbn0se1wiLi4vdXRpbFwiOjYyLFwiLi9hZGRvbnNcIjoyLFwiLi9zdmdcIjo2fV0sNTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG52YXIgX19hd2FpdGVyID0gdGhpcyAmJiB0aGlzLl9fYXdhaXRlciB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUHJvbWlzZSwgZ2VuZXJhdG9yKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmNhbGwodGhpc0FyZywgX2FyZ3VtZW50cyk7XG4gICAgICAgIGZ1bmN0aW9uIGNhc3QodmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFByb21pc2UgJiYgdmFsdWUuY29uc3RydWN0b3IgPT09IFByb21pc2UgPyB2YWx1ZSA6IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh2YWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBvbmZ1bGZpbGwodmFsdWUpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgc3RlcChcIm5leHRcIiwgdmFsdWUpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHJlamVjdChlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBvbnJlamVjdCh2YWx1ZSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBzdGVwKFwidGhyb3dcIiwgdmFsdWUpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHJlamVjdChlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHZlcmIsIHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gZ2VuZXJhdG9yW3ZlcmJdKHZhbHVlKTtcbiAgICAgICAgICAgIHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogY2FzdChyZXN1bHQudmFsdWUpLnRoZW4ob25mdWxmaWxsLCBvbnJlamVjdCk7XG4gICAgICAgIH1cbiAgICAgICAgc3RlcChcIm5leHRcIiwgdm9pZCAwKTtcbiAgICB9KTtcbn07XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi8uLi90eXBpbmdzL3RzZC5kLnRzXCIgLz5cbmZ1bmN0aW9uIGFkZFBvbHlmaWxscygpIHtcbiAgICBpZiAoISgnUHJvbWlzZScgaW4gd2luZG93KSB8fCAhKCd0aGVuJyBpbiBQcm9taXNlLnByb3RvdHlwZSkgfHwgISgnY2F0Y2gnIGluIFByb21pc2UucHJvdG90eXBlKSkge1xuICAgICAgICBjb25zb2xlLmxvZygncHJvbWlzZXMgbm90IHByZXNlbnQsIHVzaW5nIGEgcG9seWZpbGwnKTtcbiAgICAgICAgcmVxdWlyZSgnZXM2LXByb21pc2UnKS5wb2x5ZmlsbCgpO1xuICAgIH1cbiAgICBpZiAoISgnU2V0JyBpbiB3aW5kb3cpIHx8ICEoJ2FkZCcgaW4gU2V0LnByb3RvdHlwZSkgfHwgISgnaGFzJyBpbiBTZXQucHJvdG90eXBlKSkge1xuICAgICAgICBjb25zb2xlLmxvZygnc2V0IG5vdCBwcmVzZW50LCB1c2luZyBhIHBvbHlmaWxsJyk7XG4gICAgICAgIHJlcXVpcmUoJ2VzNi1zZXQvaW1wbGVtZW50Jyk7XG4gICAgfVxuICAgIGlmICghKCdjbGFzc0xpc3QnIGluIEhUTUxFbGVtZW50LnByb3RvdHlwZSkpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2NsYXNzbGlzdCBub3QgcHJlc2VudCwgdXNpbmcgYSBwb2x5ZmlsbCcpO1xuICAgICAgICByZXF1aXJlKCdjbGFzc2xpc3QtcG9seWZpbGwnKTtcbiAgICB9XG4gICAgaWYgKCFBcnJheS5wcm90b3R5cGUuZmluZCkge1xuICAgICAgICBBcnJheS5wcm90b3R5cGUuZmluZCA9IGZ1bmN0aW9uIChwcmVkaWNhdGUpIHtcbiAgICAgICAgICAgIGlmICh0aGlzID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcnJheS5wcm90b3R5cGUuZmluZCBjYWxsZWQgb24gbnVsbCBvciB1bmRlZmluZWQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgcHJlZGljYXRlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigncHJlZGljYXRlIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGxpc3QgPSBPYmplY3QodGhpcyk7XG4gICAgICAgICAgICB2YXIgbGVuZ3RoID0gbGlzdC5sZW5ndGggPj4+IDA7XG4gICAgICAgICAgICB2YXIgdGhpc0FyZyA9IGFyZ3VtZW50c1sxXTtcbiAgICAgICAgICAgIHZhciB2YWx1ZTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGxpc3RbaV07XG4gICAgICAgICAgICAgICAgaWYgKHByZWRpY2F0ZS5jYWxsKHRoaXNBcmcsIHZhbHVlLCBpLCBsaXN0KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfTtcbiAgICB9XG59XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSBhZGRQb2x5ZmlsbHM7XG5cblxufSx7XCJjbGFzc2xpc3QtcG9seWZpbGxcIjo4LFwiZXM2LXByb21pc2VcIjo1MCxcImVzNi1zZXQvaW1wbGVtZW50XCI6NTF9XSw2OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbnZhciBfX2F3YWl0ZXIgPSB0aGlzICYmIHRoaXMuX19hd2FpdGVyIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBfYXJndW1lbnRzLCBQcm9taXNlLCBnZW5lcmF0b3IpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBnZW5lcmF0b3IgPSBnZW5lcmF0b3IuY2FsbCh0aGlzQXJnLCBfYXJndW1lbnRzKTtcbiAgICAgICAgZnVuY3Rpb24gY2FzdCh2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUHJvbWlzZSAmJiB2YWx1ZS5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSA/IHZhbHVlIDogbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIG9uZnVsZmlsbCh2YWx1ZSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBzdGVwKFwibmV4dFwiLCB2YWx1ZSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIG9ucmVqZWN0KHZhbHVlKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHN0ZXAoXCJ0aHJvd1wiLCB2YWx1ZSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAodmVyYiwgdmFsdWUpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBnZW5lcmF0b3JbdmVyYl0odmFsdWUpO1xuICAgICAgICAgICAgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBjYXN0KHJlc3VsdC52YWx1ZSkudGhlbihvbmZ1bGZpbGwsIG9ucmVqZWN0KTtcbiAgICAgICAgfVxuICAgICAgICBzdGVwKFwibmV4dFwiLCB2b2lkIDApO1xuICAgIH0pO1xufTtcbnZhciBMID0gd2luZG93Lkw7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcbmZ1bmN0aW9uIG1ha2VDaXJjbGUocG9zaXRpb24sIHJhZGl1cykge1xuICAgIHZhciBjaSA9IGNyZWF0ZVNWR0VsZW1lbnQoJ2NpcmNsZScpO1xuICAgIGNpLnNldEF0dHJpYnV0ZSgncicsIHJhZGl1cy50b1N0cmluZygpKTtcbiAgICBjaS5zZXRBdHRyaWJ1dGUoJ2N5JywgcG9zaXRpb24ueS50b1N0cmluZygpKTtcbiAgICBjaS5zZXRBdHRyaWJ1dGUoJ2N4JywgcG9zaXRpb24ueC50b1N0cmluZygpKTtcbiAgICByZXR1cm4gY2k7XG59XG5leHBvcnRzLm1ha2VDaXJjbGUgPSBtYWtlQ2lyY2xlO1xuZnVuY3Rpb24gZ2V0QmV6aWVyUGF0aChwYXRoKSB7XG4gICAgdmFyIG1hdGNoZXMgPSBwYXRoLmdldEF0dHJpYnV0ZSgnZCcpLm1hdGNoKC9NXFxzKiguKz8pLCguKz8pXFxzKkNcXHMqKC4rPyksKC4rPylcXHMoLis/KSwoLis/KVxccyguKz8pLCguKz8pLyk7XG4gICAgdmFyIG51bWJlcnMgPSBtYXRjaGVzLnNsaWNlKDEpLm1hcChmdW5jdGlvbiAobSkge1xuICAgICAgICByZXR1cm4gTnVtYmVyKG0pO1xuICAgIH0pO1xuICAgIHZhciByZXQgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDg7IGkgKz0gMikge1xuICAgICAgICByZXQucHVzaChuZXcgTC5Qb2ludChudW1iZXJzW2ldLCBudW1iZXJzW2kgKyAxXSkpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufVxuZXhwb3J0cy5nZXRCZXppZXJQYXRoID0gZ2V0QmV6aWVyUGF0aDtcbmZ1bmN0aW9uIHNldEJlemllclBhdGgoZWwsIGNvbnRyb2xQb2ludHMpIHtcbiAgICBpZiAoY29udHJvbFBvaW50cy5sZW5ndGggIT09IDQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd0aGVyZSBzaG91bGQgYmUgNCBwb2ludHMnKTtcbiAgICB9XG4gICAgdmFyIHBhdGggPSBjcmVhdGVTVkdFbGVtZW50KCdwYXRoJyk7XG4gICAgdmFyIHMgPSBbJ00nXS5jb25jYXQoY29udHJvbFBvaW50cy5tYXAoZnVuY3Rpb24gKHB0KSB7XG4gICAgICAgIHJldHVybiBwdC54ICsgXCIsXCIgKyBwdC55O1xuICAgIH0pKTtcbiAgICBzLnNwbGljZSgyLCAwLCAnQycpO1xuICAgIGVsLnNldEF0dHJpYnV0ZSgnZCcsIHMuam9pbignICcpKTtcbn1cbmV4cG9ydHMuc2V0QmV6aWVyUGF0aCA9IHNldEJlemllclBhdGg7XG5mdW5jdGlvbiBtYWtlQ3ViaWNCZXppZXIoY29udHJvbFBvaW50cykge1xuICAgIHZhciBwYXRoID0gY3JlYXRlU1ZHRWxlbWVudCgncGF0aCcpO1xuICAgIHNldEJlemllclBhdGgocGF0aCwgY29udHJvbFBvaW50cyk7XG4gICAgcmV0dXJuIHBhdGg7XG59XG5leHBvcnRzLm1ha2VDdWJpY0JlemllciA9IG1ha2VDdWJpY0JlemllcjtcbmZ1bmN0aW9uIGN1dEN1YmljQmV6aWVyKGNvbnRyb2xQb2ludHMsIGZyYWN0aW9uKSB7XG4gICAgZnVuY3Rpb24gcmVkKGNwcykge1xuICAgICAgICB2YXIgcHRzID0gbmV3IEFycmF5KGNwcy5sZW5ndGggLSAxKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwdHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHB0c1swXSA9IGNwc1tpXS5hZGQoY3BzW2kgKyAxXS5zdWJ0cmFjdChjcHNbaV0pLm11bHRpcGx5QnkoZnJhY3Rpb24pKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHRzO1xuICAgIH1cbiAgICB2YXIgbmV3QXJyID0gbmV3IEFycmF5KGNvbnRyb2xQb2ludHMubGVuZ3RoKTtcbiAgICB2YXIgcHRzID0gY29udHJvbFBvaW50cy5zbGljZSgwLCBjb250cm9sUG9pbnRzLmxlbmd0aCk7XG4gICAgZG8ge1xuICAgICAgICBuZXdBcnIucHVzaChwdHNbMF0pO1xuICAgICAgICBwdHMgPSByZWQocHRzKTtcbiAgICB9IHdoaWxlIChwdHMubGVuZ3RoID4gMCk7XG4gICAgcmV0dXJuIG5ld0Fycjtcbn1cbmV4cG9ydHMuY3V0Q3ViaWNCZXppZXIgPSBjdXRDdWJpY0JlemllcjtcbmZ1bmN0aW9uIG1ha2VUcmFuc2ZlclJpbmcoY2VudGVyLCByYWRpdXMsIHRoaWNrbmVzcywgYm9yZGVyV2lkdGgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IFsndHJhbnNmZXItb3V0ZXInLCAndHJhbnNmZXItaW5uZXInXTtcbiAgICB2YXIgaGFsZkJvcmRlciA9IGJvcmRlcldpZHRoICogMC41O1xuICAgIHJldHVybiBbdGhpY2tuZXNzICsgaGFsZkJvcmRlciwgdGhpY2tuZXNzIC0gaGFsZkJvcmRlcl0ubWFwKGZ1bmN0aW9uICh0LCBpbmRleCkge1xuICAgICAgICB2YXIgcmluZyA9IG1ha2VDaXJjbGUoY2VudGVyLCByYWRpdXMpO1xuICAgICAgICByaW5nLnN0eWxlLnN0cm9rZVdpZHRoID0gdCArICdweCc7XG4gICAgICAgIHJpbmcuY2xhc3NMaXN0LmFkZChjbGFzc2VzW2luZGV4XSk7XG4gICAgICAgIHJldHVybiByaW5nO1xuICAgIH0pO1xufVxuZXhwb3J0cy5tYWtlVHJhbnNmZXJSaW5nID0gbWFrZVRyYW5zZmVyUmluZztcbmZ1bmN0aW9uIG1ha2VUcmFuc2ZlcihzdGFydCwgZW5kLCB0aGlja25lc3MsIGJvcmRlcldpZHRoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSBbJ3RyYW5zZmVyLW91dGVyJywgJ3RyYW5zZmVyLWlubmVyJ107XG4gICAgdmFyIGhhbGZCb3JkZXIgPSBib3JkZXJXaWR0aCAqIDAuNTtcbiAgICByZXR1cm4gW3RoaWNrbmVzcyArIGhhbGZCb3JkZXIsIHRoaWNrbmVzcyAtIGhhbGZCb3JkZXJdLm1hcChmdW5jdGlvbiAodCwgaW5kZXgpIHtcbiAgICAgICAgdmFyIGxpbmUgPSBjcmVhdGVTVkdFbGVtZW50KCdsaW5lJyk7XG4gICAgICAgIGxpbmUuc2V0QXR0cmlidXRlKCd4MScsIHN0YXJ0LngudG9TdHJpbmcoKSk7XG4gICAgICAgIGxpbmUuc2V0QXR0cmlidXRlKCd5MScsIHN0YXJ0LnkudG9TdHJpbmcoKSk7XG4gICAgICAgIGxpbmUuc2V0QXR0cmlidXRlKCd4MicsIGVuZC54LnRvU3RyaW5nKCkpO1xuICAgICAgICBsaW5lLnNldEF0dHJpYnV0ZSgneTInLCBlbmQueS50b1N0cmluZygpKTtcbiAgICAgICAgbGluZS5zdHlsZS5zdHJva2VXaWR0aCA9IHQgKyAncHgnO1xuICAgICAgICBsaW5lLmNsYXNzTGlzdC5hZGQoY2xhc3Nlc1tpbmRleF0pO1xuICAgICAgICByZXR1cm4gbGluZTtcbiAgICB9KTtcbn1cbmV4cG9ydHMubWFrZVRyYW5zZmVyID0gbWFrZVRyYW5zZmVyO1xuZnVuY3Rpb24gY3JlYXRlU1ZHRWxlbWVudCh0YWdOYW1lKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCB0YWdOYW1lKTtcbn1cbmV4cG9ydHMuY3JlYXRlU1ZHRWxlbWVudCA9IGNyZWF0ZVNWR0VsZW1lbnQ7XG5mdW5jdGlvbiBtYWtlRm9yZWlnbkRpdih0b3BMZWZ0LCB0ZXh0KSB7XG4gICAgdmFyIGZvcmVpZ24gPSBjcmVhdGVTVkdFbGVtZW50KCdmb3JlaWduT2JqZWN0Jyk7XG4gICAgLy9mb3JlaWduLnNldEF0dHJpYnV0ZSgncmVxdWlyZWRFeHRlbnNpb25zJywgJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWwnKTtcbiAgICBmb3JlaWduLnNldEF0dHJpYnV0ZSgneCcsIHRvcExlZnQueC50b1N0cmluZygpKTtcbiAgICBmb3JlaWduLnNldEF0dHJpYnV0ZSgneScsIHRvcExlZnQueS50b1N0cmluZygpKTtcbiAgICBmb3JlaWduLnNldEF0dHJpYnV0ZSgnd2lkdGgnLCAnMjAwJyk7XG4gICAgZm9yZWlnbi5zZXRBdHRyaWJ1dGUoJ2hlaWdodCcsICc1MCcpO1xuICAgIC8vbGV0IGRpdiA9IDxIVE1MRWxlbWVudD5kb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWwnLCAnZGl2Jyk7XG4gICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGRpdi5pbm5lckhUTUwgPSB0ZXh0O1xuICAgIGRpdi5jbGFzc0xpc3QuYWRkKCdwbGF0ZS1ib3gnKTtcbiAgICBkaXYuY2xhc3NMaXN0LmFkZCgncGxhdGUtdGV4dCcpO1xuICAgIGZvcmVpZ24uYXBwZW5kQ2hpbGQoZGl2KTtcbiAgICByZXR1cm4gZm9yZWlnbjtcbn1cbmZ1bmN0aW9uIG1ha2VEcm9wU2hhZG93KCkge1xuICAgIHZhciBmaWx0ZXIgPSBjcmVhdGVTVkdFbGVtZW50KCdmaWx0ZXInKTtcbiAgICBmaWx0ZXIuaWQgPSAnc2hhZG93JztcbiAgICBmaWx0ZXIuc2V0QXR0cmlidXRlKCd3aWR0aCcsICcyMDAlJyk7XG4gICAgZmlsdGVyLnNldEF0dHJpYnV0ZSgnaGVpZ2h0JywgJzIwMCUnKTtcbiAgICBmaWx0ZXIuaW5uZXJIVE1MID0gXCJcXG4gICAgICAgIDxmZU9mZnNldCByZXN1bHQ9XFxcIm9mZk91dFxcXCIgaW49XFxcIlNvdXJjZUFscGhhXFxcIiBkeD1cXFwiMFxcXCIgZHk9XFxcIjJcXFwiIC8+XFxuICAgICAgICA8ZmVHYXVzc2lhbkJsdXIgcmVzdWx0PVxcXCJibHVyT3V0XFxcIiBpbj1cXFwib2ZmT3V0XFxcIiBzdGREZXZpYXRpb249XFxcIjJcXFwiIC8+XFxuICAgICAgICA8ZmVCbGVuZCBpbj1cXFwiU291cmNlR3JhcGhpY1xcXCIgaW4yPVxcXCJibHVyT3V0XFxcIiBtb2RlPVxcXCJub3JtYWxcXFwiIC8+XFxuICAgIFwiO1xuICAgIHJldHVybiBmaWx0ZXI7XG59XG5leHBvcnRzLm1ha2VEcm9wU2hhZG93ID0gbWFrZURyb3BTaGFkb3c7XG5mdW5jdGlvbiBtYWtlUGxhdGUoKSB7XG4gICAgdmFyIHN0YXRpb25QbGF0ZSA9IGNyZWF0ZVNWR0VsZW1lbnQoJ2cnKTtcbiAgICBzdGF0aW9uUGxhdGUuaWQgPSAnc3RhdGlvbi1wbGF0ZSc7XG4gICAgc3RhdGlvblBsYXRlLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgc3RhdGlvblBsYXRlLmlubmVySFRNTCA9IFwiPGxpbmUgaWQ9XFxcInBvbGVcXFwiIGNsYXNzPVxcXCJwbGF0ZS1wb2xlXFxcIi8+XFxuICAgICAgICAgICAgPGc+XFxuICAgICAgICAgICAgICAgIDxyZWN0IGlkPVxcXCJwbGF0ZS1ib3hcXFwiIGNsYXNzPVxcXCJwbGF0ZS1ib3hcXFwiIGZpbHRlcj1cXFwidXJsKCNzaGFkb3cpXFxcIi8+XFxuICAgICAgICAgICAgICAgIDx0ZXh0IGlkPVxcXCJwbGF0ZS10ZXh0XFxcIiBmaWxsPVxcXCJibGFja1xcXCIgY2xhc3M9XFxcInBsYXRlLXRleHRcXFwiPjx0c3Bhbi8+PHRzcGFuLz48dHNwYW4vPjwvdGV4dD5cXG4gICAgICAgICAgICA8L2c+XCI7XG4gICAgcmV0dXJuIHN0YXRpb25QbGF0ZTtcbn1cbmV4cG9ydHMubWFrZVBsYXRlID0gbWFrZVBsYXRlO1xuZnVuY3Rpb24gY2lyY2xlQnlEdW1teShkdW1teSkge1xuICAgIHJldHVybiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncC0nICsgZHVtbXkuaWQuc2xpY2UoMikpO1xufVxuZXhwb3J0cy5jaXJjbGVCeUR1bW15ID0gY2lyY2xlQnlEdW1teTtcbmZ1bmN0aW9uIHBsYXRmb3JtQnlDaXJjbGUoY2lyY2xlLCBncmFwaCkge1xuICAgIHJldHVybiBncmFwaC5wbGF0Zm9ybXNbcGFyc2VJbnQoY2lyY2xlLmlkLnNsaWNlKDIpKV07XG59XG5leHBvcnRzLnBsYXRmb3JtQnlDaXJjbGUgPSBwbGF0Zm9ybUJ5Q2lyY2xlO1xuZnVuY3Rpb24gcGxhdGZvcm1CeUR1bW15KGR1bW15LCBncmFwaCkge1xuICAgIHJldHVybiBncmFwaC5wbGF0Zm9ybXNbcGFyc2VJbnQoZHVtbXkuaWQuc2xpY2UoMikpXTtcbn1cbmV4cG9ydHMucGxhdGZvcm1CeUR1bW15ID0gcGxhdGZvcm1CeUR1bW15O1xuLyoqXHJcbiAqIG1vZGlmaWVzICYgcmV0dXJucyB0aGUgbW9kaWZpZWQgcGxhdGVcclxuICovXG5mdW5jdGlvbiBtb2RpZnlQbGF0ZShjaXJjbGUsIGdyYXBoKSB7XG4gICAgdmFyIHBsYXRlR3JvdXAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RhdGlvbi1wbGF0ZScpO1xuICAgIHZhciBjID0gbmV3IEwuUG9pbnQoTnVtYmVyKGNpcmNsZS5nZXRBdHRyaWJ1dGUoJ2N4JykpLCBOdW1iZXIoY2lyY2xlLmdldEF0dHJpYnV0ZSgnY3knKSkpO1xuICAgIHZhciByID0gTnVtYmVyKGNpcmNsZS5nZXRBdHRyaWJ1dGUoJ3InKSk7XG4gICAgdmFyIGlSID0gTWF0aC50cnVuYyhyKTtcbiAgICB2YXIgcG9sZSA9IHBsYXRlR3JvdXAuY2hpbGRyZW5bMF07XG4gICAgdmFyIHBvbGVTaXplID0gbmV3IEwuUG9pbnQoNCArIGlSLCA4ICsgaVIpO1xuICAgIHZhciBwb2xlRW5kID0gYy5zdWJ0cmFjdChwb2xlU2l6ZSk7XG4gICAgcG9sZS5zZXRBdHRyaWJ1dGUoJ3gxJywgYy54LnRvU3RyaW5nKCkpO1xuICAgIHBvbGUuc2V0QXR0cmlidXRlKCd5MScsIGMueS50b1N0cmluZygpKTtcbiAgICBwb2xlLnNldEF0dHJpYnV0ZSgneDInLCBwb2xlRW5kLngudG9TdHJpbmcoKSk7XG4gICAgcG9sZS5zZXRBdHRyaWJ1dGUoJ3kyJywgcG9sZUVuZC55LnRvU3RyaW5nKCkpO1xuICAgIHZhciBwbGF0Zm9ybSA9IGdyYXBoLnBsYXRmb3Jtc1twYXJzZUludChjaXJjbGUuaWQuc2xpY2UoMikpXTtcbiAgICB2YXIgcnUgPSBwbGF0Zm9ybS5uYW1lO1xuICAgIHZhciBmaSA9IHBsYXRmb3JtLmFsdE5hbWVzWydmaSddO1xuICAgIHZhciBlbiA9IHBsYXRmb3JtLmFsdE5hbWVzWydlbiddO1xuICAgIHZhciBuYW1lcyA9ICFmaSA/IFtydV0gOiB1dGlsLmdldFVzZXJMYW5ndWFnZSgpID09PSAnZmknID8gW2ZpLCBydV0gOiBbcnUsIGZpXTtcbiAgICBpZiAoZW4pIG5hbWVzLnB1c2goZW4pO1xuICAgIG1vZGlmeVBsYXRlQm94KHBvbGVFbmQsIG5hbWVzKTtcbiAgICByZXR1cm4gcGxhdGVHcm91cDtcbn1cbmV4cG9ydHMubW9kaWZ5UGxhdGUgPSBtb2RpZnlQbGF0ZTtcbmZ1bmN0aW9uIG1vZGlmeVBsYXRlQm94KGJvdHRvbVJpZ2h0LCBsaW5lcykge1xuICAgIHZhciByZWN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BsYXRlLWJveCcpO1xuICAgIHZhciBzcGFjaW5nID0gMTI7XG4gICAgdmFyIGxvbmdlc3QgPSBsaW5lcy5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIGN1cikge1xuICAgICAgICByZXR1cm4gcHJldi5sZW5ndGggPCBjdXIubGVuZ3RoID8gY3VyIDogcHJldjtcbiAgICB9KTtcbiAgICB2YXIgcmVjdFNpemUgPSBuZXcgTC5Qb2ludCgxMCArIGxvbmdlc3QubGVuZ3RoICogNiwgNiArIHNwYWNpbmcgKiBsaW5lcy5sZW5ndGgpO1xuICAgIHJlY3Quc2V0QXR0cmlidXRlKCd3aWR0aCcsIHJlY3RTaXplLngudG9TdHJpbmcoKSk7XG4gICAgcmVjdC5zZXRBdHRyaWJ1dGUoJ2hlaWdodCcsIHJlY3RTaXplLnkudG9TdHJpbmcoKSk7XG4gICAgdmFyIHJlY3RUb3BMZWZ0ID0gYm90dG9tUmlnaHQuc3VidHJhY3QocmVjdFNpemUpO1xuICAgIHJlY3Quc2V0QXR0cmlidXRlKCd4JywgcmVjdFRvcExlZnQueC50b1N0cmluZygpKTtcbiAgICByZWN0LnNldEF0dHJpYnV0ZSgneScsIHJlY3RUb3BMZWZ0LnkudG9TdHJpbmcoKSk7XG4gICAgdmFyIHRleHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGxhdGUtdGV4dCcpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIHRleHRUb3BMZWZ0ID0gYm90dG9tUmlnaHQuc3VidHJhY3QobmV3IEwuUG9pbnQoMywgcmVjdFNpemUueSAtIChpICsgMSkgKiBzcGFjaW5nKSk7XG4gICAgICAgIHZhciB0ID0gdGV4dC5jaGlsZHJlbltpXTtcbiAgICAgICAgdC5zZXRBdHRyaWJ1dGUoJ3gnLCB0ZXh0VG9wTGVmdC54LnRvU3RyaW5nKCkpO1xuICAgICAgICB0LnNldEF0dHJpYnV0ZSgneScsIHRleHRUb3BMZWZ0LnkudG9TdHJpbmcoKSk7XG4gICAgICAgIHQudGV4dENvbnRlbnQgPSBsaW5lc1tpXTtcbiAgICB9XG4gICAgd2hpbGUgKGkgPCB0ZXh0LmNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICB0ZXh0LmNoaWxkcmVuW2krK10udGV4dENvbnRlbnQgPSBudWxsO1xuICAgIH1cbn1cblxuXG59LHtcIi4uL3V0aWxcIjo2Mn1dLDc6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xudmFyIF9fYXdhaXRlciA9IHRoaXMgJiYgdGhpcy5fX2F3YWl0ZXIgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIF9hcmd1bWVudHMsIFByb21pc2UsIGdlbmVyYXRvcikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGdlbmVyYXRvciA9IGdlbmVyYXRvci5jYWxsKHRoaXNBcmcsIF9hcmd1bWVudHMpO1xuICAgICAgICBmdW5jdGlvbiBjYXN0KHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQcm9taXNlICYmIHZhbHVlLmNvbnN0cnVjdG9yID09PSBQcm9taXNlID8gdmFsdWUgOiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUodmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gb25mdWxmaWxsKHZhbHVlKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHN0ZXAoXCJuZXh0XCIsIHZhbHVlKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gb25yZWplY3QodmFsdWUpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgc3RlcChcInRocm93XCIsIHZhbHVlKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcCh2ZXJiLCB2YWx1ZSkge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGdlbmVyYXRvclt2ZXJiXSh2YWx1ZSk7XG4gICAgICAgICAgICByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IGNhc3QocmVzdWx0LnZhbHVlKS50aGVuKG9uZnVsZmlsbCwgb25yZWplY3QpO1xuICAgICAgICB9XG4gICAgICAgIHN0ZXAoXCJuZXh0XCIsIHZvaWQgMCk7XG4gICAgfSk7XG59O1xuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vLi4vdHlwaW5ncy90c2QuZC50c1wiIC8+XG52YXIgTCA9IHdpbmRvdy5MO1xudmFyIHRpbGVMYXllcnMgPSB7XG4gICAgTWFwYm94OiBuZXcgTC5UaWxlTGF5ZXIoJ2h0dHBzOi8ve3N9LnRpbGVzLm1hcGJveC5jb20vdjMvaW5rZXIubWxvOTFjNDEve3p9L3t4fS97eX0ucG5nJywge1xuICAgICAgICBtaW5ab29tOiA5LFxuICAgICAgICAvL2lkOiAnaW5rZXIubWxvOTFjNDEnLFxuICAgICAgICBkZXRlY3RSZXRpbmE6IHRydWUsXG4gICAgICAgIC8vcmV1c2VUaWxlczogdHJ1ZSxcbiAgICAgICAgYm91bmRzOiBudWxsLFxuICAgICAgICBhdHRyaWJ1dGlvbjogXCJNYXAgZGF0YSAmY29weTsgPGEgaHJlZj1cXFwiaHR0cHM6Ly9vcGVuc3RyZWV0bWFwLm9yZ1xcXCI+T3BlblN0cmVldE1hcDwvYT4gY29udHJpYnV0b3JzLCA8YSBocmVmPVxcXCJodHRwczovL2NyZWF0aXZlY29tbW9ucy5vcmcvbGljZW5zZXMvYnktc2EvMi4wL1xcXCI+Q0MtQlktU0E8L2E+LCBJbWFnZXJ5IMKpIDxhIGhyZWY9XFxcImh0dHBzOi8vbWFwYm94LmNvbVxcXCI+TWFwYm94PC9hPlwiXG4gICAgfSksXG4gICAgT3Blbk1hcFN1cmZlcjogbmV3IEwuVGlsZUxheWVyKCdodHRwOi8vb3Blbm1hcHN1cmZlci51bmktaGQuZGUvdGlsZXMvcm9hZHMveD17eH0meT17eX0mej17en0nLCB7XG4gICAgICAgIG1pblpvb206IDksXG4gICAgICAgIGRldGVjdFJldGluYTogdHJ1ZSxcbiAgICAgICAgLy9yZXVzZVRpbGVzOiB0cnVlLFxuICAgICAgICBhdHRyaWJ1dGlvbjogJ0ltYWdlcnkgZnJvbSA8YSBocmVmPVwiaHR0cDovL2dpc2NpZW5jZS51bmktaGQuZGUvXCI+R0lTY2llbmNlIFJlc2VhcmNoIEdyb3VwIEAgVW5pdmVyc2l0eSBvZiBIZWlkZWxiZXJnPC9hPiAmbWRhc2g7IE1hcCBkYXRhICZjb3B5OyA8YSBocmVmPVwiaHR0cHM6Ly9zZXJ2ZXIudHMub3BlbnN0cmVldG1hcC5vcmcvY29weXJpZ2h0XCI+T3BlblN0cmVldE1hcDwvYT4nXG4gICAgfSksXG4gICAgSHlkZGFCYXNlOiBMLnRpbGVMYXllcignaHR0cDovL3tzfS50aWxlLm9wZW5zdHJlZXRtYXAuc2UvaHlkZGEvYmFzZS97en0ve3h9L3t5fS5wbmcnLCB7XG4gICAgICAgIG1pblpvb206IDksXG4gICAgICAgIGRldGVjdFJldGluYTogdHJ1ZSxcbiAgICAgICAgYXR0cmlidXRpb246ICdUaWxlcyBjb3VydGVzeSBvZiA8YSBocmVmPVwiaHR0cDovL29wZW5zdHJlZXRtYXAuc2UvXCIgdGFyZ2V0PVwiX2JsYW5rXCI+T3BlblN0cmVldE1hcCBTd2VkZW48L2E+ICZtZGFzaDsgTWFwIGRhdGEgJmNvcHk7IDxhIGhyZWY9XCJodHRwOi8vc2VydmVyLnRzLm9wZW5zdHJlZXRtYXAub3JnL2NvcHlyaWdodFwiPk9wZW5TdHJlZXRNYXA8L2E+J1xuICAgIH0pLFxuICAgIEVzcmlHcmV5OiBMLnRpbGVMYXllcignaHR0cDovL3NlcnZlci5hcmNnaXNvbmxpbmUuY29tL0FyY0dJUy9yZXN0L3NlcnZpY2VzL0NhbnZhcy9Xb3JsZF9MaWdodF9HcmF5X0Jhc2UvTWFwU2VydmVyL3RpbGUve3p9L3t5fS97eH0nLCB7XG4gICAgICAgIGF0dHJpYnV0aW9uOiAnVGlsZXMgJmNvcHk7IEVzcmkgJm1kYXNoOyBFc3JpLCBEZUxvcm1lLCBOQVZURVEnLFxuICAgICAgICBtaW5ab29tOiA5LFxuICAgICAgICBkZXRlY3RSZXRpbmE6IHRydWVcbiAgICB9KVxufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IHRpbGVMYXllcnM7XG5cblxufSx7fV0sODpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vKlxuICogY2xhc3NMaXN0LmpzOiBDcm9zcy1icm93c2VyIGZ1bGwgZWxlbWVudC5jbGFzc0xpc3QgaW1wbGVtZW50YXRpb24uXG4gKiAyMDE0LTA3LTIzXG4gKlxuICogQnkgRWxpIEdyZXksIGh0dHA6Ly9lbGlncmV5LmNvbVxuICogUHVibGljIERvbWFpbi5cbiAqIE5PIFdBUlJBTlRZIEVYUFJFU1NFRCBPUiBJTVBMSUVELiBVU0UgQVQgWU9VUiBPV04gUklTSy5cbiAqL1xuXG4vKmdsb2JhbCBzZWxmLCBkb2N1bWVudCwgRE9NRXhjZXB0aW9uICovXG5cbi8qISBAc291cmNlIGh0dHA6Ly9wdXJsLmVsaWdyZXkuY29tL2dpdGh1Yi9jbGFzc0xpc3QuanMvYmxvYi9tYXN0ZXIvY2xhc3NMaXN0LmpzKi9cblxuLyogQ29waWVkIGZyb20gTUROOlxuICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0VsZW1lbnQvY2xhc3NMaXN0XG4gKi9cblxuaWYgKFwiZG9jdW1lbnRcIiBpbiB3aW5kb3cuc2VsZikge1xuXG4gIC8vIEZ1bGwgcG9seWZpbGwgZm9yIGJyb3dzZXJzIHdpdGggbm8gY2xhc3NMaXN0IHN1cHBvcnRcbiAgaWYgKCEoXCJjbGFzc0xpc3RcIiBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiX1wiKSkpIHtcblxuICAoZnVuY3Rpb24gKHZpZXcpIHtcblxuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgaWYgKCEoJ0VsZW1lbnQnIGluIHZpZXcpKSByZXR1cm47XG5cbiAgICB2YXJcbiAgICAgICAgY2xhc3NMaXN0UHJvcCA9IFwiY2xhc3NMaXN0XCJcbiAgICAgICwgcHJvdG9Qcm9wID0gXCJwcm90b3R5cGVcIlxuICAgICAgLCBlbGVtQ3RyUHJvdG8gPSB2aWV3LkVsZW1lbnRbcHJvdG9Qcm9wXVxuICAgICAgLCBvYmpDdHIgPSBPYmplY3RcbiAgICAgICwgc3RyVHJpbSA9IFN0cmluZ1twcm90b1Byb3BdLnRyaW0gfHwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCBcIlwiKTtcbiAgICAgIH1cbiAgICAgICwgYXJySW5kZXhPZiA9IEFycmF5W3Byb3RvUHJvcF0uaW5kZXhPZiB8fCBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICB2YXJcbiAgICAgICAgICAgIGkgPSAwXG4gICAgICAgICAgLCBsZW4gPSB0aGlzLmxlbmd0aFxuICAgICAgICA7XG4gICAgICAgIGZvciAoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICBpZiAoaSBpbiB0aGlzICYmIHRoaXNbaV0gPT09IGl0ZW0pIHtcbiAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gLTE7XG4gICAgICB9XG4gICAgICAvLyBWZW5kb3JzOiBwbGVhc2UgYWxsb3cgY29udGVudCBjb2RlIHRvIGluc3RhbnRpYXRlIERPTUV4Y2VwdGlvbnNcbiAgICAgICwgRE9NRXggPSBmdW5jdGlvbiAodHlwZSwgbWVzc2FnZSkge1xuICAgICAgICB0aGlzLm5hbWUgPSB0eXBlO1xuICAgICAgICB0aGlzLmNvZGUgPSBET01FeGNlcHRpb25bdHlwZV07XG4gICAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICB9XG4gICAgICAsIGNoZWNrVG9rZW5BbmRHZXRJbmRleCA9IGZ1bmN0aW9uIChjbGFzc0xpc3QsIHRva2VuKSB7XG4gICAgICAgIGlmICh0b2tlbiA9PT0gXCJcIikge1xuICAgICAgICAgIHRocm93IG5ldyBET01FeChcbiAgICAgICAgICAgICAgXCJTWU5UQVhfRVJSXCJcbiAgICAgICAgICAgICwgXCJBbiBpbnZhbGlkIG9yIGlsbGVnYWwgc3RyaW5nIHdhcyBzcGVjaWZpZWRcIlxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKC9cXHMvLnRlc3QodG9rZW4pKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IERPTUV4KFxuICAgICAgICAgICAgICBcIklOVkFMSURfQ0hBUkFDVEVSX0VSUlwiXG4gICAgICAgICAgICAsIFwiU3RyaW5nIGNvbnRhaW5zIGFuIGludmFsaWQgY2hhcmFjdGVyXCJcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhcnJJbmRleE9mLmNhbGwoY2xhc3NMaXN0LCB0b2tlbik7XG4gICAgICB9XG4gICAgICAsIENsYXNzTGlzdCA9IGZ1bmN0aW9uIChlbGVtKSB7XG4gICAgICAgIHZhclxuICAgICAgICAgICAgdHJpbW1lZENsYXNzZXMgPSBzdHJUcmltLmNhbGwoZWxlbS5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKSB8fCBcIlwiKVxuICAgICAgICAgICwgY2xhc3NlcyA9IHRyaW1tZWRDbGFzc2VzID8gdHJpbW1lZENsYXNzZXMuc3BsaXQoL1xccysvKSA6IFtdXG4gICAgICAgICAgLCBpID0gMFxuICAgICAgICAgICwgbGVuID0gY2xhc3Nlcy5sZW5ndGhcbiAgICAgICAgO1xuICAgICAgICBmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgdGhpcy5wdXNoKGNsYXNzZXNbaV0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIHRoaXMudG9TdHJpbmcoKSk7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICAsIGNsYXNzTGlzdFByb3RvID0gQ2xhc3NMaXN0W3Byb3RvUHJvcF0gPSBbXVxuICAgICAgLCBjbGFzc0xpc3RHZXR0ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ2xhc3NMaXN0KHRoaXMpO1xuICAgICAgfVxuICAgIDtcbiAgICAvLyBNb3N0IERPTUV4Y2VwdGlvbiBpbXBsZW1lbnRhdGlvbnMgZG9uJ3QgYWxsb3cgY2FsbGluZyBET01FeGNlcHRpb24ncyB0b1N0cmluZygpXG4gICAgLy8gb24gbm9uLURPTUV4Y2VwdGlvbnMuIEVycm9yJ3MgdG9TdHJpbmcoKSBpcyBzdWZmaWNpZW50IGhlcmUuXG4gICAgRE9NRXhbcHJvdG9Qcm9wXSA9IEVycm9yW3Byb3RvUHJvcF07XG4gICAgY2xhc3NMaXN0UHJvdG8uaXRlbSA9IGZ1bmN0aW9uIChpKSB7XG4gICAgICByZXR1cm4gdGhpc1tpXSB8fCBudWxsO1xuICAgIH07XG4gICAgY2xhc3NMaXN0UHJvdG8uY29udGFpbnMgPSBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgIHRva2VuICs9IFwiXCI7XG4gICAgICByZXR1cm4gY2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuKSAhPT0gLTE7XG4gICAgfTtcbiAgICBjbGFzc0xpc3RQcm90by5hZGQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXJcbiAgICAgICAgICB0b2tlbnMgPSBhcmd1bWVudHNcbiAgICAgICAgLCBpID0gMFxuICAgICAgICAsIGwgPSB0b2tlbnMubGVuZ3RoXG4gICAgICAgICwgdG9rZW5cbiAgICAgICAgLCB1cGRhdGVkID0gZmFsc2VcbiAgICAgIDtcbiAgICAgIGRvIHtcbiAgICAgICAgdG9rZW4gPSB0b2tlbnNbaV0gKyBcIlwiO1xuICAgICAgICBpZiAoY2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuKSA9PT0gLTEpIHtcbiAgICAgICAgICB0aGlzLnB1c2godG9rZW4pO1xuICAgICAgICAgIHVwZGF0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB3aGlsZSAoKytpIDwgbCk7XG5cbiAgICAgIGlmICh1cGRhdGVkKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSgpO1xuICAgICAgfVxuICAgIH07XG4gICAgY2xhc3NMaXN0UHJvdG8ucmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyXG4gICAgICAgICAgdG9rZW5zID0gYXJndW1lbnRzXG4gICAgICAgICwgaSA9IDBcbiAgICAgICAgLCBsID0gdG9rZW5zLmxlbmd0aFxuICAgICAgICAsIHRva2VuXG4gICAgICAgICwgdXBkYXRlZCA9IGZhbHNlXG4gICAgICAgICwgaW5kZXhcbiAgICAgIDtcbiAgICAgIGRvIHtcbiAgICAgICAgdG9rZW4gPSB0b2tlbnNbaV0gKyBcIlwiO1xuICAgICAgICBpbmRleCA9IGNoZWNrVG9rZW5BbmRHZXRJbmRleCh0aGlzLCB0b2tlbik7XG4gICAgICAgIHdoaWxlIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICB0aGlzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgdXBkYXRlZCA9IHRydWU7XG4gICAgICAgICAgaW5kZXggPSBjaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB3aGlsZSAoKytpIDwgbCk7XG5cbiAgICAgIGlmICh1cGRhdGVkKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSgpO1xuICAgICAgfVxuICAgIH07XG4gICAgY2xhc3NMaXN0UHJvdG8udG9nZ2xlID0gZnVuY3Rpb24gKHRva2VuLCBmb3JjZSkge1xuICAgICAgdG9rZW4gKz0gXCJcIjtcblxuICAgICAgdmFyXG4gICAgICAgICAgcmVzdWx0ID0gdGhpcy5jb250YWlucyh0b2tlbilcbiAgICAgICAgLCBtZXRob2QgPSByZXN1bHQgP1xuICAgICAgICAgIGZvcmNlICE9PSB0cnVlICYmIFwicmVtb3ZlXCJcbiAgICAgICAgOlxuICAgICAgICAgIGZvcmNlICE9PSBmYWxzZSAmJiBcImFkZFwiXG4gICAgICA7XG5cbiAgICAgIGlmIChtZXRob2QpIHtcbiAgICAgICAgdGhpc1ttZXRob2RdKHRva2VuKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGZvcmNlID09PSB0cnVlIHx8IGZvcmNlID09PSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gZm9yY2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gIXJlc3VsdDtcbiAgICAgIH1cbiAgICB9O1xuICAgIGNsYXNzTGlzdFByb3RvLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHRoaXMuam9pbihcIiBcIik7XG4gICAgfTtcblxuICAgIGlmIChvYmpDdHIuZGVmaW5lUHJvcGVydHkpIHtcbiAgICAgIHZhciBjbGFzc0xpc3RQcm9wRGVzYyA9IHtcbiAgICAgICAgICBnZXQ6IGNsYXNzTGlzdEdldHRlclxuICAgICAgICAsIGVudW1lcmFibGU6IHRydWVcbiAgICAgICAgLCBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH07XG4gICAgICB0cnkge1xuICAgICAgICBvYmpDdHIuZGVmaW5lUHJvcGVydHkoZWxlbUN0clByb3RvLCBjbGFzc0xpc3RQcm9wLCBjbGFzc0xpc3RQcm9wRGVzYyk7XG4gICAgICB9IGNhdGNoIChleCkgeyAvLyBJRSA4IGRvZXNuJ3Qgc3VwcG9ydCBlbnVtZXJhYmxlOnRydWVcbiAgICAgICAgaWYgKGV4Lm51bWJlciA9PT0gLTB4N0ZGNUVDNTQpIHtcbiAgICAgICAgICBjbGFzc0xpc3RQcm9wRGVzYy5lbnVtZXJhYmxlID0gZmFsc2U7XG4gICAgICAgICAgb2JqQ3RyLmRlZmluZVByb3BlcnR5KGVsZW1DdHJQcm90bywgY2xhc3NMaXN0UHJvcCwgY2xhc3NMaXN0UHJvcERlc2MpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChvYmpDdHJbcHJvdG9Qcm9wXS5fX2RlZmluZUdldHRlcl9fKSB7XG4gICAgICBlbGVtQ3RyUHJvdG8uX19kZWZpbmVHZXR0ZXJfXyhjbGFzc0xpc3RQcm9wLCBjbGFzc0xpc3RHZXR0ZXIpO1xuICAgIH1cblxuICAgIH0od2luZG93LnNlbGYpKTtcblxuICAgIH0gZWxzZSB7XG4gICAgLy8gVGhlcmUgaXMgZnVsbCBvciBwYXJ0aWFsIG5hdGl2ZSBjbGFzc0xpc3Qgc3VwcG9ydCwgc28ganVzdCBjaGVjayBpZiB3ZSBuZWVkXG4gICAgLy8gdG8gbm9ybWFsaXplIHRoZSBhZGQvcmVtb3ZlIGFuZCB0b2dnbGUgQVBJcy5cblxuICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgdmFyIHRlc3RFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIl9cIik7XG5cbiAgICAgIHRlc3RFbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJjMVwiLCBcImMyXCIpO1xuXG4gICAgICAvLyBQb2x5ZmlsbCBmb3IgSUUgMTAvMTEgYW5kIEZpcmVmb3ggPDI2LCB3aGVyZSBjbGFzc0xpc3QuYWRkIGFuZFxuICAgICAgLy8gY2xhc3NMaXN0LnJlbW92ZSBleGlzdCBidXQgc3VwcG9ydCBvbmx5IG9uZSBhcmd1bWVudCBhdCBhIHRpbWUuXG4gICAgICBpZiAoIXRlc3RFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyhcImMyXCIpKSB7XG4gICAgICAgIHZhciBjcmVhdGVNZXRob2QgPSBmdW5jdGlvbihtZXRob2QpIHtcbiAgICAgICAgICB2YXIgb3JpZ2luYWwgPSBET01Ub2tlbkxpc3QucHJvdG90eXBlW21ldGhvZF07XG5cbiAgICAgICAgICBET01Ub2tlbkxpc3QucHJvdG90eXBlW21ldGhvZF0gPSBmdW5jdGlvbih0b2tlbikge1xuICAgICAgICAgICAgdmFyIGksIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG5cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICB0b2tlbiA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgICAgb3JpZ2luYWwuY2FsbCh0aGlzLCB0b2tlbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgICAgY3JlYXRlTWV0aG9kKCdhZGQnKTtcbiAgICAgICAgY3JlYXRlTWV0aG9kKCdyZW1vdmUnKTtcbiAgICAgIH1cblxuICAgICAgdGVzdEVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZShcImMzXCIsIGZhbHNlKTtcblxuICAgICAgLy8gUG9seWZpbGwgZm9yIElFIDEwIGFuZCBGaXJlZm94IDwyNCwgd2hlcmUgY2xhc3NMaXN0LnRvZ2dsZSBkb2VzIG5vdFxuICAgICAgLy8gc3VwcG9ydCB0aGUgc2Vjb25kIGFyZ3VtZW50LlxuICAgICAgaWYgKHRlc3RFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyhcImMzXCIpKSB7XG4gICAgICAgIHZhciBfdG9nZ2xlID0gRE9NVG9rZW5MaXN0LnByb3RvdHlwZS50b2dnbGU7XG5cbiAgICAgICAgRE9NVG9rZW5MaXN0LnByb3RvdHlwZS50b2dnbGUgPSBmdW5jdGlvbih0b2tlbiwgZm9yY2UpIHtcbiAgICAgICAgICBpZiAoMSBpbiBhcmd1bWVudHMgJiYgIXRoaXMuY29udGFpbnModG9rZW4pID09PSAhZm9yY2UpIHtcbiAgICAgICAgICAgIHJldHVybiBmb3JjZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIF90b2dnbGUuY2FsbCh0aGlzLCB0b2tlbik7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICB9XG5cbiAgICAgIHRlc3RFbGVtZW50ID0gbnVsbDtcbiAgICB9KCkpO1xuICB9XG59XG5cbn0se31dLDk6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgY29weSAgICAgICA9IHJlcXVpcmUoJ2VzNS1leHQvb2JqZWN0L2NvcHknKVxuICAsIG1hcCAgICAgICAgPSByZXF1aXJlKCdlczUtZXh0L29iamVjdC9tYXAnKVxuICAsIGNhbGxhYmxlICAgPSByZXF1aXJlKCdlczUtZXh0L29iamVjdC92YWxpZC1jYWxsYWJsZScpXG4gICwgdmFsaWRWYWx1ZSA9IHJlcXVpcmUoJ2VzNS1leHQvb2JqZWN0L3ZhbGlkLXZhbHVlJylcblxuICAsIGJpbmQgPSBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCwgZGVmaW5lUHJvcGVydHkgPSBPYmplY3QuZGVmaW5lUHJvcGVydHlcbiAgLCBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcbiAgLCBkZWZpbmU7XG5cbmRlZmluZSA9IGZ1bmN0aW9uIChuYW1lLCBkZXNjLCBiaW5kVG8pIHtcblx0dmFyIHZhbHVlID0gdmFsaWRWYWx1ZShkZXNjKSAmJiBjYWxsYWJsZShkZXNjLnZhbHVlKSwgZGdzO1xuXHRkZ3MgPSBjb3B5KGRlc2MpO1xuXHRkZWxldGUgZGdzLndyaXRhYmxlO1xuXHRkZWxldGUgZGdzLnZhbHVlO1xuXHRkZ3MuZ2V0ID0gZnVuY3Rpb24gKCkge1xuXHRcdGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMsIG5hbWUpKSByZXR1cm4gdmFsdWU7XG5cdFx0ZGVzYy52YWx1ZSA9IGJpbmQuY2FsbCh2YWx1ZSwgKGJpbmRUbyA9PSBudWxsKSA/IHRoaXMgOiB0aGlzW2JpbmRUb10pO1xuXHRcdGRlZmluZVByb3BlcnR5KHRoaXMsIG5hbWUsIGRlc2MpO1xuXHRcdHJldHVybiB0aGlzW25hbWVdO1xuXHR9O1xuXHRyZXR1cm4gZGdzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocHJvcHMvKiwgYmluZFRvKi8pIHtcblx0dmFyIGJpbmRUbyA9IGFyZ3VtZW50c1sxXTtcblx0cmV0dXJuIG1hcChwcm9wcywgZnVuY3Rpb24gKGRlc2MsIG5hbWUpIHtcblx0XHRyZXR1cm4gZGVmaW5lKG5hbWUsIGRlc2MsIGJpbmRUbyk7XG5cdH0pO1xufTtcblxufSx7XCJlczUtZXh0L29iamVjdC9jb3B5XCI6MjQsXCJlczUtZXh0L29iamVjdC9tYXBcIjozMixcImVzNS1leHQvb2JqZWN0L3ZhbGlkLWNhbGxhYmxlXCI6MzcsXCJlczUtZXh0L29iamVjdC92YWxpZC12YWx1ZVwiOjM4fV0sMTA6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgYXNzaWduICAgICAgICA9IHJlcXVpcmUoJ2VzNS1leHQvb2JqZWN0L2Fzc2lnbicpXG4gICwgbm9ybWFsaXplT3B0cyA9IHJlcXVpcmUoJ2VzNS1leHQvb2JqZWN0L25vcm1hbGl6ZS1vcHRpb25zJylcbiAgLCBpc0NhbGxhYmxlICAgID0gcmVxdWlyZSgnZXM1LWV4dC9vYmplY3QvaXMtY2FsbGFibGUnKVxuICAsIGNvbnRhaW5zICAgICAgPSByZXF1aXJlKCdlczUtZXh0L3N0cmluZy8jL2NvbnRhaW5zJylcblxuICAsIGQ7XG5cbmQgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChkc2NyLCB2YWx1ZS8qLCBvcHRpb25zKi8pIHtcblx0dmFyIGMsIGUsIHcsIG9wdGlvbnMsIGRlc2M7XG5cdGlmICgoYXJndW1lbnRzLmxlbmd0aCA8IDIpIHx8ICh0eXBlb2YgZHNjciAhPT0gJ3N0cmluZycpKSB7XG5cdFx0b3B0aW9ucyA9IHZhbHVlO1xuXHRcdHZhbHVlID0gZHNjcjtcblx0XHRkc2NyID0gbnVsbDtcblx0fSBlbHNlIHtcblx0XHRvcHRpb25zID0gYXJndW1lbnRzWzJdO1xuXHR9XG5cdGlmIChkc2NyID09IG51bGwpIHtcblx0XHRjID0gdyA9IHRydWU7XG5cdFx0ZSA9IGZhbHNlO1xuXHR9IGVsc2Uge1xuXHRcdGMgPSBjb250YWlucy5jYWxsKGRzY3IsICdjJyk7XG5cdFx0ZSA9IGNvbnRhaW5zLmNhbGwoZHNjciwgJ2UnKTtcblx0XHR3ID0gY29udGFpbnMuY2FsbChkc2NyLCAndycpO1xuXHR9XG5cblx0ZGVzYyA9IHsgdmFsdWU6IHZhbHVlLCBjb25maWd1cmFibGU6IGMsIGVudW1lcmFibGU6IGUsIHdyaXRhYmxlOiB3IH07XG5cdHJldHVybiAhb3B0aW9ucyA/IGRlc2MgOiBhc3NpZ24obm9ybWFsaXplT3B0cyhvcHRpb25zKSwgZGVzYyk7XG59O1xuXG5kLmdzID0gZnVuY3Rpb24gKGRzY3IsIGdldCwgc2V0LyosIG9wdGlvbnMqLykge1xuXHR2YXIgYywgZSwgb3B0aW9ucywgZGVzYztcblx0aWYgKHR5cGVvZiBkc2NyICE9PSAnc3RyaW5nJykge1xuXHRcdG9wdGlvbnMgPSBzZXQ7XG5cdFx0c2V0ID0gZ2V0O1xuXHRcdGdldCA9IGRzY3I7XG5cdFx0ZHNjciA9IG51bGw7XG5cdH0gZWxzZSB7XG5cdFx0b3B0aW9ucyA9IGFyZ3VtZW50c1szXTtcblx0fVxuXHRpZiAoZ2V0ID09IG51bGwpIHtcblx0XHRnZXQgPSB1bmRlZmluZWQ7XG5cdH0gZWxzZSBpZiAoIWlzQ2FsbGFibGUoZ2V0KSkge1xuXHRcdG9wdGlvbnMgPSBnZXQ7XG5cdFx0Z2V0ID0gc2V0ID0gdW5kZWZpbmVkO1xuXHR9IGVsc2UgaWYgKHNldCA9PSBudWxsKSB7XG5cdFx0c2V0ID0gdW5kZWZpbmVkO1xuXHR9IGVsc2UgaWYgKCFpc0NhbGxhYmxlKHNldCkpIHtcblx0XHRvcHRpb25zID0gc2V0O1xuXHRcdHNldCA9IHVuZGVmaW5lZDtcblx0fVxuXHRpZiAoZHNjciA9PSBudWxsKSB7XG5cdFx0YyA9IHRydWU7XG5cdFx0ZSA9IGZhbHNlO1xuXHR9IGVsc2Uge1xuXHRcdGMgPSBjb250YWlucy5jYWxsKGRzY3IsICdjJyk7XG5cdFx0ZSA9IGNvbnRhaW5zLmNhbGwoZHNjciwgJ2UnKTtcblx0fVxuXG5cdGRlc2MgPSB7IGdldDogZ2V0LCBzZXQ6IHNldCwgY29uZmlndXJhYmxlOiBjLCBlbnVtZXJhYmxlOiBlIH07XG5cdHJldHVybiAhb3B0aW9ucyA/IGRlc2MgOiBhc3NpZ24obm9ybWFsaXplT3B0cyhvcHRpb25zKSwgZGVzYyk7XG59O1xuXG59LHtcImVzNS1leHQvb2JqZWN0L2Fzc2lnblwiOjIxLFwiZXM1LWV4dC9vYmplY3QvaXMtY2FsbGFibGVcIjoyNyxcImVzNS1leHQvb2JqZWN0L25vcm1hbGl6ZS1vcHRpb25zXCI6MzMsXCJlczUtZXh0L3N0cmluZy8jL2NvbnRhaW5zXCI6Mzl9XSwxMTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vLyBJbnNwaXJlZCBieSBHb29nbGUgQ2xvc3VyZTpcbi8vIGh0dHA6Ly9jbG9zdXJlLWxpYnJhcnkuZ29vZ2xlY29kZS5jb20vc3ZuL2RvY3MvXG4vLyBjbG9zdXJlX2dvb2dfYXJyYXlfYXJyYXkuanMuaHRtbCNnb29nLmFycmF5LmNsZWFyXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHZhbHVlID0gcmVxdWlyZSgnLi4vLi4vb2JqZWN0L3ZhbGlkLXZhbHVlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuXHR2YWx1ZSh0aGlzKS5sZW5ndGggPSAwO1xuXHRyZXR1cm4gdGhpcztcbn07XG5cbn0se1wiLi4vLi4vb2JqZWN0L3ZhbGlkLXZhbHVlXCI6Mzh9XSwxMjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciB0b1Bvc0ludCA9IHJlcXVpcmUoJy4uLy4uL251bWJlci90by1wb3MtaW50ZWdlcicpXG4gICwgdmFsdWUgICAgPSByZXF1aXJlKCcuLi8uLi9vYmplY3QvdmFsaWQtdmFsdWUnKVxuXG4gICwgaW5kZXhPZiA9IEFycmF5LnByb3RvdHlwZS5pbmRleE9mXG4gICwgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG4gICwgYWJzID0gTWF0aC5hYnMsIGZsb29yID0gTWF0aC5mbG9vcjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoc2VhcmNoRWxlbWVudC8qLCBmcm9tSW5kZXgqLykge1xuXHR2YXIgaSwgbCwgZnJvbUluZGV4LCB2YWw7XG5cdGlmIChzZWFyY2hFbGVtZW50ID09PSBzZWFyY2hFbGVtZW50KSB7IC8vanNsaW50OiBpZ25vcmVcblx0XHRyZXR1cm4gaW5kZXhPZi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHR9XG5cblx0bCA9IHRvUG9zSW50KHZhbHVlKHRoaXMpLmxlbmd0aCk7XG5cdGZyb21JbmRleCA9IGFyZ3VtZW50c1sxXTtcblx0aWYgKGlzTmFOKGZyb21JbmRleCkpIGZyb21JbmRleCA9IDA7XG5cdGVsc2UgaWYgKGZyb21JbmRleCA+PSAwKSBmcm9tSW5kZXggPSBmbG9vcihmcm9tSW5kZXgpO1xuXHRlbHNlIGZyb21JbmRleCA9IHRvUG9zSW50KHRoaXMubGVuZ3RoKSAtIGZsb29yKGFicyhmcm9tSW5kZXgpKTtcblxuXHRmb3IgKGkgPSBmcm9tSW5kZXg7IGkgPCBsOyArK2kpIHtcblx0XHRpZiAoaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLCBpKSkge1xuXHRcdFx0dmFsID0gdGhpc1tpXTtcblx0XHRcdGlmICh2YWwgIT09IHZhbCkgcmV0dXJuIGk7IC8vanNsaW50OiBpZ25vcmVcblx0XHR9XG5cdH1cblx0cmV0dXJuIC0xO1xufTtcblxufSx7XCIuLi8uLi9udW1iZXIvdG8tcG9zLWludGVnZXJcIjoxOSxcIi4uLy4uL29iamVjdC92YWxpZC12YWx1ZVwiOjM4fV0sMTM6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nXG5cbiAgLCBpZCA9IHRvU3RyaW5nLmNhbGwoKGZ1bmN0aW9uICgpIHsgcmV0dXJuIGFyZ3VtZW50czsgfSgpKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHgpIHsgcmV0dXJuICh0b1N0cmluZy5jYWxsKHgpID09PSBpZCk7IH07XG5cbn0se31dLDE0OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgRnVuY3Rpb24oXCJyZXR1cm4gdGhpc1wiKSgpO1xuXG59LHt9XSwxNTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9pcy1pbXBsZW1lbnRlZCcpKClcblx0PyBNYXRoLnNpZ25cblx0OiByZXF1aXJlKCcuL3NoaW0nKTtcblxufSx7XCIuL2lzLWltcGxlbWVudGVkXCI6MTYsXCIuL3NoaW1cIjoxN31dLDE2OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG5cdHZhciBzaWduID0gTWF0aC5zaWduO1xuXHRpZiAodHlwZW9mIHNpZ24gIT09ICdmdW5jdGlvbicpIHJldHVybiBmYWxzZTtcblx0cmV0dXJuICgoc2lnbigxMCkgPT09IDEpICYmIChzaWduKC0yMCkgPT09IC0xKSk7XG59O1xuXG59LHt9XSwxNzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdHZhbHVlID0gTnVtYmVyKHZhbHVlKTtcblx0aWYgKGlzTmFOKHZhbHVlKSB8fCAodmFsdWUgPT09IDApKSByZXR1cm4gdmFsdWU7XG5cdHJldHVybiAodmFsdWUgPiAwKSA/IDEgOiAtMTtcbn07XG5cbn0se31dLDE4OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIHNpZ24gPSByZXF1aXJlKCcuLi9tYXRoL3NpZ24nKVxuXG4gICwgYWJzID0gTWF0aC5hYnMsIGZsb29yID0gTWF0aC5mbG9vcjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAodmFsdWUpIHtcblx0aWYgKGlzTmFOKHZhbHVlKSkgcmV0dXJuIDA7XG5cdHZhbHVlID0gTnVtYmVyKHZhbHVlKTtcblx0aWYgKCh2YWx1ZSA9PT0gMCkgfHwgIWlzRmluaXRlKHZhbHVlKSkgcmV0dXJuIHZhbHVlO1xuXHRyZXR1cm4gc2lnbih2YWx1ZSkgKiBmbG9vcihhYnModmFsdWUpKTtcbn07XG5cbn0se1wiLi4vbWF0aC9zaWduXCI6MTV9XSwxOTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciB0b0ludGVnZXIgPSByZXF1aXJlKCcuL3RvLWludGVnZXInKVxuXG4gICwgbWF4ID0gTWF0aC5tYXg7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiBtYXgoMCwgdG9JbnRlZ2VyKHZhbHVlKSk7IH07XG5cbn0se1wiLi90by1pbnRlZ2VyXCI6MTh9XSwyMDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vLyBJbnRlcm5hbCBtZXRob2QsIHVzZWQgYnkgaXRlcmF0aW9uIGZ1bmN0aW9ucy5cbi8vIENhbGxzIGEgZnVuY3Rpb24gZm9yIGVhY2gga2V5LXZhbHVlIHBhaXIgZm91bmQgaW4gb2JqZWN0XG4vLyBPcHRpb25hbGx5IHRha2VzIGNvbXBhcmVGbiB0byBpdGVyYXRlIG9iamVjdCBpbiBzcGVjaWZpYyBvcmRlclxuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBjYWxsYWJsZSA9IHJlcXVpcmUoJy4vdmFsaWQtY2FsbGFibGUnKVxuICAsIHZhbHVlICAgID0gcmVxdWlyZSgnLi92YWxpZC12YWx1ZScpXG5cbiAgLCBiaW5kID0gRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQsIGNhbGwgPSBGdW5jdGlvbi5wcm90b3R5cGUuY2FsbCwga2V5cyA9IE9iamVjdC5rZXlzXG4gICwgcHJvcGVydHlJc0VudW1lcmFibGUgPSBPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChtZXRob2QsIGRlZlZhbCkge1xuXHRyZXR1cm4gZnVuY3Rpb24gKG9iaiwgY2IvKiwgdGhpc0FyZywgY29tcGFyZUZuKi8pIHtcblx0XHR2YXIgbGlzdCwgdGhpc0FyZyA9IGFyZ3VtZW50c1syXSwgY29tcGFyZUZuID0gYXJndW1lbnRzWzNdO1xuXHRcdG9iaiA9IE9iamVjdCh2YWx1ZShvYmopKTtcblx0XHRjYWxsYWJsZShjYik7XG5cblx0XHRsaXN0ID0ga2V5cyhvYmopO1xuXHRcdGlmIChjb21wYXJlRm4pIHtcblx0XHRcdGxpc3Quc29ydCgodHlwZW9mIGNvbXBhcmVGbiA9PT0gJ2Z1bmN0aW9uJykgPyBiaW5kLmNhbGwoY29tcGFyZUZuLCBvYmopIDogdW5kZWZpbmVkKTtcblx0XHR9XG5cdFx0aWYgKHR5cGVvZiBtZXRob2QgIT09ICdmdW5jdGlvbicpIG1ldGhvZCA9IGxpc3RbbWV0aG9kXTtcblx0XHRyZXR1cm4gY2FsbC5jYWxsKG1ldGhvZCwgbGlzdCwgZnVuY3Rpb24gKGtleSwgaW5kZXgpIHtcblx0XHRcdGlmICghcHJvcGVydHlJc0VudW1lcmFibGUuY2FsbChvYmosIGtleSkpIHJldHVybiBkZWZWYWw7XG5cdFx0XHRyZXR1cm4gY2FsbC5jYWxsKGNiLCB0aGlzQXJnLCBvYmpba2V5XSwga2V5LCBvYmosIGluZGV4KTtcblx0XHR9KTtcblx0fTtcbn07XG5cbn0se1wiLi92YWxpZC1jYWxsYWJsZVwiOjM3LFwiLi92YWxpZC12YWx1ZVwiOjM4fV0sMjE6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vaXMtaW1wbGVtZW50ZWQnKSgpXG5cdD8gT2JqZWN0LmFzc2lnblxuXHQ6IHJlcXVpcmUoJy4vc2hpbScpO1xuXG59LHtcIi4vaXMtaW1wbGVtZW50ZWRcIjoyMixcIi4vc2hpbVwiOjIzfV0sMjI6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIGFzc2lnbiA9IE9iamVjdC5hc3NpZ24sIG9iajtcblx0aWYgKHR5cGVvZiBhc3NpZ24gIT09ICdmdW5jdGlvbicpIHJldHVybiBmYWxzZTtcblx0b2JqID0geyBmb286ICdyYXonIH07XG5cdGFzc2lnbihvYmosIHsgYmFyOiAnZHdhJyB9LCB7IHRyenk6ICd0cnp5JyB9KTtcblx0cmV0dXJuIChvYmouZm9vICsgb2JqLmJhciArIG9iai50cnp5KSA9PT0gJ3JhemR3YXRyenknO1xufTtcblxufSx7fV0sMjM6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIga2V5cyAgPSByZXF1aXJlKCcuLi9rZXlzJylcbiAgLCB2YWx1ZSA9IHJlcXVpcmUoJy4uL3ZhbGlkLXZhbHVlJylcblxuICAsIG1heCA9IE1hdGgubWF4O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChkZXN0LCBzcmMvKiwg4oCmc3JjbiovKSB7XG5cdHZhciBlcnJvciwgaSwgbCA9IG1heChhcmd1bWVudHMubGVuZ3RoLCAyKSwgYXNzaWduO1xuXHRkZXN0ID0gT2JqZWN0KHZhbHVlKGRlc3QpKTtcblx0YXNzaWduID0gZnVuY3Rpb24gKGtleSkge1xuXHRcdHRyeSB7IGRlc3Rba2V5XSA9IHNyY1trZXldOyB9IGNhdGNoIChlKSB7XG5cdFx0XHRpZiAoIWVycm9yKSBlcnJvciA9IGU7XG5cdFx0fVxuXHR9O1xuXHRmb3IgKGkgPSAxOyBpIDwgbDsgKytpKSB7XG5cdFx0c3JjID0gYXJndW1lbnRzW2ldO1xuXHRcdGtleXMoc3JjKS5mb3JFYWNoKGFzc2lnbik7XG5cdH1cblx0aWYgKGVycm9yICE9PSB1bmRlZmluZWQpIHRocm93IGVycm9yO1xuXHRyZXR1cm4gZGVzdDtcbn07XG5cbn0se1wiLi4va2V5c1wiOjI5LFwiLi4vdmFsaWQtdmFsdWVcIjozOH1dLDI0OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIGFzc2lnbiA9IHJlcXVpcmUoJy4vYXNzaWduJylcbiAgLCB2YWx1ZSAgPSByZXF1aXJlKCcuL3ZhbGlkLXZhbHVlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9iaikge1xuXHR2YXIgY29weSA9IE9iamVjdCh2YWx1ZShvYmopKTtcblx0aWYgKGNvcHkgIT09IG9iaikgcmV0dXJuIGNvcHk7XG5cdHJldHVybiBhc3NpZ24oe30sIG9iaik7XG59O1xuXG59LHtcIi4vYXNzaWduXCI6MjEsXCIuL3ZhbGlkLXZhbHVlXCI6Mzh9XSwyNTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vLyBXb3JrYXJvdW5kIGZvciBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0yODA0XG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGNyZWF0ZSA9IE9iamVjdC5jcmVhdGUsIHNoaW07XG5cbmlmICghcmVxdWlyZSgnLi9zZXQtcHJvdG90eXBlLW9mL2lzLWltcGxlbWVudGVkJykoKSkge1xuXHRzaGltID0gcmVxdWlyZSgnLi9zZXQtcHJvdG90eXBlLW9mL3NoaW0nKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKCkge1xuXHR2YXIgbnVsbE9iamVjdCwgcHJvcHMsIGRlc2M7XG5cdGlmICghc2hpbSkgcmV0dXJuIGNyZWF0ZTtcblx0aWYgKHNoaW0ubGV2ZWwgIT09IDEpIHJldHVybiBjcmVhdGU7XG5cblx0bnVsbE9iamVjdCA9IHt9O1xuXHRwcm9wcyA9IHt9O1xuXHRkZXNjID0geyBjb25maWd1cmFibGU6IGZhbHNlLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsXG5cdFx0dmFsdWU6IHVuZGVmaW5lZCB9O1xuXHRPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhPYmplY3QucHJvdG90eXBlKS5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG5cdFx0aWYgKG5hbWUgPT09ICdfX3Byb3RvX18nKSB7XG5cdFx0XHRwcm9wc1tuYW1lXSA9IHsgY29uZmlndXJhYmxlOiB0cnVlLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsXG5cdFx0XHRcdHZhbHVlOiB1bmRlZmluZWQgfTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0cHJvcHNbbmFtZV0gPSBkZXNjO1xuXHR9KTtcblx0T2JqZWN0LmRlZmluZVByb3BlcnRpZXMobnVsbE9iamVjdCwgcHJvcHMpO1xuXG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShzaGltLCAnbnVsbFBvbHlmaWxsJywgeyBjb25maWd1cmFibGU6IGZhbHNlLFxuXHRcdGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogZmFsc2UsIHZhbHVlOiBudWxsT2JqZWN0IH0pO1xuXG5cdHJldHVybiBmdW5jdGlvbiAocHJvdG90eXBlLCBwcm9wcykge1xuXHRcdHJldHVybiBjcmVhdGUoKHByb3RvdHlwZSA9PT0gbnVsbCkgPyBudWxsT2JqZWN0IDogcHJvdG90eXBlLCBwcm9wcyk7XG5cdH07XG59KCkpO1xuXG59LHtcIi4vc2V0LXByb3RvdHlwZS1vZi9pcy1pbXBsZW1lbnRlZFwiOjM1LFwiLi9zZXQtcHJvdG90eXBlLW9mL3NoaW1cIjozNn1dLDI2OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL19pdGVyYXRlJykoJ2ZvckVhY2gnKTtcblxufSx7XCIuL19pdGVyYXRlXCI6MjB9XSwyNzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vLyBEZXByZWNhdGVkXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqID09PSAnZnVuY3Rpb24nOyB9O1xuXG59LHt9XSwyODpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBtYXAgPSB7IGZ1bmN0aW9uOiB0cnVlLCBvYmplY3Q6IHRydWUgfTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoeCkge1xuXHRyZXR1cm4gKCh4ICE9IG51bGwpICYmIG1hcFt0eXBlb2YgeF0pIHx8IGZhbHNlO1xufTtcblxufSx7fV0sMjk6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vaXMtaW1wbGVtZW50ZWQnKSgpXG5cdD8gT2JqZWN0LmtleXNcblx0OiByZXF1aXJlKCcuL3NoaW0nKTtcblxufSx7XCIuL2lzLWltcGxlbWVudGVkXCI6MzAsXCIuL3NoaW1cIjozMX1dLDMwOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG5cdHRyeSB7XG5cdFx0T2JqZWN0LmtleXMoJ3ByaW1pdGl2ZScpO1xuXHRcdHJldHVybiB0cnVlO1xuXHR9IGNhdGNoIChlKSB7IHJldHVybiBmYWxzZTsgfVxufTtcblxufSx7fV0sMzE6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIga2V5cyA9IE9iamVjdC5rZXlzO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvYmplY3QpIHtcblx0cmV0dXJuIGtleXMob2JqZWN0ID09IG51bGwgPyBvYmplY3QgOiBPYmplY3Qob2JqZWN0KSk7XG59O1xuXG59LHt9XSwzMjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBjYWxsYWJsZSA9IHJlcXVpcmUoJy4vdmFsaWQtY2FsbGFibGUnKVxuICAsIGZvckVhY2ggID0gcmVxdWlyZSgnLi9mb3ItZWFjaCcpXG5cbiAgLCBjYWxsID0gRnVuY3Rpb24ucHJvdG90eXBlLmNhbGw7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9iaiwgY2IvKiwgdGhpc0FyZyovKSB7XG5cdHZhciBvID0ge30sIHRoaXNBcmcgPSBhcmd1bWVudHNbMl07XG5cdGNhbGxhYmxlKGNiKTtcblx0Zm9yRWFjaChvYmosIGZ1bmN0aW9uICh2YWx1ZSwga2V5LCBvYmosIGluZGV4KSB7XG5cdFx0b1trZXldID0gY2FsbC5jYWxsKGNiLCB0aGlzQXJnLCB2YWx1ZSwga2V5LCBvYmosIGluZGV4KTtcblx0fSk7XG5cdHJldHVybiBvO1xufTtcblxufSx7XCIuL2Zvci1lYWNoXCI6MjYsXCIuL3ZhbGlkLWNhbGxhYmxlXCI6Mzd9XSwzMzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBmb3JFYWNoID0gQXJyYXkucHJvdG90eXBlLmZvckVhY2gsIGNyZWF0ZSA9IE9iamVjdC5jcmVhdGU7XG5cbnZhciBwcm9jZXNzID0gZnVuY3Rpb24gKHNyYywgb2JqKSB7XG5cdHZhciBrZXk7XG5cdGZvciAoa2V5IGluIHNyYykgb2JqW2tleV0gPSBzcmNba2V5XTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9wdGlvbnMvKiwg4oCmb3B0aW9ucyovKSB7XG5cdHZhciByZXN1bHQgPSBjcmVhdGUobnVsbCk7XG5cdGZvckVhY2guY2FsbChhcmd1bWVudHMsIGZ1bmN0aW9uIChvcHRpb25zKSB7XG5cdFx0aWYgKG9wdGlvbnMgPT0gbnVsbCkgcmV0dXJuO1xuXHRcdHByb2Nlc3MoT2JqZWN0KG9wdGlvbnMpLCByZXN1bHQpO1xuXHR9KTtcblx0cmV0dXJuIHJlc3VsdDtcbn07XG5cbn0se31dLDM0OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2lzLWltcGxlbWVudGVkJykoKVxuXHQ/IE9iamVjdC5zZXRQcm90b3R5cGVPZlxuXHQ6IHJlcXVpcmUoJy4vc2hpbScpO1xuXG59LHtcIi4vaXMtaW1wbGVtZW50ZWRcIjozNSxcIi4vc2hpbVwiOjM2fV0sMzU6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgY3JlYXRlID0gT2JqZWN0LmNyZWF0ZSwgZ2V0UHJvdG90eXBlT2YgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2ZcbiAgLCB4ID0ge307XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKC8qY3VzdG9tQ3JlYXRlKi8pIHtcblx0dmFyIHNldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mXG5cdCAgLCBjdXN0b21DcmVhdGUgPSBhcmd1bWVudHNbMF0gfHwgY3JlYXRlO1xuXHRpZiAodHlwZW9mIHNldFByb3RvdHlwZU9mICE9PSAnZnVuY3Rpb24nKSByZXR1cm4gZmFsc2U7XG5cdHJldHVybiBnZXRQcm90b3R5cGVPZihzZXRQcm90b3R5cGVPZihjdXN0b21DcmVhdGUobnVsbCksIHgpKSA9PT0geDtcbn07XG5cbn0se31dLDM2OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbi8vIEJpZyB0aGFua3MgdG8gQFdlYlJlZmxlY3Rpb24gZm9yIHNvcnRpbmcgdGhpcyBvdXRcbi8vIGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL1dlYlJlZmxlY3Rpb24vNTU5MzU1NFxuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBpc09iamVjdCAgICAgID0gcmVxdWlyZSgnLi4vaXMtb2JqZWN0JylcbiAgLCB2YWx1ZSAgICAgICAgID0gcmVxdWlyZSgnLi4vdmFsaWQtdmFsdWUnKVxuXG4gICwgaXNQcm90b3R5cGVPZiA9IE9iamVjdC5wcm90b3R5cGUuaXNQcm90b3R5cGVPZlxuICAsIGRlZmluZVByb3BlcnR5ID0gT2JqZWN0LmRlZmluZVByb3BlcnR5XG4gICwgbnVsbERlc2MgPSB7IGNvbmZpZ3VyYWJsZTogdHJ1ZSwgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiB0cnVlLFxuXHRcdHZhbHVlOiB1bmRlZmluZWQgfVxuICAsIHZhbGlkYXRlO1xuXG52YWxpZGF0ZSA9IGZ1bmN0aW9uIChvYmosIHByb3RvdHlwZSkge1xuXHR2YWx1ZShvYmopO1xuXHRpZiAoKHByb3RvdHlwZSA9PT0gbnVsbCkgfHwgaXNPYmplY3QocHJvdG90eXBlKSkgcmV0dXJuIG9iajtcblx0dGhyb3cgbmV3IFR5cGVFcnJvcignUHJvdG90eXBlIG11c3QgYmUgbnVsbCBvciBhbiBvYmplY3QnKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uIChzdGF0dXMpIHtcblx0dmFyIGZuLCBzZXQ7XG5cdGlmICghc3RhdHVzKSByZXR1cm4gbnVsbDtcblx0aWYgKHN0YXR1cy5sZXZlbCA9PT0gMikge1xuXHRcdGlmIChzdGF0dXMuc2V0KSB7XG5cdFx0XHRzZXQgPSBzdGF0dXMuc2V0O1xuXHRcdFx0Zm4gPSBmdW5jdGlvbiAob2JqLCBwcm90b3R5cGUpIHtcblx0XHRcdFx0c2V0LmNhbGwodmFsaWRhdGUob2JqLCBwcm90b3R5cGUpLCBwcm90b3R5cGUpO1xuXHRcdFx0XHRyZXR1cm4gb2JqO1xuXHRcdFx0fTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Zm4gPSBmdW5jdGlvbiAob2JqLCBwcm90b3R5cGUpIHtcblx0XHRcdFx0dmFsaWRhdGUob2JqLCBwcm90b3R5cGUpLl9fcHJvdG9fXyA9IHByb3RvdHlwZTtcblx0XHRcdFx0cmV0dXJuIG9iajtcblx0XHRcdH07XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdGZuID0gZnVuY3Rpb24gc2VsZihvYmosIHByb3RvdHlwZSkge1xuXHRcdFx0dmFyIGlzTnVsbEJhc2U7XG5cdFx0XHR2YWxpZGF0ZShvYmosIHByb3RvdHlwZSk7XG5cdFx0XHRpc051bGxCYXNlID0gaXNQcm90b3R5cGVPZi5jYWxsKHNlbGYubnVsbFBvbHlmaWxsLCBvYmopO1xuXHRcdFx0aWYgKGlzTnVsbEJhc2UpIGRlbGV0ZSBzZWxmLm51bGxQb2x5ZmlsbC5fX3Byb3RvX187XG5cdFx0XHRpZiAocHJvdG90eXBlID09PSBudWxsKSBwcm90b3R5cGUgPSBzZWxmLm51bGxQb2x5ZmlsbDtcblx0XHRcdG9iai5fX3Byb3RvX18gPSBwcm90b3R5cGU7XG5cdFx0XHRpZiAoaXNOdWxsQmFzZSkgZGVmaW5lUHJvcGVydHkoc2VsZi5udWxsUG9seWZpbGwsICdfX3Byb3RvX18nLCBudWxsRGVzYyk7XG5cdFx0XHRyZXR1cm4gb2JqO1xuXHRcdH07XG5cdH1cblx0cmV0dXJuIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShmbiwgJ2xldmVsJywgeyBjb25maWd1cmFibGU6IGZhbHNlLFxuXHRcdGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogZmFsc2UsIHZhbHVlOiBzdGF0dXMubGV2ZWwgfSk7XG59KChmdW5jdGlvbiAoKSB7XG5cdHZhciB4ID0gT2JqZWN0LmNyZWF0ZShudWxsKSwgeSA9IHt9LCBzZXRcblx0ICAsIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKE9iamVjdC5wcm90b3R5cGUsICdfX3Byb3RvX18nKTtcblxuXHRpZiAoZGVzYykge1xuXHRcdHRyeSB7XG5cdFx0XHRzZXQgPSBkZXNjLnNldDsgLy8gT3BlcmEgY3Jhc2hlcyBhdCB0aGlzIHBvaW50XG5cdFx0XHRzZXQuY2FsbCh4LCB5KTtcblx0XHR9IGNhdGNoIChpZ25vcmUpIHsgfVxuXHRcdGlmIChPYmplY3QuZ2V0UHJvdG90eXBlT2YoeCkgPT09IHkpIHJldHVybiB7IHNldDogc2V0LCBsZXZlbDogMiB9O1xuXHR9XG5cblx0eC5fX3Byb3RvX18gPSB5O1xuXHRpZiAoT2JqZWN0LmdldFByb3RvdHlwZU9mKHgpID09PSB5KSByZXR1cm4geyBsZXZlbDogMiB9O1xuXG5cdHggPSB7fTtcblx0eC5fX3Byb3RvX18gPSB5O1xuXHRpZiAoT2JqZWN0LmdldFByb3RvdHlwZU9mKHgpID09PSB5KSByZXR1cm4geyBsZXZlbDogMSB9O1xuXG5cdHJldHVybiBmYWxzZTtcbn0oKSkpKTtcblxucmVxdWlyZSgnLi4vY3JlYXRlJyk7XG5cbn0se1wiLi4vY3JlYXRlXCI6MjUsXCIuLi9pcy1vYmplY3RcIjoyOCxcIi4uL3ZhbGlkLXZhbHVlXCI6Mzh9XSwzNzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGZuKSB7XG5cdGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHRocm93IG5ldyBUeXBlRXJyb3IoZm4gKyBcIiBpcyBub3QgYSBmdW5jdGlvblwiKTtcblx0cmV0dXJuIGZuO1xufTtcblxufSx7fV0sMzg6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHRpZiAodmFsdWUgPT0gbnVsbCkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCB1c2UgbnVsbCBvciB1bmRlZmluZWRcIik7XG5cdHJldHVybiB2YWx1ZTtcbn07XG5cbn0se31dLDM5OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2lzLWltcGxlbWVudGVkJykoKVxuXHQ/IFN0cmluZy5wcm90b3R5cGUuY29udGFpbnNcblx0OiByZXF1aXJlKCcuL3NoaW0nKTtcblxufSx7XCIuL2lzLWltcGxlbWVudGVkXCI6NDAsXCIuL3NoaW1cIjo0MX1dLDQwOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIHN0ciA9ICdyYXpkd2F0cnp5JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG5cdGlmICh0eXBlb2Ygc3RyLmNvbnRhaW5zICE9PSAnZnVuY3Rpb24nKSByZXR1cm4gZmFsc2U7XG5cdHJldHVybiAoKHN0ci5jb250YWlucygnZHdhJykgPT09IHRydWUpICYmIChzdHIuY29udGFpbnMoJ2ZvbycpID09PSBmYWxzZSkpO1xufTtcblxufSx7fV0sNDE6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgaW5kZXhPZiA9IFN0cmluZy5wcm90b3R5cGUuaW5kZXhPZjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoc2VhcmNoU3RyaW5nLyosIHBvc2l0aW9uKi8pIHtcblx0cmV0dXJuIGluZGV4T2YuY2FsbCh0aGlzLCBzZWFyY2hTdHJpbmcsIGFyZ3VtZW50c1sxXSkgPiAtMTtcbn07XG5cbn0se31dLDQyOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZ1xuXG4gICwgaWQgPSB0b1N0cmluZy5jYWxsKCcnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoeCkge1xuXHRyZXR1cm4gKHR5cGVvZiB4ID09PSAnc3RyaW5nJykgfHwgKHggJiYgKHR5cGVvZiB4ID09PSAnb2JqZWN0JykgJiZcblx0XHQoKHggaW5zdGFuY2VvZiBTdHJpbmcpIHx8ICh0b1N0cmluZy5jYWxsKHgpID09PSBpZCkpKSB8fCBmYWxzZTtcbn07XG5cbn0se31dLDQzOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIHNldFByb3RvdHlwZU9mID0gcmVxdWlyZSgnZXM1LWV4dC9vYmplY3Qvc2V0LXByb3RvdHlwZS1vZicpXG4gICwgY29udGFpbnMgICAgICAgPSByZXF1aXJlKCdlczUtZXh0L3N0cmluZy8jL2NvbnRhaW5zJylcbiAgLCBkICAgICAgICAgICAgICA9IHJlcXVpcmUoJ2QnKVxuICAsIEl0ZXJhdG9yICAgICAgID0gcmVxdWlyZSgnLi8nKVxuXG4gICwgZGVmaW5lUHJvcGVydHkgPSBPYmplY3QuZGVmaW5lUHJvcGVydHlcbiAgLCBBcnJheUl0ZXJhdG9yO1xuXG5BcnJheUl0ZXJhdG9yID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYXJyLCBraW5kKSB7XG5cdGlmICghKHRoaXMgaW5zdGFuY2VvZiBBcnJheUl0ZXJhdG9yKSkgcmV0dXJuIG5ldyBBcnJheUl0ZXJhdG9yKGFyciwga2luZCk7XG5cdEl0ZXJhdG9yLmNhbGwodGhpcywgYXJyKTtcblx0aWYgKCFraW5kKSBraW5kID0gJ3ZhbHVlJztcblx0ZWxzZSBpZiAoY29udGFpbnMuY2FsbChraW5kLCAna2V5K3ZhbHVlJykpIGtpbmQgPSAna2V5K3ZhbHVlJztcblx0ZWxzZSBpZiAoY29udGFpbnMuY2FsbChraW5kLCAna2V5JykpIGtpbmQgPSAna2V5Jztcblx0ZWxzZSBraW5kID0gJ3ZhbHVlJztcblx0ZGVmaW5lUHJvcGVydHkodGhpcywgJ19fa2luZF9fJywgZCgnJywga2luZCkpO1xufTtcbmlmIChzZXRQcm90b3R5cGVPZikgc2V0UHJvdG90eXBlT2YoQXJyYXlJdGVyYXRvciwgSXRlcmF0b3IpO1xuXG5BcnJheUl0ZXJhdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSXRlcmF0b3IucHJvdG90eXBlLCB7XG5cdGNvbnN0cnVjdG9yOiBkKEFycmF5SXRlcmF0b3IpLFxuXHRfcmVzb2x2ZTogZChmdW5jdGlvbiAoaSkge1xuXHRcdGlmICh0aGlzLl9fa2luZF9fID09PSAndmFsdWUnKSByZXR1cm4gdGhpcy5fX2xpc3RfX1tpXTtcblx0XHRpZiAodGhpcy5fX2tpbmRfXyA9PT0gJ2tleSt2YWx1ZScpIHJldHVybiBbaSwgdGhpcy5fX2xpc3RfX1tpXV07XG5cdFx0cmV0dXJuIGk7XG5cdH0pLFxuXHR0b1N0cmluZzogZChmdW5jdGlvbiAoKSB7IHJldHVybiAnW29iamVjdCBBcnJheSBJdGVyYXRvcl0nOyB9KVxufSk7XG5cbn0se1wiLi9cIjo0NixcImRcIjoxMCxcImVzNS1leHQvb2JqZWN0L3NldC1wcm90b3R5cGUtb2ZcIjozNCxcImVzNS1leHQvc3RyaW5nLyMvY29udGFpbnNcIjozOX1dLDQ0OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIGlzQXJndW1lbnRzID0gcmVxdWlyZSgnZXM1LWV4dC9mdW5jdGlvbi9pcy1hcmd1bWVudHMnKVxuICAsIGNhbGxhYmxlICAgID0gcmVxdWlyZSgnZXM1LWV4dC9vYmplY3QvdmFsaWQtY2FsbGFibGUnKVxuICAsIGlzU3RyaW5nICAgID0gcmVxdWlyZSgnZXM1LWV4dC9zdHJpbmcvaXMtc3RyaW5nJylcbiAgLCBnZXQgICAgICAgICA9IHJlcXVpcmUoJy4vZ2V0JylcblxuICAsIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5LCBjYWxsID0gRnVuY3Rpb24ucHJvdG90eXBlLmNhbGxcbiAgLCBzb21lID0gQXJyYXkucHJvdG90eXBlLnNvbWU7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGl0ZXJhYmxlLCBjYi8qLCB0aGlzQXJnKi8pIHtcblx0dmFyIG1vZGUsIHRoaXNBcmcgPSBhcmd1bWVudHNbMl0sIHJlc3VsdCwgZG9CcmVhaywgYnJva2VuLCBpLCBsLCBjaGFyLCBjb2RlO1xuXHRpZiAoaXNBcnJheShpdGVyYWJsZSkgfHwgaXNBcmd1bWVudHMoaXRlcmFibGUpKSBtb2RlID0gJ2FycmF5Jztcblx0ZWxzZSBpZiAoaXNTdHJpbmcoaXRlcmFibGUpKSBtb2RlID0gJ3N0cmluZyc7XG5cdGVsc2UgaXRlcmFibGUgPSBnZXQoaXRlcmFibGUpO1xuXG5cdGNhbGxhYmxlKGNiKTtcblx0ZG9CcmVhayA9IGZ1bmN0aW9uICgpIHsgYnJva2VuID0gdHJ1ZTsgfTtcblx0aWYgKG1vZGUgPT09ICdhcnJheScpIHtcblx0XHRzb21lLmNhbGwoaXRlcmFibGUsIGZ1bmN0aW9uICh2YWx1ZSkge1xuXHRcdFx0Y2FsbC5jYWxsKGNiLCB0aGlzQXJnLCB2YWx1ZSwgZG9CcmVhayk7XG5cdFx0XHRpZiAoYnJva2VuKSByZXR1cm4gdHJ1ZTtcblx0XHR9KTtcblx0XHRyZXR1cm47XG5cdH1cblx0aWYgKG1vZGUgPT09ICdzdHJpbmcnKSB7XG5cdFx0bCA9IGl0ZXJhYmxlLmxlbmd0aDtcblx0XHRmb3IgKGkgPSAwOyBpIDwgbDsgKytpKSB7XG5cdFx0XHRjaGFyID0gaXRlcmFibGVbaV07XG5cdFx0XHRpZiAoKGkgKyAxKSA8IGwpIHtcblx0XHRcdFx0Y29kZSA9IGNoYXIuY2hhckNvZGVBdCgwKTtcblx0XHRcdFx0aWYgKChjb2RlID49IDB4RDgwMCkgJiYgKGNvZGUgPD0gMHhEQkZGKSkgY2hhciArPSBpdGVyYWJsZVsrK2ldO1xuXHRcdFx0fVxuXHRcdFx0Y2FsbC5jYWxsKGNiLCB0aGlzQXJnLCBjaGFyLCBkb0JyZWFrKTtcblx0XHRcdGlmIChicm9rZW4pIGJyZWFrO1xuXHRcdH1cblx0XHRyZXR1cm47XG5cdH1cblx0cmVzdWx0ID0gaXRlcmFibGUubmV4dCgpO1xuXG5cdHdoaWxlICghcmVzdWx0LmRvbmUpIHtcblx0XHRjYWxsLmNhbGwoY2IsIHRoaXNBcmcsIHJlc3VsdC52YWx1ZSwgZG9CcmVhayk7XG5cdFx0aWYgKGJyb2tlbikgcmV0dXJuO1xuXHRcdHJlc3VsdCA9IGl0ZXJhYmxlLm5leHQoKTtcblx0fVxufTtcblxufSx7XCIuL2dldFwiOjQ1LFwiZXM1LWV4dC9mdW5jdGlvbi9pcy1hcmd1bWVudHNcIjoxMyxcImVzNS1leHQvb2JqZWN0L3ZhbGlkLWNhbGxhYmxlXCI6MzcsXCJlczUtZXh0L3N0cmluZy9pcy1zdHJpbmdcIjo0Mn1dLDQ1OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIGlzQXJndW1lbnRzICAgID0gcmVxdWlyZSgnZXM1LWV4dC9mdW5jdGlvbi9pcy1hcmd1bWVudHMnKVxuICAsIGlzU3RyaW5nICAgICAgID0gcmVxdWlyZSgnZXM1LWV4dC9zdHJpbmcvaXMtc3RyaW5nJylcbiAgLCBBcnJheUl0ZXJhdG9yICA9IHJlcXVpcmUoJy4vYXJyYXknKVxuICAsIFN0cmluZ0l0ZXJhdG9yID0gcmVxdWlyZSgnLi9zdHJpbmcnKVxuICAsIGl0ZXJhYmxlICAgICAgID0gcmVxdWlyZSgnLi92YWxpZC1pdGVyYWJsZScpXG4gICwgaXRlcmF0b3JTeW1ib2wgPSByZXF1aXJlKCdlczYtc3ltYm9sJykuaXRlcmF0b3I7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9iaikge1xuXHRpZiAodHlwZW9mIGl0ZXJhYmxlKG9iailbaXRlcmF0b3JTeW1ib2xdID09PSAnZnVuY3Rpb24nKSByZXR1cm4gb2JqW2l0ZXJhdG9yU3ltYm9sXSgpO1xuXHRpZiAoaXNBcmd1bWVudHMob2JqKSkgcmV0dXJuIG5ldyBBcnJheUl0ZXJhdG9yKG9iaik7XG5cdGlmIChpc1N0cmluZyhvYmopKSByZXR1cm4gbmV3IFN0cmluZ0l0ZXJhdG9yKG9iaik7XG5cdHJldHVybiBuZXcgQXJyYXlJdGVyYXRvcihvYmopO1xufTtcblxufSx7XCIuL2FycmF5XCI6NDMsXCIuL3N0cmluZ1wiOjQ4LFwiLi92YWxpZC1pdGVyYWJsZVwiOjQ5LFwiZXM1LWV4dC9mdW5jdGlvbi9pcy1hcmd1bWVudHNcIjoxMyxcImVzNS1leHQvc3RyaW5nL2lzLXN0cmluZ1wiOjQyLFwiZXM2LXN5bWJvbFwiOjU2fV0sNDY6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2xlYXIgICAgPSByZXF1aXJlKCdlczUtZXh0L2FycmF5LyMvY2xlYXInKVxuICAsIGFzc2lnbiAgID0gcmVxdWlyZSgnZXM1LWV4dC9vYmplY3QvYXNzaWduJylcbiAgLCBjYWxsYWJsZSA9IHJlcXVpcmUoJ2VzNS1leHQvb2JqZWN0L3ZhbGlkLWNhbGxhYmxlJylcbiAgLCB2YWx1ZSAgICA9IHJlcXVpcmUoJ2VzNS1leHQvb2JqZWN0L3ZhbGlkLXZhbHVlJylcbiAgLCBkICAgICAgICA9IHJlcXVpcmUoJ2QnKVxuICAsIGF1dG9CaW5kID0gcmVxdWlyZSgnZC9hdXRvLWJpbmQnKVxuICAsIFN5bWJvbCAgID0gcmVxdWlyZSgnZXM2LXN5bWJvbCcpXG5cbiAgLCBkZWZpbmVQcm9wZXJ0eSA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eVxuICAsIGRlZmluZVByb3BlcnRpZXMgPSBPYmplY3QuZGVmaW5lUHJvcGVydGllc1xuICAsIEl0ZXJhdG9yO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEl0ZXJhdG9yID0gZnVuY3Rpb24gKGxpc3QsIGNvbnRleHQpIHtcblx0aWYgKCEodGhpcyBpbnN0YW5jZW9mIEl0ZXJhdG9yKSkgcmV0dXJuIG5ldyBJdGVyYXRvcihsaXN0LCBjb250ZXh0KTtcblx0ZGVmaW5lUHJvcGVydGllcyh0aGlzLCB7XG5cdFx0X19saXN0X186IGQoJ3cnLCB2YWx1ZShsaXN0KSksXG5cdFx0X19jb250ZXh0X186IGQoJ3cnLCBjb250ZXh0KSxcblx0XHRfX25leHRJbmRleF9fOiBkKCd3JywgMClcblx0fSk7XG5cdGlmICghY29udGV4dCkgcmV0dXJuO1xuXHRjYWxsYWJsZShjb250ZXh0Lm9uKTtcblx0Y29udGV4dC5vbignX2FkZCcsIHRoaXMuX29uQWRkKTtcblx0Y29udGV4dC5vbignX2RlbGV0ZScsIHRoaXMuX29uRGVsZXRlKTtcblx0Y29udGV4dC5vbignX2NsZWFyJywgdGhpcy5fb25DbGVhcik7XG59O1xuXG5kZWZpbmVQcm9wZXJ0aWVzKEl0ZXJhdG9yLnByb3RvdHlwZSwgYXNzaWduKHtcblx0Y29uc3RydWN0b3I6IGQoSXRlcmF0b3IpLFxuXHRfbmV4dDogZChmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGk7XG5cdFx0aWYgKCF0aGlzLl9fbGlzdF9fKSByZXR1cm47XG5cdFx0aWYgKHRoaXMuX19yZWRvX18pIHtcblx0XHRcdGkgPSB0aGlzLl9fcmVkb19fLnNoaWZ0KCk7XG5cdFx0XHRpZiAoaSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gaTtcblx0XHR9XG5cdFx0aWYgKHRoaXMuX19uZXh0SW5kZXhfXyA8IHRoaXMuX19saXN0X18ubGVuZ3RoKSByZXR1cm4gdGhpcy5fX25leHRJbmRleF9fKys7XG5cdFx0dGhpcy5fdW5CaW5kKCk7XG5cdH0pLFxuXHRuZXh0OiBkKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMuX2NyZWF0ZVJlc3VsdCh0aGlzLl9uZXh0KCkpOyB9KSxcblx0X2NyZWF0ZVJlc3VsdDogZChmdW5jdGlvbiAoaSkge1xuXHRcdGlmIChpID09PSB1bmRlZmluZWQpIHJldHVybiB7IGRvbmU6IHRydWUsIHZhbHVlOiB1bmRlZmluZWQgfTtcblx0XHRyZXR1cm4geyBkb25lOiBmYWxzZSwgdmFsdWU6IHRoaXMuX3Jlc29sdmUoaSkgfTtcblx0fSksXG5cdF9yZXNvbHZlOiBkKGZ1bmN0aW9uIChpKSB7IHJldHVybiB0aGlzLl9fbGlzdF9fW2ldOyB9KSxcblx0X3VuQmluZDogZChmdW5jdGlvbiAoKSB7XG5cdFx0dGhpcy5fX2xpc3RfXyA9IG51bGw7XG5cdFx0ZGVsZXRlIHRoaXMuX19yZWRvX187XG5cdFx0aWYgKCF0aGlzLl9fY29udGV4dF9fKSByZXR1cm47XG5cdFx0dGhpcy5fX2NvbnRleHRfXy5vZmYoJ19hZGQnLCB0aGlzLl9vbkFkZCk7XG5cdFx0dGhpcy5fX2NvbnRleHRfXy5vZmYoJ19kZWxldGUnLCB0aGlzLl9vbkRlbGV0ZSk7XG5cdFx0dGhpcy5fX2NvbnRleHRfXy5vZmYoJ19jbGVhcicsIHRoaXMuX29uQ2xlYXIpO1xuXHRcdHRoaXMuX19jb250ZXh0X18gPSBudWxsO1xuXHR9KSxcblx0dG9TdHJpbmc6IGQoZnVuY3Rpb24gKCkgeyByZXR1cm4gJ1tvYmplY3QgSXRlcmF0b3JdJzsgfSlcbn0sIGF1dG9CaW5kKHtcblx0X29uQWRkOiBkKGZ1bmN0aW9uIChpbmRleCkge1xuXHRcdGlmIChpbmRleCA+PSB0aGlzLl9fbmV4dEluZGV4X18pIHJldHVybjtcblx0XHQrK3RoaXMuX19uZXh0SW5kZXhfXztcblx0XHRpZiAoIXRoaXMuX19yZWRvX18pIHtcblx0XHRcdGRlZmluZVByb3BlcnR5KHRoaXMsICdfX3JlZG9fXycsIGQoJ2MnLCBbaW5kZXhdKSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHRoaXMuX19yZWRvX18uZm9yRWFjaChmdW5jdGlvbiAocmVkbywgaSkge1xuXHRcdFx0aWYgKHJlZG8gPj0gaW5kZXgpIHRoaXMuX19yZWRvX19baV0gPSArK3JlZG87XG5cdFx0fSwgdGhpcyk7XG5cdFx0dGhpcy5fX3JlZG9fXy5wdXNoKGluZGV4KTtcblx0fSksXG5cdF9vbkRlbGV0ZTogZChmdW5jdGlvbiAoaW5kZXgpIHtcblx0XHR2YXIgaTtcblx0XHRpZiAoaW5kZXggPj0gdGhpcy5fX25leHRJbmRleF9fKSByZXR1cm47XG5cdFx0LS10aGlzLl9fbmV4dEluZGV4X187XG5cdFx0aWYgKCF0aGlzLl9fcmVkb19fKSByZXR1cm47XG5cdFx0aSA9IHRoaXMuX19yZWRvX18uaW5kZXhPZihpbmRleCk7XG5cdFx0aWYgKGkgIT09IC0xKSB0aGlzLl9fcmVkb19fLnNwbGljZShpLCAxKTtcblx0XHR0aGlzLl9fcmVkb19fLmZvckVhY2goZnVuY3Rpb24gKHJlZG8sIGkpIHtcblx0XHRcdGlmIChyZWRvID4gaW5kZXgpIHRoaXMuX19yZWRvX19baV0gPSAtLXJlZG87XG5cdFx0fSwgdGhpcyk7XG5cdH0pLFxuXHRfb25DbGVhcjogZChmdW5jdGlvbiAoKSB7XG5cdFx0aWYgKHRoaXMuX19yZWRvX18pIGNsZWFyLmNhbGwodGhpcy5fX3JlZG9fXyk7XG5cdFx0dGhpcy5fX25leHRJbmRleF9fID0gMDtcblx0fSlcbn0pKSk7XG5cbmRlZmluZVByb3BlcnR5KEl0ZXJhdG9yLnByb3RvdHlwZSwgU3ltYm9sLml0ZXJhdG9yLCBkKGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIHRoaXM7XG59KSk7XG5kZWZpbmVQcm9wZXJ0eShJdGVyYXRvci5wcm90b3R5cGUsIFN5bWJvbC50b1N0cmluZ1RhZywgZCgnJywgJ0l0ZXJhdG9yJykpO1xuXG59LHtcImRcIjoxMCxcImQvYXV0by1iaW5kXCI6OSxcImVzNS1leHQvYXJyYXkvIy9jbGVhclwiOjExLFwiZXM1LWV4dC9vYmplY3QvYXNzaWduXCI6MjEsXCJlczUtZXh0L29iamVjdC92YWxpZC1jYWxsYWJsZVwiOjM3LFwiZXM1LWV4dC9vYmplY3QvdmFsaWQtdmFsdWVcIjozOCxcImVzNi1zeW1ib2xcIjo1Nn1dLDQ3OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIGlzQXJndW1lbnRzICAgID0gcmVxdWlyZSgnZXM1LWV4dC9mdW5jdGlvbi9pcy1hcmd1bWVudHMnKVxuICAsIGlzU3RyaW5nICAgICAgID0gcmVxdWlyZSgnZXM1LWV4dC9zdHJpbmcvaXMtc3RyaW5nJylcbiAgLCBpdGVyYXRvclN5bWJvbCA9IHJlcXVpcmUoJ2VzNi1zeW1ib2wnKS5pdGVyYXRvclxuXG4gICwgaXNBcnJheSA9IEFycmF5LmlzQXJyYXk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gZmFsc2U7XG5cdGlmIChpc0FycmF5KHZhbHVlKSkgcmV0dXJuIHRydWU7XG5cdGlmIChpc1N0cmluZyh2YWx1ZSkpIHJldHVybiB0cnVlO1xuXHRpZiAoaXNBcmd1bWVudHModmFsdWUpKSByZXR1cm4gdHJ1ZTtcblx0cmV0dXJuICh0eXBlb2YgdmFsdWVbaXRlcmF0b3JTeW1ib2xdID09PSAnZnVuY3Rpb24nKTtcbn07XG5cbn0se1wiZXM1LWV4dC9mdW5jdGlvbi9pcy1hcmd1bWVudHNcIjoxMyxcImVzNS1leHQvc3RyaW5nL2lzLXN0cmluZ1wiOjQyLFwiZXM2LXN5bWJvbFwiOjU2fV0sNDg6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLy8gVGhhbmtzIEBtYXRoaWFzYnluZW5zXG4vLyBodHRwOi8vbWF0aGlhc2J5bmVucy5iZS9ub3Rlcy9qYXZhc2NyaXB0LXVuaWNvZGUjaXRlcmF0aW5nLW92ZXItc3ltYm9sc1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBzZXRQcm90b3R5cGVPZiA9IHJlcXVpcmUoJ2VzNS1leHQvb2JqZWN0L3NldC1wcm90b3R5cGUtb2YnKVxuICAsIGQgICAgICAgICAgICAgID0gcmVxdWlyZSgnZCcpXG4gICwgSXRlcmF0b3IgICAgICAgPSByZXF1aXJlKCcuLycpXG5cbiAgLCBkZWZpbmVQcm9wZXJ0eSA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eVxuICAsIFN0cmluZ0l0ZXJhdG9yO1xuXG5TdHJpbmdJdGVyYXRvciA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHN0cikge1xuXHRpZiAoISh0aGlzIGluc3RhbmNlb2YgU3RyaW5nSXRlcmF0b3IpKSByZXR1cm4gbmV3IFN0cmluZ0l0ZXJhdG9yKHN0cik7XG5cdHN0ciA9IFN0cmluZyhzdHIpO1xuXHRJdGVyYXRvci5jYWxsKHRoaXMsIHN0cik7XG5cdGRlZmluZVByb3BlcnR5KHRoaXMsICdfX2xlbmd0aF9fJywgZCgnJywgc3RyLmxlbmd0aCkpO1xuXG59O1xuaWYgKHNldFByb3RvdHlwZU9mKSBzZXRQcm90b3R5cGVPZihTdHJpbmdJdGVyYXRvciwgSXRlcmF0b3IpO1xuXG5TdHJpbmdJdGVyYXRvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEl0ZXJhdG9yLnByb3RvdHlwZSwge1xuXHRjb25zdHJ1Y3RvcjogZChTdHJpbmdJdGVyYXRvciksXG5cdF9uZXh0OiBkKGZ1bmN0aW9uICgpIHtcblx0XHRpZiAoIXRoaXMuX19saXN0X18pIHJldHVybjtcblx0XHRpZiAodGhpcy5fX25leHRJbmRleF9fIDwgdGhpcy5fX2xlbmd0aF9fKSByZXR1cm4gdGhpcy5fX25leHRJbmRleF9fKys7XG5cdFx0dGhpcy5fdW5CaW5kKCk7XG5cdH0pLFxuXHRfcmVzb2x2ZTogZChmdW5jdGlvbiAoaSkge1xuXHRcdHZhciBjaGFyID0gdGhpcy5fX2xpc3RfX1tpXSwgY29kZTtcblx0XHRpZiAodGhpcy5fX25leHRJbmRleF9fID09PSB0aGlzLl9fbGVuZ3RoX18pIHJldHVybiBjaGFyO1xuXHRcdGNvZGUgPSBjaGFyLmNoYXJDb2RlQXQoMCk7XG5cdFx0aWYgKChjb2RlID49IDB4RDgwMCkgJiYgKGNvZGUgPD0gMHhEQkZGKSkgcmV0dXJuIGNoYXIgKyB0aGlzLl9fbGlzdF9fW3RoaXMuX19uZXh0SW5kZXhfXysrXTtcblx0XHRyZXR1cm4gY2hhcjtcblx0fSksXG5cdHRvU3RyaW5nOiBkKGZ1bmN0aW9uICgpIHsgcmV0dXJuICdbb2JqZWN0IFN0cmluZyBJdGVyYXRvcl0nOyB9KVxufSk7XG5cbn0se1wiLi9cIjo0NixcImRcIjoxMCxcImVzNS1leHQvb2JqZWN0L3NldC1wcm90b3R5cGUtb2ZcIjozNH1dLDQ5OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIGlzSXRlcmFibGUgPSByZXF1aXJlKCcuL2lzLWl0ZXJhYmxlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdGlmICghaXNJdGVyYWJsZSh2YWx1ZSkpIHRocm93IG5ldyBUeXBlRXJyb3IodmFsdWUgKyBcIiBpcyBub3QgaXRlcmFibGVcIik7XG5cdHJldHVybiB2YWx1ZTtcbn07XG5cbn0se1wiLi9pcy1pdGVyYWJsZVwiOjQ3fV0sNTA6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCl7XG4vKiFcbiAqIEBvdmVydmlldyBlczYtcHJvbWlzZSAtIGEgdGlueSBpbXBsZW1lbnRhdGlvbiBvZiBQcm9taXNlcy9BKy5cbiAqIEBjb3B5cmlnaHQgQ29weXJpZ2h0IChjKSAyMDE0IFllaHVkYSBLYXR6LCBUb20gRGFsZSwgU3RlZmFuIFBlbm5lciBhbmQgY29udHJpYnV0b3JzIChDb252ZXJzaW9uIHRvIEVTNiBBUEkgYnkgSmFrZSBBcmNoaWJhbGQpXG4gKiBAbGljZW5zZSAgIExpY2Vuc2VkIHVuZGVyIE1JVCBsaWNlbnNlXG4gKiAgICAgICAgICAgIFNlZSBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vamFrZWFyY2hpYmFsZC9lczYtcHJvbWlzZS9tYXN0ZXIvTElDRU5TRVxuICogQHZlcnNpb24gICAzLjAuMlxuICovXG5cbihmdW5jdGlvbigpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkdXRpbHMkJG9iamVjdE9yRnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuIHR5cGVvZiB4ID09PSAnZnVuY3Rpb24nIHx8ICh0eXBlb2YgeCA9PT0gJ29iamVjdCcgJiYgeCAhPT0gbnVsbCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc0Z1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiB0eXBlb2YgeCA9PT0gJ2Z1bmN0aW9uJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzTWF5YmVUaGVuYWJsZSh4KSB7XG4gICAgICByZXR1cm4gdHlwZW9mIHggPT09ICdvYmplY3QnICYmIHggIT09IG51bGw7XG4gICAgfVxuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSR1dGlscyQkX2lzQXJyYXk7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkdXRpbHMkJF9pc0FycmF5ID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4KSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSR1dGlscyQkX2lzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuICAgIH1cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzQXJyYXkgPSBsaWIkZXM2JHByb21pc2UkdXRpbHMkJF9pc0FycmF5O1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkbGVuID0gMDtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJHRvU3RyaW5nID0ge30udG9TdHJpbmc7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR2ZXJ0eE5leHQ7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRjdXN0b21TY2hlZHVsZXJGbjtcblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXNhcCA9IGZ1bmN0aW9uIGFzYXAoY2FsbGJhY2ssIGFyZykge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHF1ZXVlW2xpYiRlczYkcHJvbWlzZSRhc2FwJCRsZW5dID0gY2FsbGJhY2s7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWVbbGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbiArIDFdID0gYXJnO1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbiArPSAyO1xuICAgICAgaWYgKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRsZW4gPT09IDIpIHtcbiAgICAgICAgLy8gSWYgbGVuIGlzIDIsIHRoYXQgbWVhbnMgdGhhdCB3ZSBuZWVkIHRvIHNjaGVkdWxlIGFuIGFzeW5jIGZsdXNoLlxuICAgICAgICAvLyBJZiBhZGRpdGlvbmFsIGNhbGxiYWNrcyBhcmUgcXVldWVkIGJlZm9yZSB0aGUgcXVldWUgaXMgZmx1c2hlZCwgdGhleVxuICAgICAgICAvLyB3aWxsIGJlIHByb2Nlc3NlZCBieSB0aGlzIGZsdXNoIHRoYXQgd2UgYXJlIHNjaGVkdWxpbmcuXG4gICAgICAgIGlmIChsaWIkZXM2JHByb21pc2UkYXNhcCQkY3VzdG9tU2NoZWR1bGVyRm4pIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkY3VzdG9tU2NoZWR1bGVyRm4obGliJGVzNiRwcm9taXNlJGFzYXAkJGZsdXNoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2NoZWR1bGVGbHVzaCgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHNldFNjaGVkdWxlcihzY2hlZHVsZUZuKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkY3VzdG9tU2NoZWR1bGVyRm4gPSBzY2hlZHVsZUZuO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRzZXRBc2FwKGFzYXBGbikge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJGFzYXAgPSBhc2FwRm47XG4gICAgfVxuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRicm93c2VyV2luZG93ID0gKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSA/IHdpbmRvdyA6IHVuZGVmaW5lZDtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJGJyb3dzZXJHbG9iYWwgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkYnJvd3NlcldpbmRvdyB8fCB7fTtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJGJyb3dzZXJHbG9iYWwuTXV0YXRpb25PYnNlcnZlciB8fCBsaWIkZXM2JHByb21pc2UkYXNhcCQkYnJvd3Nlckdsb2JhbC5XZWJLaXRNdXRhdGlvbk9ic2VydmVyO1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkaXNOb2RlID0gdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmIHt9LnRvU3RyaW5nLmNhbGwocHJvY2VzcykgPT09ICdbb2JqZWN0IHByb2Nlc3NdJztcblxuICAgIC8vIHRlc3QgZm9yIHdlYiB3b3JrZXIgYnV0IG5vdCBpbiBJRTEwXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRpc1dvcmtlciA9IHR5cGVvZiBVaW50OENsYW1wZWRBcnJheSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgIHR5cGVvZiBpbXBvcnRTY3JpcHRzICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgdHlwZW9mIE1lc3NhZ2VDaGFubmVsICE9PSAndW5kZWZpbmVkJztcblxuICAgIC8vIG5vZGVcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTmV4dFRpY2soKSB7XG4gICAgICAvLyBub2RlIHZlcnNpb24gMC4xMC54IGRpc3BsYXlzIGEgZGVwcmVjYXRpb24gd2FybmluZyB3aGVuIG5leHRUaWNrIGlzIHVzZWQgcmVjdXJzaXZlbHlcbiAgICAgIC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vY3Vqb2pzL3doZW4vaXNzdWVzLzQxMCBmb3IgZGV0YWlsc1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBwcm9jZXNzLm5leHRUaWNrKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRmbHVzaCk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIHZlcnR4XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVZlcnR4VGltZXIoKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR2ZXJ0eE5leHQobGliJGVzNiRwcm9taXNlJGFzYXAkJGZsdXNoKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZU11dGF0aW9uT2JzZXJ2ZXIoKSB7XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgbGliJGVzNiRwcm9taXNlJGFzYXAkJEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRmbHVzaCk7XG4gICAgICB2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgICAgIG9ic2VydmVyLm9ic2VydmUobm9kZSwgeyBjaGFyYWN0ZXJEYXRhOiB0cnVlIH0pO1xuXG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIG5vZGUuZGF0YSA9IChpdGVyYXRpb25zID0gKytpdGVyYXRpb25zICUgMik7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIHdlYiB3b3JrZXJcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTWVzc2FnZUNoYW5uZWwoKSB7XG4gICAgICB2YXIgY2hhbm5lbCA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xuICAgICAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkZmx1c2g7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICBjaGFubmVsLnBvcnQyLnBvc3RNZXNzYWdlKDApO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlU2V0VGltZW91dCgpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgc2V0VGltZW91dChsaWIkZXM2JHByb21pc2UkYXNhcCQkZmx1c2gsIDEpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJHF1ZXVlID0gbmV3IEFycmF5KDEwMDApO1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRmbHVzaCgpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbjsgaSs9Mikge1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWVbaV07XG4gICAgICAgIHZhciBhcmcgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWVbaSsxXTtcblxuICAgICAgICBjYWxsYmFjayhhcmcpO1xuXG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRxdWV1ZVtpXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHF1ZXVlW2krMV0gPSB1bmRlZmluZWQ7XG4gICAgICB9XG5cbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRsZW4gPSAwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhdHRlbXB0VmVydHgoKSB7XG4gICAgICB0cnkge1xuICAgICAgICB2YXIgciA9IHJlcXVpcmU7XG4gICAgICAgIHZhciB2ZXJ0eCA9IHIoJ3ZlcnR4Jyk7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR2ZXJ0eE5leHQgPSB2ZXJ0eC5ydW5Pbkxvb3AgfHwgdmVydHgucnVuT25Db250ZXh0O1xuICAgICAgICByZXR1cm4gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVZlcnR4VGltZXIoKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICByZXR1cm4gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVNldFRpbWVvdXQoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2g7XG4gICAgLy8gRGVjaWRlIHdoYXQgYXN5bmMgbWV0aG9kIHRvIHVzZSB0byB0cmlnZ2VyaW5nIHByb2Nlc3Npbmcgb2YgcXVldWVkIGNhbGxiYWNrczpcbiAgICBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJGlzTm9kZSkge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2ggPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTmV4dFRpY2soKTtcbiAgICB9IGVsc2UgaWYgKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRCcm93c2VyTXV0YXRpb25PYnNlcnZlcikge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2ggPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTXV0YXRpb25PYnNlcnZlcigpO1xuICAgIH0gZWxzZSBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJGlzV29ya2VyKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2NoZWR1bGVGbHVzaCA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VNZXNzYWdlQ2hhbm5lbCgpO1xuICAgIH0gZWxzZSBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJGJyb3dzZXJXaW5kb3cgPT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgcmVxdWlyZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2ggPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXR0ZW1wdFZlcnR4KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRzY2hlZHVsZUZsdXNoID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVNldFRpbWVvdXQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKCkge31cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HICAgPSB2b2lkIDA7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRCA9IDE7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVEICA9IDI7XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkR0VUX1RIRU5fRVJST1IgPSBuZXcgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRXJyb3JPYmplY3QoKTtcblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHNlbGZGdWxmaWxsbWVudCgpIHtcbiAgICAgIHJldHVybiBuZXcgVHlwZUVycm9yKFwiWW91IGNhbm5vdCByZXNvbHZlIGEgcHJvbWlzZSB3aXRoIGl0c2VsZlwiKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRjYW5ub3RSZXR1cm5Pd24oKSB7XG4gICAgICByZXR1cm4gbmV3IFR5cGVFcnJvcignQSBwcm9taXNlcyBjYWxsYmFjayBjYW5ub3QgcmV0dXJuIHRoYXQgc2FtZSBwcm9taXNlLicpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGdldFRoZW4ocHJvbWlzZSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHByb21pc2UudGhlbjtcbiAgICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkR0VUX1RIRU5fRVJST1IuZXJyb3IgPSBlcnJvcjtcbiAgICAgICAgcmV0dXJuIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEdFVF9USEVOX0VSUk9SO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHRyeVRoZW4odGhlbiwgdmFsdWUsIGZ1bGZpbGxtZW50SGFuZGxlciwgcmVqZWN0aW9uSGFuZGxlcikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhlbi5jYWxsKHZhbHVlLCBmdWxmaWxsbWVudEhhbmRsZXIsIHJlamVjdGlvbkhhbmRsZXIpO1xuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIHJldHVybiBlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGhhbmRsZUZvcmVpZ25UaGVuYWJsZShwcm9taXNlLCB0aGVuYWJsZSwgdGhlbikge1xuICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhc2FwKGZ1bmN0aW9uKHByb21pc2UpIHtcbiAgICAgICAgdmFyIHNlYWxlZCA9IGZhbHNlO1xuICAgICAgICB2YXIgZXJyb3IgPSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCR0cnlUaGVuKHRoZW4sIHRoZW5hYmxlLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgIGlmIChzZWFsZWQpIHsgcmV0dXJuOyB9XG4gICAgICAgICAgc2VhbGVkID0gdHJ1ZTtcbiAgICAgICAgICBpZiAodGhlbmFibGUgIT09IHZhbHVlKSB7XG4gICAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCB2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbihyZWFzb24pIHtcbiAgICAgICAgICBpZiAoc2VhbGVkKSB7IHJldHVybjsgfVxuICAgICAgICAgIHNlYWxlZCA9IHRydWU7XG5cbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgICAgICAgfSwgJ1NldHRsZTogJyArIChwcm9taXNlLl9sYWJlbCB8fCAnIHVua25vd24gcHJvbWlzZScpKTtcblxuICAgICAgICBpZiAoIXNlYWxlZCAmJiBlcnJvcikge1xuICAgICAgICAgIHNlYWxlZCA9IHRydWU7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfSwgcHJvbWlzZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaGFuZGxlT3duVGhlbmFibGUocHJvbWlzZSwgdGhlbmFibGUpIHtcbiAgICAgIGlmICh0aGVuYWJsZS5fc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIHRoZW5hYmxlLl9yZXN1bHQpO1xuICAgICAgfSBlbHNlIGlmICh0aGVuYWJsZS5fc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVEKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCB0aGVuYWJsZS5fcmVzdWx0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHN1YnNjcmliZSh0aGVuYWJsZSwgdW5kZWZpbmVkLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgICB9LCBmdW5jdGlvbihyZWFzb24pIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaGFuZGxlTWF5YmVUaGVuYWJsZShwcm9taXNlLCBtYXliZVRoZW5hYmxlKSB7XG4gICAgICBpZiAobWF5YmVUaGVuYWJsZS5jb25zdHJ1Y3RvciA9PT0gcHJvbWlzZS5jb25zdHJ1Y3Rvcikge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRoYW5kbGVPd25UaGVuYWJsZShwcm9taXNlLCBtYXliZVRoZW5hYmxlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciB0aGVuID0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZ2V0VGhlbihtYXliZVRoZW5hYmxlKTtcblxuICAgICAgICBpZiAodGhlbiA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkR0VUX1RIRU5fRVJST1IpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkR0VUX1RIRU5fRVJST1IuZXJyb3IpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoZW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSk7XG4gICAgICAgIH0gZWxzZSBpZiAobGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc0Z1bmN0aW9uKHRoZW4pKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaGFuZGxlRm9yZWlnblRoZW5hYmxlKHByb21pc2UsIG1heWJlVGhlbmFibGUsIHRoZW4pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZXNvbHZlKHByb21pc2UsIHZhbHVlKSB7XG4gICAgICBpZiAocHJvbWlzZSA9PT0gdmFsdWUpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHNlbGZGdWxmaWxsbWVudCgpKTtcbiAgICAgIH0gZWxzZSBpZiAobGliJGVzNiRwcm9taXNlJHV0aWxzJCRvYmplY3RPckZ1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRoYW5kbGVNYXliZVRoZW5hYmxlKHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHB1Ymxpc2hSZWplY3Rpb24ocHJvbWlzZSkge1xuICAgICAgaWYgKHByb21pc2UuX29uZXJyb3IpIHtcbiAgICAgICAgcHJvbWlzZS5fb25lcnJvcihwcm9taXNlLl9yZXN1bHQpO1xuICAgICAgfVxuXG4gICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRwdWJsaXNoKHByb21pc2UpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpIHtcbiAgICAgIGlmIChwcm9taXNlLl9zdGF0ZSAhPT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUEVORElORykgeyByZXR1cm47IH1cblxuICAgICAgcHJvbWlzZS5fcmVzdWx0ID0gdmFsdWU7XG4gICAgICBwcm9taXNlLl9zdGF0ZSA9IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRDtcblxuICAgICAgaWYgKHByb21pc2UuX3N1YnNjcmliZXJzLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXNhcChsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRwdWJsaXNoLCBwcm9taXNlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgcmVhc29uKSB7XG4gICAgICBpZiAocHJvbWlzZS5fc3RhdGUgIT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBFTkRJTkcpIHsgcmV0dXJuOyB9XG4gICAgICBwcm9taXNlLl9zdGF0ZSA9IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVEO1xuICAgICAgcHJvbWlzZS5fcmVzdWx0ID0gcmVhc29uO1xuXG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXNhcChsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRwdWJsaXNoUmVqZWN0aW9uLCBwcm9taXNlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRzdWJzY3JpYmUocGFyZW50LCBjaGlsZCwgb25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pIHtcbiAgICAgIHZhciBzdWJzY3JpYmVycyA9IHBhcmVudC5fc3Vic2NyaWJlcnM7XG4gICAgICB2YXIgbGVuZ3RoID0gc3Vic2NyaWJlcnMubGVuZ3RoO1xuXG4gICAgICBwYXJlbnQuX29uZXJyb3IgPSBudWxsO1xuXG4gICAgICBzdWJzY3JpYmVyc1tsZW5ndGhdID0gY2hpbGQ7XG4gICAgICBzdWJzY3JpYmVyc1tsZW5ndGggKyBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRGVUxGSUxMRURdID0gb25GdWxmaWxsbWVudDtcbiAgICAgIHN1YnNjcmliZXJzW2xlbmd0aCArIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVEXSAgPSBvblJlamVjdGlvbjtcblxuICAgICAgaWYgKGxlbmd0aCA9PT0gMCAmJiBwYXJlbnQuX3N0YXRlKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhc2FwKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHB1Ymxpc2gsIHBhcmVudCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcHVibGlzaChwcm9taXNlKSB7XG4gICAgICB2YXIgc3Vic2NyaWJlcnMgPSBwcm9taXNlLl9zdWJzY3JpYmVycztcbiAgICAgIHZhciBzZXR0bGVkID0gcHJvbWlzZS5fc3RhdGU7XG5cbiAgICAgIGlmIChzdWJzY3JpYmVycy5sZW5ndGggPT09IDApIHsgcmV0dXJuOyB9XG5cbiAgICAgIHZhciBjaGlsZCwgY2FsbGJhY2ssIGRldGFpbCA9IHByb21pc2UuX3Jlc3VsdDtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdWJzY3JpYmVycy5sZW5ndGg7IGkgKz0gMykge1xuICAgICAgICBjaGlsZCA9IHN1YnNjcmliZXJzW2ldO1xuICAgICAgICBjYWxsYmFjayA9IHN1YnNjcmliZXJzW2kgKyBzZXR0bGVkXTtcblxuICAgICAgICBpZiAoY2hpbGQpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRpbnZva2VDYWxsYmFjayhzZXR0bGVkLCBjaGlsZCwgY2FsbGJhY2ssIGRldGFpbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2FsbGJhY2soZGV0YWlsKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBwcm9taXNlLl9zdWJzY3JpYmVycy5sZW5ndGggPSAwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEVycm9yT2JqZWN0KCkge1xuICAgICAgdGhpcy5lcnJvciA9IG51bGw7XG4gICAgfVxuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFRSWV9DQVRDSF9FUlJPUiA9IG5ldyBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRFcnJvck9iamVjdCgpO1xuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkdHJ5Q2F0Y2goY2FsbGJhY2ssIGRldGFpbCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGRldGFpbCk7XG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkVFJZX0NBVENIX0VSUk9SLmVycm9yID0gZTtcbiAgICAgICAgcmV0dXJuIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFRSWV9DQVRDSF9FUlJPUjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRpbnZva2VDYWxsYmFjayhzZXR0bGVkLCBwcm9taXNlLCBjYWxsYmFjaywgZGV0YWlsKSB7XG4gICAgICB2YXIgaGFzQ2FsbGJhY2sgPSBsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzRnVuY3Rpb24oY2FsbGJhY2spLFxuICAgICAgICAgIHZhbHVlLCBlcnJvciwgc3VjY2VlZGVkLCBmYWlsZWQ7XG5cbiAgICAgIGlmIChoYXNDYWxsYmFjaykge1xuICAgICAgICB2YWx1ZSA9IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHRyeUNhdGNoKGNhbGxiYWNrLCBkZXRhaWwpO1xuXG4gICAgICAgIGlmICh2YWx1ZSA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkVFJZX0NBVENIX0VSUk9SKSB7XG4gICAgICAgICAgZmFpbGVkID0gdHJ1ZTtcbiAgICAgICAgICBlcnJvciA9IHZhbHVlLmVycm9yO1xuICAgICAgICAgIHZhbHVlID0gbnVsbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdWNjZWVkZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb21pc2UgPT09IHZhbHVlKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGNhbm5vdFJldHVybk93bigpKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWUgPSBkZXRhaWw7XG4gICAgICAgIHN1Y2NlZWRlZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChwcm9taXNlLl9zdGF0ZSAhPT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUEVORElORykge1xuICAgICAgICAvLyBub29wXG4gICAgICB9IGVsc2UgaWYgKGhhc0NhbGxiYWNrICYmIHN1Y2NlZWRlZCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH0gZWxzZSBpZiAoZmFpbGVkKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCBlcnJvcik7XG4gICAgICB9IGVsc2UgaWYgKHNldHRsZWQgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH0gZWxzZSBpZiAoc2V0dGxlZCA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRpbml0aWFsaXplUHJvbWlzZShwcm9taXNlLCByZXNvbHZlcikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzb2x2ZXIoZnVuY3Rpb24gcmVzb2x2ZVByb21pc2UodmFsdWUpe1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgICB9LCBmdW5jdGlvbiByZWplY3RQcm9taXNlKHJlYXNvbikge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCByZWFzb24pO1xuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJEVudW1lcmF0b3IoQ29uc3RydWN0b3IsIGlucHV0KSB7XG4gICAgICB2YXIgZW51bWVyYXRvciA9IHRoaXM7XG5cbiAgICAgIGVudW1lcmF0b3IuX2luc3RhbmNlQ29uc3RydWN0b3IgPSBDb25zdHJ1Y3RvcjtcbiAgICAgIGVudW1lcmF0b3IucHJvbWlzZSA9IG5ldyBDb25zdHJ1Y3RvcihsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKTtcblxuICAgICAgaWYgKGVudW1lcmF0b3IuX3ZhbGlkYXRlSW5wdXQoaW5wdXQpKSB7XG4gICAgICAgIGVudW1lcmF0b3IuX2lucHV0ICAgICA9IGlucHV0O1xuICAgICAgICBlbnVtZXJhdG9yLmxlbmd0aCAgICAgPSBpbnB1dC5sZW5ndGg7XG4gICAgICAgIGVudW1lcmF0b3IuX3JlbWFpbmluZyA9IGlucHV0Lmxlbmd0aDtcblxuICAgICAgICBlbnVtZXJhdG9yLl9pbml0KCk7XG5cbiAgICAgICAgaWYgKGVudW1lcmF0b3IubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChlbnVtZXJhdG9yLnByb21pc2UsIGVudW1lcmF0b3IuX3Jlc3VsdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZW51bWVyYXRvci5sZW5ndGggPSBlbnVtZXJhdG9yLmxlbmd0aCB8fCAwO1xuICAgICAgICAgIGVudW1lcmF0b3IuX2VudW1lcmF0ZSgpO1xuICAgICAgICAgIGlmIChlbnVtZXJhdG9yLl9yZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwoZW51bWVyYXRvci5wcm9taXNlLCBlbnVtZXJhdG9yLl9yZXN1bHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KGVudW1lcmF0b3IucHJvbWlzZSwgZW51bWVyYXRvci5fdmFsaWRhdGlvbkVycm9yKCkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yLnByb3RvdHlwZS5fdmFsaWRhdGVJbnB1dCA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICByZXR1cm4gbGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc0FycmF5KGlucHV0KTtcbiAgICB9O1xuXG4gICAgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJEVudW1lcmF0b3IucHJvdG90eXBlLl92YWxpZGF0aW9uRXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgRXJyb3IoJ0FycmF5IE1ldGhvZHMgbXVzdCBiZSBwcm92aWRlZCBhbiBBcnJheScpO1xuICAgIH07XG5cbiAgICBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvci5wcm90b3R5cGUuX2luaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX3Jlc3VsdCA9IG5ldyBBcnJheSh0aGlzLmxlbmd0aCk7XG4gICAgfTtcblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkZGVmYXVsdCA9IGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yO1xuXG4gICAgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJEVudW1lcmF0b3IucHJvdG90eXBlLl9lbnVtZXJhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBlbnVtZXJhdG9yID0gdGhpcztcblxuICAgICAgdmFyIGxlbmd0aCAgPSBlbnVtZXJhdG9yLmxlbmd0aDtcbiAgICAgIHZhciBwcm9taXNlID0gZW51bWVyYXRvci5wcm9taXNlO1xuICAgICAgdmFyIGlucHV0ICAgPSBlbnVtZXJhdG9yLl9pbnB1dDtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IHByb21pc2UuX3N0YXRlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HICYmIGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBlbnVtZXJhdG9yLl9lYWNoRW50cnkoaW5wdXRbaV0sIGkpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvci5wcm90b3R5cGUuX2VhY2hFbnRyeSA9IGZ1bmN0aW9uKGVudHJ5LCBpKSB7XG4gICAgICB2YXIgZW51bWVyYXRvciA9IHRoaXM7XG4gICAgICB2YXIgYyA9IGVudW1lcmF0b3IuX2luc3RhbmNlQ29uc3RydWN0b3I7XG5cbiAgICAgIGlmIChsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzTWF5YmVUaGVuYWJsZShlbnRyeSkpIHtcbiAgICAgICAgaWYgKGVudHJ5LmNvbnN0cnVjdG9yID09PSBjICYmIGVudHJ5Ll9zdGF0ZSAhPT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUEVORElORykge1xuICAgICAgICAgIGVudHJ5Ll9vbmVycm9yID0gbnVsbDtcbiAgICAgICAgICBlbnVtZXJhdG9yLl9zZXR0bGVkQXQoZW50cnkuX3N0YXRlLCBpLCBlbnRyeS5fcmVzdWx0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbnVtZXJhdG9yLl93aWxsU2V0dGxlQXQoYy5yZXNvbHZlKGVudHJ5KSwgaSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVudW1lcmF0b3IuX3JlbWFpbmluZy0tO1xuICAgICAgICBlbnVtZXJhdG9yLl9yZXN1bHRbaV0gPSBlbnRyeTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJEVudW1lcmF0b3IucHJvdG90eXBlLl9zZXR0bGVkQXQgPSBmdW5jdGlvbihzdGF0ZSwgaSwgdmFsdWUpIHtcbiAgICAgIHZhciBlbnVtZXJhdG9yID0gdGhpcztcbiAgICAgIHZhciBwcm9taXNlID0gZW51bWVyYXRvci5wcm9taXNlO1xuXG4gICAgICBpZiAocHJvbWlzZS5fc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBFTkRJTkcpIHtcbiAgICAgICAgZW51bWVyYXRvci5fcmVtYWluaW5nLS07XG5cbiAgICAgICAgaWYgKHN0YXRlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRSRUpFQ1RFRCkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCB2YWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZW51bWVyYXRvci5fcmVzdWx0W2ldID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGVudW1lcmF0b3IuX3JlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIGVudW1lcmF0b3IuX3Jlc3VsdCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yLnByb3RvdHlwZS5fd2lsbFNldHRsZUF0ID0gZnVuY3Rpb24ocHJvbWlzZSwgaSkge1xuICAgICAgdmFyIGVudW1lcmF0b3IgPSB0aGlzO1xuXG4gICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRzdWJzY3JpYmUocHJvbWlzZSwgdW5kZWZpbmVkLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBlbnVtZXJhdG9yLl9zZXR0bGVkQXQobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRlVMRklMTEVELCBpLCB2YWx1ZSk7XG4gICAgICB9LCBmdW5jdGlvbihyZWFzb24pIHtcbiAgICAgICAgZW51bWVyYXRvci5fc2V0dGxlZEF0KGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVELCBpLCByZWFzb24pO1xuICAgICAgfSk7XG4gICAgfTtcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRhbGwkJGFsbChlbnRyaWVzKSB7XG4gICAgICByZXR1cm4gbmV3IGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRkZWZhdWx0KHRoaXMsIGVudHJpZXMpLnByb21pc2U7XG4gICAgfVxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRhbGwkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRhbGwkJGFsbDtcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyYWNlJCRyYWNlKGVudHJpZXMpIHtcbiAgICAgIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gICAgICB2YXIgQ29uc3RydWN0b3IgPSB0aGlzO1xuXG4gICAgICB2YXIgcHJvbWlzZSA9IG5ldyBDb25zdHJ1Y3RvcihsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKTtcblxuICAgICAgaWYgKCFsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzQXJyYXkoZW50cmllcykpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIG5ldyBUeXBlRXJyb3IoJ1lvdSBtdXN0IHBhc3MgYW4gYXJyYXkgdG8gcmFjZS4nKSk7XG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgfVxuXG4gICAgICB2YXIgbGVuZ3RoID0gZW50cmllcy5sZW5ndGg7XG5cbiAgICAgIGZ1bmN0aW9uIG9uRnVsZmlsbG1lbnQodmFsdWUpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIG9uUmVqZWN0aW9uKHJlYXNvbikge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgICAgIH1cblxuICAgICAgZm9yICh2YXIgaSA9IDA7IHByb21pc2UuX3N0YXRlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HICYmIGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRzdWJzY3JpYmUoQ29uc3RydWN0b3IucmVzb2x2ZShlbnRyaWVzW2ldKSwgdW5kZWZpbmVkLCBvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH1cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmFjZSQkZGVmYXVsdCA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJhY2UkJHJhY2U7XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVzb2x2ZSQkcmVzb2x2ZShvYmplY3QpIHtcbiAgICAgIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gICAgICB2YXIgQ29uc3RydWN0b3IgPSB0aGlzO1xuXG4gICAgICBpZiAob2JqZWN0ICYmIHR5cGVvZiBvYmplY3QgPT09ICdvYmplY3QnICYmIG9iamVjdC5jb25zdHJ1Y3RvciA9PT0gQ29uc3RydWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICAgIH1cblxuICAgICAgdmFyIHByb21pc2UgPSBuZXcgQ29uc3RydWN0b3IobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbm9vcCk7XG4gICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZXNvbHZlKHByb21pc2UsIG9iamVjdCk7XG4gICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlc29sdmUkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZXNvbHZlJCRyZXNvbHZlO1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlamVjdCQkcmVqZWN0KHJlYXNvbikge1xuICAgICAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgICAgIHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG4gICAgICB2YXIgcHJvbWlzZSA9IG5ldyBDb25zdHJ1Y3RvcihsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKTtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCByZWFzb24pO1xuICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZWplY3QkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZWplY3QkJHJlamVjdDtcblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkY291bnRlciA9IDA7XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkbmVlZHNSZXNvbHZlcigpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1lvdSBtdXN0IHBhc3MgYSByZXNvbHZlciBmdW5jdGlvbiBhcyB0aGUgZmlyc3QgYXJndW1lbnQgdG8gdGhlIHByb21pc2UgY29uc3RydWN0b3InKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkbmVlZHNOZXcoKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRmFpbGVkIHRvIGNvbnN0cnVjdCAnUHJvbWlzZSc6IFBsZWFzZSB1c2UgdGhlICduZXcnIG9wZXJhdG9yLCB0aGlzIG9iamVjdCBjb25zdHJ1Y3RvciBjYW5ub3QgYmUgY2FsbGVkIGFzIGEgZnVuY3Rpb24uXCIpO1xuICAgIH1cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkZGVmYXVsdCA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlO1xuICAgIC8qKlxuICAgICAgUHJvbWlzZSBvYmplY3RzIHJlcHJlc2VudCB0aGUgZXZlbnR1YWwgcmVzdWx0IG9mIGFuIGFzeW5jaHJvbm91cyBvcGVyYXRpb24uIFRoZVxuICAgICAgcHJpbWFyeSB3YXkgb2YgaW50ZXJhY3Rpbmcgd2l0aCBhIHByb21pc2UgaXMgdGhyb3VnaCBpdHMgYHRoZW5gIG1ldGhvZCwgd2hpY2hcbiAgICAgIHJlZ2lzdGVycyBjYWxsYmFja3MgdG8gcmVjZWl2ZSBlaXRoZXIgYSBwcm9taXNlJ3MgZXZlbnR1YWwgdmFsdWUgb3IgdGhlIHJlYXNvblxuICAgICAgd2h5IHRoZSBwcm9taXNlIGNhbm5vdCBiZSBmdWxmaWxsZWQuXG5cbiAgICAgIFRlcm1pbm9sb2d5XG4gICAgICAtLS0tLS0tLS0tLVxuXG4gICAgICAtIGBwcm9taXNlYCBpcyBhbiBvYmplY3Qgb3IgZnVuY3Rpb24gd2l0aCBhIGB0aGVuYCBtZXRob2Qgd2hvc2UgYmVoYXZpb3IgY29uZm9ybXMgdG8gdGhpcyBzcGVjaWZpY2F0aW9uLlxuICAgICAgLSBgdGhlbmFibGVgIGlzIGFuIG9iamVjdCBvciBmdW5jdGlvbiB0aGF0IGRlZmluZXMgYSBgdGhlbmAgbWV0aG9kLlxuICAgICAgLSBgdmFsdWVgIGlzIGFueSBsZWdhbCBKYXZhU2NyaXB0IHZhbHVlIChpbmNsdWRpbmcgdW5kZWZpbmVkLCBhIHRoZW5hYmxlLCBvciBhIHByb21pc2UpLlxuICAgICAgLSBgZXhjZXB0aW9uYCBpcyBhIHZhbHVlIHRoYXQgaXMgdGhyb3duIHVzaW5nIHRoZSB0aHJvdyBzdGF0ZW1lbnQuXG4gICAgICAtIGByZWFzb25gIGlzIGEgdmFsdWUgdGhhdCBpbmRpY2F0ZXMgd2h5IGEgcHJvbWlzZSB3YXMgcmVqZWN0ZWQuXG4gICAgICAtIGBzZXR0bGVkYCB0aGUgZmluYWwgcmVzdGluZyBzdGF0ZSBvZiBhIHByb21pc2UsIGZ1bGZpbGxlZCBvciByZWplY3RlZC5cblxuICAgICAgQSBwcm9taXNlIGNhbiBiZSBpbiBvbmUgb2YgdGhyZWUgc3RhdGVzOiBwZW5kaW5nLCBmdWxmaWxsZWQsIG9yIHJlamVjdGVkLlxuXG4gICAgICBQcm9taXNlcyB0aGF0IGFyZSBmdWxmaWxsZWQgaGF2ZSBhIGZ1bGZpbGxtZW50IHZhbHVlIGFuZCBhcmUgaW4gdGhlIGZ1bGZpbGxlZFxuICAgICAgc3RhdGUuICBQcm9taXNlcyB0aGF0IGFyZSByZWplY3RlZCBoYXZlIGEgcmVqZWN0aW9uIHJlYXNvbiBhbmQgYXJlIGluIHRoZVxuICAgICAgcmVqZWN0ZWQgc3RhdGUuICBBIGZ1bGZpbGxtZW50IHZhbHVlIGlzIG5ldmVyIGEgdGhlbmFibGUuXG5cbiAgICAgIFByb21pc2VzIGNhbiBhbHNvIGJlIHNhaWQgdG8gKnJlc29sdmUqIGEgdmFsdWUuICBJZiB0aGlzIHZhbHVlIGlzIGFsc28gYVxuICAgICAgcHJvbWlzZSwgdGhlbiB0aGUgb3JpZ2luYWwgcHJvbWlzZSdzIHNldHRsZWQgc3RhdGUgd2lsbCBtYXRjaCB0aGUgdmFsdWUnc1xuICAgICAgc2V0dGxlZCBzdGF0ZS4gIFNvIGEgcHJvbWlzZSB0aGF0ICpyZXNvbHZlcyogYSBwcm9taXNlIHRoYXQgcmVqZWN0cyB3aWxsXG4gICAgICBpdHNlbGYgcmVqZWN0LCBhbmQgYSBwcm9taXNlIHRoYXQgKnJlc29sdmVzKiBhIHByb21pc2UgdGhhdCBmdWxmaWxscyB3aWxsXG4gICAgICBpdHNlbGYgZnVsZmlsbC5cblxuXG4gICAgICBCYXNpYyBVc2FnZTpcbiAgICAgIC0tLS0tLS0tLS0tLVxuXG4gICAgICBgYGBqc1xuICAgICAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgLy8gb24gc3VjY2Vzc1xuICAgICAgICByZXNvbHZlKHZhbHVlKTtcblxuICAgICAgICAvLyBvbiBmYWlsdXJlXG4gICAgICAgIHJlamVjdChyZWFzb24pO1xuICAgICAgfSk7XG5cbiAgICAgIHByb21pc2UudGhlbihmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAvLyBvbiBmdWxmaWxsbWVudFxuICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgICAgIC8vIG9uIHJlamVjdGlvblxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQWR2YW5jZWQgVXNhZ2U6XG4gICAgICAtLS0tLS0tLS0tLS0tLS1cblxuICAgICAgUHJvbWlzZXMgc2hpbmUgd2hlbiBhYnN0cmFjdGluZyBhd2F5IGFzeW5jaHJvbm91cyBpbnRlcmFjdGlvbnMgc3VjaCBhc1xuICAgICAgYFhNTEh0dHBSZXF1ZXN0YHMuXG5cbiAgICAgIGBgYGpzXG4gICAgICBmdW5jdGlvbiBnZXRKU09OKHVybCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICAgICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAgICAgICB4aHIub3BlbignR0VUJywgdXJsKTtcbiAgICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gaGFuZGxlcjtcbiAgICAgICAgICB4aHIucmVzcG9uc2VUeXBlID0gJ2pzb24nO1xuICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdBY2NlcHQnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgIHhoci5zZW5kKCk7XG5cbiAgICAgICAgICBmdW5jdGlvbiBoYW5kbGVyKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMucmVhZHlTdGF0ZSA9PT0gdGhpcy5ET05FKSB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLnJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKCdnZXRKU09OOiBgJyArIHVybCArICdgIGZhaWxlZCB3aXRoIHN0YXR1czogWycgKyB0aGlzLnN0YXR1cyArICddJykpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGdldEpTT04oJy9wb3N0cy5qc29uJykudGhlbihmdW5jdGlvbihqc29uKSB7XG4gICAgICAgIC8vIG9uIGZ1bGZpbGxtZW50XG4gICAgICB9LCBmdW5jdGlvbihyZWFzb24pIHtcbiAgICAgICAgLy8gb24gcmVqZWN0aW9uXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBVbmxpa2UgY2FsbGJhY2tzLCBwcm9taXNlcyBhcmUgZ3JlYXQgY29tcG9zYWJsZSBwcmltaXRpdmVzLlxuXG4gICAgICBgYGBqc1xuICAgICAgUHJvbWlzZS5hbGwoW1xuICAgICAgICBnZXRKU09OKCcvcG9zdHMnKSxcbiAgICAgICAgZ2V0SlNPTignL2NvbW1lbnRzJylcbiAgICAgIF0pLnRoZW4oZnVuY3Rpb24odmFsdWVzKXtcbiAgICAgICAgdmFsdWVzWzBdIC8vID0+IHBvc3RzSlNPTlxuICAgICAgICB2YWx1ZXNbMV0gLy8gPT4gY29tbWVudHNKU09OXG5cbiAgICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIEBjbGFzcyBQcm9taXNlXG4gICAgICBAcGFyYW0ge2Z1bmN0aW9ufSByZXNvbHZlclxuICAgICAgVXNlZnVsIGZvciB0b29saW5nLlxuICAgICAgQGNvbnN0cnVjdG9yXG4gICAgKi9cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZShyZXNvbHZlcikge1xuICAgICAgdGhpcy5faWQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkY291bnRlcisrO1xuICAgICAgdGhpcy5fc3RhdGUgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLl9yZXN1bHQgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLl9zdWJzY3JpYmVycyA9IFtdO1xuXG4gICAgICBpZiAobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbm9vcCAhPT0gcmVzb2x2ZXIpIHtcbiAgICAgICAgaWYgKCFsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzRnVuY3Rpb24ocmVzb2x2ZXIpKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJG5lZWRzUmVzb2x2ZXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZSkpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkbmVlZHNOZXcoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGluaXRpYWxpemVQcm9taXNlKHRoaXMsIHJlc29sdmVyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZS5hbGwgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRhbGwkJGRlZmF1bHQ7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UucmFjZSA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJhY2UkJGRlZmF1bHQ7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UucmVzb2x2ZSA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlc29sdmUkJGRlZmF1bHQ7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UucmVqZWN0ID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVqZWN0JCRkZWZhdWx0O1xuICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLl9zZXRTY2hlZHVsZXIgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2V0U2NoZWR1bGVyO1xuICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLl9zZXRBc2FwID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJHNldEFzYXA7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UuX2FzYXAgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXNhcDtcblxuICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLnByb3RvdHlwZSA9IHtcbiAgICAgIGNvbnN0cnVjdG9yOiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZSxcblxuICAgIC8qKlxuICAgICAgVGhlIHByaW1hcnkgd2F5IG9mIGludGVyYWN0aW5nIHdpdGggYSBwcm9taXNlIGlzIHRocm91Z2ggaXRzIGB0aGVuYCBtZXRob2QsXG4gICAgICB3aGljaCByZWdpc3RlcnMgY2FsbGJhY2tzIHRvIHJlY2VpdmUgZWl0aGVyIGEgcHJvbWlzZSdzIGV2ZW50dWFsIHZhbHVlIG9yIHRoZVxuICAgICAgcmVhc29uIHdoeSB0aGUgcHJvbWlzZSBjYW5ub3QgYmUgZnVsZmlsbGVkLlxuXG4gICAgICBgYGBqc1xuICAgICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uKHVzZXIpe1xuICAgICAgICAvLyB1c2VyIGlzIGF2YWlsYWJsZVxuICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKXtcbiAgICAgICAgLy8gdXNlciBpcyB1bmF2YWlsYWJsZSwgYW5kIHlvdSBhcmUgZ2l2ZW4gdGhlIHJlYXNvbiB3aHlcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIENoYWluaW5nXG4gICAgICAtLS0tLS0tLVxuXG4gICAgICBUaGUgcmV0dXJuIHZhbHVlIG9mIGB0aGVuYCBpcyBpdHNlbGYgYSBwcm9taXNlLiAgVGhpcyBzZWNvbmQsICdkb3duc3RyZWFtJ1xuICAgICAgcHJvbWlzZSBpcyByZXNvbHZlZCB3aXRoIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIGZpcnN0IHByb21pc2UncyBmdWxmaWxsbWVudFxuICAgICAgb3IgcmVqZWN0aW9uIGhhbmRsZXIsIG9yIHJlamVjdGVkIGlmIHRoZSBoYW5kbGVyIHRocm93cyBhbiBleGNlcHRpb24uXG5cbiAgICAgIGBgYGpzXG4gICAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgcmV0dXJuIHVzZXIubmFtZTtcbiAgICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgcmV0dXJuICdkZWZhdWx0IG5hbWUnO1xuICAgICAgfSkudGhlbihmdW5jdGlvbiAodXNlck5hbWUpIHtcbiAgICAgICAgLy8gSWYgYGZpbmRVc2VyYCBmdWxmaWxsZWQsIGB1c2VyTmFtZWAgd2lsbCBiZSB0aGUgdXNlcidzIG5hbWUsIG90aGVyd2lzZSBpdFxuICAgICAgICAvLyB3aWxsIGJlIGAnZGVmYXVsdCBuYW1lJ2BcbiAgICAgIH0pO1xuXG4gICAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGb3VuZCB1c2VyLCBidXQgc3RpbGwgdW5oYXBweScpO1xuICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2BmaW5kVXNlcmAgcmVqZWN0ZWQgYW5kIHdlJ3JlIHVuaGFwcHknKTtcbiAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIC8vIG5ldmVyIHJlYWNoZWRcbiAgICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgLy8gaWYgYGZpbmRVc2VyYCBmdWxmaWxsZWQsIGByZWFzb25gIHdpbGwgYmUgJ0ZvdW5kIHVzZXIsIGJ1dCBzdGlsbCB1bmhhcHB5Jy5cbiAgICAgICAgLy8gSWYgYGZpbmRVc2VyYCByZWplY3RlZCwgYHJlYXNvbmAgd2lsbCBiZSAnYGZpbmRVc2VyYCByZWplY3RlZCBhbmQgd2UncmUgdW5oYXBweScuXG4gICAgICB9KTtcbiAgICAgIGBgYFxuICAgICAgSWYgdGhlIGRvd25zdHJlYW0gcHJvbWlzZSBkb2VzIG5vdCBzcGVjaWZ5IGEgcmVqZWN0aW9uIGhhbmRsZXIsIHJlamVjdGlvbiByZWFzb25zIHdpbGwgYmUgcHJvcGFnYXRlZCBmdXJ0aGVyIGRvd25zdHJlYW0uXG5cbiAgICAgIGBgYGpzXG4gICAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFBlZGFnb2dpY2FsRXhjZXB0aW9uKCdVcHN0cmVhbSBlcnJvcicpO1xuICAgICAgfSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgLy8gbmV2ZXIgcmVhY2hlZFxuICAgICAgfSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgLy8gbmV2ZXIgcmVhY2hlZFxuICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICAvLyBUaGUgYFBlZGdhZ29jaWFsRXhjZXB0aW9uYCBpcyBwcm9wYWdhdGVkIGFsbCB0aGUgd2F5IGRvd24gdG8gaGVyZVxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQXNzaW1pbGF0aW9uXG4gICAgICAtLS0tLS0tLS0tLS1cblxuICAgICAgU29tZXRpbWVzIHRoZSB2YWx1ZSB5b3Ugd2FudCB0byBwcm9wYWdhdGUgdG8gYSBkb3duc3RyZWFtIHByb21pc2UgY2FuIG9ubHkgYmVcbiAgICAgIHJldHJpZXZlZCBhc3luY2hyb25vdXNseS4gVGhpcyBjYW4gYmUgYWNoaWV2ZWQgYnkgcmV0dXJuaW5nIGEgcHJvbWlzZSBpbiB0aGVcbiAgICAgIGZ1bGZpbGxtZW50IG9yIHJlamVjdGlvbiBoYW5kbGVyLiBUaGUgZG93bnN0cmVhbSBwcm9taXNlIHdpbGwgdGhlbiBiZSBwZW5kaW5nXG4gICAgICB1bnRpbCB0aGUgcmV0dXJuZWQgcHJvbWlzZSBpcyBzZXR0bGVkLiBUaGlzIGlzIGNhbGxlZCAqYXNzaW1pbGF0aW9uKi5cblxuICAgICAgYGBganNcbiAgICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICByZXR1cm4gZmluZENvbW1lbnRzQnlBdXRob3IodXNlcik7XG4gICAgICB9KS50aGVuKGZ1bmN0aW9uIChjb21tZW50cykge1xuICAgICAgICAvLyBUaGUgdXNlcidzIGNvbW1lbnRzIGFyZSBub3cgYXZhaWxhYmxlXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBJZiB0aGUgYXNzaW1saWF0ZWQgcHJvbWlzZSByZWplY3RzLCB0aGVuIHRoZSBkb3duc3RyZWFtIHByb21pc2Ugd2lsbCBhbHNvIHJlamVjdC5cblxuICAgICAgYGBganNcbiAgICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICByZXR1cm4gZmluZENvbW1lbnRzQnlBdXRob3IodXNlcik7XG4gICAgICB9KS50aGVuKGZ1bmN0aW9uIChjb21tZW50cykge1xuICAgICAgICAvLyBJZiBgZmluZENvbW1lbnRzQnlBdXRob3JgIGZ1bGZpbGxzLCB3ZSdsbCBoYXZlIHRoZSB2YWx1ZSBoZXJlXG4gICAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIC8vIElmIGBmaW5kQ29tbWVudHNCeUF1dGhvcmAgcmVqZWN0cywgd2UnbGwgaGF2ZSB0aGUgcmVhc29uIGhlcmVcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIFNpbXBsZSBFeGFtcGxlXG4gICAgICAtLS0tLS0tLS0tLS0tLVxuXG4gICAgICBTeW5jaHJvbm91cyBFeGFtcGxlXG5cbiAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgIHZhciByZXN1bHQ7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHJlc3VsdCA9IGZpbmRSZXN1bHQoKTtcbiAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgLy8gZmFpbHVyZVxuICAgICAgfVxuICAgICAgYGBgXG5cbiAgICAgIEVycmJhY2sgRXhhbXBsZVxuXG4gICAgICBgYGBqc1xuICAgICAgZmluZFJlc3VsdChmdW5jdGlvbihyZXN1bHQsIGVycil7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAvLyBmYWlsdXJlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBQcm9taXNlIEV4YW1wbGU7XG5cbiAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgIGZpbmRSZXN1bHQoKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCl7XG4gICAgICAgIC8vIHN1Y2Nlc3NcbiAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgICAgIC8vIGZhaWx1cmVcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIEFkdmFuY2VkIEV4YW1wbGVcbiAgICAgIC0tLS0tLS0tLS0tLS0tXG5cbiAgICAgIFN5bmNocm9ub3VzIEV4YW1wbGVcblxuICAgICAgYGBgamF2YXNjcmlwdFxuICAgICAgdmFyIGF1dGhvciwgYm9va3M7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF1dGhvciA9IGZpbmRBdXRob3IoKTtcbiAgICAgICAgYm9va3MgID0gZmluZEJvb2tzQnlBdXRob3IoYXV0aG9yKTtcbiAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgLy8gZmFpbHVyZVxuICAgICAgfVxuICAgICAgYGBgXG5cbiAgICAgIEVycmJhY2sgRXhhbXBsZVxuXG4gICAgICBgYGBqc1xuXG4gICAgICBmdW5jdGlvbiBmb3VuZEJvb2tzKGJvb2tzKSB7XG5cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gZmFpbHVyZShyZWFzb24pIHtcblxuICAgICAgfVxuXG4gICAgICBmaW5kQXV0aG9yKGZ1bmN0aW9uKGF1dGhvciwgZXJyKXtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIGZhaWx1cmUoZXJyKTtcbiAgICAgICAgICAvLyBmYWlsdXJlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZpbmRCb29va3NCeUF1dGhvcihhdXRob3IsIGZ1bmN0aW9uKGJvb2tzLCBlcnIpIHtcbiAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGZhaWx1cmUoZXJyKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgZm91bmRCb29rcyhib29rcyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgICAgICAgICAgIGZhaWx1cmUocmVhc29uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgICAgIGZhaWx1cmUoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBQcm9taXNlIEV4YW1wbGU7XG5cbiAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgIGZpbmRBdXRob3IoKS5cbiAgICAgICAgdGhlbihmaW5kQm9va3NCeUF1dGhvcikuXG4gICAgICAgIHRoZW4oZnVuY3Rpb24oYm9va3Mpe1xuICAgICAgICAgIC8vIGZvdW5kIGJvb2tzXG4gICAgICB9KS5jYXRjaChmdW5jdGlvbihyZWFzb24pe1xuICAgICAgICAvLyBzb21ldGhpbmcgd2VudCB3cm9uZ1xuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQG1ldGhvZCB0aGVuXG4gICAgICBAcGFyYW0ge0Z1bmN0aW9ufSBvbkZ1bGZpbGxlZFxuICAgICAgQHBhcmFtIHtGdW5jdGlvbn0gb25SZWplY3RlZFxuICAgICAgVXNlZnVsIGZvciB0b29saW5nLlxuICAgICAgQHJldHVybiB7UHJvbWlzZX1cbiAgICAqL1xuICAgICAgdGhlbjogZnVuY3Rpb24ob25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pIHtcbiAgICAgICAgdmFyIHBhcmVudCA9IHRoaXM7XG4gICAgICAgIHZhciBzdGF0ZSA9IHBhcmVudC5fc3RhdGU7XG5cbiAgICAgICAgaWYgKHN0YXRlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRGVUxGSUxMRUQgJiYgIW9uRnVsZmlsbG1lbnQgfHwgc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVEICYmICFvblJlamVjdGlvbikge1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNoaWxkID0gbmV3IHRoaXMuY29uc3RydWN0b3IobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbm9vcCk7XG4gICAgICAgIHZhciByZXN1bHQgPSBwYXJlbnQuX3Jlc3VsdDtcblxuICAgICAgICBpZiAoc3RhdGUpIHtcbiAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBhcmd1bWVudHNbc3RhdGUgLSAxXTtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXNhcChmdW5jdGlvbigpe1xuICAgICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaW52b2tlQ2FsbGJhY2soc3RhdGUsIGNoaWxkLCBjYWxsYmFjaywgcmVzdWx0KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRzdWJzY3JpYmUocGFyZW50LCBjaGlsZCwgb25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNoaWxkO1xuICAgICAgfSxcblxuICAgIC8qKlxuICAgICAgYGNhdGNoYCBpcyBzaW1wbHkgc3VnYXIgZm9yIGB0aGVuKHVuZGVmaW5lZCwgb25SZWplY3Rpb24pYCB3aGljaCBtYWtlcyBpdCB0aGUgc2FtZVxuICAgICAgYXMgdGhlIGNhdGNoIGJsb2NrIG9mIGEgdHJ5L2NhdGNoIHN0YXRlbWVudC5cblxuICAgICAgYGBganNcbiAgICAgIGZ1bmN0aW9uIGZpbmRBdXRob3IoKXtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZG4ndCBmaW5kIHRoYXQgYXV0aG9yJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIHN5bmNocm9ub3VzXG4gICAgICB0cnkge1xuICAgICAgICBmaW5kQXV0aG9yKCk7XG4gICAgICB9IGNhdGNoKHJlYXNvbikge1xuICAgICAgICAvLyBzb21ldGhpbmcgd2VudCB3cm9uZ1xuICAgICAgfVxuXG4gICAgICAvLyBhc3luYyB3aXRoIHByb21pc2VzXG4gICAgICBmaW5kQXV0aG9yKCkuY2F0Y2goZnVuY3Rpb24ocmVhc29uKXtcbiAgICAgICAgLy8gc29tZXRoaW5nIHdlbnQgd3JvbmdcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIEBtZXRob2QgY2F0Y2hcbiAgICAgIEBwYXJhbSB7RnVuY3Rpb259IG9uUmVqZWN0aW9uXG4gICAgICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gICAgICBAcmV0dXJuIHtQcm9taXNlfVxuICAgICovXG4gICAgICAnY2F0Y2gnOiBmdW5jdGlvbihvblJlamVjdGlvbikge1xuICAgICAgICByZXR1cm4gdGhpcy50aGVuKG51bGwsIG9uUmVqZWN0aW9uKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwb2x5ZmlsbCQkcG9seWZpbGwoKSB7XG4gICAgICB2YXIgbG9jYWw7XG5cbiAgICAgIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIGxvY2FsID0gZ2xvYmFsO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICBsb2NhbCA9IHNlbGY7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGxvY2FsID0gRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigncG9seWZpbGwgZmFpbGVkIGJlY2F1c2UgZ2xvYmFsIG9iamVjdCBpcyB1bmF2YWlsYWJsZSBpbiB0aGlzIGVudmlyb25tZW50Jyk7XG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgUCA9IGxvY2FsLlByb21pc2U7XG5cbiAgICAgIGlmIChQICYmIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChQLnJlc29sdmUoKSkgPT09ICdbb2JqZWN0IFByb21pc2VdJyAmJiAhUC5jYXN0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgbG9jYWwuUHJvbWlzZSA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRkZWZhdWx0O1xuICAgIH1cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHBvbHlmaWxsJCRkZWZhdWx0ID0gbGliJGVzNiRwcm9taXNlJHBvbHlmaWxsJCRwb2x5ZmlsbDtcblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkdW1kJCRFUzZQcm9taXNlID0ge1xuICAgICAgJ1Byb21pc2UnOiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkZGVmYXVsdCxcbiAgICAgICdwb2x5ZmlsbCc6IGxpYiRlczYkcHJvbWlzZSRwb2x5ZmlsbCQkZGVmYXVsdFxuICAgIH07XG5cbiAgICAvKiBnbG9iYWwgZGVmaW5lOnRydWUgbW9kdWxlOnRydWUgd2luZG93OiB0cnVlICovXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lWydhbWQnXSkge1xuICAgICAgZGVmaW5lKGZ1bmN0aW9uKCkgeyByZXR1cm4gbGliJGVzNiRwcm9taXNlJHVtZCQkRVM2UHJvbWlzZTsgfSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGVbJ2V4cG9ydHMnXSkge1xuICAgICAgbW9kdWxlWydleHBvcnRzJ10gPSBsaWIkZXM2JHByb21pc2UkdW1kJCRFUzZQcm9taXNlO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHRoaXMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aGlzWydFUzZQcm9taXNlJ10gPSBsaWIkZXM2JHByb21pc2UkdW1kJCRFUzZQcm9taXNlO1xuICAgIH1cblxuICAgIGxpYiRlczYkcHJvbWlzZSRwb2x5ZmlsbCQkZGVmYXVsdCgpO1xufSkuY2FsbCh0aGlzKTtcblxuXG59KS5jYWxsKHRoaXMscmVxdWlyZSgnX3Byb2Nlc3MnKSx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxufSx7XCJfcHJvY2Vzc1wiOjF9XSw1MTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbmlmICghcmVxdWlyZSgnLi9pcy1pbXBsZW1lbnRlZCcpKCkpIHtcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHJlcXVpcmUoJ2VzNS1leHQvZ2xvYmFsJyksICdTZXQnLFxuXHRcdHsgdmFsdWU6IHJlcXVpcmUoJy4vcG9seWZpbGwnKSwgY29uZmlndXJhYmxlOiB0cnVlLCBlbnVtZXJhYmxlOiBmYWxzZSxcblx0XHRcdHdyaXRhYmxlOiB0cnVlIH0pO1xufVxuXG59LHtcIi4vaXMtaW1wbGVtZW50ZWRcIjo1MixcIi4vcG9seWZpbGxcIjo1NSxcImVzNS1leHQvZ2xvYmFsXCI6MTR9XSw1MjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgc2V0LCBpdGVyYXRvciwgcmVzdWx0O1xuXHRpZiAodHlwZW9mIFNldCAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuIGZhbHNlO1xuXHRpZiAoU3RyaW5nKFNldC5wcm90b3R5cGUpICE9PSAnW29iamVjdCBTZXRdJykgcmV0dXJuIGZhbHNlO1xuXHRzZXQgPSBuZXcgU2V0KFsncmF6JywgJ2R3YScsICd0cnp5J10pO1xuXHRpZiAoc2V0LnNpemUgIT09IDMpIHJldHVybiBmYWxzZTtcblx0aWYgKHR5cGVvZiBzZXQuYWRkICE9PSAnZnVuY3Rpb24nKSByZXR1cm4gZmFsc2U7XG5cdGlmICh0eXBlb2Ygc2V0LmNsZWFyICE9PSAnZnVuY3Rpb24nKSByZXR1cm4gZmFsc2U7XG5cdGlmICh0eXBlb2Ygc2V0LmRlbGV0ZSAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuIGZhbHNlO1xuXHRpZiAodHlwZW9mIHNldC5lbnRyaWVzICE9PSAnZnVuY3Rpb24nKSByZXR1cm4gZmFsc2U7XG5cdGlmICh0eXBlb2Ygc2V0LmZvckVhY2ggIT09ICdmdW5jdGlvbicpIHJldHVybiBmYWxzZTtcblx0aWYgKHR5cGVvZiBzZXQuaGFzICE9PSAnZnVuY3Rpb24nKSByZXR1cm4gZmFsc2U7XG5cdGlmICh0eXBlb2Ygc2V0LmtleXMgIT09ICdmdW5jdGlvbicpIHJldHVybiBmYWxzZTtcblx0aWYgKHR5cGVvZiBzZXQudmFsdWVzICE9PSAnZnVuY3Rpb24nKSByZXR1cm4gZmFsc2U7XG5cblx0aXRlcmF0b3IgPSBzZXQudmFsdWVzKCk7XG5cdHJlc3VsdCA9IGl0ZXJhdG9yLm5leHQoKTtcblx0aWYgKHJlc3VsdC5kb25lICE9PSBmYWxzZSkgcmV0dXJuIGZhbHNlO1xuXHRpZiAocmVzdWx0LnZhbHVlICE9PSAncmF6JykgcmV0dXJuIGZhbHNlO1xuXG5cdHJldHVybiB0cnVlO1xufTtcblxufSx7fV0sNTM6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLy8gRXhwb3J0cyB0cnVlIGlmIGVudmlyb25tZW50IHByb3ZpZGVzIG5hdGl2ZSBgU2V0YCBpbXBsZW1lbnRhdGlvbixcbi8vIHdoYXRldmVyIHRoYXQgaXMuXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKCkge1xuXHRpZiAodHlwZW9mIFNldCA9PT0gJ3VuZGVmaW5lZCcpIHJldHVybiBmYWxzZTtcblx0cmV0dXJuIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoU2V0LnByb3RvdHlwZSkgPT09ICdbb2JqZWN0IFNldF0nKTtcbn0oKSk7XG5cbn0se31dLDU0OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIHNldFByb3RvdHlwZU9mICAgID0gcmVxdWlyZSgnZXM1LWV4dC9vYmplY3Qvc2V0LXByb3RvdHlwZS1vZicpXG4gICwgY29udGFpbnMgICAgICAgICAgPSByZXF1aXJlKCdlczUtZXh0L3N0cmluZy8jL2NvbnRhaW5zJylcbiAgLCBkICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ2QnKVxuICAsIEl0ZXJhdG9yICAgICAgICAgID0gcmVxdWlyZSgnZXM2LWl0ZXJhdG9yJylcbiAgLCB0b1N0cmluZ1RhZ1N5bWJvbCA9IHJlcXVpcmUoJ2VzNi1zeW1ib2wnKS50b1N0cmluZ1RhZ1xuXG4gICwgZGVmaW5lUHJvcGVydHkgPSBPYmplY3QuZGVmaW5lUHJvcGVydHlcbiAgLCBTZXRJdGVyYXRvcjtcblxuU2V0SXRlcmF0b3IgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChzZXQsIGtpbmQpIHtcblx0aWYgKCEodGhpcyBpbnN0YW5jZW9mIFNldEl0ZXJhdG9yKSkgcmV0dXJuIG5ldyBTZXRJdGVyYXRvcihzZXQsIGtpbmQpO1xuXHRJdGVyYXRvci5jYWxsKHRoaXMsIHNldC5fX3NldERhdGFfXywgc2V0KTtcblx0aWYgKCFraW5kKSBraW5kID0gJ3ZhbHVlJztcblx0ZWxzZSBpZiAoY29udGFpbnMuY2FsbChraW5kLCAna2V5K3ZhbHVlJykpIGtpbmQgPSAna2V5K3ZhbHVlJztcblx0ZWxzZSBraW5kID0gJ3ZhbHVlJztcblx0ZGVmaW5lUHJvcGVydHkodGhpcywgJ19fa2luZF9fJywgZCgnJywga2luZCkpO1xufTtcbmlmIChzZXRQcm90b3R5cGVPZikgc2V0UHJvdG90eXBlT2YoU2V0SXRlcmF0b3IsIEl0ZXJhdG9yKTtcblxuU2V0SXRlcmF0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShJdGVyYXRvci5wcm90b3R5cGUsIHtcblx0Y29uc3RydWN0b3I6IGQoU2V0SXRlcmF0b3IpLFxuXHRfcmVzb2x2ZTogZChmdW5jdGlvbiAoaSkge1xuXHRcdGlmICh0aGlzLl9fa2luZF9fID09PSAndmFsdWUnKSByZXR1cm4gdGhpcy5fX2xpc3RfX1tpXTtcblx0XHRyZXR1cm4gW3RoaXMuX19saXN0X19baV0sIHRoaXMuX19saXN0X19baV1dO1xuXHR9KSxcblx0dG9TdHJpbmc6IGQoZnVuY3Rpb24gKCkgeyByZXR1cm4gJ1tvYmplY3QgU2V0IEl0ZXJhdG9yXSc7IH0pXG59KTtcbmRlZmluZVByb3BlcnR5KFNldEl0ZXJhdG9yLnByb3RvdHlwZSwgdG9TdHJpbmdUYWdTeW1ib2wsIGQoJ2MnLCAnU2V0IEl0ZXJhdG9yJykpO1xuXG59LHtcImRcIjoxMCxcImVzNS1leHQvb2JqZWN0L3NldC1wcm90b3R5cGUtb2ZcIjozNCxcImVzNS1leHQvc3RyaW5nLyMvY29udGFpbnNcIjozOSxcImVzNi1pdGVyYXRvclwiOjQ2LFwiZXM2LXN5bWJvbFwiOjU2fV0sNTU6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2xlYXIgICAgICAgICAgPSByZXF1aXJlKCdlczUtZXh0L2FycmF5LyMvY2xlYXInKVxuICAsIGVJbmRleE9mICAgICAgID0gcmVxdWlyZSgnZXM1LWV4dC9hcnJheS8jL2UtaW5kZXgtb2YnKVxuICAsIHNldFByb3RvdHlwZU9mID0gcmVxdWlyZSgnZXM1LWV4dC9vYmplY3Qvc2V0LXByb3RvdHlwZS1vZicpXG4gICwgY2FsbGFibGUgICAgICAgPSByZXF1aXJlKCdlczUtZXh0L29iamVjdC92YWxpZC1jYWxsYWJsZScpXG4gICwgZCAgICAgICAgICAgICAgPSByZXF1aXJlKCdkJylcbiAgLCBlZSAgICAgICAgICAgICA9IHJlcXVpcmUoJ2V2ZW50LWVtaXR0ZXInKVxuICAsIFN5bWJvbCAgICAgICAgID0gcmVxdWlyZSgnZXM2LXN5bWJvbCcpXG4gICwgaXRlcmF0b3IgICAgICAgPSByZXF1aXJlKCdlczYtaXRlcmF0b3IvdmFsaWQtaXRlcmFibGUnKVxuICAsIGZvck9mICAgICAgICAgID0gcmVxdWlyZSgnZXM2LWl0ZXJhdG9yL2Zvci1vZicpXG4gICwgSXRlcmF0b3IgICAgICAgPSByZXF1aXJlKCcuL2xpYi9pdGVyYXRvcicpXG4gICwgaXNOYXRpdmUgICAgICAgPSByZXF1aXJlKCcuL2lzLW5hdGl2ZS1pbXBsZW1lbnRlZCcpXG5cbiAgLCBjYWxsID0gRnVuY3Rpb24ucHJvdG90eXBlLmNhbGxcbiAgLCBkZWZpbmVQcm9wZXJ0eSA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSwgZ2V0UHJvdG90eXBlT2YgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2ZcbiAgLCBTZXRQb2x5LCBnZXRWYWx1ZXM7XG5cbm1vZHVsZS5leHBvcnRzID0gU2V0UG9seSA9IGZ1bmN0aW9uICgvKml0ZXJhYmxlKi8pIHtcblx0dmFyIGl0ZXJhYmxlID0gYXJndW1lbnRzWzBdLCBzZWxmO1xuXHRpZiAoISh0aGlzIGluc3RhbmNlb2YgU2V0UG9seSkpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0NvbnN0cnVjdG9yIHJlcXVpcmVzIFxcJ25ld1xcJycpO1xuXHRpZiAoaXNOYXRpdmUgJiYgc2V0UHJvdG90eXBlT2YpIHNlbGYgPSBzZXRQcm90b3R5cGVPZihuZXcgU2V0KCksIGdldFByb3RvdHlwZU9mKHRoaXMpKTtcblx0ZWxzZSBzZWxmID0gdGhpcztcblx0aWYgKGl0ZXJhYmxlICE9IG51bGwpIGl0ZXJhdG9yKGl0ZXJhYmxlKTtcblx0ZGVmaW5lUHJvcGVydHkoc2VsZiwgJ19fc2V0RGF0YV9fJywgZCgnYycsIFtdKSk7XG5cdGlmICghaXRlcmFibGUpIHJldHVybiBzZWxmO1xuXHRmb3JPZihpdGVyYWJsZSwgZnVuY3Rpb24gKHZhbHVlKSB7XG5cdFx0aWYgKGVJbmRleE9mLmNhbGwodGhpcywgdmFsdWUpICE9PSAtMSkgcmV0dXJuO1xuXHRcdHRoaXMucHVzaCh2YWx1ZSk7XG5cdH0sIHNlbGYuX19zZXREYXRhX18pO1xuXHRyZXR1cm4gc2VsZjtcbn07XG5cbmlmIChpc05hdGl2ZSkge1xuXHRpZiAoc2V0UHJvdG90eXBlT2YpIHNldFByb3RvdHlwZU9mKFNldFBvbHksIFNldCk7XG5cdFNldFBvbHkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShTZXQucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiBkKFNldFBvbHkpIH0pO1xufVxuXG5lZShPYmplY3QuZGVmaW5lUHJvcGVydGllcyhTZXRQb2x5LnByb3RvdHlwZSwge1xuXHRhZGQ6IGQoZnVuY3Rpb24gKHZhbHVlKSB7XG5cdFx0aWYgKHRoaXMuaGFzKHZhbHVlKSkgcmV0dXJuIHRoaXM7XG5cdFx0dGhpcy5lbWl0KCdfYWRkJywgdGhpcy5fX3NldERhdGFfXy5wdXNoKHZhbHVlKSAtIDEsIHZhbHVlKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSksXG5cdGNsZWFyOiBkKGZ1bmN0aW9uICgpIHtcblx0XHRpZiAoIXRoaXMuX19zZXREYXRhX18ubGVuZ3RoKSByZXR1cm47XG5cdFx0Y2xlYXIuY2FsbCh0aGlzLl9fc2V0RGF0YV9fKTtcblx0XHR0aGlzLmVtaXQoJ19jbGVhcicpO1xuXHR9KSxcblx0ZGVsZXRlOiBkKGZ1bmN0aW9uICh2YWx1ZSkge1xuXHRcdHZhciBpbmRleCA9IGVJbmRleE9mLmNhbGwodGhpcy5fX3NldERhdGFfXywgdmFsdWUpO1xuXHRcdGlmIChpbmRleCA9PT0gLTEpIHJldHVybiBmYWxzZTtcblx0XHR0aGlzLl9fc2V0RGF0YV9fLnNwbGljZShpbmRleCwgMSk7XG5cdFx0dGhpcy5lbWl0KCdfZGVsZXRlJywgaW5kZXgsIHZhbHVlKTtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSksXG5cdGVudHJpZXM6IGQoZnVuY3Rpb24gKCkgeyByZXR1cm4gbmV3IEl0ZXJhdG9yKHRoaXMsICdrZXkrdmFsdWUnKTsgfSksXG5cdGZvckVhY2g6IGQoZnVuY3Rpb24gKGNiLyosIHRoaXNBcmcqLykge1xuXHRcdHZhciB0aGlzQXJnID0gYXJndW1lbnRzWzFdLCBpdGVyYXRvciwgcmVzdWx0LCB2YWx1ZTtcblx0XHRjYWxsYWJsZShjYik7XG5cdFx0aXRlcmF0b3IgPSB0aGlzLnZhbHVlcygpO1xuXHRcdHJlc3VsdCA9IGl0ZXJhdG9yLl9uZXh0KCk7XG5cdFx0d2hpbGUgKHJlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHR2YWx1ZSA9IGl0ZXJhdG9yLl9yZXNvbHZlKHJlc3VsdCk7XG5cdFx0XHRjYWxsLmNhbGwoY2IsIHRoaXNBcmcsIHZhbHVlLCB2YWx1ZSwgdGhpcyk7XG5cdFx0XHRyZXN1bHQgPSBpdGVyYXRvci5fbmV4dCgpO1xuXHRcdH1cblx0fSksXG5cdGhhczogZChmdW5jdGlvbiAodmFsdWUpIHtcblx0XHRyZXR1cm4gKGVJbmRleE9mLmNhbGwodGhpcy5fX3NldERhdGFfXywgdmFsdWUpICE9PSAtMSk7XG5cdH0pLFxuXHRrZXlzOiBkKGdldFZhbHVlcyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMudmFsdWVzKCk7IH0pLFxuXHRzaXplOiBkLmdzKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMuX19zZXREYXRhX18ubGVuZ3RoOyB9KSxcblx0dmFsdWVzOiBkKGZ1bmN0aW9uICgpIHsgcmV0dXJuIG5ldyBJdGVyYXRvcih0aGlzKTsgfSksXG5cdHRvU3RyaW5nOiBkKGZ1bmN0aW9uICgpIHsgcmV0dXJuICdbb2JqZWN0IFNldF0nOyB9KVxufSkpO1xuZGVmaW5lUHJvcGVydHkoU2V0UG9seS5wcm90b3R5cGUsIFN5bWJvbC5pdGVyYXRvciwgZChnZXRWYWx1ZXMpKTtcbmRlZmluZVByb3BlcnR5KFNldFBvbHkucHJvdG90eXBlLCBTeW1ib2wudG9TdHJpbmdUYWcsIGQoJ2MnLCAnU2V0JykpO1xuXG59LHtcIi4vaXMtbmF0aXZlLWltcGxlbWVudGVkXCI6NTMsXCIuL2xpYi9pdGVyYXRvclwiOjU0LFwiZFwiOjEwLFwiZXM1LWV4dC9hcnJheS8jL2NsZWFyXCI6MTEsXCJlczUtZXh0L2FycmF5LyMvZS1pbmRleC1vZlwiOjEyLFwiZXM1LWV4dC9vYmplY3Qvc2V0LXByb3RvdHlwZS1vZlwiOjM0LFwiZXM1LWV4dC9vYmplY3QvdmFsaWQtY2FsbGFibGVcIjozNyxcImVzNi1pdGVyYXRvci9mb3Itb2ZcIjo0NCxcImVzNi1pdGVyYXRvci92YWxpZC1pdGVyYWJsZVwiOjQ5LFwiZXM2LXN5bWJvbFwiOjU2LFwiZXZlbnQtZW1pdHRlclwiOjYxfV0sNTY6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vaXMtaW1wbGVtZW50ZWQnKSgpID8gU3ltYm9sIDogcmVxdWlyZSgnLi9wb2x5ZmlsbCcpO1xuXG59LHtcIi4vaXMtaW1wbGVtZW50ZWRcIjo1NyxcIi4vcG9seWZpbGxcIjo1OX1dLDU3OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG5cdHZhciBzeW1ib2w7XG5cdGlmICh0eXBlb2YgU3ltYm9sICE9PSAnZnVuY3Rpb24nKSByZXR1cm4gZmFsc2U7XG5cdHN5bWJvbCA9IFN5bWJvbCgndGVzdCBzeW1ib2wnKTtcblx0dHJ5IHsgU3RyaW5nKHN5bWJvbCk7IH0gY2F0Y2ggKGUpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdGlmICh0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSAnc3ltYm9sJykgcmV0dXJuIHRydWU7XG5cblx0Ly8gUmV0dXJuICd0cnVlJyBmb3IgcG9seWZpbGxzXG5cdGlmICh0eXBlb2YgU3ltYm9sLmlzQ29uY2F0U3ByZWFkYWJsZSAhPT0gJ29iamVjdCcpIHJldHVybiBmYWxzZTtcblx0aWYgKHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgIT09ICdvYmplY3QnKSByZXR1cm4gZmFsc2U7XG5cdGlmICh0eXBlb2YgU3ltYm9sLnRvUHJpbWl0aXZlICE9PSAnb2JqZWN0JykgcmV0dXJuIGZhbHNlO1xuXHRpZiAodHlwZW9mIFN5bWJvbC50b1N0cmluZ1RhZyAhPT0gJ29iamVjdCcpIHJldHVybiBmYWxzZTtcblx0aWYgKHR5cGVvZiBTeW1ib2wudW5zY29wYWJsZXMgIT09ICdvYmplY3QnKSByZXR1cm4gZmFsc2U7XG5cblx0cmV0dXJuIHRydWU7XG59O1xuXG59LHt9XSw1ODpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHgpIHtcblx0cmV0dXJuICh4ICYmICgodHlwZW9mIHggPT09ICdzeW1ib2wnKSB8fCAoeFsnQEB0b1N0cmluZ1RhZyddID09PSAnU3ltYm9sJykpKSB8fCBmYWxzZTtcbn07XG5cbn0se31dLDU5OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIGQgICAgICAgICAgICAgID0gcmVxdWlyZSgnZCcpXG4gICwgdmFsaWRhdGVTeW1ib2wgPSByZXF1aXJlKCcuL3ZhbGlkYXRlLXN5bWJvbCcpXG5cbiAgLCBjcmVhdGUgPSBPYmplY3QuY3JlYXRlLCBkZWZpbmVQcm9wZXJ0aWVzID0gT2JqZWN0LmRlZmluZVByb3BlcnRpZXNcbiAgLCBkZWZpbmVQcm9wZXJ0eSA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSwgb2JqUHJvdG90eXBlID0gT2JqZWN0LnByb3RvdHlwZVxuICAsIE5hdGl2ZVN5bWJvbCwgU3ltYm9sUG9seWZpbGwsIEhpZGRlblN5bWJvbCwgZ2xvYmFsU3ltYm9scyA9IGNyZWF0ZShudWxsKTtcblxuaWYgKHR5cGVvZiBTeW1ib2wgPT09ICdmdW5jdGlvbicpIE5hdGl2ZVN5bWJvbCA9IFN5bWJvbDtcblxudmFyIGdlbmVyYXRlTmFtZSA9IChmdW5jdGlvbiAoKSB7XG5cdHZhciBjcmVhdGVkID0gY3JlYXRlKG51bGwpO1xuXHRyZXR1cm4gZnVuY3Rpb24gKGRlc2MpIHtcblx0XHR2YXIgcG9zdGZpeCA9IDAsIG5hbWUsIGllMTFCdWdXb3JrYXJvdW5kO1xuXHRcdHdoaWxlIChjcmVhdGVkW2Rlc2MgKyAocG9zdGZpeCB8fCAnJyldKSArK3Bvc3RmaXg7XG5cdFx0ZGVzYyArPSAocG9zdGZpeCB8fCAnJyk7XG5cdFx0Y3JlYXRlZFtkZXNjXSA9IHRydWU7XG5cdFx0bmFtZSA9ICdAQCcgKyBkZXNjO1xuXHRcdGRlZmluZVByb3BlcnR5KG9ialByb3RvdHlwZSwgbmFtZSwgZC5ncyhudWxsLCBmdW5jdGlvbiAodmFsdWUpIHtcblx0XHRcdC8vIEZvciBJRTExIGlzc3VlIHNlZTpcblx0XHRcdC8vIGh0dHBzOi8vY29ubmVjdC5taWNyb3NvZnQuY29tL0lFL2ZlZWRiYWNrZGV0YWlsL3ZpZXcvMTkyODUwOC9cblx0XHRcdC8vICAgIGllMTEtYnJva2VuLWdldHRlcnMtb24tZG9tLW9iamVjdHNcblx0XHRcdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tZWRpa29vL2VzNi1zeW1ib2wvaXNzdWVzLzEyXG5cdFx0XHRpZiAoaWUxMUJ1Z1dvcmthcm91bmQpIHJldHVybjtcblx0XHRcdGllMTFCdWdXb3JrYXJvdW5kID0gdHJ1ZTtcblx0XHRcdGRlZmluZVByb3BlcnR5KHRoaXMsIG5hbWUsIGQodmFsdWUpKTtcblx0XHRcdGllMTFCdWdXb3JrYXJvdW5kID0gZmFsc2U7XG5cdFx0fSkpO1xuXHRcdHJldHVybiBuYW1lO1xuXHR9O1xufSgpKTtcblxuSGlkZGVuU3ltYm9sID0gZnVuY3Rpb24gU3ltYm9sKGRlc2NyaXB0aW9uKSB7XG5cdGlmICh0aGlzIGluc3RhbmNlb2YgSGlkZGVuU3ltYm9sKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdUeXBlRXJyb3I6IFN5bWJvbCBpcyBub3QgYSBjb25zdHJ1Y3RvcicpO1xuXHRyZXR1cm4gU3ltYm9sUG9seWZpbGwoZGVzY3JpcHRpb24pO1xufTtcbm1vZHVsZS5leHBvcnRzID0gU3ltYm9sUG9seWZpbGwgPSBmdW5jdGlvbiBTeW1ib2woZGVzY3JpcHRpb24pIHtcblx0dmFyIHN5bWJvbDtcblx0aWYgKHRoaXMgaW5zdGFuY2VvZiBTeW1ib2wpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1R5cGVFcnJvcjogU3ltYm9sIGlzIG5vdCBhIGNvbnN0cnVjdG9yJyk7XG5cdHN5bWJvbCA9IGNyZWF0ZShIaWRkZW5TeW1ib2wucHJvdG90eXBlKTtcblx0ZGVzY3JpcHRpb24gPSAoZGVzY3JpcHRpb24gPT09IHVuZGVmaW5lZCA/ICcnIDogU3RyaW5nKGRlc2NyaXB0aW9uKSk7XG5cdHJldHVybiBkZWZpbmVQcm9wZXJ0aWVzKHN5bWJvbCwge1xuXHRcdF9fZGVzY3JpcHRpb25fXzogZCgnJywgZGVzY3JpcHRpb24pLFxuXHRcdF9fbmFtZV9fOiBkKCcnLCBnZW5lcmF0ZU5hbWUoZGVzY3JpcHRpb24pKVxuXHR9KTtcbn07XG5kZWZpbmVQcm9wZXJ0aWVzKFN5bWJvbFBvbHlmaWxsLCB7XG5cdGZvcjogZChmdW5jdGlvbiAoa2V5KSB7XG5cdFx0aWYgKGdsb2JhbFN5bWJvbHNba2V5XSkgcmV0dXJuIGdsb2JhbFN5bWJvbHNba2V5XTtcblx0XHRyZXR1cm4gKGdsb2JhbFN5bWJvbHNba2V5XSA9IFN5bWJvbFBvbHlmaWxsKFN0cmluZyhrZXkpKSk7XG5cdH0pLFxuXHRrZXlGb3I6IGQoZnVuY3Rpb24gKHMpIHtcblx0XHR2YXIga2V5O1xuXHRcdHZhbGlkYXRlU3ltYm9sKHMpO1xuXHRcdGZvciAoa2V5IGluIGdsb2JhbFN5bWJvbHMpIGlmIChnbG9iYWxTeW1ib2xzW2tleV0gPT09IHMpIHJldHVybiBrZXk7XG5cdH0pLFxuXHRoYXNJbnN0YW5jZTogZCgnJywgKE5hdGl2ZVN5bWJvbCAmJiBOYXRpdmVTeW1ib2wuaGFzSW5zdGFuY2UpIHx8IFN5bWJvbFBvbHlmaWxsKCdoYXNJbnN0YW5jZScpKSxcblx0aXNDb25jYXRTcHJlYWRhYmxlOiBkKCcnLCAoTmF0aXZlU3ltYm9sICYmIE5hdGl2ZVN5bWJvbC5pc0NvbmNhdFNwcmVhZGFibGUpIHx8XG5cdFx0U3ltYm9sUG9seWZpbGwoJ2lzQ29uY2F0U3ByZWFkYWJsZScpKSxcblx0aXRlcmF0b3I6IGQoJycsIChOYXRpdmVTeW1ib2wgJiYgTmF0aXZlU3ltYm9sLml0ZXJhdG9yKSB8fCBTeW1ib2xQb2x5ZmlsbCgnaXRlcmF0b3InKSksXG5cdG1hdGNoOiBkKCcnLCAoTmF0aXZlU3ltYm9sICYmIE5hdGl2ZVN5bWJvbC5tYXRjaCkgfHwgU3ltYm9sUG9seWZpbGwoJ21hdGNoJykpLFxuXHRyZXBsYWNlOiBkKCcnLCAoTmF0aXZlU3ltYm9sICYmIE5hdGl2ZVN5bWJvbC5yZXBsYWNlKSB8fCBTeW1ib2xQb2x5ZmlsbCgncmVwbGFjZScpKSxcblx0c2VhcmNoOiBkKCcnLCAoTmF0aXZlU3ltYm9sICYmIE5hdGl2ZVN5bWJvbC5zZWFyY2gpIHx8IFN5bWJvbFBvbHlmaWxsKCdzZWFyY2gnKSksXG5cdHNwZWNpZXM6IGQoJycsIChOYXRpdmVTeW1ib2wgJiYgTmF0aXZlU3ltYm9sLnNwZWNpZXMpIHx8IFN5bWJvbFBvbHlmaWxsKCdzcGVjaWVzJykpLFxuXHRzcGxpdDogZCgnJywgKE5hdGl2ZVN5bWJvbCAmJiBOYXRpdmVTeW1ib2wuc3BsaXQpIHx8IFN5bWJvbFBvbHlmaWxsKCdzcGxpdCcpKSxcblx0dG9QcmltaXRpdmU6IGQoJycsIChOYXRpdmVTeW1ib2wgJiYgTmF0aXZlU3ltYm9sLnRvUHJpbWl0aXZlKSB8fCBTeW1ib2xQb2x5ZmlsbCgndG9QcmltaXRpdmUnKSksXG5cdHRvU3RyaW5nVGFnOiBkKCcnLCAoTmF0aXZlU3ltYm9sICYmIE5hdGl2ZVN5bWJvbC50b1N0cmluZ1RhZykgfHwgU3ltYm9sUG9seWZpbGwoJ3RvU3RyaW5nVGFnJykpLFxuXHR1bnNjb3BhYmxlczogZCgnJywgKE5hdGl2ZVN5bWJvbCAmJiBOYXRpdmVTeW1ib2wudW5zY29wYWJsZXMpIHx8IFN5bWJvbFBvbHlmaWxsKCd1bnNjb3BhYmxlcycpKVxufSk7XG5kZWZpbmVQcm9wZXJ0aWVzKEhpZGRlblN5bWJvbC5wcm90b3R5cGUsIHtcblx0Y29uc3RydWN0b3I6IGQoU3ltYm9sUG9seWZpbGwpLFxuXHR0b1N0cmluZzogZCgnJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5fX25hbWVfXzsgfSlcbn0pO1xuXG5kZWZpbmVQcm9wZXJ0aWVzKFN5bWJvbFBvbHlmaWxsLnByb3RvdHlwZSwge1xuXHR0b1N0cmluZzogZChmdW5jdGlvbiAoKSB7IHJldHVybiAnU3ltYm9sICgnICsgdmFsaWRhdGVTeW1ib2wodGhpcykuX19kZXNjcmlwdGlvbl9fICsgJyknOyB9KSxcblx0dmFsdWVPZjogZChmdW5jdGlvbiAoKSB7IHJldHVybiB2YWxpZGF0ZVN5bWJvbCh0aGlzKTsgfSlcbn0pO1xuZGVmaW5lUHJvcGVydHkoU3ltYm9sUG9seWZpbGwucHJvdG90eXBlLCBTeW1ib2xQb2x5ZmlsbC50b1ByaW1pdGl2ZSwgZCgnJyxcblx0ZnVuY3Rpb24gKCkgeyByZXR1cm4gdmFsaWRhdGVTeW1ib2wodGhpcyk7IH0pKTtcbmRlZmluZVByb3BlcnR5KFN5bWJvbFBvbHlmaWxsLnByb3RvdHlwZSwgU3ltYm9sUG9seWZpbGwudG9TdHJpbmdUYWcsIGQoJ2MnLCAnU3ltYm9sJykpO1xuXG5kZWZpbmVQcm9wZXJ0eShIaWRkZW5TeW1ib2wucHJvdG90eXBlLCBTeW1ib2xQb2x5ZmlsbC50b1ByaW1pdGl2ZSxcblx0ZCgnYycsIFN5bWJvbFBvbHlmaWxsLnByb3RvdHlwZVtTeW1ib2xQb2x5ZmlsbC50b1ByaW1pdGl2ZV0pKTtcbmRlZmluZVByb3BlcnR5KEhpZGRlblN5bWJvbC5wcm90b3R5cGUsIFN5bWJvbFBvbHlmaWxsLnRvU3RyaW5nVGFnLFxuXHRkKCdjJywgU3ltYm9sUG9seWZpbGwucHJvdG90eXBlW1N5bWJvbFBvbHlmaWxsLnRvU3RyaW5nVGFnXSkpO1xuXG59LHtcIi4vdmFsaWRhdGUtc3ltYm9sXCI6NjAsXCJkXCI6MTB9XSw2MDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBpc1N5bWJvbCA9IHJlcXVpcmUoJy4vaXMtc3ltYm9sJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdGlmICghaXNTeW1ib2wodmFsdWUpKSB0aHJvdyBuZXcgVHlwZUVycm9yKHZhbHVlICsgXCIgaXMgbm90IGEgc3ltYm9sXCIpO1xuXHRyZXR1cm4gdmFsdWU7XG59O1xuXG59LHtcIi4vaXMtc3ltYm9sXCI6NTh9XSw2MTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBkICAgICAgICA9IHJlcXVpcmUoJ2QnKVxuICAsIGNhbGxhYmxlID0gcmVxdWlyZSgnZXM1LWV4dC9vYmplY3QvdmFsaWQtY2FsbGFibGUnKVxuXG4gICwgYXBwbHkgPSBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHksIGNhbGwgPSBGdW5jdGlvbi5wcm90b3R5cGUuY2FsbFxuICAsIGNyZWF0ZSA9IE9iamVjdC5jcmVhdGUsIGRlZmluZVByb3BlcnR5ID0gT2JqZWN0LmRlZmluZVByb3BlcnR5XG4gICwgZGVmaW5lUHJvcGVydGllcyA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzXG4gICwgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG4gICwgZGVzY3JpcHRvciA9IHsgY29uZmlndXJhYmxlOiB0cnVlLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUgfVxuXG4gICwgb24sIG9uY2UsIG9mZiwgZW1pdCwgbWV0aG9kcywgZGVzY3JpcHRvcnMsIGJhc2U7XG5cbm9uID0gZnVuY3Rpb24gKHR5cGUsIGxpc3RlbmVyKSB7XG5cdHZhciBkYXRhO1xuXG5cdGNhbGxhYmxlKGxpc3RlbmVyKTtcblxuXHRpZiAoIWhhc093blByb3BlcnR5LmNhbGwodGhpcywgJ19fZWVfXycpKSB7XG5cdFx0ZGF0YSA9IGRlc2NyaXB0b3IudmFsdWUgPSBjcmVhdGUobnVsbCk7XG5cdFx0ZGVmaW5lUHJvcGVydHkodGhpcywgJ19fZWVfXycsIGRlc2NyaXB0b3IpO1xuXHRcdGRlc2NyaXB0b3IudmFsdWUgPSBudWxsO1xuXHR9IGVsc2Uge1xuXHRcdGRhdGEgPSB0aGlzLl9fZWVfXztcblx0fVxuXHRpZiAoIWRhdGFbdHlwZV0pIGRhdGFbdHlwZV0gPSBsaXN0ZW5lcjtcblx0ZWxzZSBpZiAodHlwZW9mIGRhdGFbdHlwZV0gPT09ICdvYmplY3QnKSBkYXRhW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuXHRlbHNlIGRhdGFbdHlwZV0gPSBbZGF0YVt0eXBlXSwgbGlzdGVuZXJdO1xuXG5cdHJldHVybiB0aGlzO1xufTtcblxub25jZSA9IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lcikge1xuXHR2YXIgb25jZSwgc2VsZjtcblxuXHRjYWxsYWJsZShsaXN0ZW5lcik7XG5cdHNlbGYgPSB0aGlzO1xuXHRvbi5jYWxsKHRoaXMsIHR5cGUsIG9uY2UgPSBmdW5jdGlvbiAoKSB7XG5cdFx0b2ZmLmNhbGwoc2VsZiwgdHlwZSwgb25jZSk7XG5cdFx0YXBwbHkuY2FsbChsaXN0ZW5lciwgdGhpcywgYXJndW1lbnRzKTtcblx0fSk7XG5cblx0b25jZS5fX2VlT25jZUxpc3RlbmVyX18gPSBsaXN0ZW5lcjtcblx0cmV0dXJuIHRoaXM7XG59O1xuXG5vZmYgPSBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIpIHtcblx0dmFyIGRhdGEsIGxpc3RlbmVycywgY2FuZGlkYXRlLCBpO1xuXG5cdGNhbGxhYmxlKGxpc3RlbmVyKTtcblxuXHRpZiAoIWhhc093blByb3BlcnR5LmNhbGwodGhpcywgJ19fZWVfXycpKSByZXR1cm4gdGhpcztcblx0ZGF0YSA9IHRoaXMuX19lZV9fO1xuXHRpZiAoIWRhdGFbdHlwZV0pIHJldHVybiB0aGlzO1xuXHRsaXN0ZW5lcnMgPSBkYXRhW3R5cGVdO1xuXG5cdGlmICh0eXBlb2YgbGlzdGVuZXJzID09PSAnb2JqZWN0Jykge1xuXHRcdGZvciAoaSA9IDA7IChjYW5kaWRhdGUgPSBsaXN0ZW5lcnNbaV0pOyArK2kpIHtcblx0XHRcdGlmICgoY2FuZGlkYXRlID09PSBsaXN0ZW5lcikgfHxcblx0XHRcdFx0XHQoY2FuZGlkYXRlLl9fZWVPbmNlTGlzdGVuZXJfXyA9PT0gbGlzdGVuZXIpKSB7XG5cdFx0XHRcdGlmIChsaXN0ZW5lcnMubGVuZ3RoID09PSAyKSBkYXRhW3R5cGVdID0gbGlzdGVuZXJzW2kgPyAwIDogMV07XG5cdFx0XHRcdGVsc2UgbGlzdGVuZXJzLnNwbGljZShpLCAxKTtcblx0XHRcdH1cblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0aWYgKChsaXN0ZW5lcnMgPT09IGxpc3RlbmVyKSB8fFxuXHRcdFx0XHQobGlzdGVuZXJzLl9fZWVPbmNlTGlzdGVuZXJfXyA9PT0gbGlzdGVuZXIpKSB7XG5cdFx0XHRkZWxldGUgZGF0YVt0eXBlXTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdGhpcztcbn07XG5cbmVtaXQgPSBmdW5jdGlvbiAodHlwZSkge1xuXHR2YXIgaSwgbCwgbGlzdGVuZXIsIGxpc3RlbmVycywgYXJncztcblxuXHRpZiAoIWhhc093blByb3BlcnR5LmNhbGwodGhpcywgJ19fZWVfXycpKSByZXR1cm47XG5cdGxpc3RlbmVycyA9IHRoaXMuX19lZV9fW3R5cGVdO1xuXHRpZiAoIWxpc3RlbmVycykgcmV0dXJuO1xuXG5cdGlmICh0eXBlb2YgbGlzdGVuZXJzID09PSAnb2JqZWN0Jykge1xuXHRcdGwgPSBhcmd1bWVudHMubGVuZ3RoO1xuXHRcdGFyZ3MgPSBuZXcgQXJyYXkobCAtIDEpO1xuXHRcdGZvciAoaSA9IDE7IGkgPCBsOyArK2kpIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXG5cdFx0bGlzdGVuZXJzID0gbGlzdGVuZXJzLnNsaWNlKCk7XG5cdFx0Zm9yIChpID0gMDsgKGxpc3RlbmVyID0gbGlzdGVuZXJzW2ldKTsgKytpKSB7XG5cdFx0XHRhcHBseS5jYWxsKGxpc3RlbmVyLCB0aGlzLCBhcmdzKTtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0c3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG5cdFx0Y2FzZSAxOlxuXHRcdFx0Y2FsbC5jYWxsKGxpc3RlbmVycywgdGhpcyk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIDI6XG5cdFx0XHRjYWxsLmNhbGwobGlzdGVuZXJzLCB0aGlzLCBhcmd1bWVudHNbMV0pO1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAzOlxuXHRcdFx0Y2FsbC5jYWxsKGxpc3RlbmVycywgdGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuXHRcdFx0YnJlYWs7XG5cdFx0ZGVmYXVsdDpcblx0XHRcdGwgPSBhcmd1bWVudHMubGVuZ3RoO1xuXHRcdFx0YXJncyA9IG5ldyBBcnJheShsIC0gMSk7XG5cdFx0XHRmb3IgKGkgPSAxOyBpIDwgbDsgKytpKSB7XG5cdFx0XHRcdGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXHRcdFx0fVxuXHRcdFx0YXBwbHkuY2FsbChsaXN0ZW5lcnMsIHRoaXMsIGFyZ3MpO1xuXHRcdH1cblx0fVxufTtcblxubWV0aG9kcyA9IHtcblx0b246IG9uLFxuXHRvbmNlOiBvbmNlLFxuXHRvZmY6IG9mZixcblx0ZW1pdDogZW1pdFxufTtcblxuZGVzY3JpcHRvcnMgPSB7XG5cdG9uOiBkKG9uKSxcblx0b25jZTogZChvbmNlKSxcblx0b2ZmOiBkKG9mZiksXG5cdGVtaXQ6IGQoZW1pdClcbn07XG5cbmJhc2UgPSBkZWZpbmVQcm9wZXJ0aWVzKHt9LCBkZXNjcmlwdG9ycyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IGZ1bmN0aW9uIChvKSB7XG5cdHJldHVybiAobyA9PSBudWxsKSA/IGNyZWF0ZShiYXNlKSA6IGRlZmluZVByb3BlcnRpZXMoT2JqZWN0KG8pLCBkZXNjcmlwdG9ycyk7XG59O1xuZXhwb3J0cy5tZXRob2RzID0gbWV0aG9kcztcblxufSx7XCJkXCI6MTAsXCJlczUtZXh0L29iamVjdC92YWxpZC1jYWxsYWJsZVwiOjM3fV0sNjI6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vdHlwaW5ncy90c2QuZC50c1wiIC8+XG4ndXNlIHN0cmljdCc7XG5cbnZhciBMID0gd2luZG93Lkw7XG5mdW5jdGlvbiBkaWZmQnlPbmUoYSwgYikge1xuICAgIHZhciBkaWZmID0gMDtcbiAgICBpZiAoYSAhPT0gJycgJiYgYiAhPT0gJycgJiYgYS5sZW5ndGggPT09IGIubGVuZ3RoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gMDsgaSA8IGEubGVuZ3RoICYmIGogPCBiLmxlbmd0aDsgKytpLCArK2opIHtcbiAgICAgICAgICAgIGlmIChhW2ldICE9IGJbal0pIHtcbiAgICAgICAgICAgICAgICArK2RpZmY7XG4gICAgICAgICAgICAgICAgaWYgKGFbaSArIDFdID09PSBiW2pdKSB7XG4gICAgICAgICAgICAgICAgICAgICsraTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFbaV0gPT09IGJbaiArIDFdKSB7XG4gICAgICAgICAgICAgICAgICAgICsrajtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFbaSArIDFdID09PSBiW2ogKyAxXSkge1xuICAgICAgICAgICAgICAgICAgICArK2k7IC8vXG4gICAgICAgICAgICAgICAgICAgICsrajtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRpZmYgPT09IDE7XG59XG5leHBvcnRzLmRpZmZCeU9uZSA9IGRpZmZCeU9uZTtcbmZ1bmN0aW9uIGdldFVzZXJMYW5ndWFnZSgpIHtcbiAgICByZXR1cm4gKG5hdmlnYXRvci51c2VyTGFuZ3VhZ2UgfHwgbmF2aWdhdG9yLmxhbmd1YWdlKS5zbGljZSgwLCAyKS50b0xvd2VyQ2FzZSgpO1xufVxuZXhwb3J0cy5nZXRVc2VyTGFuZ3VhZ2UgPSBnZXRVc2VyTGFuZ3VhZ2U7XG5mdW5jdGlvbiBwYXJzZVRyYW5zZm9ybSh2YWwpIHtcbiAgICB2YXIgbWF0Y2hlcyA9IHZhbC5tYXRjaCgvdHJhbnNsYXRlKDNkKT9cXCgoLT9cXGQrKS4qPyxcXHM/KC0/XFxkKykuKj8oLFxccz8oLT9cXGQrKS4qPyk/XFwpL2kpO1xuICAgIHJldHVybiBtYXRjaGVzID8gbmV3IEwuUG9pbnQoTnVtYmVyKG1hdGNoZXNbMl0pLCBOdW1iZXIobWF0Y2hlc1szXSkpIDogbmV3IEwuUG9pbnQoMCwgMCk7XG59XG5leHBvcnRzLnBhcnNlVHJhbnNmb3JtID0gcGFyc2VUcmFuc2Zvcm07XG5mdW5jdGlvbiBmaW5kQ2lyY2xlKGdyYXBoLCBzdGF0aW9uKSB7XG4gICAgaWYgKHN0YXRpb24ucGxhdGZvcm1zLmxlbmd0aCAhPT0gMykgcmV0dXJuIG51bGw7XG4gICAgdmFyIHBsYXRmb3JtcyA9IHN0YXRpb24ucGxhdGZvcm1zLm1hcChmdW5jdGlvbiAocGxhdGZvcm1OdW0pIHtcbiAgICAgICAgcmV0dXJuIGdyYXBoLnBsYXRmb3Jtc1twbGF0Zm9ybU51bV07XG4gICAgfSk7XG4gICAgcmV0dXJuIHBsYXRmb3Jtcy5ldmVyeShmdW5jdGlvbiAocGxhdGZvcm0pIHtcbiAgICAgICAgcmV0dXJuIHBsYXRmb3JtLnRyYW5zZmVycy5sZW5ndGggPT09IDI7XG4gICAgfSkgPyBwbGF0Zm9ybXMgOiBudWxsO1xufVxuZXhwb3J0cy5maW5kQ2lyY2xlID0gZmluZENpcmNsZTtcbmZ1bmN0aW9uIGdldENpcmN1bWNlbnRlcihwb3NpdGlvbnMpIHtcbiAgICBpZiAocG9zaXRpb25zLmxlbmd0aCAhPT0gMykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ211c3QgaGF2ZSAzIHZlcnRpY2VzJyk7XG4gICAgfVxuICAgIHZhciBiID0gcG9zaXRpb25zWzFdLnN1YnRyYWN0KHBvc2l0aW9uc1swXSk7XG4gICAgdmFyIGMgPSBwb3NpdGlvbnNbMl0uc3VidHJhY3QocG9zaXRpb25zWzBdKTtcbiAgICB2YXIgYmIgPSBkb3QoYiwgYik7XG4gICAgdmFyIGNjID0gZG90KGMsIGMpO1xuICAgIHJldHVybiBuZXcgTC5Qb2ludChjLnkgKiBiYiAtIGIueSAqIGNjLCBiLnggKiBjYyAtIGMueCAqIGJiKS5kaXZpZGVCeSgyLjAgKiAoYi54ICogYy55IC0gYi55ICogYy54KSkuYWRkKHBvc2l0aW9uc1swXSk7XG59XG5leHBvcnRzLmdldENpcmN1bWNlbnRlciA9IGdldENpcmN1bWNlbnRlcjtcbmZ1bmN0aW9uIGdldFNWR0RhdGFzZXQoZWwpIHtcbiAgICAvLyBmb3Igd2Via2l0LWJhc2VkIGJyb3dzZXJzXG4gICAgaWYgKCdkYXRhc2V0JyBpbiBlbCkge1xuICAgICAgICByZXR1cm4gZWxbJ2RhdGFzZXQnXTtcbiAgICB9XG4gICAgLy8gZm9yIHRoZSByZXN0XG4gICAgdmFyIGF0dHJzID0gZWwuYXR0cmlidXRlcztcbiAgICB2YXIgZGF0YXNldCA9IHt9O1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXR0cnMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGF0dHIgPSBhdHRyc1tpXS5uYW1lO1xuICAgICAgICBpZiAoYXR0ci5zdGFydHNXaXRoKCdkYXRhLScpKSB7XG4gICAgICAgICAgICBkYXRhc2V0W2F0dHIuc2xpY2UoNSldID0gZWwuZ2V0QXR0cmlidXRlKGF0dHIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkYXRhc2V0O1xufVxuZXhwb3J0cy5nZXRTVkdEYXRhc2V0ID0gZ2V0U1ZHRGF0YXNldDtcbmZ1bmN0aW9uIHNldFNWR0RhdGFzZXQoZWwsIGRhdGFzZXQpIHtcbiAgICBPYmplY3Qua2V5cyhkYXRhc2V0KS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgcmV0dXJuIGVsLnNldEF0dHJpYnV0ZSgnZGF0YS0nICsga2V5LCBkYXRhc2V0W2tleV0pO1xuICAgIH0pO1xufVxuZXhwb3J0cy5zZXRTVkdEYXRhc2V0ID0gc2V0U1ZHRGF0YXNldDtcbmZ1bmN0aW9uIGZsYXNoVGl0bGUodGl0bGVzLCBkdXJhdGlvbikge1xuICAgIHZhciBpID0gMDtcbiAgICBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBkb2N1bWVudC50aXRsZSA9IHRpdGxlc1srK2kgJSB0aXRsZXMubGVuZ3RoXTtcbiAgICB9LCBkdXJhdGlvbik7XG59XG5leHBvcnRzLmZsYXNoVGl0bGUgPSBmbGFzaFRpdGxlO1xuZnVuY3Rpb24gZG90KGEsIGIpIHtcbiAgICByZXR1cm4gYS54ICogYi54ICsgYS55ICogYi55O1xufVxuZXhwb3J0cy5kb3QgPSBkb3Q7XG5mdW5jdGlvbiBhbmdsZSh2MSwgdjIpIHtcbiAgICByZXR1cm4gZG90KHYxLCB2MikgLyB2MS5kaXN0YW5jZVRvKHYyKTtcbn1cbmV4cG9ydHMuYW5nbGUgPSBhbmdsZTtcbmZ1bmN0aW9uIGdldENlbnRlcihwdHMpIHtcbiAgICByZXR1cm4gcHRzLnJlZHVjZShmdW5jdGlvbiAocHJldiwgY3VyKSB7XG4gICAgICAgIHJldHVybiBwcmV2LmFkZChjdXIpO1xuICAgIH0pLmRpdmlkZUJ5KHB0cy5sZW5ndGgpO1xufVxuZXhwb3J0cy5nZXRDZW50ZXIgPSBnZXRDZW50ZXI7XG5mdW5jdGlvbiB2ZXJpZnlIaW50cyhncmFwaCwgaGludHMpIHtcbiAgICBmdW5jdGlvbiBjaGVja1BsYXRmb3JtSGludE9iamVjdChvYmopIHtcbiAgICAgICAgT2JqZWN0LmtleXMob2JqKS5mb3JFYWNoKGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgICAgICB2YXIgdmFsID0gb2JqW2xpbmVdO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgaWYgKGdyYXBoLnBsYXRmb3Jtcy5maW5kKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZWwubmFtZSA9PT0gdmFsO1xuICAgICAgICAgICAgICAgIH0pID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGxhdGZvcm0gXCIgKyB2YWwgKyBcIiBkb2Vzbid0IGV4aXN0XCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFsLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdyYXBoLnBsYXRmb3Jtcy5maW5kKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsLm5hbWUgPT09IGl0ZW07XG4gICAgICAgICAgICAgICAgICAgIH0pID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInBsYXRmb3JtIFwiICsgaXRlbSArIFwiIGRvZXNuJ3QgZXhpc3RcIik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIHZhciBjcm9zc1BsYXRmb3JtID0gaGludHMuY3Jvc3NQbGF0Zm9ybTtcbiAgICAgICAgT2JqZWN0LmtleXMoY3Jvc3NQbGF0Zm9ybSkuZm9yRWFjaChmdW5jdGlvbiAocGxhdGZvcm1OYW1lKSB7XG4gICAgICAgICAgICBpZiAoZ3JhcGgucGxhdGZvcm1zLmZpbmQoZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsLm5hbWUgPT09IHBsYXRmb3JtTmFtZTtcbiAgICAgICAgICAgIH0pID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoXCJwbGF0Zm9ybSBcIiArIHBsYXRmb3JtTmFtZSArIFwiIGRvZXNuJ3QgZXhpc3RcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgb2JqID0gY3Jvc3NQbGF0Zm9ybVtwbGF0Zm9ybU5hbWVdO1xuICAgICAgICAgICAgaWYgKCdmb3JFYWNoJyBpbiBvYmopIHtcbiAgICAgICAgICAgICAgICBvYmouZm9yRWFjaChmdW5jdGlvbiAobykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2hlY2tQbGF0Zm9ybUhpbnRPYmplY3Q7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNoZWNrUGxhdGZvcm1IaW50T2JqZWN0KG9iaik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBPYmplY3Qua2V5cyhoaW50cy5lbmdsaXNoTmFtZXMpLmZvckVhY2goZnVuY3Rpb24gKHBsYXRmb3JtTmFtZSkge1xuICAgICAgICAgICAgaWYgKGdyYXBoLnBsYXRmb3Jtcy5maW5kKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbC5uYW1lID09PSBwbGF0Zm9ybU5hbWU7XG4gICAgICAgICAgICB9KSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KFwicGxhdGZvcm0gXCIgKyBwbGF0Zm9ybU5hbWUgKyBcIiBkb2Vzbid0IGV4aXN0XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzb2x2ZSgnaGludHMganNvbiBzZWVtcyBva2F5Jyk7XG4gICAgfSk7XG59XG5leHBvcnRzLnZlcmlmeUhpbnRzID0gdmVyaWZ5SGludHM7XG4vKipcclxuICogbnVsbDogZG9lc24ndCBjb250YWluXHJcbiAqIC0xOiBpcyBhbiBvYmplY3RcclxuICogPj0wOiBpcyBhbiBhcnJheVxyXG4gKi9cbmZ1bmN0aW9uIGhpbnRDb250YWluc0xpbmUoZ3JhcGgsIGRpckhpbnRzLCBwbGF0Zm9ybSkge1xuICAgIHZhciBzcGFucyA9IHBsYXRmb3JtLnNwYW5zLm1hcChmdW5jdGlvbiAoaSkge1xuICAgICAgICByZXR1cm4gZ3JhcGguc3BhbnNbaV07XG4gICAgfSk7XG4gICAgdmFyIHJvdXRlcyA9IFtdO1xuICAgIHNwYW5zLmZvckVhY2goZnVuY3Rpb24gKHNwYW4pIHtcbiAgICAgICAgcmV0dXJuIHNwYW4ucm91dGVzLmZvckVhY2goZnVuY3Rpb24gKGkpIHtcbiAgICAgICAgICAgIHJldHVybiByb3V0ZXMucHVzaChncmFwaC5yb3V0ZXNbaV0pO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICB2YXIgbGluZXMgPSByb3V0ZXMubWFwKGZ1bmN0aW9uIChydCkge1xuICAgICAgICByZXR1cm4gcnQubGluZTtcbiAgICB9KTtcbiAgICB2YXIgcGxhdGZvcm1IaW50cyA9IGRpckhpbnRzW3BsYXRmb3JtLm5hbWVdO1xuICAgIGlmIChwbGF0Zm9ybUhpbnRzKSB7XG4gICAgICAgIGlmICgnZm9yRWFjaCcgaW4gcGxhdGZvcm1IaW50cykge1xuICAgICAgICAgICAgZm9yICh2YXIgaWR4ID0gMDsgaWR4IDwgcGxhdGZvcm1IaW50cy5sZW5ndGg7ICsraWR4KSB7XG4gICAgICAgICAgICAgICAgaWYgKE9iamVjdC5rZXlzKHBsYXRmb3JtSGludHNbaWR4XSkuc29tZShmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBsaW5lcy5pbmRleE9mKGtleSkgPiAtMTtcbiAgICAgICAgICAgICAgICB9KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaWR4O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChPYmplY3Qua2V5cyhwbGF0Zm9ybUhpbnRzKS5zb21lKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBsaW5lcy5pbmRleE9mKGtleSkgPiAtMTtcbiAgICAgICAgfSkpIHtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cbmV4cG9ydHMuaGludENvbnRhaW5zTGluZSA9IGhpbnRDb250YWluc0xpbmU7XG5mdW5jdGlvbiBkb3dubG9hZEFzRmlsZSh0aXRsZSwgY29udGVudCkge1xuICAgIHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgIHZhciBibG9iID0gbmV3IEJsb2IoW2NvbnRlbnRdLCB7IHR5cGU6IFwib2N0ZXQvc3RyZWFtXCIgfSk7XG4gICAgdmFyIHVybCA9IHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICAgIGEuaHJlZiA9IHVybDtcbiAgICBhWydkb3dubG9hZCddID0gdGl0bGU7XG4gICAgYS5jbGljaygpO1xuICAgIHdpbmRvdy5VUkwucmV2b2tlT2JqZWN0VVJMKHVybCk7XG59XG5leHBvcnRzLmRvd25sb2FkQXNGaWxlID0gZG93bmxvYWRBc0ZpbGU7XG5cblxufSx7fV19LHt9LFszXSk7XG4iXSwiZmlsZSI6InNjcmlwdC5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
