/// <reference path="../../typings/tsd.d.ts" />
import * as L from 'leaflet';
import * as math from './math';

export function createSVGElement(tagName: string) {
    return document.createElementNS('http://www.w3.org/2000/svg', tagName);
}

export function makeCircle(position: L.Point, radius: number): SVGCircleElement {
    const circle = createSVGElement('circle') as SVGCircleElement;
    circle.setAttribute('r', radius.toString());
    circle.setAttribute('cy', position.y.toString());
    circle.setAttribute('cx', position.x.toString());
    return circle;
}

export function makeLine(start: L.Point, end: L.Point): SVGLineElement {
    const line = createSVGElement('line') as SVGLineElement;
    line.setAttribute('x1', start.x.toString());
    line.setAttribute('y1', start.y.toString());
    line.setAttribute('x2', end.x.toString());
    line.setAttribute('y2', end.y.toString());
    return line;
}

export function makeArc(start: L.Point, end: L.Point, third: L.Point): SVGPathElement {
    const path = createSVGElement('path') as SVGPathElement;
    setCircularPath(path, start, end, third);
    return path;
}

export function getBezierPathPoints(path: Element) {
    const points: L.Point[] = [],
        re = /\D([\d\.]+).*?,.*?([\d\.]+)/g,
        d = path.getAttribute('d');
    let m: RegExpExecArray;
    while ((m = re.exec(d)) !== null) {
        points.push(new L.Point(Number(m[1]), Number(m[2])));
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

export function getCircularPath(path: Element) {
    const points: number[] = [],
        re = /\D([\d\.]+)/g,
        d = path.getAttribute('d');
    let m: RegExpExecArray;
    while ((m = re.exec(d)) !== null) {
        points.push(Number(m[1]));
    }
    return points;
}

export function setCircularPath(el: Element, start: L.Point, end: L.Point, third: L.Point) {
    const center = math.getCircumcenter([start, end, third]);
    const startAngle = Math.atan2(start.y - center.y, start.x - center.x),
        endAngle = Math.atan2(end.y - center.y, end.x - center.x);
    // const thirdAngle = Math.atan2(third.y - center.y, third.x - center.x);
    const diff = endAngle - startAngle;
    let large = diff <= Math.PI || diff > -Math.PI ? 0 : 1;
    const u = start.subtract(center),
        v = end.subtract(center);
    let sweep = u.x * v.y - v.x * u.y < 0 ? 0 : 1;
    const dot = math.dot(third.subtract(start), third.subtract(end));
    if (dot < 0) {
        sweep = 1 - sweep;
        large = 1 - large;
    }
    const radius = center.distanceTo(start);
    const d = [
        'M', start.x, start.y,
        'A', radius, radius, 0, large, sweep, end.x, end.y
    ].join(' ');
    el.setAttribute('d', d);
}

export function makeCubicBezier(controlPoints: L.Point[]): SVGPathElement {
    const path = createSVGElement('path') as SVGPathElement;
    setBezierPath(path, controlPoints);
    return path;
}

export function makeTransferRing(center: L.Point, radius: number) {
    const outer = makeCircle(center, radius);
    const inner: typeof outer = outer.cloneNode(true) as any;
    return [outer, inner];
}

export function makeTransferArc(start: L.Point, end: L.Point, third: L.Point) {
    const outer = makeArc(start, end, third);
    const inner: typeof outer = outer.cloneNode(true) as any;
    return [outer, inner];
}

export function makeTransferLine(start: L.Point, end: L.Point): SVGLineElement[] {
    // gradient disappearing fix (maybe use rectangle?)
    let tg = end.clone();
    if (start.x === end.x) {
        tg.x += 0.01;
    } else if (start.y === end.y) {
        tg.y += 0.01;
    }
    return [makeLine(start, tg), makeLine(start, tg)];
}

export function circleOffset(circle: SVGCircleElement): L.Point {
    const c = new L.Point(+circle.getAttribute('cx'), +circle.getAttribute('cy')),
        iR = ~~circle.getAttribute('r'),
        offset = new L.Point(0 + iR, 4 + iR);
    return c.subtract(offset);
}

export namespace Filters {
    export function makeDrop(): SVGFilterElement {
        const filter = createSVGElement('filter');
        filter.id = 'shadow';
        filter.setAttribute('width', '200%');
        filter.setAttribute('height', '200%');
        (filter as any).innerHTML = `
            <feOffset result="offOut" in="SourceAlpha" dx="0" dy="4" />
            <feColorMatrix result="matrixOut" in="offOut" type="matrix" values=
                "0 0 0 0   0
                0 0 0 0   0
                0 0 0 0   0
                0 0 0 0.5 0"/>
            <feGaussianBlur result="blurOut" in="matrixOut" stdDeviation="2" />

            <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
        `;
        return filter as any;
    }

    export function makeGlow(): SVGFilterElement {
        const filter = createSVGElement('filter');
        filter.id = 'black-glow';
        (filter as any).innerHTML = `<feColorMatrix type="matrix" values=
                "0 0 0 0   0
                0 0 0 0   0
                0 0 0 0   0
                0 0 0 0.3 0"/>
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>`;
        return filter as any;
    }

    export function makeOpacity(): SVGFilterElement {
        const filter = createSVGElement('filter');
        filter.id = 'opacity';
        (filter as any).innerHTML = `<feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.5">
        </feComponentTransfer>`;
        return filter as any;
    }

    export function makeGray(): SVGFilterElement {
        const filter = createSVGElement('filter');
        filter.id = 'gray';
        (filter as any).innerHTML = `<feColorMatrix type="matrix"
               values="0.2126 0.7152 0.0722 0 0
                       0.2126 0.7152 0.0722 0 0
                       0.2126 0.7152 0.0722 0 0
                       0 0 0 1 0"/>`;
        return filter as any;
    }

    export function appendAll(defs: SVGDefsElement) {
        defs.appendChild(makeDrop());
        defs.appendChild(makeGlow());
        defs.appendChild(makeOpacity());
        defs.appendChild(makeGray());
    }

    export function applyDrop(path: Element & SVGStylable) {
        // fixing disappearing lines
        const box = path.getBoundingClientRect();
        const strokeWidth = parseFloat(getComputedStyle(path).strokeWidth) * 2;
        if (box.height >= strokeWidth && box.width >= strokeWidth) {
            path.style.filter = 'url(#black-glow)';
        }
    }
}

export namespace Gradients {
    export function makeUndirectedLinear(colors: string[]): SVGLinearGradientElement {
        const gradient = createSVGElement('linearGradient') as SVGLinearGradientElement;
        if ('innerHTML' in gradient) {
            gradient.innerHTML = `<stop style="stop-color:${colors[0]}" /><stop style="stop-color:${colors[1]}" />`;
            return gradient;
        } else {
            const from = createSVGElement('stop') as SVGStopElement;
            from.style.stopColor = colors[0];
            const to = createSVGElement('stop') as SVGStopElement;
            to.style.stopColor = colors[1];
            gradient.appendChild(from);
            gradient.appendChild(to);
        }
        return gradient;
    }

    export function makeLinear(vector: L.Point, colors: string[], offset = 0): SVGLinearGradientElement {
        const gradient = makeUndirectedLinear(colors);
        setOffset(gradient, offset);
        setDirection(gradient, vector);
        return gradient;
    }

    export function setDirection(gradient: Element, vector: L.Point) {
        const rotate = `rotate(${Math.atan2(vector.y, vector.x) * 180 / Math.PI}, 0.5, 0.5)`;
        gradient.setAttribute('gradientTransform', rotate);
    }

    export function setOffset(gradient: Element, offset: number) {
        (gradient.firstChild as SVGStopElement).setAttribute('offset', offset.toString());
        (gradient.lastChild as SVGStopElement).setAttribute('offset', (1 - offset).toString());
    }
}