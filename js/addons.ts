import L = require('leaflet');
import MetroMap from './metro-map';

export class LayerControl {
    private layerControl: any;
    constructor(tileLayers: any, otherLayers = null) {
        this.layerControl = L.control['UniForm'](tileLayers, otherLayers, {
            collapsed: false,
            position: 'topright'
        });
    }
    addTo(map: L.Map) {
        // add control widget to map and html dom.
        this.layerControl.addTo(map);
        // update the control widget to the specific theme.
        this.layerControl.renderUniformControl();
    }
}

export class Measurement {
    constructor(metroMap: MetroMap) {
        let overlay = metroMap.getOverlay();
        let map = metroMap.getMap();
        let polyline = new L.Polyline([], { color: 'red' });
        polyline.addTo(map);
        let marker = new L.CircleMarker([60, 30]);
        let text = '0m';
        //marker.on('mouseover', e => popup.)
        overlay.addEventListener('click', e => {
            if (!e.shiftKey) return;
            let pt = map.containerPointToLatLng(new L.Point(e.x, e.y));
            polyline.addLatLng(pt).redraw();
            marker.on('mouseout', e => marker.closePopup());
            //.on('dblclick', e => {
            //    polyline.setLatLngs([]).redraw();
            //    this.map.removeLayer(marker);
            //})
            marker.addTo(map);
            let pts = polyline.getLatLngs();
            if (pts.length > 1) {
                let distance = 0;
                for (let i = 1; i < pts.length; ++i) {
                    distance += pts[i - 1].distanceTo(pts[i]);
                }
                L.popup()
                    .setLatLng(pt)
                    .setContent('Popup')
                    .openOn(map);
            }
        });
    }
}