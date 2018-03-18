import { LeafletEvent } from 'leaflet'

interface MetroMapEventMap {
    'distancemeasureinit': LeafletEvent,
    'clearmeasurements': LeafletEvent,
    'zoomstart': LeafletEvent,

    'measuredistance': MouseEvent,
    'platformchangetype': MouseEvent,
    'platformrename': MouseEvent,
    'platformmovestart': MouseEvent,
    'platformmove': MouseEvent,
    'platformmoveend': MouseEvent,
    'platformadd': CustomEvent,
    'platformdelete': MouseEvent,
    'spanroutechange': MouseEvent,
    'spaninvert': MouseEvent,
    'spanend': CustomEvent,
    'spandelete': MouseEvent,
    'transferend': CustomEvent,
    'transferdelete': MouseEvent,
    'editmapstart': Event,
    'editmapend': Event,
    'mapsave': Event,

    'platformaddclick': MouseEvent,
    'spanstart': MouseEvent,
    'transferstart': MouseEvent,
    'platformaddtolineclick': Event,

    'routefrom': MouseEvent,
    'routeto': MouseEvent,
    'clearroute': MouseEvent,
}

export default MetroMapEventMap
