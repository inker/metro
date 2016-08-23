/// <reference path="../../typings/tsd.d.ts" />
import * as L from 'leaflet';
import * as nw from '../network';
import * as i18n from '../i18n';
import { getStyleRulesAsText } from '../res';

export function arraysEquals<T>(a: T[], b: T[]) {
    const n = a.length;
    if (n !== b.length) return false;
    for (let i = 0; i < n; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

export function setsEqual<T>(a: Set<T>, b: Set<T>) {
    const n = a.size;
    if (n !== b.size) return false;
    for (let vals = a.values(), el = vals.next(); !el.done; el = vals.next()) {
        if (!b.has(el.value)) return false;
    }
    return true;
}

export function intersection<T>(a: Set<T>, b: Set<T>) {
    const isn = new Set<T>();
    a.forEach(item => {
        if (b.has(item)) isn.add(item)
    });
    return isn;
}

export function uniquify<T>(arr: T[]) {
    return Array.from(new Set(arr));
}

export function deleteFromArray<T>(arr: T[], el: T) {
    const pos = arr.indexOf(el);
    if (pos < 0) return;
    arr[pos] = arr[arr.length - 1];
    arr.pop();
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

export function roundPoint(point: L.Point, precision: number): L.Point {
    return new L.Point(+point.x.toFixed(precision), +point.y.toFixed(precision));
}

export function getFraction(num: number, radix = 10): string {
    return num.toString(radix).split('.')[1] || '0';
}

export function generateId(collision?: (temp: string) => boolean): string {
    const id = Math.random().toString(36).slice(2);
    return collision !== undefined && collision(id) ? generateId(collision) : id;  
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
        removeListener();
        handler(e);
    };
    const backbuttonListener = e => {
        removeListener();
        handler(e);
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

export function getPlatformNamesZipped(platforms: nw.Platform[]) {
    const platformNames = platforms.map(getPlatformNames);
    return [0, 1, 2]
        .map(no => platforms.map((p, i) => platformNames[i][no]))
        .map(uniquify)
        .map(arr => arr.reduce((prev, cur) => `${prev} / ${cur}`))
        .filter(s => s !== undefined);
}

export function midPointsToEnds(posOnSVG: L.Point, midPts: L.Point[]) {
    const lens = midPts.map(midPt => posOnSVG.distanceTo(midPt));
    const midOfMidsWeighted = midPts[1]
        .subtract(midPts[0])
        .multiplyBy(lens[0] / (lens[0] + lens[1]))
        .add(midPts[0]);
    const offset = posOnSVG.subtract(midOfMidsWeighted);
    return midPts.map(v => roundPoint(v.add(offset), 2));    
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

export namespace File {
    export function download(title: string, dataURL: string) {
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = title;
        a.click();
    }

    export function downloadBlob(title: string, blob: Blob) {
        const url = URL.createObjectURL(blob);
        download(title, url);
        URL.revokeObjectURL(url);
    }

    export function downloadText(title: string, content: string) {
        downloadBlob(title, new Blob([content], { type: 'octet/stream' }));
    }

    export function downloadSvgAsPicture(title: string, root: SVGSVGElement, format: string) {
        svgToPictureDataUrl(root, format).then(dataURL => download(title, dataURL));
    }

    export function svgToPictureDataUrl(root: SVGSVGElement, format: string): Promise<string> {
        return svgToCanvas(root).then(canvas => canvas.toDataURL('image/' + format));
    }

    export function svgToCanvas(root: SVGSVGElement): Promise<HTMLCanvasElement> {
        return new Promise<HTMLCanvasElement>(resolve => {
            const img = svgToImg(root, true);
            img.onload = e => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                canvas.getContext('2d').drawImage(img, 0, 0);
                resolve(canvas);
            };
        })
    }

    export function svgToPicture(root: SVGSVGElement): Promise<HTMLImageElement> {
        const dataUrlPromise = svgToPictureDataUrl(root, 'png');
        const img = document.createElement('img');
        img.width = parseInt(root.getAttribute('width')) || parseInt(root.style.width);
        img.height = parseInt(root.getAttribute('height')) || parseInt(root.style.height);
        return dataUrlPromise.then(dataUrl => {
            img.src = dataUrl;
            return img;
        });
    }

    export function svgToImg(root: SVGSVGElement, appendExternalStyles = false): HTMLImageElement {
        if (appendExternalStyles) {
            root = optimizeSvg(root);
        }
        const img = document.createElement('img');
        img.width = parseInt(root.getAttribute('width')) || parseInt(root.style.width);
        img.height = parseInt(root.getAttribute('height')) || parseInt(root.style.height);
        img.src = svgToDataUrl(root);
        return img;
    }

    export function svgToDataUrl(root: SVGSVGElement): string {
        return 'data:image/svg+xml;base64,' + btoa(new XMLSerializer().serializeToString(root));
    }

    function optimizeSvg(root: SVGSVGElement): SVGSVGElement {
        const optimized = root.cloneNode(true) as SVGSVGElement;
        const dummy = optimized.querySelectorAll('[id^=dummy]');
        for (let i = 0, len = dummy.length; i < len; ++i) {
            dummy[i].parentNode.removeChild(dummy[i]);
        }
        optimized.style.left = optimized.style.top = '';
        const plate = optimized.querySelector('#station-plate');
        plate.parentNode.removeChild(plate);
        const defs = optimized.querySelector('defs');
        const styleElement = document.createElement('style');
        styleElement.textContent = getStyleRulesAsText();
        defs.insertBefore(styleElement, defs.firstChild);
        return optimized;
    }

}

export function flashTitle(titles: string[], duration: number) {
    let i = 0;
    setInterval(() => document.title = titles[++i % titles.length], duration);
}

export function scaleOverlay(overlay: Element&{ style: CSSStyleDeclaration }, scaleFactor: number, mousePos?: L.Point) {
    const box = overlay.getBoundingClientRect();
    if (!mousePos) {
        const el = document.documentElement;
        mousePos = new L.Point(el.clientWidth / 2, el.clientHeight / 2);
    }
    const clickOffset = new L.Point(mousePos.x - box.left, mousePos.y - box.top);
    const ratio = new L.Point(clickOffset.x / box.width, clickOffset.y / box.height);
    const overlayStyle = overlay.style;
    // overlayStyle.left = '0';
    // overlayStyle.top = '0';
    overlayStyle.transformOrigin = `${ratio.x * 100}% ${ratio.y * 100}%`;
    overlayStyle.transform = `scale(${scaleFactor})`;
}

export function tryGet<T>(fetch: () => T, validate: (val: T) => boolean, interval = 100, ttl = 100) {
    return new Promise<T>((resolve, reject) => setTimeout(function bar() {
        console.log(ttl);
        if (--ttl <= 0) {
            console.error('rejected', bar);
            reject();
        }
        const val = fetch();
        if (validate(val)) {
            return resolve(val);
        }
        setTimeout(bar, interval);
    }));    
}

export function tryGetElement(query: string, interval = 100, ttl = 100) {
    const rest = query.slice(1);
    const foo = query[0] === '#' ? (() => document.getElementById(rest)) : () => document.querySelector(query);
    return tryGet(foo, val => val !== null, interval, ttl);
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
        trim3d(blurringStuff[i] as HTMLElement & SVGStylable);
    }
}