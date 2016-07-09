/// <reference path="../../typings/tsd.d.ts" />
import * as L from 'leaflet';
import MetroMap from '../metro-map';
import * as util from '../util';
import { Icons } from '../ui';
import { Item as ContextMenuItem } from './contextmenu';

export default class DistanceMeasure {
    private metroMap: MetroMap;
    private map: L.Map;
    private polyline = new L.Polyline([], { color: 'red'});
    private markers = new L.FeatureGroup().on('layeradd layerremove', util.fixFontRendering);
    private contextMenuItem: ContextMenuItem;
    constructor(metroMap: MetroMap) {
        this.metroMap = metroMap;
        this.map = metroMap.getMap();
        this.contextMenuItem = this.metroMap.contextMenu.items.get('measuredistance');
    }

    private updateDistances() {
        const latlngs = this.polyline.getLatLngs(),
            markers = this.markers.getLayers() as L.Marker[],
            nMarkers = markers.length;
        latlngs[0] = markers[0].setPopupContent('0').getLatLng();
        for (let i = 1, distance = 0; i < nMarkers; ++i) {
            const currentLatLng = markers[i].getLatLng();
            latlngs[i] = currentLatLng;
            distance += markers[i - 1].getLatLng().distanceTo(currentLatLng);
            const d = Math.round(distance);
            const str = d < 1000 ? d + ' m' : (d < 10000 ? d / 1000 : Math.round(d / 10) / 100) + ' km';
            markers[i].setPopupContent(str);
        }
        if (latlngs.length > nMarkers) {
            latlngs.length = nMarkers;
        }
        this.polyline.redraw();
        if (nMarkers > 1) {
            markers[nMarkers - 1].openPopup();
        }
    }

    private makeMarker = (e: L.LeafletMouseEvent) => {
        if (e.originalEvent.button !== 0) return;
        const marker = new L.Marker(e.latlng, { draggable: true })
            .bindPopup('')
            .on('drag', e => this.updateDistances())
            .on('click', (e: L.LeafletMouseEvent) => {
                if (e.originalEvent.button !== 1) return;
                //L.DomEvent.preventDefault(e.originalEvent);
                this.markers.removeLayer(marker);
                if (this.markers.getLayers().length > 0) {
                    this.updateDistances();
                } else {
                    this.metroMap.dispatchEvent(new MouseEvent('deletemeasurements'));
                }

                //L.DomEvent.stopPropagation(e.originalEvent);
                //return false;
            });
        // const el = { lang: { ru: 'Udaliť izmerenia', en: 'Delete measurements' } };
        // this.metroMap.contextMenu.extraItems.set(circle, new Map().set('deletemeasurements', el));
        marker.setIcon(Icons.circle);
        this.markers.addLayer(marker);
        this.updateDistances();
    };

    measureDistance(initialCoordinate: L.LatLng) {
        this.metroMap.contextMenu.items.delete('measuredistance');
        this.map.addLayer(this.polyline.setLatLngs([]))
            .addLayer(this.markers)
            .on('click', this.makeMarker);
        this.map.fire('click', { latlng: initialCoordinate, originalEvent: { button: 0 } });
        util.onceEscapePress(e => this.metroMap.dispatchEvent(new MouseEvent('deletemeasurements')));
    }

    deleteMeasurements() {
        this.map.removeLayer(this.polyline)
            .removeLayer(this.markers.clearLayers())
            .off('click', this.makeMarker);
        this.metroMap.contextMenu.items.set('measuredistance', this.contextMenuItem);
    }
}