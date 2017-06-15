import { icon } from 'leaflet'

import { proxify } from '../../util'

export { default as RedCircle } from './RedCircle'
export { default as makeMarker } from './marker'

export const red = icon({
    iconUrl: proxify('http://harrywood.co.uk/maps/examples/leaflet/marker-icon-red.png'),
    // iconRetinaUrl: 'my-icon@2x.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: proxify('http://cdn.leafletjs.com/leaflet/v0.7.7/images/marker-shadow.png'),
    shadowRetinaUrl: 'marker-shadow-@2x.png',
    shadowSize: [41, 41],
    shadowAnchor: [12, 41],
})
