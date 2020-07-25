import Network, { Route } from '../network'

const alertifyPromise = import(/* webpackChunkName: "alertify" */ 'ui/alertify')

export default async (network: Network, defSet: Set<Route>) => {
  const def = Array.from(defSet).map(r => r.line + r.branch).join('|')
  const routeSet = new Set<Route>()
  const { prompt } = await alertifyPromise
  const routeString = await prompt('routes', def)
  if (routeString === null) {
    return defSet
  }
  for (const s of routeString.split('|')) {
    const tokens = s[0] === 'M' ? s.match(/(M\d{0,2})(\w?)/) : s.match(/([EL])(.{0,2})/)
    if (!tokens) {
      console.error('incorrect route', s)
      continue
    }
    const [, line, branch] = tokens
    let route = network.routes.find(r => r.line === line && r.branch === branch)
    if (route === undefined) {
      console.log('creating new route')
      route = {
        line,
        branch,
      }
      network.routes.push(route)
    }
    routeSet.add(route)
  }
  return routeSet
}
