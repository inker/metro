/// <reference path="../../typings/tsd.d.ts" />
import * as L from 'leaflet';
import MetroMap from '../metromap';
import * as util from '../util';
import { Icons } from '../ui';

export default class DistanceMeasure {
    private metroMap: MetroMap;
    private polyline = new L.Polyline([], { color: 'red'});
    private markers = new L.FeatureGroup().on('layeradd layerremove', e => util.fixFontRendering());
    private dashedLine = new L.Polyline([], { color: 'red', opacity: 0.25, dashArray: '0,9' });

    constructor(metroMap: MetroMap) {
        this.metroMap = metroMap;
        const map = metroMap.getMap();
        const measureListener = (e: MouseEvent) => this.measureDistance(util.mouseToLatLng(map, e));
        metroMap.addEventListener('measuredistance', measureListener);
        metroMap.addEventListener('deletemeasurements', e => this.deleteMeasurements());
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
        this.dashedLine.getLatLngs()[0] = latlngs[latlngs.length - 1];
        //this.dashedLine.redraw();
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
        //this.metroMap.contextMenu.extraItems.set(circle, new Map().set('deletemeasurements', el));
        marker.setIcon(Icons.circle);
        this.markers.addLayer(marker);
        this.updateDistances();
    };

    private onMouseMove = (e: L.LeafletMouseEvent) => {
        this.dashedLine.getLatLngs()[1] = e.latlng;
        this.dashedLine.redraw();
    }

    measureDistance(initialCoordinate: L.LatLng) {
        this.dashedLine.addLatLng(initialCoordinate).addLatLng(initialCoordinate);
        this.metroMap.getMap()
            .addLayer(this.polyline.setLatLngs([]))
            .addLayer(this.markers)
            .addLayer(this.dashedLine.setLatLngs([]))
            .on('click', this.makeMarker)
            .on('mousemove', this.onMouseMove)
            .fire('click', { latlng: initialCoordinate, originalEvent: { button: 0 } });
        util.onceEscapePress(e => this.metroMap.dispatchEvent(new MouseEvent('deletemeasurements')));
    }

    deleteMeasurements() {
        this.metroMap.getMap()
            .removeLayer(this.polyline)
            .removeLayer(this.markers.clearLayers())
            .removeLayer(this.dashedLine)
            .off('mousemove', this.onMouseMove)
            .off('click', this.makeMarker);
    }
}