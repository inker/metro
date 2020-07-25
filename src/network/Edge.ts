import { uniqueId } from 'lodash'

export default class <V> {
    readonly id = uniqueId('edge-')
    protected _source: V
    protected _target: V

    get source() {
      return this._source
    }

    set source(vertex: V) {
      this._source = vertex
    }

    get target() {
      return this._target
    }

    set target(vertex: V) {
      this._target = vertex
    }

    constructor(source: V, target: V) {
      if (source === target) {
        throw new Error(`source is the same as target: ${source}`)
      }
      this._source = source
      this._target = target
    }

    isOf(v1: V, v2: V) {
      return this._source === v1 && this._target === v2 || this._source === v2 && this._target === v1
    }

    has(vertex: V) {
      return this._source === vertex || this._target === vertex
    }

    other(vertex: V) {
      if (this._source === vertex) {
        return this._target
      }
      if (this._target === vertex) {
        return this._source
      }
      throw new Error('span does not have vertex')
    }

    isAdjacent(edge: this) {
      return this.has(edge._source) || this.has(edge._target)
    }

    isParallel(edge: this) {
      return edge.isOf(this._source, this._target)
    }

    invert() {
      const t = this._source
      this._source = this._target
      this._target = t
    }
}
