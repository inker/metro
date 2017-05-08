import { AltNames, LatLng } from './types'

import Span from './Span'
import Transfer from './Transfer'
import Station from './Station'
import Route from './Route'

export default class {
    name: string
    altNames: AltNames
    location: LatLng
    readonly spans: Span[] = []
    readonly transfers: Transfer[] = []
    private _station: Station
    elevation?: number

    get station() {
        return this._station
    }

    constructor(name: string, location: LatLng, altNames: AltNames = {}, elevation?: number) {
        this.name = name
        this.altNames = altNames
        this.location = location
        this.elevation = elevation
    }

    passingRoutes(): Set<Route> {
        const routes = new Set<Route>()
        for (const span of this.spans) {
            for (const route of span.routes) {
                routes.add(route)
            }
        }
        return routes
    }

    passingLines(): Set<string> {
        const lines = new Set<string>()
        for (const span of this.spans) {
            for (const route of span.routes) {
                lines.add(route.line)
            }
        }
        return lines
    }

}
