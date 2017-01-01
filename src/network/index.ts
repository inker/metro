import { latLng } from 'leaflet'

import {
    deleteFromArray,
    geo,
} from '../util'

import {
    LatLngJSON,
    GraphJSON,
    SpanJSON,
} from './types'

import Platform from './Platform'
import Station from './Station'
import Edge from './Edge'
import Span from './Span'
import Transfer from './Transfer'
import Route from './Route'

export {
    Platform,
    Station,
    Edge,
    Span,
    Transfer,
    Route,
    GraphJSON,
}

export default class {
    platforms: Platform[]
    stations: Station[]
    lines: {}
    transfers: Transfer[]
    spans: Span[]
    routes: Route[]
    constructor(json: GraphJSON) {
        const objectifyLatLng = (obj: LatLngJSON) => latLng(obj.lat, obj.lng)
        this.platforms = json.platforms.map(p => new Platform(p.name, objectifyLatLng(p.location), p.altNames))
        this.stations = []
        this.routes = json.routes
        this.lines = json.lines
        this.transfers = json.transfers.map(s => new Transfer(this.platforms[s.source], this.platforms[s.target]))
        const spanRoutes = (s: SpanJSON) => s.routes.map(i => this.routes[i])
        this.spans = json.spans.map(s => new Span(this.platforms[s.source], this.platforms[s.target], spanRoutes(s)))

        console.time('restore')
        const transferSet = new Set(this.transfers)
        const platformsCopy = new Set(this.platforms)
        while (transferSet.size > 0) {
            const firstTransfer = transferSet.values().next().value
            const pls = new Set<Platform>()
                .add(firstTransfer.source)
                .add(firstTransfer.target)
            transferSet.delete(firstTransfer)
            for (let it = pls.values(), p = it.next().value; p !== undefined; p = it.next().value) {
                const forDeletion = new Set<Transfer>()
                for (let tit = transferSet.values(), t = tit.next().value; t !== undefined; t = tit.next().value) {
                    if (t.source === p) {
                        pls.add(t.target)
                        forDeletion.add(t)
                    } else if (t.target === p) {
                        pls.add(t.source)
                        forDeletion.add(t)
                    }
                }
                forDeletion.forEach(t => transferSet.delete(t))
                platformsCopy.delete(p)
            }
            const station = new Station(Array.from(pls))
            this.stations.push(station)
        }
        platformsCopy.forEach(pl => this.stations.push(new Station([pl])))
        console.timeEnd('restore')

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
                location: p.location,
            })),
            transfers: this.transfers.map(t => ({
                source: this.platforms.indexOf(t.source),
                target: this.platforms.indexOf(t.target),
            })),
            lines: this.lines,
            spans: this.spans.map(s => ({
                source: this.platforms.indexOf(s.source),
                target: this.platforms.indexOf(s.target),
                routes: s.routes.map(r => this.routes.indexOf(r)),
            })),
            routes: this.routes,
        }, (k, v) => k.startsWith('_') ? undefined : v)
    }

    deletePlatform(platform: Platform) {
        console.log('removing platform', platform)
        for (const transfer of platform.transfers) {
            deleteFromArray(this.transfers, transfer)
        }
        platform.transfers = []
        if (platform.spans.length === 1) {
            const span = platform.spans[0]
            const neighbor = span.other(platform)
            deleteFromArray(neighbor.spans, span)
            deleteFromArray(this.spans, span)
        } else if (platform.spans.length === 2) {
            const [first, second] = platform.spans
            const end = second.other(platform)
            if (!end) {
                throw new Error(`span does not have other end`)
            }
            if (platform.passingRoutes().size === 2) {
                const otherPlatform = first.other(platform)
                deleteFromArray(otherPlatform.spans, first)
                deleteFromArray(this.spans, first)
            } else if (first.source === platform) {
                first.source = end
            } else {
                first.target = end
            }
            deleteFromArray(end.spans, second)
            deleteFromArray(this.spans, second)
        } else {
            for (const span of platform.spans) {
                const neighbor = span.other(platform)
                deleteFromArray(neighbor.spans, span)
                deleteFromArray(this.spans, span)
            }
        }
        const { station } = platform
        if (station.platforms.length === 1) {
            deleteFromArray(this.stations, station)
        } else {
            deleteFromArray(station.platforms, platform)
        }
        deleteFromArray(this.platforms, platform)
    }

}