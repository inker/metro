interface Options<T> {
  move: (iteration: number) => T,
  costFunc: () => number,
  shouldAccept: (newCost: number, prevCost: number, iteration: number) => boolean,
  onAccept?: (newCost: number, prevCost: number, iteration: number) => void,
  restore?: (beforeRetVal: T, iteration: number) => void,
}

export default <T>(totalIterations: number, initialCost: number, {
  costFunc,
  shouldAccept,
  move,
  restore,
  onAccept,
}: Options<T>) => {
  let prevCost = initialCost
  for (let i = 0; i < totalIterations; ++i) {
    const snapshot = move(i)
    const newCost = costFunc()
    if (shouldAccept(newCost, prevCost, i)) {
      if (onAccept) {
        onAccept(newCost, prevCost, i)
      }
      prevCost = newCost
      continue
    }
    if (restore) {
      restore(snapshot, i)
    }
  }
  return prevCost
}
