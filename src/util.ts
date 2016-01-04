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

export function once(el: EventTarget, eventType: string, listener: (e: KeyboardEvent) => any) {
    const handler: typeof listener = e => {
        el.removeEventListener(eventType, handler);
        listener(e);
    }
    el.addEventListener(eventType, handler);
}

export function onceEscapePress(handler: (ev: KeyboardEvent) => any) {
    once(window, 'keydown', e => {
        if (e.keyCode === 27) handler(e);
    });
}

export function resetStyle() {
    const selector = '#paths-inner *, #paths-outer *, #transfers-inner *, #transfers-outer *, #station-circles *';
    const els = document.querySelectorAll(selector);
    for (let i = 0; i < els.length; ++i) {
        const el: HTMLElement = els[i] as any;
        el.style.opacity = null;
        if (el.id.charAt(1) !== 't') {
            el.style.filter = null;
        }
    }
}

export namespace Transform {
    export function parse(val: string): L.Point {
        if (val.length == 0) return new L.Point(0, 0);
        const [m, , x, y] = val.match(/translate(3d)?\((-?\d+).*?,\s?(-?\d+).*?(,\s?(-?\d+).*?)?\)/i);
        return m ? new L.Point(Number(x), Number(y)) : new L.Point(0, 0);
    }

    export function replace(el: HTMLElement) {
        const s = el.style;
        s.transform = s.transform.replace(/translate3d\s*\((.+?,\s*.+?),\s*.+?\s*\)/i, 'translate($1)');
    }
}

export namespace SVGDataset {
    export function get(el: Element): any {
        // for webkit-based browsers
        if ('dataset' in el) {
            return el['dataset'];
        }
        // for the rest
        const attrs = el.attributes;
        const dataset = {};
        for (let i = 0; i < attrs.length; ++i) {
            const attr = attrs[i].name;
            if (attr.startsWith('data-')) {
                dataset[attr.slice(5)] = el.getAttribute(attr);
            }
        }
        return dataset;
    }

    export function set(el: Element, dataset: any): void {
        for (let key of Object.keys(dataset)) {
            el.setAttribute('data-' + key, dataset[key]);
        }
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
        const lines = routes.map(rt => rt.line);
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
    function hexColorToArray(hex: string): number[] {
        return hex.match(/[0-9a-f]{1,2}/ig).map(s => parseInt(s, 16));
    }

    function rgbColorToArray(rgb: string): number[] {
        return rgb.match(/rgb\s*\((\d+),\s*(\d+),\s*(\d+)\s*\)/).slice(1).map(Number);
    }

    export function mean(rgb: string[]): string {
        const reduceFunc = (prev: number[], cur: string) =>
            (cur.startsWith('#') ? hexColorToArray : rgbColorToArray)(cur)
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
    const blob = new Blob([content], { type: "octet/stream" });
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