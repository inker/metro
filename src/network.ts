/// <reference path="../typings/tsd.d.ts" />
import * as L from 'leaflet';
import { getCenter } from './geo';

type AltNames = {
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

export class Station implements Nameable {
    constructor(public platforms: number[], public name: string, public altNames: AltNames) {}
};

class Edge {
    public source: number;
    public target: number;
    constructor(source: number, target: number) {
        if (source === target) {
            throw new Error(`source is the same as target: ${source}`);
        }
        this.source = source;
        this.target = target;
    }
    isOf(v1: number, v2: number) {
        return this.source === v1 && this.target === v2 || this.source === v2 && this.target === v1;
    }
    has(vertex: number) {
        return this.source === vertex || this.target === vertex;
    }
    other(vertex: number) {
        return this.source === vertex ? this.target : this.target === vertex ? this.source : null;
    }
    isAdjacent(edge: Edge) {
        return this.has(edge.source) || this.has(edge.target);
    }
}

export class Transfer extends Edge {}

export class Span extends Edge {
    constructor(source: number, target: number, public routes: number[]) {
        super(source, target);
    }
}

export type Route = {
    line: string;
    branch: string;
};

export class Network {
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
        this.transfers = newGraph.transfers.map(s => new Transfer(s.source, s.target));
        this.spans = newGraph.spans.map(s => new Span(s.source, s.target, s.routes));
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
            this.stations.push(new Station(plarr, first.name, first.altNames));
            //this.stations.push({ name: first.name, altNames: first.altNames, platforms: plarr });
            for (let p of plarr) {
                this.platforms[p]['station'] = this.stations.length - 1;
            }
        }
        for (let i = 0; i < platformsCopy.length; ++i) {
            const pl = platformsCopy[i];
            if (pl === undefined) continue;
            this.stations.push(new Station([i], pl.name, pl.altNames));
            //this.stations.push({ name: pl.name, altNames: pl.altNames, platforms: [i] });
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

    passingLines(platform: Platform): Set<string> {
        const lines = new Set<string>();
        for (let spanIndex of platform.spans) {
            for (let routeIndex of this.spans[spanIndex].routes) {
                lines.add(this.routes[routeIndex].line);
            }
        }
        return lines;
    }

    passingLinesStation(station: Station): Set<string> {
        const lines = new Set<string>();
        for (let platformIndex of station.platforms) {
            for (let spanIndex of this.platforms[platformIndex].spans) {
                for (let routeIndex of this.spans[spanIndex].routes) {
                    lines.add(this.routes[routeIndex].line);
                }
            }
        }
        return lines;
    }

    getStationCenter(station: Station): L.LatLng {
        return getCenter(station.platforms.map(i => this.platforms[i].location));
    }
};