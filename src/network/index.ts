import { latLng } from 'leaflet'

import Platform from './Platform'
import Station from './Station'
import Edge from './Edge'
import Span from './Span'
import Transfer from './Transfer'
import Route from './Route'

import { deleteFromArray } from '../util/collections'

import {
    LatLngJSON,
    GraphJSON,
    SpanJSON,
} from './types'

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
    readonly platforms: Platform[]
    readonly stations: Station[]
    readonly lines: {}
    readonly transfers: Transfer[]
    readonly spans: Span[]
    readonly routes: Route[]
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
            const pls = new Set([
                firstTransfer.source,
                firstTransfer.target,
            ])
            transferSet.delete(firstTransfer)
            for (const p of pls) {
                const forDeletion = new Set<Transfer>()
                for (const t of transferSet) {
                    if (t.source === p) {
                        pls.add(t.target)
                        forDeletion.add(t)
                    } else if (t.target === p) {
                        pls.add(t.source)
                        forDeletion.add(t)
                    }
                }
                for (const transfer of forDeletion) {
                    transferSet.delete(transfer)
                }
                platformsCopy.delete(p)
            }
            const station = new Station(Array.from(pls))
            this.stations.push(station)
        }
        for (const platform of platformsCopy) {
            this.stations.push(new Station([platform]))
        }
        console.timeEnd('restore')
    }

    toJSON(): string {
        const { platforms, transfers, lines, spans, routes } = this
        return JSON.stringify({
            version: Date.now(),
            platforms: platforms.map(p => ({
                name: p.name,
                altNames: p.altNames,
                location: p.location,
            })),
            transfers: transfers.map(t => ({
                source: platforms.indexOf(t.source),
                target: platforms.indexOf(t.target),
            })),
            lines,
            spans: spans.map(s => ({
                source: platforms.indexOf(s.source),
                target: platforms.indexOf(s.target),
                routes: s.routes.map(r => routes.indexOf(r)),
            })),
            routes,
        }, (k, v) => k.startsWith('_') ? undefined : v)
    }

    deletePlatform(platform: Platform) {
        console.log('removing platform', platform)
        for (const transfer of platform.transfers) {
            deleteFromArray(this.transfers, transfer)
        }
        platform.transfers.length = 0
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
