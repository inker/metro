import * as svg from '../util/svg';
import { File } from '../util/utilities';

export const Start = L.icon({
    iconUrl: 'https://proxy-antonv.rhcloud.com/?url=http://map.project-osrm.org/images/marker-start-icon-2x.png',
    iconSize: [20, 56],
    iconAnchor: [10, 28],
});

export const End = L.icon({
    iconUrl: 'https://proxy-antonv.rhcloud.com/?url=http://map.project-osrm.org/images/marker-end-icon-2x.png',
    iconSize: [20, 56],
    iconAnchor: [10, 28],
});

export const Red = L.icon({
    iconUrl: 'https://proxy-antonv.rhcloud.com/?url=http://harrywood.co.uk/maps/examples/leaflet/marker-icon-red.png',
    // iconRetinaUrl: 'my-icon@2x.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://proxy-antonv.rhcloud.com/?url=http://cdn.leafletjs.com/leaflet/v0.7.7/images/marker-shadow.png',
    shadowRetinaUrl: 'marker-shadow-@2x.png',
    shadowSize: [41, 41],
    shadowAnchor: [12, 41]
});

export const Circle = (() => {
    const root = svg.createSVGElement('svg') as SVGSVGElement;
    root.setAttribute('width', '100');
    root.setAttribute('height', '100');
    const ci = svg.makeCircle(new L.Point(50, 50), 40);
    ci.style.stroke = 'red';
    ci.style.strokeWidth = '20px';
    ci.style.fill = 'white';
    root.appendChild(ci);
    const r = 5;
    return L.icon({
        iconUrl: File.svgToDataUrl(root),
        iconSize: [r * 2, r * 2],
        iconAnchor: [r, r],
        popupAnchor: [0, -r]
    });
})();