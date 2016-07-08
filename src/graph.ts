/// <reference path="../typings/tsd.d.ts" />

import * as L from 'leaflet';

type AltNames = { 
    old?: string;
    en?: string;
    [lang: string]: string;
 };

interface Nameable {
    name: string;
    altNames: AltNames;
}

export interface Platform extends Nameable {
    station: number;
    location: L.LatLng;
    elevation: number;
    spans: number[];
};

export interface Station extends Nameable {
    platforms: number[];
};

interface Edge {
    source: number;
    target: number;
}

export type Transfer = Edge;

export interface Span extends Edge {
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
        this.stations = [];
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

        console.time('restore');
        const transferSet = new Set(this.transfers);
        const platformsCopy = this.platforms.slice();
        while (transferSet.size > 0) {
            const firstTransfer = transferSet.values().next().value;
            const pls = new Set<number>().add(firstTransfer.source).add(firstTransfer.target);
            transferSet.delete(firstTransfer);
            for (let it = pls.values(), p = it.next().value; p !== undefined; p = it.next().value) {
                const forDeletion = new Set<Transfer>();
                for (let tit = transferSet.values(), t = tit.next().value; t !== undefined; t = tit.next().value) {
                    if (t.source === p) {
                        pls.add(t.target);
                        forDeletion.add(t);
                    } else if (t.target === p) {
                        pls.add(t.source);
                        forDeletion.add(t);
                    }
                }
                forDeletion.forEach(t => transferSet.delete(t));
                platformsCopy[p] = undefined;
            }
            const plarr = Array.from(pls);
            const first = this.platforms[plarr[0]];
            this.stations.push({ name: first.name, altNames: first.altNames, platforms: plarr });
            for (let p of plarr) {
                this.platforms[p]['station'] = this.stations.length - 1;
            }
        }
        for (let i = 0; i < platformsCopy.length; ++i) {
            const pl = platformsCopy[i];
            if (pl === undefined) continue;
            this.stations.push({ name: pl.name, altNames: pl.altNames, platforms: [i] });
            this.platforms[i]['station'] = this.stations.length - 1;
        }
        console.timeEnd('restore');

        // const chains: number[][] = [];
        // for (let i = 0; i < this.routes.length; ++i) {
        //     const route = this.routes[i];
        //     const [start, end]: number[] = route as any;
        //     route['start'] = route['end'] = undefined;
        //     const starts = this.spans.filter(s => s.source === i),
        //         ends = this.spans.filter(s => s.target === i);
        //     for (let span of starts) {
        //         if (span.target === end) {
        //             if (span.routes !== undefined) {
        //                 span.routes.push(i);
        //             } else {
        //                 span['routes'] = [i];
        //             }
        //             break; //!!!!!!
        //         }
        //         let newSpan = span;
        //         while (true) {
        //             newSpan = this.spans.filter(s => s.source === newSpan.target);
        //         }
        //     }
        //     const foo: Span[][] = adjSpans.map(el => []);
        //     for (let s of adjSpans) {
        //         if (s.source === start && s.target === end || s.source === end && s.target === start) {
        //             s['routes'] = i;
        //             continue;
        //         }
        //         while (true) {
        //             if (s.source === )
        //         }
        //     }
        //}
    }
    
    toJSON(): string {
        const platforms: Platform[] = JSON.parse(JSON.stringify(this.platforms));
        const spans: Span[] = JSON.parse(JSON.stringify(this.spans));
        const routes: Route[] = JSON.parse(JSON.stringify(this.routes));

        for (let platform of platforms) {
            platform['spans'] = platform['station'] = undefined;
        }
        // const map = {}; // routeNum -> platforms
        // for (let span of spans) {
        //     for (let route of span.routes) {
        //         const obj = map[route] || {};
        //         obj[span.source] = !obj[span.source];
        //         obj[span.target] = !obj[span.target];
        //         map[route] = obj;
        //     }
        //     span.routes = undefined;
        // }

        // for (let ri of Object.keys(map)) {
        //     const route = routes[ri];
        //     const obj = map[ri];
        //     const arr = Object.keys(obj).filter(pl => obj[pl]);
        //     routes[ri]['start'] = arr[0];
        //     routes[ri]['end'] = arr[1];
        // }

        return JSON.stringify({ 
            platforms,
            transfers: this.transfers,
            lines: this.lines,
            spans,
            routes
        }, (k, v) => k.startsWith('_') ? undefined : v);
    }
};