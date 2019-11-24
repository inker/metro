import {
  Point,
  LatLng,
} from 'leaflet'

import getCenter from 'utils/geo/getCenter'
import {
  tryGetFromMap,
} from 'utils/collections'

import Network, {
  Platform,
} from '../../network'

type LatLngToOverlayPoint = (latLng: LatLng) => Point

function getPlatformsPositionOnOverlayDetailed(network: Network, latLngToOverlayPoint: LatLngToOverlayPoint) {
  const positions = new WeakMap<Platform, Point>()

  // all platforms are in their place
  for (const station of network.stations) {
    for (const platform of station.platforms) {
      const pos = latLngToOverlayPoint(platform.location)
      positions.set(platform, pos)
    }
  }
  return positions
}

function getPlatformsPositionOnOverlayNonDetailed(network: Network, latLngToOverlayPoint: LatLngToOverlayPoint) {
  const positions = new WeakMap<Platform, Point>()

  for (const station of network.stations) {
    const nameSet = new Set<string>()
    const center = latLngToOverlayPoint(station.getCenter())
    const { platforms } = station
    for (const platform of platforms) {
      nameSet.add(platform.name)
      positions.set(platform, center)
    }
    if (nameSet.size === 1) {
      continue
    }
    // unless...
    if (nameSet.size < 1) {
      console.error(station)
      throw new Error('station has no names')
    }
    const posByName = new Map<string, Point>()
    for (const name of nameSet) {
      const locations = platforms.filter(p => p.name === name).map(p => p.location)
      const geoCenter = getCenter(locations)
      posByName.set(name, latLngToOverlayPoint(geoCenter))
    }
    for (const platform of platforms) {
      const pos = tryGetFromMap(posByName, platform.name)
      positions.set(platform, pos)
    }
  }

  return positions
}

export default (
  isDetailed: boolean,
  network: Network,
  latLngToOverlayPoint: LatLngToOverlayPoint,
) => {
  const func = isDetailed
    ? getPlatformsPositionOnOverlayDetailed
    : getPlatformsPositionOnOverlayNonDetailed

  const positions = func(network, latLngToOverlayPoint)

  return (platform: Platform) =>
    tryGetFromMap(positions, platform)
}
