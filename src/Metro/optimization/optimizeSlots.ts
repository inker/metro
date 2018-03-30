import {
  clamp,
  intersection,
  lte,
  random,
  sample,
  shuffle,
} from 'lodash'

import {
  tryGetFromMap,
  swapArrayElements,
} from 'util/collections'

import Network, {
  Platform,
  Route,
} from '../../network'

import getSegments from '../utils/getSegments'
import getPlatformBranches from '../utils/getPlatformBranches'
import makeAcceptanceFunc from '../utils/makeAcceptanceFunc'
import optimize from '../utils/optimize'

function onAccept(newCost: number, prevCost: number, iteration: number) {
  if (newCost !== prevCost) {
    console.log(iteration, newCost)
  }
}

interface Options {
  network: Network,
  platformSlots: WeakMap<Platform, Route[]>,
  costFunc: () => number,
  updateBatches: () => void,
}

export default ({
  network,
  platformSlots,
  costFunc,
  updateBatches,
}: Options) => {
  const platforms = network.platforms.filter(p => platformSlots.has(p))
  const segments = getSegments(platforms)
  console.log('segments', segments)

  // initial primitive optimization (straigtening of segments)
  console.log('straightening segments')
  for (const segment of segments) {
    const firstPlatform = segment[0]
    const slots = tryGetFromMap(platformSlots, firstPlatform)
    for (const p of segment) {
      const pSlots = tryGetFromMap(platformSlots, p)
      pSlots.splice(0, pSlots.length, ...slots)
    }
  }
  updateBatches()

  let cost = costFunc()
  console.log('initial cost', cost)
  const TOTAL_ITERATIONS = 100

  const swapSpansOptions = {
    costFunc,
    shouldAccept: makeAcceptanceFunc(TOTAL_ITERATIONS, 20, 50),
    onAccept,
    move: () => {
      const segment = sample(segments)!
      const firstPlatform = segment[0]
      const routes = tryGetFromMap(platformSlots, firstPlatform)
      const max = routes.length - 1
      const slot1 = random(0, max)
      const slot2 = random(0, max)
      for (const p of segment) {
        const slots = tryGetFromMap(platformSlots, p)
        swapArrayElements(slots, slot1, slot2)
      }
      updateBatches()
      return { segment, slot1, slot2 }
    },
    restore: ({ segment, slot1, slot2 }) => {
      for (const p of segment) {
        const slots = tryGetFromMap(platformSlots, p)
        swapArrayElements(slots, slot1, slot2)
      }
      updateBatches()
    },
  }

  cost = optimize(TOTAL_ITERATIONS, cost, swapSpansOptions)

  // move whole routes around
  const platformBranches = getPlatformBranches(platforms)
  const routeEntries = shuffle(Array.from(platformBranches))

  console.log('swap routes')

  const swapRoutesOptions = {
    costFunc,
    shouldAccept: lte,
    onAccept,
    move: (i) => {
      const [r1, ps1] = sample(routeEntries)!
      const [r2, ps2] = sample(routeEntries)!
      const commonPlatforms = intersection(ps1, ps2)
      for (const p of commonPlatforms) {
        const slots = tryGetFromMap(platformSlots, p)
        const slot1 = slots.indexOf(r1)
        const slot2 = slots.indexOf(r2)
        swapArrayElements(slots, slot1, slot2)
      }
      updateBatches()
      return { commonPlatforms, r1, r2 }
    },
    restore: ({ commonPlatforms, r1, r2 }) => {
      for (const p of commonPlatforms) {
        const slots = tryGetFromMap(platformSlots, p)
        const slot1 = slots.indexOf(r1)
        const slot2 = slots.indexOf(r2)
        swapArrayElements(slots, slot1, slot2)
      }
      updateBatches()
    },
  }

  cost = optimize(TOTAL_ITERATIONS / 2, cost, swapRoutesOptions)

  const clampingOptions = {
    costFunc,
    shouldAccept: lte,
    onAccept,
    move: (i) => {
      const [route, ps] = routeEntries[i % routeEntries.length]
      const down = Math.random() < 0.5
      const swappedPlatforms = new Map<Platform, Route>()
      for (const p of ps) {
        const slots = tryGetFromMap(platformSlots, p)
        const slot = slots.indexOf(route)
        const newSlot = slot + (down ? 1 : -1)
        const otherSlot = clamp(newSlot, 0, slots.length - 1)
        if (slot === otherSlot) {
          continue
        }
        const otherRoute = slots[otherSlot]
        swapArrayElements(slots, slot, otherSlot)
        swappedPlatforms.set(p, otherRoute)
      }
      updateBatches()
      return { route, swappedPlatforms }
    },
    restore: ({ route, swappedPlatforms }) => {
      for (const [p, otherRoute] of swappedPlatforms) {
        const slots = tryGetFromMap(platformSlots, p)
        const slot = slots.indexOf(otherRoute)
        const otherSlot = slots.indexOf(route)
        swapArrayElements(slots, slot, otherSlot)
      }
      updateBatches()
    },
  }

  console.log('moving routes (with clamping)', routeEntries)

  cost = optimize(TOTAL_ITERATIONS, cost, clampingOptions)

  // console.log('swapping routes again')
  // cost = optimize(TOTAL_ITERATIONS / 3, cost, swapRoutesOptions)
  const minThreeRoutePlatforms = segments.filter(pa => pa[0].passingRoutes().size > 2)

  if (minThreeRoutePlatforms.length > 0) {
    console.log('rotating routes')
    cost = optimize(TOTAL_ITERATIONS / 3, cost, {
      costFunc,
      shouldAccept: lte,
      onAccept,
      move: (i) => {
        const down = Math.random() < 0.5
        const segment = sample(minThreeRoutePlatforms)!

        // rotate
        for (const p of segment) {
          const slots = tryGetFromMap(platformSlots, p)
          if (down) {
            const last = slots.pop()!
            slots.unshift(last)
          } else {
            const first = slots.shift()!
            slots.push(first)
          }
        }
        updateBatches()
        return { segment, down }
      },
      restore: ({ segment, down }) => {
        for (const p of segment) {
          const slots = tryGetFromMap(platformSlots, p)
          if (!down) {
            const last = slots.pop()!
            slots.unshift(last)
          } else {
            const first = slots.shift()!
            slots.push(first)
          }
        }
        updateBatches()
      },
    })
  }

  console.log('finally')

  cost = optimize(TOTAL_ITERATIONS / 2, cost, {
    ...swapSpansOptions,
    shouldAccept: lte,
  })

  console.log('moving routes (with clamping) again', routeEntries)

  cost = optimize(TOTAL_ITERATIONS / 2, cost, clampingOptions)
}
