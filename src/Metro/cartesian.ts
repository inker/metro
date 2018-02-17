const f = (a, b) =>
  [].concat(...a.map(d => b.map(e => [].concat(d, e))))

const cartesian = (a: any[], b: any[], ...c: any[][]): any[][] =>
  (b ? cartesian(f(a, b), ...c) : a)

export default cartesian
