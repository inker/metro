/// <reference path="./../typings/tsd.d.ts" />
import L = require('leaflet');

declare module Plain {
    type Platform = {
        name: string;
        altName: string;
        oldName: string;
        station: number;
        location: L.LatLng;
        elevation: number;
        spans: number[];
        transfers: number[];
    };

    type Station = {
        name: string;
        altName: string;
        oldName: string;
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
        altName: string;
    }
}

//export default Plain;
export = Plain;