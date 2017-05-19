import { icon } from 'leaflet'

export { default as RedCircle } from './RedCircle'
export { default as Marker } from './Marker'

const PROXY = 'https://proxy-antonv.rhcloud.com/?url='

export const red = icon({
    iconUrl: `${PROXY}http://harrywood.co.uk/maps/examples/leaflet/marker-icon-red.png`,
    // iconRetinaUrl: 'my-icon@2x.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: `${PROXY}http://cdn.leafletjs.com/leaflet/v0.7.7/images/marker-shadow.png`,
    shadowRetinaUrl: 'marker-shadow-@2x.png',
    shadowSize: [41, 41],
    shadowAnchor: [12, 41],
})
