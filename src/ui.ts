/// <reference path="../typings/tsd.d.ts" />

const alertify = require('alertifyjs');
import MapEditor from './ui/mapeditor';
import FAQ from './ui/faq';
import TextPlate from './ui/textplate';
import ContextMenu from './ui/contextmenu';
import DistanceMeasure from './ui/distancemeasure';

export { DistanceMeasure, MapEditor, FAQ, TextPlate, ContextMenu, Icons }

import * as L from 'leaflet';
import * as g from './graph';
import * as geo from './geo';
import * as lang from './lang';
import * as svg from './svg';
const tr = lang.translate;

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

    export const circle = (() => {
        const root = svg.createSVGElement('svg');
        root.setAttribute('width', '100');
        root.setAttribute('height', '100');
        const ci = svg.makeCircle(new L.Point(50, 50), 40);
        ci.style.stroke = 'red';
        ci.style.strokeWidth = '20px';
        ci.style.fill = 'white';
        root.appendChild(ci);
        const xml = new XMLSerializer().serializeToString(root);
        const data = "data:image/svg+xml;base64," + btoa(xml);
        const img = document.createElement('img');
        img.src = data;
        //document.body.appendChild(img)
        const r = 5;
        return L.icon({
            iconUrl: data,
            iconSize: [r * 2, r * 2],
            iconAnchor: [r, r],
            popupAnchor: [0, -r]        
        });
    })();
}

export function platformRenameDialog(graph: g.Graph, platform: g.Platform) {
    const ru = platform.name, {fi, en} = platform.altNames;
    const names = en ? [ru, fi, en] : fi ? [ru, fi] : [ru];
    const nameString = names.join('|');
    alertify.prompt(tr('New name'), nameString, (okevt, val: string) => {
        const newNames = val.split('|');
        [platform.name, platform.altNames['fi'], platform.altNames['en']] = newNames;
        if (val === nameString) {
            return alertify.warning(tr('Name was not changed'));
        }
        const oldNamesStr = names.slice(1).join(', '),
            newNamesStr = newNames.slice(1).join(', ');
        alertify.success(`${ru} (${oldNamesStr}) ${tr('renamed to')} ${newNames[0]} (${newNamesStr})`);
        const station = graph.stations[platform.station];
        if (station.platforms.length < 2) return;
        alertify.confirm(tr('Rename the entire station') + '?', () => {
            for (let i of station.platforms) {
                const p = graph.platforms[i];
                [p.name, p.altNames['fi'], p.altNames['en']] = newNames;
            }
            [station.name, station.altNames['fi'], station.altNames['en']] = newNames;
            alertify.success(`${tr('The entire station was renamed to')} ${val}`);
        });

    }, () => alertify.warning(tr('Name change cancelled')));
}

export function addLayerSwitcher(map: L.Map, layers: L.TileLayer[]): void {
    let currentLayerIndex = 0;
    console.log(layers.length);
    addEventListener('keydown', e => {
        if (!e.ctrlKey || e.keyCode !== 76) return;
        e.preventDefault();
        map.removeLayer(layers[currentLayerIndex]);
        if (++currentLayerIndex === layers.length) currentLayerIndex = 0;
        map.addLayer(layers[currentLayerIndex]);
        map.invalidateSize(false);
    });
}

export function drawZones(metroMap) {
    this.graph = metroMap.getGraph();
    this.map = metroMap.getMap();
    const metroPoints = this.graph.platforms.filter(p => this.graph.routes[this.graph.spans[p.spans[0]].routes[0]].line.startsWith('M')).map(p => p.location);
    const fitnessFunc = pt => metroPoints.reduce((prev, cur) => prev + pt.distanceTo(cur), 0);
    const poly = L.polyline([]);
    const metroMean = geo.calculateGeoMean(metroPoints, fitnessFunc, poly.addLatLng.bind(poly));
    this.map.addLayer(poly);
    for (let i = 5000; i < 20000; i += 5000) {
        L.circle(metroMean, i - 250, { weight: 1 }).addTo(this.map);
        L.circle(metroMean, i + 250, { weight: 1 }).addTo(this.map);
    }
    const ePoints = this.graph.platforms.filter(p => this.graph.routes[this.graph.spans[p.spans[0]].routes[0]].line.startsWith('E')).map(p => p.location);
    const eMean = this.graph.platforms.find(p => p.name === 'Glavnyj voxal' && this.graph.routes[this.graph.spans[p.spans[0]].routes[0]].line.startsWith('E')).location;
    L.circle(eMean, 30000).addTo(this.map);
    L.circle(eMean, 45000).addTo(this.map);
}


export function cacheIcons(map: L.Map, markers: L.Marker[]) {
    for (let marker of markers) {
        map.addLayer(marker).removeLayer(marker);
    }
}