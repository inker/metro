import { deleteFromArray } from '../util'

import Platform from './Platform'
import Edge from './Edge'
import Route from './Route'

export default class Span extends Edge<Platform> {
    routes: Route[]
    constructor(source: Platform, target: Platform, routes: Route[]) {
        super(source, target)
        source.spans.push(this)
        target.spans.push(this)
        this.routes = routes
    }

    get source() {
        return this._source
    }
    set source(vertex: Platform) {
        if (this._source !== undefined) {
            deleteFromArray(this._source.spans, this)
        }
        this._source = vertex
        vertex.spans.push(this)
    }

    get target() {
        return this._target
    }
    set target(vertex: Platform) {
        if (this._target !== undefined) {
            deleteFromArray(this._target.spans, this)
        }
        this._target = vertex
        vertex.spans.push(this)
    }
}
