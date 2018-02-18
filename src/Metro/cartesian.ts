const f = (a, b) =>
  [].concat(...a.map(d => b.map(e => [].concat(d, e))))

const cartesian = (a: any[] | null, b: any[] | null, ...c: (any[] | null)[]): any[][] =>
  (b ? cartesian(f(a, b), ...c) : a)

export default cartesian
