import * as L from 'leaflet';

type AltNames = { 
    old?: string;
    fi?: string;
    en?: string;
    se?: string;
    ee?: string;
    de?: string;
 };

export interface Platform {
    name: string;
    altNames: AltNames;
    station: number;
    location: L.LatLng;
    elevation: number;
    spans: number[];
    transfers: number[];
};

export type Station = {
    name: string;
    altNames: AltNames;
    location: L.LatLng;
    platforms: number[];
};

export type Transfer = {
    source: number;
    target: number;
};

export type Span = {
    source: number;
    target: number;
    routes: number[];
};

export type Route = {
    line: string;
    branch: string;
};

export type StationOrPlatform = {
    location: L.LatLng;
    name: string;
    altNames: AltNames;
};

export type Graph = {
    platforms: Platform[];
    stations: Station[];
    lines: {};
    transfers: Transfer[];
    spans: Span[];
    routes: Route[];
    hints?: any;
};

export type Hints = {
    crossPlatform: any;
    englishNames: any;
    elevationSegments: any;
}