/// <reference path="../../typings/tsd.d.ts" />
const alertify = require('alertifyjs');
import * as L from 'leaflet';
import MetroMap from '../metromap';
import * as util from '../util';
import { Animation, Shadows } from '../svg';
import { shortestRoute, ShortestRouteObject } from '../algorithm';
import { Icons, cacheIcons } from '../ui';
import { tr, formatTime as ft } from '../i18n';

export default class RoutePlanner {
    private metroMap: MetroMap;
    private fromMarker: L.Marker;
    private toMarker: L.Marker;

    constructor(metroMap: MetroMap) {
        this.metroMap = metroMap;
        const map = metroMap.getMap();
        const center = map.getCenter();
        this.fromMarker = new L.Marker(center, { draggable: true, icon: Icons.Start });
        this.toMarker = new L.Marker(center, { draggable: true, icon: Icons.End });
        cacheIcons(metroMap.getMap(), [this.fromMarker, this.toMarker]);
        this.addMarkerListeners();
        metroMap.addListener('routefrom routeto', this.handleFromTo.bind(this));
        metroMap.addListener('clearroute', e => this.clearRoute());
        map.on('zoomstart', e => Animation.terminateAnimations());
    }

    private handleFromTo(e: MouseEvent) {
        const map = this.metroMap.getMap();
        const coors = util.mouseToLatLng(map, e);
        const marker = e.type === 'routefrom' ? this.fromMarker : this.toMarker;
        marker.setLatLng(coors);
        if (!map.hasLayer(marker)) {
            map.addLayer(marker);
        }
        const otherMarker = marker === this.fromMarker ? this.toMarker : this.fromMarker;
        if (map.hasLayer(otherMarker)) {
            // fixing font rendering here boosts the performance
            util.fixFontRendering();
            this.visualizeRouteBetween(this.fromMarker.getLatLng(), this.toMarker.getLatLng());
            //this.map.once('zoomend', e => this.visualizeShortestRoute(latLngArr));
            //this.map.fitBounds(new L.LatLngBounds(latLngArr));
        }
    }

    private addMarkerListeners(): void {
        for (let marker of [this.fromMarker, this.toMarker]) {
            marker.on('drag', e => this.visualizeShortestRoute(false)).on('dragend', e => {
                util.fixFontRendering();
                this.visualizeShortestRoute();
            });
        }
    }    

    private visualizeShortestRoute(animate = true) {
        const map = this.metroMap.getMap();
        if (!map.hasLayer(this.fromMarker) || !map.hasLayer(this.toMarker)) return;
        this.visualizeRouteBetween(this.fromMarker.getLatLng(), this.toMarker.getLatLng(), animate);
    }

    private visualizeRouteBetween(from: L.LatLng, to: L.LatLng, animate = true) {
        util.resetStyle();
        alertify.dismissAll();
        this.visualizeRoute(shortestRoute(this.metroMap.getNetwork(), from, to), animate);
    }

    private visualizeRoute(obj: ShortestRouteObject, animate = true) {
        const { platforms, edges, time } = obj;
        const walkTo = ft(time.walkTo);
        if (edges === undefined) {
            return alertify.success(tr`${walkTo} on foot!`);
        }
        const selector = '#paths-inner *, #paths-outer *, #transfers-inner *, #transfers-outer *, #station-circles *';
        Animation.terminateAnimations().then(() => {
            for (let { style } of document.querySelectorAll(selector) as any) {
                //style['-webkit-filter'] = 'grayscale(1)';
                style.filter = null;
                style.opacity = '0.25';
            }
            if (animate) {
                return Animation.animateRoute(this.metroMap.getNetwork(), platforms, edges, 1);
            }
            for (let edgeIdTail of edges) {
                const outer = document.getElementById('o' + edgeIdTail);
                if (outer === null) continue;
                outer.style.opacity = null;
                const inner = document.getElementById('i' + edgeIdTail);
                if (inner !== null) {
                    inner.style.opacity = null;
                }
                if (outer.id.charAt(1) !== 't') {
                    Shadows.applyDrop(outer);
                }
            }
            for (let platformNum of platforms) {
                document.getElementById('p-' + platformNum).style.opacity = null;
            }      
        }).then(finished => {
            // finished is undefined if not animated, false if animation is still running or true if otherwise
            if (!finished) return;
            alertify.message(tr`TIME:<br>${walkTo} on foot<br>${ft(time.metro)} by metro<br>${ft(time.walkFrom)} on foot<br>TOTAL: ${ft(time.total)}`, 10)
        });
    }

    private clearRoute() {
        const map = this.metroMap.getMap();
        const terminate = Animation.terminateAnimations();
        map.removeLayer(this.fromMarker).removeLayer(this.toMarker);
        this.fromMarker.off('drag').off('dragend');
        this.toMarker.off('drag').off('dragend');
        alertify.dismissAll();
        terminate.then(util.resetStyle);
    }

}
