import {
  orderBy,
} from 'lodash'

import Span from '../../network/Span'

const makeIteratee = (parallelSpans: Span[][]) =>
  (span: Span) => {
    const parallels = parallelSpans.find(ss => ss.includes(span))
    const numParallels = parallels ? parallels.length : 1
    const eFactor = span.routes[0].line === 'E' ? 0 : Infinity
    return eFactor + numParallels
  }

export default (spans: Span[], parallelSpans: Span[][]) => {
  const iteratee = makeIteratee(parallelSpans)
  const sortedSpans = orderBy(spans, iteratee, 'desc')
  spans.splice(0, spans.length, ...sortedSpans)
}
