'use strict';
/// <reference path="../typings/tsd.d.ts" />

import https = require('https');
import tr = require('../metro-graph');
import IAdapter = require('./geo-to-transport-adapter');
import util = require('../util');
import geo = require('../geo');
import libxmljs = require('libxmljs');
//import xml2js = require('xml2js');
import fs = require('fs');
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
}

// errors in meters
let transferOverlapError = 20;
let distanceError = 50; //
let sameJunctionError = 1000;

// a kludge to avoid 'L' is undefined

class YaObject {
    name: string;
    description: string;

    constructor(name: string, description: string = '') {
        this.name = name;
        this.description = description;
    }
}

class YaPoint extends YaObject {
    location: L.LatLng;

    constructor(location: L.LatLng, name: string, description: string = '') {
        super(name, description);
        this.location = location;
    }
}

class YaPath extends YaObject {
    points: L.LatLng[];

    constructor(points: L.LatLng[], name: string, description: string = '') {
        super(name, description);
        this.points = points;
    }
}

class Yadapter implements IAdapter {
    private url: string;
    private kml: string = '';
    private graph = new tr.MetroGraph();

    constructor(url: string) {
        //if (!/maps\.yandex\.ru/ig.test(url)) throw new Error('incorrect URL provided');
        this.url = url;
    }

    parseFile(cb?: Function): void {
        https.get(this.url, kmlResp => {
            kmlResp.on('data', chunk => this.kml += chunk)
                .on('end', () => { // doesn't work as a lambda, lol
                    this.kmlToGraph();
                    fs.writeFile('./json/graph.json', this.graph.toJSON(), 'utf8', err => {
                        console.log('graph written');
                        if (typeof cb === 'function') return cb();
                    });
                })
                .on('error', err => {
                    throw err;
                });
            console.log('getting kml file...');
        }).on('error', err => {
            throw err;
        }).on('end', () => console.log('request ended'));
    }

