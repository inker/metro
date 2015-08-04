'use strict';
/// <reference path="../typings/tsd.d.ts" />

import libxmljs = require('libxmljs');
import request = require('request');
import fs = require('fs');
import L = require('leaflet');

import * as tr from '../metro-graph';
import IAdapter from './geo-to-transport-adapter';
import * as util from '../util';
import * as geo from '../geo';
import {TransferOverlapError, DistanceError, SameJunctionError} from '../decorators';

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

    constructor(location: L.LatLng, name: string, description = "") {
        super(name, description);
        this.location = location;
    }
}

class YaPath extends YaObject {
    points: L.LatLng[];

    constructor(points: L.LatLng[], name: string, description = "") {
        super(name, description);
        this.points = points;
    }
}


@TransferOverlapError(20)
@DistanceError(50)
@SameJunctionError(1000)
class Yadapter implements IAdapter {
    private url: string;
    private _distanceError: number = Reflect['getOwnMetadata']('DistanceError', this.constructor);
    private _sameJunctionError: number = Reflect['getOwnMetadata']('SameJunctionError', this.constructor);
    private _transferOverlapError: number = Reflect['getOwnMetadata']('TransferOverlapError', this.constructor);

    constructor(url: string) {
        //if (!/maps\.yandex\.ru/ig.test(url)) throw new Error('incorrect URL provided');
        this.url = url;
    }

    parseFile(): Promise<tr.MetroGraph> {
        return new Promise((resolve, reject) => request(this.url, (error, response, body) => {
            if (error) throw error;
            if (response.statusCode !== 200) throw new Error('yandex server is not responding');
            console.log('kml successfully obtained');
            console.time('parsing took');
            let graph = this.kmlToGraph(body);
            console.timeEnd('parsing took');
            resolve(graph);
            const json = graph.toJSON();
        }));
    }

