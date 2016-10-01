/// <reference path="../typings/tsd.d.ts" />
import * as L from 'leaflet';
import { getCenter } from './util/geo';
import { getPlatformNamesZipped, deleteFromArray } from './util/utilities';

type LatLngJSON = { lat: number, lng: number };
type AltNamesJSON = { [lang: string]: string; };
type PlatformJSON = { name: string, altNames: AltNamesJSON, location: LatLngJSON }
type TransferJSON = { source: number, target: number };
type SpanJSON = { source: number, target: number, routes: number[] };
type LineJSON = { name: { [lang: string]: string }};
type RouteJSON = { line: string, branch: string };
export type GraphJSON = {
    platforms: PlatformJSON[],
    transfers: TransferJSON[],
    lines: { [lineId: string]: LineJSON },
    spans: SpanJSON[],
    routes: RouteJSON[]
};

type AltNames = {
    [lang: string]: string;
};

export class Platform {
    name: string;
    altNames: AltNames;
    location: L.LatLng;
    spans: Span[] = [];
    transfers: Transfer[] = [];
    private _station: Station;
    elevation: number;

    get station() { return this._station; }

    constructor(name: string, location: L.LatLng, altNames: AltNames = {}, elevation?: number) {
        this.name = name;
        this.altNames = altNames;
        this.location = location;
        this.elevation = elevation;
    }

    passingRoutes(): Set<Route> {
        const routes = new Set<Route>();
        for (let span of this.spans) {
            for (let route of span.routes) {
                routes.add(route);
            }
        }
        return routes;
    }

    passingLines(): Set<string> {
        const lines = new Set<string>();
        for (let span of this.spans) {
            for (let route of span.routes) {
                lines.add(route.line);
            }
        }
        return lines;
    }

};

export class Station {
    constructor(public platforms: Platform[]) {
        for (let platform of platforms) {
            (platform as any)._station = this;
        }
    }

    getNames(): string[] {
        return getPlatformNamesZipped(this.platforms);
    }

    getCenter(): L.LatLng {
        return getCenter(this.platforms.map(p => p.location));
    }

    passingLines(): Set<string> {
        const lines = new Set<string>();
        for (let platform of this.platforms) {
            for (let span of platform.spans) {
                for (let route of span.routes) {
                    lines.add(route.line);
                }
            }
        }
        return lines;
    }

};

export class Edge<V> {
    protected _source: V;
    protected _target: V;

    get source() { return this._source; }
    get target() { return this._target; }
    set source(vertex: V) {
        this._source = vertex;
    }
    set target(vertex: V) {
        this._target = vertex;
    }

    constructor(source: V, target: V) {
        if (source === target) {
            throw new Error(`source is the same as target: ${source}`);
        }
        this._source = source;
        this._target = target;
    }
    isOf(v1: V, v2: V) {
        return this._source === v1 && this._target === v2 || this._source === v2 && this._target === v1;
    }
    has(vertex: V) {
        return this._source === vertex || this._target === vertex;
    }
    other(vertex: V) {
        return this._source === vertex ? this._target : this._target === vertex ? this._source : null;
    }
    isAdjacent(edge: Edge<V>) {
        return this.has(edge._source) || this.has(edge._target);
    }

    invert() {
        [this._source, this._target] = [this._target, this._source];
    }

    destroy() {
        this.source = undefined;
        this.target = undefined;
    }
}

export class Transfer extends Edge<Platform> {
    constructor(source: Platform, target: Platform) {
        super(source, target);
        source.transfers.push(this);
        target.transfers.push(this);
    }
    get source() { return this._source; }
    get target() { return this._target; }
    set source(vertex: Platform) {
        if (this._source !== undefined) {
            deleteFromArray(this._source.transfers, this);
        }
        this._source = vertex;
        vertex.transfers.push(this);
    }
    set target(vertex: Platform) {
        if (this._target !== undefined) {
            deleteFromArray(this._target.transfers, this);
        }
        this._target = vertex;
        vertex.transfers.push(this);
    }
}

