/// <reference path="../typings/tsd.d.ts" />
import * as L from 'leaflet';
import * as nw from './network';
import * as i18n from './i18n'

export function arrayEquals<T>(a: T[], b: T[]) {
    const n = a.length;
    if (n !== b.length) return false;
    for (let i = 0; i < n; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

export function uniquify<T>(arr: T[]) {
    return Array.from(new Set(arr));
} 

export function formatInteger(integer: number): string {
    const s = integer.toString();
    console.log(s);
    const start = s.length % 3;
    const arr = start > 0 ? [s.slice(0, start)] : [];
    for (let i = s.length % 3; i < s.length; i += 3) {
        arr.push(s.substr(i, 3));
    }
    console.log(arr);
    return arr.join("'");
}

export function mouseToLatLng(map: L.Map, event: MouseEvent): L.LatLng {
    const rect = map.getContainer().getBoundingClientRect();
    const containerPoint = new L.Point(event.clientX - rect.left, event.clientY - rect.top);
    return map.containerPointToLatLng(containerPoint);
}

export function callMeMaybe<ReturnType>(func: (...params: any[]) => ReturnType, ...params: any[]): ReturnType {
    return func ? func(...params) : undefined;
}

export function once(el: EventTarget, eventType: string, listener: EventListener) {
    el.addEventListener(eventType, function handler(e: Event) {
        el.removeEventListener(eventType, handler);
        listener(e);
    });
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
    const selector = ['paths-inner', 'paths-outer', 'transfers-inner', 'transfers-outer', 'station-circles']
        .map(i => `#${i} > *`).join(', ');
    const els = document.querySelectorAll(selector);
    for (let i = 0; i < els.length; ++i) {
        const el = els[i] as HTMLElement;
        el.style.opacity = null;
        if (el.id[1] !== 't') {
            el.style.filter = null;
        }
    }
}

export function triggerMouseEvent(target: Node, eventType: string) {
    const e = document.createEvent('MouseEvents');
    e.initEvent(eventType, true, true);
    target.dispatchEvent(e);    
}

export function getPlatformNames(platform: nw.Platform): string[] {
    const ru = platform.name,
        { fi, en } = platform.altNames,
        names = !fi ? [ru] : i18n.userLanguage === 'fi' ? [fi, ru] : [ru, fi];
    if (en) names.push(en);
    return names;
}

export function circleByIndex(index: number): SVGCircleElement {
    return document.getElementById('p-' + index) as any;
}

export function circleByDummy(dummyCircle: Element): SVGCircleElement {
    return document.getElementById('p-' + dummyCircle.id.slice(2)) as any;
}

export function platformByCircle(circle: Element, network: nw.Network) {
    return network.platforms[+circle.id.slice(2)];
}

export function trim3d<T extends { style: CSSStyleDeclaration }>({ style }: T) {
    style.transform = style.transform.replace(/translate3d\s*\((.+?,\s*.+?),\s*.+?\s*\)/i, 'translate($1)');
}

export namespace Color {
    function hexToArray(hex: string): number[] {
        return hex.match(/[0-9a-f]{1,2}/ig).map(s => parseInt(s, 16));
    }

    function rgbToArray(rgb: string): number[] {
        return rgb.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i).slice(1).map(Number);
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

export function downloadFile(title: string, blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = title;
    a.click();
    URL.revokeObjectURL(url);
}

export function downloadTextFile(title: string, content: string) {
    downloadFile(title, new Blob([content], { type: 'octet/stream' }));
}

export function scaleOverlay(overlay: SVGSVGElement, scaleFactor: number, mousePos?: L.Point) {
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
export function fixFontRendering(parent: { querySelectorAll } = document): void {
    const blurringStuff = parent.querySelectorAll('[style*="translate3d"]');
    console.log('fixing font', parent, blurringStuff);
    for (let i = 0; i < blurringStuff.length; ++i) {
        trim3d(blurringStuff[i] as HTMLElement&SVGStylable);
    }
}