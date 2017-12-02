import { LatLng, latLng } from 'leaflet'
import { meanBy } from 'lodash'

export default (points: LatLng[]) => latLng(
  meanBy(points, p => p.lat),
  meanBy(points, p => p.lng),
)
