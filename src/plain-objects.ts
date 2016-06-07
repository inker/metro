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
};

export type Station = {
    name: string;
    altNames: AltNames;
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

export class Graph {
    platforms: Platform[];
    stations: Station[];
    lines: {};
    transfers: Transfer[];
    spans: Span[];
    routes: Route[];
    hints: any;
    constructor(json: string) {
        const newGraph = JSON.parse(json);
        this.platforms = newGraph.platforms;
        this.stations = newGraph.stations;
        this.lines = newGraph.lines;
        this.transfers = newGraph.transfers;
        this.spans = newGraph.spans;
        this.routes = newGraph.routes;
        for (let platform of this.platforms) {
            platform['spans'] = [];
        }
        for (let i = 0, len = this.spans.length; i < len; ++i) {
            const span = this.spans[i];
            this.platforms[span.source].spans.push(i);
            this.platforms[span.target].spans.push(i);
        }
        for (let i = 0, len = this.stations.length; i < len; ++i) {
            const station = this.stations[i];
            for (let p of station.platforms) {
                this.platforms[p]['station'] = i;
            }
        }
    }
    
    toJSON(): string {
        const platforms = JSON.parse(JSON.stringify(this.platforms));
        for (let platform of platforms) {
            platform['spans'] = undefined;
            platform['station'] = undefined;
        }
        return JSON.stringify({ 
            platforms,
            transfers: this.transfers,
            stations: this.stations,
            lines: this.lines,
            spans: this.spans,
            routes: this.routes
        }, (k, v) => k.startsWith('_') ? undefined : v);
    }
};

export type Hints = {
    crossPlatform: any;
    elevationSegments: any;
}