    private kmlToGraph(): void {
        console.log('parsing KML file...');
        //let parser = new DOMParser();
        //let xmlDoc = parser.parseFromString(this.kml, 'text/xml');
        //let folder = utils.x2js(xmlDoc.querySelector('Folder'));
        console.log(this.kml); 
        let doc = libxmljs.parseXmlString(this.kml.replace(/<\?xml.*?\?>/ig, '')
            .replace(/\s?\w+=".*?"/ig, '')
            .replace(/(?:\r\n|\r|\n)\s*/g, ''));
        let placemarks = doc.find('/kml/Document/Folder/Placemark'); //
        //console.log(placemarks.toString());
        let points = []; // to stations
        let paths = []; // to lines
        let loms: L.LatLng[][] = []; // to interchanges
        placemarks.forEach(placemark => {
            const placemarkName = placemark.get('./name', '').text();
            const desc = placemark.get('./description', '');
            const placemarkDescription = (desc) ? desc.text() : '';
            const placemarkLocation = placemark.get('.//coordinates', '').text();
            if (placemark.find('./Point').length > 0) {
                const cs = placemarkLocation.split(',');
                const coords = new L.LatLng(Number(cs[1]), Number(cs[0]));
                points.push(new YaPoint(coords, placemarkName, placemarkDescription));
            } else if (placemark.find('./LineString').length > 0 || placemark.find('./LinearRing').length > 0) {
                const pts = placemarkLocation
                    .split(/\s/)
                    .map(match => {
                        const cs = match.split(',');
                        return new L.LatLng(Number(cs[1]), Number(cs[0]));
                    });
                const firstLetter = placemarkName.charAt(0);
                if (firstLetter == 'Л' || firstLetter == 'М') {
                    loms.push(pts);
                } else if (placemarkName.substr(0, 5) != 'Konec') {
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
        loms.forEach(lom => {
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
            if (index > -1) points.splice(index, 1);
            // find the nearest station out of already added, or create a new one
            let closestStation: tr.Station;
            if (!this.graph.stations.some(station => {
                    if (closestPoint.name == station.name
                        && closestPoint.location.distanceTo(station.platforms[0].location) < sameJunctionError) {
                        closestStation = station;
                        return true;
                    }
                })) {
                closestStation = new tr.Station(closestPoint.name, closestPoint.description, []);
                this.graph.stations.push(closestStation);
            }
            let platformsForGraph: tr.Platform[]  = [];
            const firstPlatform = this.getOrMakePlatform(lom[0], false);
            platformsForGraph.push(firstPlatform);
            firstPlatform.station = closestStation;
            let prevPlatform = firstPlatform;
            for (let i = 1; i < lom.length; ++i) {
                let platform = this.getOrMakePlatform(lom[i], false);
                platform.station = closestStation;
                this.graph.transfers.push(new tr.Transfer(prevPlatform, platform));
                platformsForGraph.push(platform);
                prevPlatform = platform;
            }
            if (circular) {
                this.graph.transfers.push(new tr.Transfer(prevPlatform, firstPlatform));
            }
            platformsForGraph.forEach(platform => {
                if (this.graph.platforms.indexOf(platform) == -1) {
                    this.graph.platforms.push(platform);
                }
            });
        });
        // convert the remaining points
        points.forEach(pt => {
            let platform = new tr.Platform(pt.location);
            this.graph.platforms.push(platform);
            this.graph.stations.push(new tr.Station(pt.name, pt.description, [platform]));
        });

        const eLine = new tr.Line('E');
        this.graph.lines.push(eLine);
        let line: tr.Line;
        paths.forEach(path => {
            line = eLine;
            // and the closest platform
            let prevPlatform = geo.findClosestObject(path.points[0], this.graph.platforms);
            // if the path is not a branch
            const type = path.name.charAt(0);
            let branches: string;
            let routes = [];
            if (type == 'E') {
                let lineNums = path.name.slice(1).split('').sort();
                branches = lineNums.join('');
                lineNums.forEach(lineNum => {
                    let route = new tr.Route(eLine, lineNum);
                    if (!this.graph.routes.some(rt => {
                            if (route.id == rt.id) {
                                route = rt;
                                return true;
                            }
                        })) {
                        this.graph.routes.push(route);
                    }
                    routes.push(route);
                });
            } else {
                const matches = path.name.match(/[ML](\d+)([a-z]*)/);
                if (!matches) console.error(path);
                const lineNum = Number(matches[1]);
                branches = matches[2];
                line = new tr.Line(type, lineNum);
                if (!this.graph.lines.some(l => {
                        if (l.id == line.id) {
                            line = l;
                            return true;
                        }
                    })) {
                    this.graph.lines.push(line);
                }
                routes.push(new tr.Route(line, branches));
                if (!this.graph.routes.some(rt => {
                        if (routes[0].id == rt.id) {
                            routes[0] = rt;
                            return true;
                        }
                    })) {
                    this.graph.routes.push(routes[0]);
                }

            }
            let presentSpan: tr.Span = null;
            let presentBranches = '';
            prevPlatform.spans.forEach(span => {
                span.routes.forEach(rt => {
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
                        prevPlatform = geo.findClosestObject(path.points[0], this.graph.platforms);
                    }
                } else if (presentSpan.source == prevPlatform) {
                    path.points.reverse();
                    prevPlatform = geo.findClosestObject(path.points[0], this.graph.platforms);
                }
            }
            for (let i = 1; i < path.points.length; ++i) {
                const closestPlatforms = geo.findObjectsInRadius(path.points[i], this.graph.platforms, distanceError, true);
                if (closestPlatforms.length > 0) {
                    const platform = (closestPlatforms.length == 1)
                        ? closestPlatforms[0]
                        : geo.findClosestObject(path.points[i], closestPlatforms);
                    //let platform:tr.Platform = geo.findClosestObject(path.points[i], this.graph.platforms);
                    if (platform != prevPlatform/* && geo.getDistance(path.points[i], platform.location) < distanceError*/) {
                        this.graph.spans.push(new tr.Span(prevPlatform, platform, routes));
                        prevPlatform = platform;
                    }
                }
            }

        });
        //this.graph.platforms.forEach(pl =>
        // console.log(pl.location.latitude + ', ' + (pl.station ? pl.name : 'no-station')));
        //this.graph.stations.forEach(pl => console.log(pl.name + ', ' + pl.altName + ', ' + pl.platforms.length)); //
        console.log(JSON.stringify(JSON.parse(this.graph.toJSON()), null, 2));
    }

    getOrMakePlatform(location: L.LatLng, addToGraph: boolean): tr.Platform {
        const closestPlatforms = geo.findObjectsInRadius(location, this.graph.platforms, distanceError);
        if (closestPlatforms.length == 0) {
            let platform = new tr.Platform(location);
            if (addToGraph) this.graph.platforms.push(platform);
            return platform;
        } else if (closestPlatforms.length == 1) {
            return closestPlatforms[0];
        }
        return geo.findClosestObject(location, closestPlatforms);
    }

}

export = Yadapter;
//export default Yadapter;