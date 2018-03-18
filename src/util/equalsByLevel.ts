const sameContent = <T>(arr1: T[], arr2: T[]) =>
  arr1.length === arr2.length && arr1.every(item => arr2.includes(item))

function objectsAreTheSame(o1: object, o2: object, currentLevel: number): boolean {
  const keys1 = Object.keys(o1)
  const keys2 = Object.keys(o2)

  return sameContent(keys1, keys2)
    && keys1.every(k => equalsByLevel(o1[k], o2[k], currentLevel - 1))
}

const equalsByLevel = (o1: any, o2: any, currentLevel: number) =>
  o1 === o2
    || currentLevel > 0
      && o1
      && o2
      && typeof o1 === 'object'
      && typeof o2 === 'object'
      && objectsAreTheSame(o1, o2, currentLevel)

/**
 * 0: ===
 * 1: shallow
 * Infinity: deep
 */
export default (o1: any, o2: any, level: number) => {
  if (!Number.isInteger(level) || level < 0) {
    throw new Error(`level must be a non-negative integer, got ${level} instead`)
  }
  return equalsByLevel(o1, o2, level)
}
