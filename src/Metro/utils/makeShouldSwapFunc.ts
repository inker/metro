export default (numIterations: number, max: number, costFunction: () => number) => {
  const min = 1
  const diff = max - min
  return (prevCost: number, i: number) => {
    const temperature = 1 - (i / numIterations)
    const b = temperature ** 25
    const threshold = min + (b * diff)

    const cost = costFunction()
    const ratio = cost / prevCost
    return ratio < threshold ? cost : null
  }
}
