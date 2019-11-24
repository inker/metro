import memoizeOne from 'memoize-one'
import { identity } from 'lodash'

import shallowEqual from './shallowEqual'

const comparator = (newArgs: [any], oldArgs: [any]) =>
  shallowEqual(newArgs[0], oldArgs[0])

export default () =>
  memoizeOne(identity, comparator)
