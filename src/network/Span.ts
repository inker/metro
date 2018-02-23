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
        source.spans.outbound.push(this)
        target.spans.inbound.push(this)
        // if (source.spans.outbound.find(s => intersection(s.routes, routes).length > 0)) {
        //     console.log('inverting span 1', this)
        //     source.spans.inbound.push(this)
        // } else {
        //     source.spans.outbound.push(this)
        // }
        // if (target.spans.inbound.find(s => intersection(s.routes, routes).length > 0)) {
        //     console.log('inverting span 2', this)
        //     target.spans.outbound.push(this)
        // } else {
        //     target.spans.inbound.push(this)
        // }
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

    isNext(otherSpan: Span) {
        return (this._source === otherSpan._target || this._target === otherSpan._source)
            && intersection(this.routes, otherSpan.routes).length > 0
    }

    parallelSpans() {
        const {
            _source,
            _target,
        } = this
        const spans = new Set([..._source.getAllSpans(), ..._target.getAllSpans()])
        spans.delete(this)
        return Array.from(spans).filter(s => s.isOf(_source, _target))
    }

    invert() {
        const {
            _source,
            _target,
        } = this

        _source.spans.outbound.splice(_source.spans.outbound.indexOf(this), 1)
        _source.spans.inbound.push(this)

        _target.spans.inbound.splice(_target.spans.inbound.indexOf(this), 1)
        _target.spans.outbound.push(this)

        this._source = _target
        this._target = _source
    }
}
