'use strict';
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../typings/tsd.d.ts" />
var https = require('https');
var tr = require('../metro-graph');
var util = require('../util');
var geo = require('../geo');
var libxmljs = require('libxmljs');
//import xml2js = require('xml2js');
var fs = require('fs');
//import * as https from 'https';
//import * as tr from '../metro-graph';
//import IAdapter from './geo-to-transport-adapter';
//import * as util from '../util';
//import * as geo from '../geo';
//import * as libxmljs from 'libxmljs';
//import * as fs from 'fs';
var L = {
    LatLng: require('leaflet').LatLng,
    Point: require('leaflet').Point
};
// errors in meters
let transferOverlapError = 20;
let distanceError = 50; //
let sameJunctionError = 1000;
// a kludge to avoid 'L' is undefined
var YaObject = (function () {
    function YaObject(name, description) {
        if (description === void 0) { description = ''; }
        this.name = name;
        this.description = description;
    }
    return YaObject;
})();
var YaPoint = (function (_super) {
    __extends(YaPoint, _super);
    function YaPoint(location, name, description) {
        if (description === void 0) { description = ''; }
        _super.call(this, name, description);
        this.location = location;
    }
    return YaPoint;
})(YaObject);
var YaPath = (function (_super) {
    __extends(YaPath, _super);
    function YaPath(points, name, description) {
        if (description === void 0) { description = ''; }
        _super.call(this, name, description);
        this.points = points;
    }
    return YaPath;
})(YaObject);
var Yadapter = (function () {
    function Yadapter(url) {
        this.kml = '';
        this.graph = new tr.MetroGraph();
        //if (!/maps\.yandex\.ru/ig.test(url)) throw new Error('incorrect URL provided');
        this.url = url;
    }
    Yadapter.prototype.parseFile = function (cb) {
        var _this = this;
        https.get(this.url, function (kmlResp) {
            kmlResp.on('data', function (chunk) { return _this.kml += chunk; }).on('end', function () {
                _this.kmlToGraph();
                fs.writeFile('./json/graph.json', _this.graph.toJSON(), 'utf8', function (err) {
                    console.log('graph written');
                    if (typeof cb === 'function')
                        return cb();
                });
            }).on('error', function (err) {
                throw err;
            });
            console.log('getting kml file...');
        }).on('error', function (err) {
            throw err;
        }).on('end', function () { return console.log('request ended'); });
    };
    Yadapter.prototype.kmlToGraph = function () {
        var _this = this;
        console.log('parsing KML file...');
        //let parser = new DOMParser();
        //let xmlDoc = parser.parseFromString(this.kml, 'text/xml');
        //let folder = utils.x2js(xmlDoc.querySelector('Folder'));
        console.log(this.kml);
        let doc = libxmljs.parseXmlString(this.kml.replace(/<\?xml.*?\?>/ig, '').replace(/\s?\w+=".*?"/ig, '').replace(/(?:\r\n|\r|\n)\s*/g, ''));
        let placemarks = doc.find('/kml/Document/Folder/Placemark'); //
        //console.log(placemarks.toString());
        let points = []; // to stations
        let paths = []; // to lines
        let loms = []; // to interchanges
        placemarks.forEach(function (placemark) {
            const placemarkName = placemark.get('./name', '').text();
            const desc = placemark.get('./description', '');
            const placemarkDescription = (desc) ? desc.text() : '';
            const placemarkLocation = placemark.get('.//coordinates', '').text();
            if (placemark.find('./Point').length > 0) {
                const cs = placemarkLocation.split(',');
                const coords = new L.LatLng(Number(cs[1]), Number(cs[0]));
                points.push(new YaPoint(coords, placemarkName, placemarkDescription));
            }
            else if (placemark.find('./LineString').length > 0 || placemark.find('./LinearRing').length > 0) {
                const pts = placemarkLocation.split(/\s/).map(function (match) {
                    const cs = match.split(',');
                    return new L.LatLng(Number(cs[1]), Number(cs[0]));
                });
                const firstLetter = placemarkName.charAt(0);
                if (firstLetter == 'Л' || firstLetter == 'М') {
                    loms.push(pts);
                }
                else if (placemarkName.substr(0, 5) != 'Konec') {
                    paths.push(new YaPath(pts, placemarkName, placemarkDescription));
                }
            }
        });
        console.log('points parsed: ' + points.length);
        console.log('paths parsed: ' + paths.length);
        console.log('loms parsed: ' + loms.length); //
        //console.log(points);
        //console.log(JSON.stringify(paths, null, 2));
        //console.log(JSON.stringify(loms, null, 2));
        /*
         * 1. find the closest placemark to each lom
         * 2. */
        let pointsCloned = points.slice(0);
        loms.forEach(function (lom) {
            // if the end overlaps the beginning, delete it
            let circular = false;
            if (lom[0].distanceTo(lom[lom.length - 1]) < transferOverlapError) {
                circular = true;
                lom.splice(lom.length - 1);
            }
            // calculate the center of the interchange & find the closest point
            const center = geo.getCenter(lom);
            const closestPoint = geo.findClosestObject(center, pointsCloned);
            // no longer needed in points
            const index = points.indexOf(closestPoint);
            if (index > -1)
                points.splice(index, 1);
            // find the nearest station out of already added, or create a new one
            let closestStation;
            if (!_this.graph.stations.some(function (station) {
                if (closestPoint.name == station.name && closestPoint.location.distanceTo(station.platforms[0].location) < sameJunctionError) {
                    closestStation = station;
                    return true;
                }
            })) {
                closestStation = new tr.Station(closestPoint.name, closestPoint.description, []);
                _this.graph.stations.push(closestStation);
            }
            let platformsForGraph = [];
            const firstPlatform = _this.getOrMakePlatform(lom[0], false);
            platformsForGraph.push(firstPlatform);
            firstPlatform.station = closestStation;
            let prevPlatform = firstPlatform;
            for (let i = 1; i < lom.length; ++i) {
                let platform = _this.getOrMakePlatform(lom[i], false);
                platform.station = closestStation;
                _this.graph.transfers.push(new tr.Transfer(prevPlatform, platform));
                platformsForGraph.push(platform);
                prevPlatform = platform;
            }
            if (circular) {
                _this.graph.transfers.push(new tr.Transfer(prevPlatform, firstPlatform));
            }
            platformsForGraph.forEach(function (platform) {
                if (_this.graph.platforms.indexOf(platform) == -1) {
                    _this.graph.platforms.push(platform);
                }
            });
        });
        // convert the remaining points
        points.forEach(function (pt) {
            let platform = new tr.Platform(pt.location);
            _this.graph.platforms.push(platform);
            _this.graph.stations.push(new tr.Station(pt.name, pt.description, [platform]));
        });
        const eLine = new tr.Line('E');
        this.graph.lines.push(eLine);
        let line;
        paths.forEach(function (path) {
            line = eLine;
            // and the closest platform
            let prevPlatform = geo.findClosestObject(path.points[0], _this.graph.platforms);
            // if the path is not a branch
            const type = path.name.charAt(0);
            let branches;
            let routes = [];
            if (type == 'E') {
                let lineNums = path.name.slice(1).split('').sort();
                branches = lineNums.join('');
                lineNums.forEach(function (lineNum) {
                    let route = new tr.Route(eLine, lineNum);
                    if (!_this.graph.routes.some(function (rt) {
                        if (route.id == rt.id) {
                            route = rt;
                            return true;
                        }
                    })) {
                        _this.graph.routes.push(route);
                    }
                    routes.push(route);
                });
            }
            else {
                const matches = path.name.match(/[ML](\d+)([a-z]*)/);
                if (!matches)
                    console.error(path);
                const lineNum = Number(matches[1]);
                branches = matches[2];
                line = new tr.Line(type, lineNum);
                if (!_this.graph.lines.some(function (l) {
                    if (l.id == line.id) {
                        line = l;
                        return true;
                    }
                })) {
                    _this.graph.lines.push(line);
                }
                routes.push(new tr.Route(line, branches));
                if (!_this.graph.routes.some(function (rt) {
                    if (routes[0].id == rt.id) {
                        routes[0] = rt;
                        return true;
                    }
                })) {
                    _this.graph.routes.push(routes[0]);
                }
            }
            let presentSpan = null;
            let presentBranches = '';
            prevPlatform.spans.forEach(function (span) {
                span.routes.forEach(function (rt) {
                    // compare lines by values!
                    if (rt.line.id == routes[0].line.id) {
                        presentSpan = span;
                        presentBranches += rt.branch;
                    }
                });
            });
            presentBranches = presentBranches.split('').sort().join('');
            // if platform had this line (!)
            if (presentSpan) {
                // if both are branches of the main line but not equal to each other
                // if siblings (same parent)
                if (util.diffByOne(branches, presentBranches)) {
                    if (presentSpan.target == prevPlatform) {
                        path.points.reverse();
                        prevPlatform = geo.findClosestObject(path.points[0], _this.graph.platforms);
                    }
                }
                else if (presentSpan.source == prevPlatform) {
                    path.points.reverse();
                    prevPlatform = geo.findClosestObject(path.points[0], _this.graph.platforms);
                }
            }
            for (let i = 1; i < path.points.length; ++i) {
                const closestPlatforms = geo.findObjectsInRadius(path.points[i], _this.graph.platforms, distanceError, true);
                if (closestPlatforms.length > 0) {
                    const platform = (closestPlatforms.length == 1) ? closestPlatforms[0] : geo.findClosestObject(path.points[i], closestPlatforms);
                    //let platform:tr.Platform = geo.findClosestObject(path.points[i], this.graph.platforms);
                    if (platform != prevPlatform) {
                        _this.graph.spans.push(new tr.Span(prevPlatform, platform, routes));
                        prevPlatform = platform;
                    }
                }
            }
        });
        //this.graph.platforms.forEach(pl =>
        // console.log(pl.location.latitude + ', ' + (pl.station ? pl.name : 'no-station')));
        //this.graph.stations.forEach(pl => console.log(pl.name + ', ' + pl.altName + ', ' + pl.platforms.length)); //
        console.log(JSON.stringify(JSON.parse(this.graph.toJSON()), null, 2));
    };
    Yadapter.prototype.getOrMakePlatform = function (location, addToGraph) {
        const closestPlatforms = geo.findObjectsInRadius(location, this.graph.platforms, distanceError);
        if (closestPlatforms.length == 0) {
            let platform = new tr.Platform(location);
            if (addToGraph)
                this.graph.platforms.push(platform);
            return platform;
        }
        else if (closestPlatforms.length == 1) {
            return closestPlatforms[0];
        }
        return geo.findClosestObject(location, closestPlatforms);
    };
    return Yadapter;
})();
module.exports = Yadapter;
//export default Yadapter; 
//# sourceMappingURL=yadapter.js.map