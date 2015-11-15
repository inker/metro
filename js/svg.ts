import L = require('leaflet');
import * as po from '../plain-objects';
import * as util from '../util';

export function createSVGElement(tagName: string): HTMLElement {
    return document.createElementNS('http://www.w3.org/2000/svg', tagName) as any;
}

export function makeCircle(position: L.Point, radius: number): HTMLElement {
    const circle = createSVGElement('circle');
    circle.setAttribute('r', radius.toString());
    circle.setAttribute('cy', position.y.toString());
    circle.setAttribute('cx', position.x.toString());
    return circle;
}

export function makeArc(center: L.Point, start: L.Point, end: L.Point) {
    const path = createSVGElement('path');
    setCircularPath(path, center, start, end)
    return path;
}

export function getBezierPath(path: Element) {
    const points: L.Point[] = [],
        re = /\W([\d\.])\W.*?,\W*([\d\.])\W/g,
        d = path.getAttribute('d');
    let m: RegExpExecArray;
    while ((m = re.exec(d)) !== null) {
        points.push(new L.Point(Number[m[0]], Number(m[1])));
    }
    return points;
}

export function setBezierPath(el: Element, controlPoints: L.Point[]) {
    if (controlPoints.length !== 4) {
        throw new Error('there should be 4 points');
    }
    const path = createSVGElement('path');
    const s = ['M'].concat(controlPoints.map(pt => `${pt.x},${pt.y}`));
    s.splice(2, 0, 'C');
    el.setAttribute('d', s.join(' '));
}

export function setCircularPath(el: Element, center: L.Point, start: L.Point, end: L.Point) {
    const radius = center.distanceTo(start);
    const u = start.subtract(center),
        v = end.subtract(center);
    const large = u.x * v.y - v.x * u.y < 0 ? 1 : 0;

    const startAngle = Math.atan2(start.y - center.y, start.x - center.x);
    const endAngle = Math.atan2(end.y - center.y, end.x - center.x);
    const diff = endAngle - startAngle;
    const sweep = diff <= Math.PI || diff > -Math.PI ? 1 : 0;
    const d = [
        'M', start.x, start.y,
        'A', radius, radius, 0, large, sweep, end.x, end.y
    ].join(' ');
    el.setAttribute('d', d);
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

export function makeTransferRing(center: L.Point, radius: number): HTMLElement[] {
    const outer = makeCircle(center, radius);
    const inner: typeof outer = outer.cloneNode(true) as any;
    return [outer, inner];
}

export function makeTransferArc(center: L.Point, start: L.Point, end: L.Point) {
    const outer = makeArc(center, start, end);
    const inner: typeof outer = outer.cloneNode(true) as any;
    return [outer, inner];
}

export function makeTransfer(start: L.Point, end: L.Point): HTMLElement[] {
    const classes = ['transfer-outer', 'transfer-inner'];
    return classes.map(cls => {
        const line = createSVGElement('line');
        line.setAttribute('x1', start.x.toString());
        line.setAttribute('y1', start.y.toString());
        line.setAttribute('x2', end.x.toString());
        line.setAttribute('y2', end.y.toString());
        line.classList.add(cls);
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

export function setGradientDirection(gradient: Element, vector: L.Point) {
    const coors = util.vectorToGradCoordinates(vector);
    gradient.setAttribute('x1', (1 - coors.x) * 50 + '%');
    gradient.setAttribute('y1', (1 - coors.y) * 50 + '%');
    gradient.setAttribute('x2', (1 + coors.x) * 50 + '%');
    gradient.setAttribute('y2', (1 + coors.y) * 50 + '%');
}

export function makeGradient(vector: L.Point, colors: string[]) {
    const gradient = createSVGElement('linearGradient');
    setGradientDirection(gradient, vector);
    gradient.innerHTML = `<stop offset="25%" style="stop-color:${colors[0]}" />
      <stop offset="75%" style="stop-color:${colors[1]}" />`;
    return gradient;
}

export function removeGradients() {
    const transfers = document.getElementById('transfers-outer').children;
    if (transfers) {
        for (let i = 0; i < transfers.length; ++i) {
            (transfers[i] as HTMLElement).style.stroke = null;
        }
    }
}

export function addGradients() {
    const transfers = document.getElementById('transfers-outer').children;
    if (transfers) {
        for (let i = 0; i < transfers.length; ++i) {
            const transfer = transfers[i];
            (transfer as HTMLElement).style.stroke = `url(#g-${i})`;
        }
    }
}



export function circleByDummy(dummy: Element): HTMLElement {
    return document.getElementById('p-' + dummy.id.slice(2));
}

export function platformByCircle(circle: Element, graph: po.Graph) {
    return graph.platforms[parseInt(circle.id.slice(2))];
}

