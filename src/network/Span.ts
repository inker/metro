import fastDelete from 'fast-delete'
import { intersection } from 'lodash'

import Platform from './Platform'
import Edge from './Edge'
import Route from './Route'

export default class Span extends Edge<Platform> {
    routes: Route[]

    constructor(source: Platform, target: Platform, routes: Route[]) {
        super(source, target)
        // TODO
        if (source.spans.outbound.find(s => intersection(s.routes, routes).length > 0)) {
            console.log('inverting span', this)
            source.spans.inbound.push(this)
        } else {
            source.spans.outbound.push(this)
        }
        if (target.spans.inbound.find(s => intersection(s.routes, routes).length > 0)) {
            console.log('inverting span', this)
            target.spans.outbound.push(this)
        } else {
            target.spans.inbound.push(this)
        }
        this.routes = routes
    }

    get source() {
        return this._source
    }

    set source(vertex: Platform) {
        if (this._source !== undefined) {
            fastDelete(this._source.spans.outbound, this as Span)
        }
        this._source = vertex
        vertex.spans.outbound.push(this)
    }

    get target() {
        return this._target
    }

    set target(vertex: Platform) {
        if (this._target !== undefined) {
            fastDelete(this._target.spans.inbound, this as Span)
        }
        this._target = vertex
        vertex.spans.inbound.push(this)
    }
}
