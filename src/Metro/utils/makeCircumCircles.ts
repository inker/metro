import findCycle from 'utils/algorithm/findCycle'

import Network, {
  Platform,
  Station,
} from '../../network'

export default (network: Network) => {
  const stationCircumpoints = new WeakMap<Station, Platform[]>()

  for (const station of network.stations) {
    const circular = findCycle(network, station)
    if (circular.length > 0) {
      stationCircumpoints.set(station, circular)
    }
  }

  return stationCircumpoints
}