    private kmlToGraph(kml: string): tr.MetroGraph {
        console.log('parsing KML file...');
        let graph = new tr.MetroGraph();
        kml = kml.replace(/<\?xml.*?\?>/ig, '') // delete the top xml stuff
            .replace(/\s?\w+=".*?"/ig, '') // delete the attributes
            .replace(/(?:\r\n|\r|\n)\s*/g, ''); // delete new line characters
        let doc = libxmljs.parseXmlString(kml);
        let placemarks = doc.find('/kml/Document/Folder/Placemark');
        
        let points = []; // to stations
        let paths: YaPath[] = []; // to lines
        let loms: L.LatLng[][] = []; // to interchanges
        placemarks.forEach(placemark => {
            const placemarkName = placemark.get('./name', '').text();
            const desc = placemark.get('./description', '');
            const placemarkDescription = desc ? desc.text() : '';
            const placemarkLocation = placemark.get('.//coordinates', '').text();
            if (placemark.find('./Point').length > 0) {
                const cs = placemarkLocation.split(',');
                const coords = new L.LatLng(Number(cs[1]), Number(cs[0]));
                points.push(new YaPoint(coords, placemarkName, placemarkDescription));
            } else if (placemark.find('./LineString').length > 0 || placemark.find('./LinearRing').length > 0) {
                const pts = placemarkLocation.split(/\s/).map(match => {
                    const cs = match.split(',');
                    return new L.LatLng(Number(cs[1]), Number(cs[0]));
                });
                const firstLetter = placemarkName.charAt(0);
                if (firstLetter === 'Л' || firstLetter === 'М') {
                    loms.push(pts);
                } else if (!placemarkName.startsWith('Konec')) {
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

            if (lom[0].distanceTo(lom[lom.length - 1]) < this._transferOverlapError) {
                circular = true;
                lom.splice(lom.length - 1);
            }
            // calculate the center of the interchange & find the closest point
            const center = geo.getCenter(lom);
            const closestPoint = geo.findClosestObject(center, pointsCloned);
            // no longer needed in points
            const index = points.indexOf(closestPoint);
            if (index > -1) {
                points.splice(index, 1);
            }
            // find the nearest station out of already added, or create a new one
            let closestStation: tr.Station;
            if (!graph.stations.some(station => {
                    if (closestPoint.name === station.name
                        && closestPoint.location.distanceTo(station.platforms[0].location) < this._sameJunctionError) {
                        closestStation = station;
                        return true;
                    }
                })) {
                closestStation = new tr.Station(closestPoint.name, { fi: closestPoint.description }, []);
                graph.stations.push(closestStation);
            }
            let platformsForGraph: tr.Platform[] = [];
            const firstPlatform = Yadapter.getOrMakePlatform(graph.platforms, lom[0], false);
            platformsForGraph.push(firstPlatform);
            firstPlatform.station = closestStation;
            let prevPlatform = firstPlatform;
            for (let i = 1; i < lom.length; ++i) {
                let platform = Yadapter.getOrMakePlatform(graph.platforms, lom[i], false);
                platform.station = closestStation;
                graph.transfers.push(new tr.Transfer(prevPlatform, platform));
                platformsForGraph.push(platform);
                prevPlatform = platform;
            }
            if (circular) {
                graph.transfers.push(new tr.Transfer(prevPlatform, firstPlatform));
            }
            platformsForGraph.forEach(platform => {
                if (graph.platforms.indexOf(platform) < 0) {
                    graph.platforms.push(platform);
                }
            });
        });
        // convert the remaining points
        points.forEach(pt => {
            let platform = new tr.Platform(pt.location);
            graph.platforms.push(platform);
            graph.stations.push(new tr.Station(pt.name, { fi: pt.description }, [platform]));
        });

        const eLine = new tr.Line('E');
        graph.lines.push(eLine);
        let line: tr.Line;
        paths.forEach(path => {
            line = eLine;
            // and the closest platform
            let prevPlatform = geo.findClosestObject(path.points[0], graph.platforms);
            // if the path is not a branch
            const type = path.name.charAt(0);
            let branches: string;
            let routes: tr.Route[] = [];
            if (type === 'E') {
                let lineNums = path.name.split('').slice(1).sort();
                branches = lineNums.join('');
                lineNums.forEach(lineNum => {
                    let route = new tr.Route(eLine, lineNum);
                    if (!graph.routes.some(rt => {
                            if (route.id === rt.id) {
                                route = rt;
                                return true;
                            }
                        })) {
                        graph.routes.push(route);
                    }
                    routes.push(route);
                });
            } else {
                const matches = path.name.match(/[ML](\d+)([a-z]*)/);
                if (!matches) console.error(path);
                const lineNum = Number(matches[1]);
                branches = matches[2];
                line = new tr.Line(type, lineNum);
                if (!graph.lines.some(l => {
                        if (l.id === line.id) {
                            line = l;
                            return true;
                        }
                    })) {
                    graph.lines.push(line);
                }
                routes.push(new tr.Route(line, branches));
                if (!graph.routes.some(rt => {
                        if (routes[0].id === rt.id) {
                            routes[0] = rt;
                            return true;
                        }
                    })) {
                    graph.routes.push(routes[0]);
                }

            }
            let presentSpan: tr.Span = null;
            let presentBranches = '';
            prevPlatform.spans.forEach(span => {
                span.routes.forEach(rt => {
                    // compare lines by values!
                    if (rt.line.id === routes[0].line.id) {
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
                    if (presentSpan.target === prevPlatform) {
                        path.points.reverse();
                        prevPlatform = geo.findClosestObject(path.points[0], graph.platforms);
                    }
                } else if (presentSpan.source === prevPlatform) {
                    path.points.reverse();
                    prevPlatform = geo.findClosestObject(path.points[0], graph.platforms);
                }
            }
            for (let i = 1; i < path.points.length; ++i) {
                const closestPlatforms = geo.findObjectsWithinRadius(path.points[i], graph.platforms, this._distanceError, true);
                if (closestPlatforms.length > 0) {
                    const platform = (closestPlatforms.length === 1)
                        ? closestPlatforms[0]
                        : geo.findClosestObject(path.points[i], closestPlatforms);
                    //let platform:tr.Platform = geo.findClosestObject(path.points[i], graph.platforms);
                    if (platform !== prevPlatform/* && geo.getDistance(path.points[i], platform.location) < distanceError*/) {
                        graph.spans.push(new tr.Span(prevPlatform, platform, routes));
                        prevPlatform = platform;
                    }
                }
            }

        });
        //graph.platforms.forEach(pl =>
        // console.log(pl.location.latitude + ', ' + (pl.station ? pl.name : 'no-station')));
        //graph.stations.forEach(pl => console.log(pl.name + ', ' + pl.altName + ', ' + pl.platforms.length)); //
        //console.log(JSON.stringify(JSON.parse(graph.toJSON()), null, 2));
        return graph;
    }

    static getOrMakePlatform(platforms: tr.Platform[], location: L.LatLng, addToGraph: boolean): tr.Platform {
        let distanceError = Reflect['getOwnMetadata']('DistanceError', this);
        const closestPlatforms = geo.findObjectsWithinRadius(location, platforms, distanceError);
        if (closestPlatforms.length === 0) {
            let platform = new tr.Platform(location);
            if (addToGraph) platforms.push(platform);
            return platform;
        } else if (closestPlatforms.length === 1) {
            return closestPlatforms[0];
        }
        return geo.findClosestObject(location, closestPlatforms);
    }

}

//export = Yadapter;
export default Yadapter;