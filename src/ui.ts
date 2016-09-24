const alertify = require('alertifyjs');
import MapEditor from './ui/mapeditor';
import FAQ from './ui/faq';
import TextPlate from './ui/textplate';
import RoutePlanner from './ui/routeplanner';
import ContextMenu from './ui/contextmenu';
import DistanceMeasure from './ui/distancemeasure';
import SvgOverlay from './ui/svgoverlay';
import MetroMap from './metromap';
import * as Icons from './ui/icons';

export { DistanceMeasure, MapEditor, FAQ, TextPlate, RoutePlanner, ContextMenu, Icons, SvgOverlay }

import * as L from 'leaflet';
import * as nw from './network';
import { calculateGeoMean } from './util/geo';
import { tr, userLanguage } from './i18n';

export function platformRenameDialog(platform: nw.Platform) {
    const ru = platform.name, {fi, en} = platform.altNames;
    const names = en ? [ru, fi, en] : fi ? [ru, fi] : [ru];
    const nameString = names.join('|');
    const tokens = window.location.search.match(/city=(\w+)/);
    const city = tokens ? tokens[1] : 'spb';
    const second = city === 'spb' ? 'fi' : city === 'helsinki' ? 'se' : undefined;
    alertify.prompt(tr`New name`, nameString, (okev, val: string) => {
        const newNames = val.split('|');
        [platform.name, platform.altNames[second], platform.altNames['en']] = newNames;
        if (val === nameString) {
            return alertify.warning(tr`Name was not changed`);
        }
        const oldNamesStr = names.slice(1).join(', '),
            newNamesStr = newNames.slice(1).join(', ');
        alertify.success(tr`${ru} (${oldNamesStr}) renamed to ${newNames[0]} (${newNamesStr})`)
        const station = platform.station;
        if (station.platforms.length < 2) return;
        alertify.confirm(tr`Rename the entire station?`, () => {
            for (let p of station.platforms) {
                [p.name, p.altNames['fi'], p.altNames['en']] = newNames;
            }
            alertify.success(tr`The entire station was renamed to ${val}`);
        });

    }, () => alertify.warning(tr`Name change cancelled`));
}

export function askRoutes(network: nw.Network, defSet?: Set<nw.Route>) {
    const def = defSet === undefined ? undefined : Array.from(defSet).map(r => r.line + r.branch).join('|')
    let routeSet = new Set<nw.Route>();
    for (let s of prompt('routes', def).split('|')) {
        var tokens = s[0] === 'M' ? s.match(/(M\d{0,2})(\w?)/) : s.match(/([EL])(.{0,2})/);
        if (!tokens) {
            console.error('incorrect route', s);
            continue;
        }
        let route = network.routes.find(r => r.line === tokens[1] && r.branch === tokens[2]);
        if (route === undefined) {
            console.log('creating new route');
            route = { line: tokens[1], branch: tokens[2] };
            network.routes.push(route);
        }
        routeSet.add(route);
    }
    return routeSet;
}

export function addLayerSwitcher(map: L.Map, layers: L.TileLayer[]): void {
    let currentLayerIndex = 0;
    console.log(layers.length);
    addEventListener('keydown', e => {
        if (!e.shiftKey || !e.ctrlKey || e.keyCode !== 76) return;
        e.preventDefault();
        map.removeLayer(layers[currentLayerIndex]);
        if (++currentLayerIndex === layers.length) currentLayerIndex = 0;
        map.addLayer(layers[currentLayerIndex]);
        map.invalidateSize(false);
    });
}

export function drawZones(map: L.Map, platforms: nw.Platform[]) {
    const metroPoints = platforms.filter(p => p.spans[0].routes[0].line.startsWith('M')).map(p => p.location);
    const fitnessFunc = pt => metroPoints.reduce((prev, cur) => prev + pt.distanceTo(cur), 0);
    const poly = L.polyline([], { color: 'red'});
    const metroMean = calculateGeoMean(metroPoints, fitnessFunc, 1, cur => poly.addLatLng(cur));
    map.addLayer(poly);
    for (let i = 5000; i < 20000; i += 5000) {
        L.circle(metroMean, i - 250, { weight: 1 }).addTo(map);
        L.circle(metroMean, i + 250, { weight: 1 }).addTo(map);
    }
    const ePoints = platforms.filter(p => p.spans[0].routes[0].line.startsWith('E')).map(p => p.location);
    const eMean = platforms.find(p => p.name === 'Glavnyj voxal' && p.spans[0].routes[0].line.startsWith('E')).location;
    L.circle(eMean, 30000).addTo(map);
    L.circle(eMean, 45000).addTo(map);
}


export function cacheIcons(map: L.Map, markers: L.Marker[]) {
    for (let marker of markers) {
        map.addLayer(marker).removeLayer(marker);
    }
}