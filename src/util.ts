/// <reference path="../typings/tsd.d.ts" />
import * as L from 'leaflet';
import * as po from './plain-objects';
import * as math from './math';
import * as lang from './lang';
const tr = (text: string) => lang.translate(text);
const alertify = require('alertifyjs');

export function arrayEquals<T>(a: T[], b: T[]) {
    const n = a.length;
    if (n !== b.length) return false;
    for (let i = 0; i < n; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

export function mouseToLatLng(map: L.Map, event: MouseEvent): L.LatLng {
    const clientPos = new L.Point(event.clientX, event.clientY);
    const rect = map.getContainer().getBoundingClientRect();
    const containerPos = new L.Point(rect.left, rect.top);
    const coors = map.containerPointToLatLng(clientPos.subtract(containerPos));
    return coors;
}

export function once(el: EventTarget, eventType: string, listener: (e: Event) => any) {
    const handler: typeof listener = e => {
        el.removeEventListener(eventType, handler);
        listener(e);
    }
    el.addEventListener(eventType, handler);
}

export function onceEscapePress(handler: (ev: KeyboardEvent) => any) {
    const keydownListener = (e: KeyboardEvent) => {
        if (e.keyCode !== 27) return;
        handler(e);
        removeListener();
    };
    const backbuttonListener = e => {
        handler(e);
        removeListener();
    }
    function removeListener() {
        removeEventListener('keydown', keydownListener);
        removeEventListener('backbutton', backbuttonListener);
    }

    addEventListener('keydown', keydownListener);
    addEventListener('backbutton', backbuttonListener);
    // once(window, 'keydown', (e: KeyboardEvent) => {
    //     if (e.keyCode === 27) handler(e);
    // });
}

export function resetStyle() {
    const selector = '#paths-inner *, #paths-outer *, #transfers-inner *, #transfers-outer *, #station-circles *';
    const els = document.querySelectorAll(selector);
    for (let i = 0; i < els.length; ++i) {
        const el = els[i] as HTMLElement;
        el.style.opacity = null;
        if (el.id.charAt(1) !== 't') {
            el.style.filter = null;
        }
    }
}

export namespace CSSTransform {
    export function toPoint(val: string): L.Point {
        if (val.length == 0) return new L.Point(0, 0);
        const tokens = val.match(/translate(3d)?\((-?\d+).*?,\s?(-?\d+).*?(,\s?(-?\d+).*?)?\)/i);
        return  tokens && tokens[0] ? new L.Point(+tokens[2], +tokens[3]) : new L.Point(0, 0);
    }

    export function trim3d(el: HTMLElement | SVGStylable) {
        const s = el.style;
        s.transform = s.transform.replace(/translate3d\s*\((.+?,\s*.+?),\s*.+?\s*\)/i, 'translate($1)');
    }
}

export namespace Hints {
    export function verify(graph: po.Graph, hints: po.Hints): Promise<string> {
        function checkExistence(val: string) {
            if (graph.platforms.find(el => el.name === val) === undefined) {
                throw new Error(`platform ${val} doesn't exist`);
            }
        }
        function checkPlatformHintObject(obj) {
            for (let line of Object.keys(obj)) {
                const val = obj[line];
                if (typeof val === 'string') {
                    checkExistence(val);
                } else {
                    val.forEach(checkExistence);
                }
            }
        }
        return new Promise<string>((resolve, reject) => {
            const crossPlatform = hints.crossPlatform;
            Object.keys(crossPlatform).forEach(platformName => {
                if (graph.platforms.find(el => el.name === platformName) === undefined) {
                    reject(`platform ${platformName} doesn't exist`);
                }
                const obj = crossPlatform[platformName];
                if ('forEach' in obj) {
                    obj.forEach(checkPlatformHintObject);
                } else {
                    checkPlatformHintObject(obj);
                }
            });
            resolve('hints json seems okay');
        });
    }

    /**
     * null: doesn't contain
     * -1: is an object
     * >=0: is an array
     */
    export function hintContainsLine(graph: po.Graph, dirHints: any, platform: po.Platform): number {
        const spans = platform.spans.map(i => graph.spans[i]);
        const routes: po.Route[] = [];
        spans.forEach(span => span.routes.forEach(i => routes.push(graph.routes[i])));
        const lines = routes.map(r => r.line);
        const platformHints = dirHints[platform.name];
        if (platformHints) {
            if ('forEach' in platformHints) {
                for (let idx = 0; idx < platformHints.length; ++idx) {
                    if (Object.keys(platformHints[idx]).some(key => lines.indexOf(key) > -1)) {
                        return idx;
                    }
                }
            } else if (Object.keys(platformHints).some(key => lines.indexOf(key) > -1)) {
                return -1;
            }
        }
        return null;
    }
}

export namespace Color {
    function hexToArray(hex: string): number[] {
        return hex.match(/[0-9a-f]{1,2}/ig).map(s => parseInt(s, 16));
    }

    function rgbToArray(rgb: string): number[] {
        return rgb.match(/rgb\s*\((\d+),\s*(\d+),\s*(\d+)\s*\)/).slice(1).map(Number);
    }

    export function mean(rgb: string[]): string {
        const reduceFunc = (prev: number[], cur: string) =>
            (cur.startsWith('#') ? hexToArray : rgbToArray)(cur)
                .map((it, i) => prev[i] + it);
        const [r, g, b] = rgb.reduce(reduceFunc, [0, 0, 0]).map(i => Math.floor(i / rgb.length));
        return `rgb(${r}, ${g}, ${b})`;
    }
}

export function flashTitle(titles: string[], duration: number) {
    let i = 0;
    setInterval(() => document.title = titles[++i % titles.length], duration);
}

export function downloadAsFile(title: string, content: string) {
    const a = document.createElement('a');
    const blob = new Blob([content], { type: 'octet/stream' });
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a['download'] = title;
    a.click();
    window.URL.revokeObjectURL(url);
}

export function platformRenameDialog(graph: po.Graph, platform: po.Platform) {
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

import * as geo from './geo';
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

export function scaleOverlay(overlay: HTMLElement, scaleFactor: number, mousePos?: L.Point) {
    const overlayStyle = overlay.style;
    const box = overlay.getBoundingClientRect();
    if (!mousePos) {
        const el = document.documentElement;
        mousePos = new L.Point(el.clientWidth / 2, el.clientHeight / 2);
    }
    const clickOffset = new L.Point(mousePos.x - box.left, mousePos.y - box.top);
    const ratio = new L.Point(clickOffset.x / box.width, clickOffset.y / box.height);
    // overlayStyle.left = '0';
    // overlayStyle.top = '0';
    overlayStyle.transformOrigin = `${ratio.x * 100}% ${ratio.y * 100}%`;
    overlayStyle.transform = `scale(${scaleFactor})`;
    console.log(overlayStyle.transformOrigin);
}

export function loadIcons(map: L.Map, markers: L.Marker[]) {
    for (let marker of markers) {
        map.addLayer(marker).removeLayer(marker);
    }
}

export function removeAllChildren(el: Node) {
    let child: Node;
    while (child = el.firstChild) {
        el.removeChild(child);
    }
}


/**
 * Fixes blurry font due to 'transform3d' CSS property. Changes everything to 'transform' when the map is not moving
 */
export function fixFontRendering(): void {
    const blurringStuff = document.querySelectorAll('[style*="translate3d"]');
    console.log(blurringStuff);
    for (let i = 0; i < blurringStuff.length; ++i) {
        CSSTransform.trim3d(blurringStuff[i] as HTMLElement&SVGStylable);
    }
}