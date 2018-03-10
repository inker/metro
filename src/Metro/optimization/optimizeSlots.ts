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

import {
  mean as meanPoint,
  zero as zeroVec,
  normalize,
  orthogonal,
  segmentsIntersect,
} from 'util/math/vector'

import Network, {
  Platform,
  Span,
  Route,
} from '../../network'

import getPlatformPatches from '../utils/getPlatformPatches'
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
  spanBatches: Map<Span, number>,
  costFunc: () => number,
  updateBatches: () => void,
}

export default ({
  network,
  platformSlots,
  spanBatches,
  costFunc,
  updateBatches,
}: Options) => {
  const platforms = network.platforms.filter(p => platformSlots.has(p))
  const patches = getPlatformPatches(platforms)
  console.log('patches', patches)

  console.log('shuffling spans')
  const shuffledSpans = shuffle(network.spans)
  network.spans.splice(0, shuffledSpans.length, ...shuffledSpans)

  // initial primitive optimization (straigtening of patches)
  console.log('straightening patches')
  for (const patch of patches) {
    const firstPlatform = patch[0]
    const slots = tryGetFromMap(platformSlots, firstPlatform)
    for (const p of patch) {
      const pSlots = tryGetFromMap(platformSlots, p)
      pSlots.splice(0, pSlots.length, ...slots)
    }
  }
  updateBatches()

  let cost = costFunc()
  console.log('initial cost', cost)
  const TOTAL_ITERATIONS = 500

  const swapSpansOptions = {
    costFunc,
    shouldAccept: makeAcceptanceFunc(TOTAL_ITERATIONS, 49, 50),
    onAccept,
    move: () => {
      const patch = sample(patches)!
      const firstPlatform = patch[0]
      const routes = tryGetFromMap(platformSlots, firstPlatform)
      const max = routes.length - 1
      const slot1 = random(0, max)
      const slot2 = random(0, max)
      for (const p of patch) {
        const slots = tryGetFromMap(platformSlots, p)
        swapArrayElements(slots, slot1, slot2)
      }
      updateBatches()
      return { patch, slot1, slot2 }
    },
    restore: ({ patch, slot1, slot2 }) => {
      for (const p of patch) {
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

  console.log('moving routes (with clamping)', routeEntries)

  cost = optimize(TOTAL_ITERATIONS, cost, {
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
  })

  // console.log('swapping routes again')
  // cost = optimize(TOTAL_ITERATIONS / 3, cost, swapRoutesOptions)
  const minThreeRoutePlatforms = patches.filter(pa => pa[0].passingRoutes().size > 2)

  if (minThreeRoutePlatforms.length > 0) {
    console.log('rotating routes')
    cost = optimize(TOTAL_ITERATIONS / 3, cost, {
      costFunc,
      shouldAccept: lte,
      onAccept,
      move: (i) => {
        const down = Math.random() < 0.5
        const patch = sample(minThreeRoutePlatforms)!

        // rotate
        for (const p of patch) {
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
        return { patch, down }
      },
      restore: ({ patch, down }) => {
        for (const p of patch) {
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
}
