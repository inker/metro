interface Options<T> {
  costFunc: () => number,
  shouldSwap: (newCost: number, prevCost: number, iteration: number) => boolean
  before?: () => T,
  after?: (beforeRetVal: T) => void,
  onSwap?: (iteration: number, newCost: number, prevCost: number) => void,
}

export default <T>(totalIterations: number, initialCost: number, {
  costFunc,
  shouldSwap,
  before,
  after,
  onSwap,
}: Options<T>) => {
  let prevCost = initialCost
  for (let i = 0; i < totalIterations; ++i) {
    let beforeRetVal: T | undefined
    if (before) {
      beforeRetVal = before()
    }
    const newCost = costFunc()
    if (shouldSwap(newCost, prevCost, i)) {
      if (onSwap) {
        onSwap(i, newCost, prevCost)
      }
      prevCost = newCost
      continue
    }
    if (after) {
      after(beforeRetVal as T)
    }
  }
  return prevCost
}
