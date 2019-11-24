import {
  shuffle,
} from 'lodash'

import {
  Platform,
  Route,
} from '../../network'

export default (platforms: Iterable<Platform>) => {
  const platformSlots = new WeakMap<Platform, Route[]>()

  for (const platform of platforms) {
    const routeSet = platform.passingRoutes()
    if (routeSet.size === 1) {
      continue
    }
    const routes = Array.from(routeSet)

    // if (!config.detailedE) {
    //   const lineSet = platform.passingLines()
    //   if (lineSet.size === 1) {
    //     continue
    //   }
    //   const lines = Array.from(lineSet)
    //   const leftShift = (routes.length - 1) / 2

    //   for (let i = 0; i < lines.length; ++i) {
    //     const slot = (i - leftShift) * lineWidthPlusGapPx
    //     const map = getOrMakeInMap(platformSlots, platform, () => new Map<Route, number>())
    //     const line = lines[i]
    //     for (const route of routes) {
    //       if (route.line !== line) {
    //         continue
    //       }
    //       map.set(route, slot)
    //     }
    //     const route = routes[i]
    //     map.set(route, slot)
    //   }
    //   return
    // }

    platformSlots.set(platform, shuffle(routes))
  }

  return platformSlots
}
