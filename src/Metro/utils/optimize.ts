interface Options<T> {
  costFunc: () => number,
  shouldSwap: (newCost: number, prevCost: number, iteration: number) => boolean,
  onSwap?: (newCost: number, prevCost: number, iteration: number) => void,
  before?: (iteration: number) => T,
  after?: (beforeRetVal: T, iteration: number) => void,
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
      beforeRetVal = before(i)
    }
    const newCost = costFunc()
    if (shouldSwap(newCost, prevCost, i)) {
      if (onSwap) {
        onSwap(newCost, prevCost, i)
      }
      prevCost = newCost
      continue
    }
    if (after) {
      after(beforeRetVal as T, i)
    }
  }
  return prevCost
}
