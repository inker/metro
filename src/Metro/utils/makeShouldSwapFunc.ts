const MIN = 1

export default (numIterations: number, max: number, power: number) => {
  const diff = max - MIN
  return (newCost: number, prevCost: number, i: number) => {
    const temperature = 1 - (i / numIterations)
    const b = temperature ** power
    const threshold = MIN + (b * diff)

    const ratio = newCost / prevCost
    return ratio <= threshold
  }
}
