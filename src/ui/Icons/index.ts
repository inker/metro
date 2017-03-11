import { icon } from 'leaflet'
import RedCircle from './RedCircle'
import Marker from './Marker'

export {
    RedCircle,
    Marker,
}

export const red = icon({
    iconUrl: 'https://proxy-antonv.rhcloud.com/?url=http://harrywood.co.uk/maps/examples/leaflet/marker-icon-red.png',
    // iconRetinaUrl: 'my-icon@2x.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://proxy-antonv.rhcloud.com/?url=http://cdn.leafletjs.com/leaflet/v0.7.7/images/marker-shadow.png',
    shadowRetinaUrl: 'marker-shadow-@2x.png',
    shadowSize: [41, 41],
    shadowAnchor: [12, 41],
})
