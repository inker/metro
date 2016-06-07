/// <reference path="../typings/tsd.d.ts" />
import * as L from 'leaflet';
import * as po from './plain-objects';
import * as lang from './lang'

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

export function callMeMaybe<ReturnType>(func: (...params: any[]) => ReturnType, ...params: any[]): ReturnType {
    return func ? func(...params) : undefined;
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

export function getPlatformNames(platform: po.Platform): string[] {
    const ru = platform.name,
        { fi, en } = platform.altNames,
        names = !fi ? [ru] : lang.userLanguage === 'fi' ? [fi, ru] : [ru, fi];
    if (en) names.push(en);
    return names;
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