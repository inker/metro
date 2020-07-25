import { Map as LeafletMap, TileLayer } from 'leaflet'

export default (map: LeafletMap, layers: TileLayer[]) => {
  let currentLayerIndex = 0
  window.addEventListener('keydown', e => {
    if (!e.shiftKey || !e.ctrlKey || e.key !== 'L') {
      return
    }
    e.preventDefault()
    map.removeLayer(layers[currentLayerIndex])
    if (++currentLayerIndex === layers.length) {
      currentLayerIndex = 0
    }
    map.addLayer(layers[currentLayerIndex])
    map.invalidateSize(false)
  })
}
