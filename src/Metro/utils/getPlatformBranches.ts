import Platform from 'network/Platform'
import Route from 'network/Route'

import {
  getOrMakeInMap,
} from 'util/collections'

export default (platforms: Platform[]): Map<Route, Platform[]> => {
  const map = new Map<Route, Platform[]>()
  for (const platform of platforms) {
    const passingRoutes = platform.passingRoutes()
    for (const route of passingRoutes) {
      const arr = getOrMakeInMap(map, route, [])
      arr.push(platform)
    }
  }
  return map
}
