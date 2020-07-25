import { pull } from 'lodash'

import Platform from './Platform'
import Edge from './Edge'

type TransferType = 'osi' | undefined

export default class Transfer extends Edge<Platform> {
  type?: TransferType

  constructor(source: Platform, target: Platform, type?: TransferType) {
    super(source, target)
    source.transfers.push(this)
    target.transfers.push(this)
    this.type = type
  }

  get source() {
    return this._source
  }

  set source(vertex: Platform) {
    if (this._source !== undefined) {
      pull(this._source.transfers, this)
    }
    this._source = vertex
    vertex.transfers.push(this)
  }

  get target() {
    return this._target
  }

  set target(vertex: Platform) {
    if (this._target !== undefined) {
      pull(this._target.transfers, this)
    }
    this._target = vertex
    vertex.transfers.push(this)
  }
}
