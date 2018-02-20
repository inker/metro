import { uniqueId } from 'lodash'

import { AltNames, LatLng } from './types'

import Span from './Span'
import Transfer from './Transfer'
import Station from './Station'
import Route from './Route'

interface Spans {
    inbound: Span[],
    outbound: Span[],
}

export default class Platform {
    readonly id: string
    name: string
    altNames: AltNames
    location: LatLng
    readonly spans: Spans = {
        inbound: [],
        outbound: [],
    }
    readonly transfers: Transfer[] = []
    private _station: Station
    elevation?: number

    get station() {
        return this._station
    }

    constructor(name: string, location: LatLng, altNames: AltNames = {}, elevation?: number) {
        this.id = uniqueId('platform-')
        this.name = name
        this.altNames = altNames
        this.location = location
        this.elevation = elevation
    }

    hasSpan(span: Span) {
        const { spans } = this
        return spans.inbound.includes(span) || spans.outbound.includes(span)
    }

    getAllSpans() {
        const { spans } = this
        return [...spans.inbound, ...spans.outbound]
    }

    getNumSpans() {
        const { spans } = this
        return spans.inbound.length + spans.outbound.length
    }

    passingRoutes(): Set<Route> {
        const routes = new Set<Route>()
        for (const span of this.getAllSpans()) {
            for (const route of span.routes) {
                routes.add(route)
            }
        }
        return routes
    }

    passingLines(): Set<string> {
        const lines = new Set<string>()
        for (const span of this.getAllSpans()) {
            for (const route of span.routes) {
                lines.add(route.line)
            }
        }
        return lines
    }

    adjacentPlatformsBySpans() {
        return this.getAllSpans().map(s => s.other(this))
    }

    adjacentPlatformsByTransfers() {
        return this.transfers.map(t => t.other(this))
    }

    isAdjacentBySpan(platform: Platform) {
        return this.getAllSpans().some(s => s.has(platform))
    }

    isAdjacentByTransfer(platform: Platform) {
       return this.transfers.some(t => t.has(platform))
    }
}
