import { isEqual } from 'lodash-es'

import Network, {
    Platform,
    Station,
    Edge,
} from '../../network'

export {
    default as shortestRoute,
    ShortestRouteObject,
} from './shortestRoute'

const incidentEdges = <T>(edges: Edge<T>[], platform: T) =>
    edges.filter(edge => edge.has(platform))

export function findCycle(network: Network, station: Station): Platform[] {
    const { platforms } = station
    if (platforms.length < 3) {
        return []
    }
    // TODO: if n=3, leave as it is; if n=4, metro has priority
    const { transfers } = network
    if (platforms.length === 3) {
        const eachHasTwoTransfers = platforms.every(p => incidentEdges(transfers, p).length === 2)
        return eachHasTwoTransfers ? platforms : []
    }
    if (platforms.length === 4) {
        const psAndDegs = platforms
            .map(platform => ({
                platform,
                degree: transfers.filter(t => t.has(platform)).length,
            }))
            .sort((a, b) => a.degree - b.degree)
        const degs = psAndDegs.map(i => i.degree)
        const ps = psAndDegs.map(i => i.platform)
        if (isEqual(degs, [2, 2, 3, 3])) {
            return ps
        }
        if (isEqual(degs, [1, 2, 2, 3])) {
            return ps.slice(1)
        }
    }
    return []
}
