import {
  orderBy,
} from 'lodash'

import {
  tryGetFromMap,
} from 'util/collections'

import Span from '../../network/Span'

export default (spans: Span[], parallelSpans: Span[][]) => {
  const map = new WeakMap<Span, number>()
  for (const s of spans) {
    const parallels = parallelSpans.find(ss => ss.includes(s))
    const numParallels = parallels ? parallels.length : 1
    const eFactor = s.routes[0].line === 'E' ? 0 : Infinity
    map.set(s, numParallels + eFactor)
  }
  const sortedSpans = orderBy(spans, s => tryGetFromMap(map, s), 'desc')
  spans.splice(0, spans.length, ...sortedSpans)
}
