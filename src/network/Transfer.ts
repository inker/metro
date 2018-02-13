import fastDelete from 'fast-delete'

import Platform from './Platform'
import Edge from './Edge'

export default class Transfer extends Edge<Platform> {
    constructor(source: Platform, target: Platform) {
        super(source, target)
        source.transfers.push(this)
        target.transfers.push(this)
    }

    get source() {
        return this._source
    }
    set source(vertex: Platform) {
        if (this._source !== undefined) {
            fastDelete(this._source.transfers, this as Edge<Platform>)
        }
        this._source = vertex
        vertex.transfers.push(this)
    }

    get target() {
        return this._target
    }
    set target(vertex: Platform) {
        if (this._target !== undefined) {
            fastDelete(this._target.transfers, this as Edge<Platform>)
        }
        this._target = vertex
        vertex.transfers.push(this)
    }
}
