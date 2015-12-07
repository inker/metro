import * as L from 'leaflet';
import * as po from './plain-objects';
import * as util from './util';
import * as geo from './geo';

export function createSVGElement(tagName: string) {
    return document.createElementNS('http://www.w3.org/2000/svg', tagName);
}

export function makeCircle(position: L.Point, radius: number): SVGCircleElement {
    const circle = createSVGElement('circle');
    circle.setAttribute('r', radius.toString());
    circle.setAttribute('cy', position.y.toString());
    circle.setAttribute('cx', position.x.toString());
    return circle as any;
}

export function makeArc(center: L.Point, start: L.Point, end: L.Point): SVGPathElement {
    const path = createSVGElement('path') as SVGPathElement;
    setCircularPath(path, center, start, end)
    return path as any;
}

export function getBezierPath(path: Element) {
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

export function makeTransferArc(center: L.Point, start: L.Point, end: L.Point) {
    const outer = makeArc(center, start, end);
    const inner: typeof outer = outer.cloneNode(true) as any;
    return [outer, inner];
}

export function makeTransfer(start: L.Point, end: L.Point): SVGLineElement[] {
    return ['transfer-outer', 'transfer-inner'].map(cls => {
        const line = createSVGElement('line');
        line.setAttribute('x1', start.x.toString());
        line.setAttribute('y1', start.y.toString());
        line.setAttribute('x2', end.x.toString());
        line.setAttribute('y2', end.y.toString());
        line.classList.add(cls);
        return line as any;
    });
}

export namespace Shadows {
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
}

export namespace Gradients {
    //let defs; 
    
    export function make(vector: L.Point, colors: string[], offset = 0): SVGLinearGradientElement {
        const gradient = createSVGElement('linearGradient') as SVGLinearGradientElement;
        setDirection(gradient, vector);
        (gradient as any).innerHTML = `<stop offset="${offset}" style="stop-color:${colors[0]}" />
        <stop offset="${1 - offset}" style="stop-color:${colors[1]}" />`;
        return gradient as any;
    }

    export function removeAll() {
        // const overlay = document.getElementById('overlay');
        // const temp = overlay.querySelectorAll('defs');
        // defs = temp[temp.length - 1];
        // for (let i = 0; i < defs.length; ++i) {
        //     overlay.removeChild(temp[i]);
        // }
        const transfers = document.getElementById('transfers-outer').children;
        if (transfers) {
            for (let i = 0; i < transfers.length; ++i) {
                (transfers[i] as HTMLElement).style.stroke = '#888888';
            }
        }
    }

    export function addAll() {
        // const overlay = document.getElementById('overlay');
        // overlay.insertBefore(defs, overlay.firstElementChild);
        const transfers = document.getElementById('transfers-outer').children;
        if (transfers.length === 0) return;
        for (let i = 0; i < transfers.length; ++i) {
            const transfer = transfers[i];
            (transfer as HTMLElement).style.stroke = `url(#g-${i})`;
        }
    }

    export function setDirection(gradient: Element, vector: L.Point) {
        const coors = util.vectorToGradCoordinates(vector);
        gradient.setAttribute('x1', (1 - coors.x) * 50 + '%');
        gradient.setAttribute('y1', (1 - coors.y) * 50 + '%');
        gradient.setAttribute('x2', (1 + coors.x) * 50 + '%');
        gradient.setAttribute('y2', (1 + coors.y) * 50 + '%');
    }

    export function setOffset(gradient: Element, offset: number) {
        const gradientChildren: Element[] = gradient['children'];
        gradientChildren[0].setAttribute('offset', offset.toString());
        gradientChildren[1].setAttribute('offset', (1 - offset).toString());
    }
}

export function animateRoute(graph: po.Graph, platforms: number[], path: string[]) {
    return new Promise(resolve => (function animateSpan(i: number) {
        const circle: SVGCircleElement = document.getElementById('p-' + platforms[i]) as any;
        circle.style.opacity = null;
        if (i < path.length) {
            pulsateCircle(circle, 1.5, 200);
        } else {
            pulsateCircle(circle, 3, 200);
            return resolve();
        }
        const outerOld: SVGPathElement | SVGLineElement = document.getElementById('o' + path[i]) as any;
        if (outerOld === null) {
            return animateSpan(i + 1);
        }
        const innerOld: typeof outerOld = document.getElementById('i' + path[i]) as any;
        const outer: typeof outerOld = outerOld.cloneNode(true) as any;
        const inner: typeof outer = innerOld === null ? null : innerOld.cloneNode(true) as any;
        document.getElementById('paths-outer').appendChild(outer);
        if (inner) document.getElementById('paths-inner').appendChild(inner);
        const length: number = outer instanceof SVGLineElement
            ? L.point(Number(outer.getAttribute('x1')), Number(outer.getAttribute('y1'))).distanceTo(L.point(Number(outer.getAttribute('x2')), Number(outer.getAttribute('y2'))))
            : outer['getTotalLength']();

        const parts = path[i].split('-');
        const edge: po.Transfer | po.Span = graph[parts[0] === 'p' ? 'spans' : 'transfers'][parseInt(parts[1])];
        const initialOffset = edge.source === platforms[i] ? length : -length;
        const duration = length;
        outer.style.filter = 'url(#black-glow)';
        for (let p of (inner === null ? [outer] : [outer, inner])) {
            p.style.transition = null;
            p.style.opacity = null;
            p.style.strokeDasharray = length + ' ' + length;
            p.style.strokeDashoffset = initialOffset.toString();
            p.getBoundingClientRect();
            p.style.transition = `stroke-dashoffset ${duration}ms linear`;
            p.style.strokeDashoffset = '0';
        }
        outer.addEventListener('transitionend', e => {
            outerOld.style.opacity = null;
            if (outer.id.charAt(1) !== 't') {
                // fixing disappearing lines
                const box = outer.getBoundingClientRect();
                const strokeWidth = parseFloat(getComputedStyle(outerOld).strokeWidth);
                if (box.height >= strokeWidth && box.width >= strokeWidth) {
                    outerOld.style.filter = 'url(#black-glow)';
                }
            }
            document.getElementById('paths-outer').removeChild(outer);
            if (inner) {
                innerOld.style.opacity = null;
                if (inner) document.getElementById('paths-inner').removeChild(inner);
            }
            animateSpan(i + 1);
        });
        console.log(outer);
    })(0))
}

export function pulsateCircle(circle: SVGCircleElement, scaleFactor: number, duration: number) {
    circle.getBoundingClientRect();
    circle.style.transition = `transform ${duration / 2}ms linear`;
    // circle.style.transform = `translate3d(${-circle.getAttribute('cx') * (scaleFactor - 1)}px, ${-circle.getAttribute('cy') * (scaleFactor - 1)}px, 0) scale3d(${scaleFactor}, ${scaleFactor}, 1)`;
    circle.style.transform = `matrix(${scaleFactor}, 0, 0, ${scaleFactor}, ${-circle.getAttribute('cx') * (scaleFactor - 1) }, ${-circle.getAttribute('cy') * (scaleFactor - 1) })`;
    circle.addEventListener('transitionend', function foo(e) {
        this.removeEventListener('transitionend', foo);
        this.style.transform = 'matrix(1, 0, 0, 1, 0, 0)';
        this.addEventListener('transitionend', function bar(e) {
            this.removeEventListener('transitionend', bar);
            this.style.transform = null;
        });
    });
}

export function circleByDummy(dummyCircle: Element): SVGCircleElement {
    return document.getElementById('p-' + dummyCircle.id.slice(2)) as any;
}

export function platformByCircle(circle: Element, graph: po.Graph) {
    return graph.platforms[parseInt(circle.id.slice(2))];
}