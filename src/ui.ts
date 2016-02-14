import MapEditor from './ui/mapeditor';
import FAQ from './ui/faq';
import TextPlate from './ui/textplate';
import ContextMenu from './ui/contextmenu';

namespace Icons {
    export const start = L.icon({
        iconUrl: 'http://map.project-osrm.org/images/marker-start-icon-2x.png',
        iconSize: [20, 56],
        iconAnchor: [10, 28],
    });
    export const end = L.icon({
        iconUrl: 'http://map.project-osrm.org/images/marker-end-icon-2x.png',
        iconSize: [20, 56],
        iconAnchor: [10, 28],
    });
    export const red = L.icon({
        iconUrl: 'http://harrywood.co.uk/maps/examples/leaflet/marker-icon-red.png',
        //iconRetinaUrl: 'my-icon@2x.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: 'http://cdn.leafletjs.com/leaflet/v0.7.7/images/marker-shadow.png',
        shadowRetinaUrl: 'marker-shadow-@2x.png',
        shadowSize: [41, 41],
        shadowAnchor: [12, 41]
    });
} 

export { MapEditor, FAQ, TextPlate, ContextMenu, Icons }