/// <reference path="./typings/tsd.d.ts" />
import L = require('leaflet');
import graph = require('./metro-graph');

declare module Plain {
    type Platform = {
        name: string;
        altNames: graph.AltNames;
        station: number;
        location: L.LatLng;
        elevation: number;
        spans: number[]; 
        transfers: number[];
    };

    type Station = {
        name: string;
        altNames: graph.AltNames;
        location: L.LatLng;
        platforms: number[];
    };

    type Transfer = {
        source: number;
        target: number;
    };

    type Span = {
        source: number;
        target: number;
        routes: number[];
    };

    type Route = {
        line: string;
        branch: string;
    };

    type StationOrPlatform = {
        location: L.LatLng;
        name: string;
        altNames: graph.AltNames;
    };

    type Graph = {
        platforms: Plain.Platform[];
        stations: Plain.Station[];
        lines: {};
        transfers: Plain.Transfer[];
        spans: Plain.Span[];
        routes: Plain.Route[];
        hints?: any;
    };
    
    type Hints = {
        crossPlatform: any;
        englishNames: any;
        elevationSegments: any;
    }
}

//export default Plain;
export = Plain;