export class Span extends Edge<Platform> {
    routes: Route[];
    constructor(source: Platform, target: Platform, routes: Route[]) {
        super(source, target);
        source.spans.push(this);
        target.spans.push(this);
        this.routes = routes;
    }
    get source() { return this._source; }
    get target() { return this._target; }
    set source(vertex: Platform) {
        if (this._source !== undefined) {
            deleteFromArray(this._source.spans, this);
        }
        this._source = vertex;
        vertex.spans.push(this);
    }
    set target(vertex: Platform) {
        if (this._target !== undefined) {
            deleteFromArray(this._target.spans, this);
        }
        this._target = vertex;
        vertex.spans.push(this);
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
    constructor(json: GraphJSON) {
        const objectifyLatLng = (obj: LatLngJSON) => new L.LatLng(obj.lat, obj.lng);
        this.platforms = json.platforms.map(p => new Platform(p.name, objectifyLatLng(p.location), p.altNames));
        this.stations = [];
        this.routes = json.routes;
        this.lines = json.lines;
        this.transfers = json.transfers.map(s => new Transfer(this.platforms[s.source], this.platforms[s.target]));
        const spanRoutes = (s: SpanJSON) => s.routes.map(i => this.routes[i]);
        this.spans = json.spans.map(s => new Span(this.platforms[s.source], this.platforms[s.target], spanRoutes(s)));

        console.time('restore');
        const transferSet = new Set(this.transfers);
        const platformsCopy = new Set(this.platforms);
        while (transferSet.size > 0) {
            const firstTransfer = transferSet.values().next().value;
            const pls = new Set<Platform>().add(firstTransfer.source).add(firstTransfer.target);
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
                platformsCopy.delete(p);
            }
            const station = new Station(Array.from(pls));
            this.stations.push(station);
        }
        platformsCopy.forEach(pl => this.stations.push(new Station([pl])));
        console.timeEnd('restore');

        // console.log(this.toJSON() === JSON.stringify(json));

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
        // }
    }

    toJSON(): string {
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
            platforms: this.platforms.map(p => ({
                name: p.name,
                altNames: p.altNames,
                location: p.location
            })),
            transfers: this.transfers.map(t => ({
                source: this.platforms.indexOf(t.source),
                target: this.platforms.indexOf(t.target)
            })),
            lines: this.lines,
            spans: this.spans.map(s => ({
                source: this.platforms.indexOf(s.source),
                target: this.platforms.indexOf(s.target),
                routes: s.routes.map(r => this.routes.indexOf(r))
            })),
            routes: this.routes
        }, (k, v) => k.startsWith('_') ? undefined : v);
    }

    deletePlatform(platform: Platform) {
        console.log('removing platform', platform);
        for (let transfer of platform.transfers) {
            deleteFromArray(this.transfers, transfer);
        }
        platform.transfers = [];
        if (platform.spans.length === 1) {
            const span = platform.spans[0];
            const neighbor = span.other(platform);
            deleteFromArray(neighbor.spans, span);
            deleteFromArray(this.spans, span);
        } else if (platform.spans.length === 2) {
            const [first, second] = platform.spans;
            const end = second.other(platform);
            if (platform.passingRoutes().size === 2) {
                deleteFromArray(first.other(platform).spans, first);
                deleteFromArray(this.spans, first);
            } else if (first.source === platform) {
                first.source = end;
            } else {
                first.target = end;
            }
            deleteFromArray(end.spans, second);
            deleteFromArray(this.spans, second);
        } else {
            for (let span of platform.spans) {
                const neighbor = span.other(platform);
                deleteFromArray(neighbor.spans, span);
                deleteFromArray(this.spans, span);
            }
        }
        const { station } = platform;
        if (station.platforms.length === 1) {
            deleteFromArray(this.stations, station);
        } else {
            deleteFromArray(station.platforms, platform);
        }
        deleteFromArray(this.platforms, platform);
    }

};