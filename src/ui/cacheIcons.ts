import { Map as LeafletMap, Marker } from 'leaflet'

export default (map: LeafletMap, markers: Marker[]) => {
    for (const marker of markers) {
        map.addLayer(marker).removeLayer(marker)
    }
}
