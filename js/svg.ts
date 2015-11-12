import L = require('leaflet');
import * as po from '../plain-objects';
import * as util from '../util';

export function createSVGElement(tagName: string): HTMLElement {
    return document.createElementNS('http://www.w3.org/2000/svg', tagName) as any;
}

export function makeCircle(position: L.Point, radius: number): HTMLElement {
    const ci = createSVGElement('circle');
    ci.setAttribute('r', radius.toString());
    ci.setAttribute('cy', position.y.toString());
    ci.setAttribute('cx', position.x.toString());
    return ci;
}

//export function getBezierPath(path: Element) {
//    const points: L.Point[] = [],
//        re = /\b([\d\.])\b.*?,\b*([\d\.])\b/g,
//        d = path.getAttribute('d');
//    let m: RegExpExecArray;
//    while ((m = re.exec(d)) !== null) {
//        points.push(new L.Point(Number[m[0]], Number(m[1])));
//    }
//    return points;
//}

export function setBezierPath(el: Element, controlPoints: L.Point[]) {
    if (controlPoints.length !== 4) {
        throw new Error('there should be 4 points');
    }
    const path = createSVGElement('path');
    const s = ['M'].concat(controlPoints.map(pt => `${pt.x},${pt.y}`));
    s.splice(2, 0, 'C');
    el.setAttribute('d', s.join(' '));
}

export function makeCubicBezier(controlPoints: L.Point[]): HTMLElement {
    const path = createSVGElement('path');
    setBezierPath(path, controlPoints);
    return path;
}

export function cutCubicBezier(controlPoints: L.Point[], fraction: number): L.Point[] {
    function red(cps: L.Point[]): L.Point[] {
        const pts = new Array<L.Point>(cps.length - 1);
        for (let i = 0; i < pts.length; ++i) {
            pts[0] = cps[i].add(cps[i + 1].subtract(cps[i]).multiplyBy(fraction));
        }
        return pts;
    }

    const newArr = new Array(controlPoints.length);
    let pts = controlPoints.slice(0, controlPoints.length);
    do {
        newArr.push(pts[0]);
        pts = red(pts);
    } while (pts.length > 0);
    return newArr;
}

export function makeTransferRing(center: L.Point, radius: number, thickness: number, borderWidth: number): HTMLElement[] {
    const halfBorder = borderWidth * 0.5;
    return [thickness + halfBorder, thickness - halfBorder].map((t, index) => {
        const ring = makeCircle(center, radius);
        ring.style.strokeWidth = t + 'px';
        return ring;
    });
}

export function makeTransfer(start: L.Point, end: L.Point, thickness: number, borderWidth: number): HTMLElement[] {
    const classes = ['transfer-outer', 'transfer-inner'];
    const halfBorder = borderWidth * 0.5;
    return [thickness + halfBorder, thickness - halfBorder].map((t, index) => {
        const line = createSVGElement('line');
        line.setAttribute('x1', start.x.toString());
        line.setAttribute('y1', start.y.toString());
        line.setAttribute('x2', end.x.toString());
        line.setAttribute('y2', end.y.toString());
        line.style.strokeWidth = t + 'px';
        line.classList.add(classes[index]);
        return line;
    });
}

export function makeDropShadow() {
    const filter = createSVGElement('filter');
    filter.id = 'shadow';
    filter.setAttribute('width', '200%');
    filter.setAttribute('height', '200%');
    filter.innerHTML = `
        <feOffset result="offOut" in="SourceAlpha" dx="0" dy="2" />
        <feGaussianBlur result="blurOut" in="offOut" stdDeviation="2" />
        <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
    `;
    return filter;
}

export function circleByDummy(dummy: Element): HTMLElement {
    return document.getElementById('p-' + dummy.id.slice(2));
}

export function platformByCircle(circle: Element, graph: po.Graph) {
    return graph.platforms[parseInt(circle.id.slice(2))];
}

export function platformByDummy(dummy: Element, graph: po.Graph) {
    return graph.platforms[parseInt(dummy.id.slice(2))];
}

