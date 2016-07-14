/// <reference path="../typings/tsd.d.ts" />
import * as L from 'leaflet';
import * as nw from './network';
import * as math from './math';
import { Color } from './util';

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

export function setCircularPath(el: Element, start: L.Point, end: L.Point, third: L.Point) {
    const center = math.getCircumcenter([start, end, third]);
    const startAngle = Math.atan2(start.y - center.y, start.x - center.x),
        endAngle = Math.atan2(end.y - center.y, end.x - center.x);
    //const thirdAngle = Math.atan2(third.y - center.y, third.x - center.x);
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

export function makeTransfer(start: L.Point, end: L.Point): SVGLineElement[] {
    // gradient disappearing fix (maybe use rectangle?)
    let tg = end.clone();
    if (start.x === end.x) {
        tg.x += 0.01;
    } else if (start.y === end.y) {
        tg.y += 0.01;
    }
    return ['transfer-outer', 'transfer-inner'].map(cls => {
        const line = createSVGElement('line') as SVGLineElement;
        line.setAttribute('x1', start.x.toString());
        line.setAttribute('y1', start.y.toString());
        line.setAttribute('x2', tg.x.toString());
        line.setAttribute('y2', tg.y.toString());
        line.classList.add(cls);
        return line;
    });
}

export function circleOffset(circle: SVGCircleElement): L.Point {
    const c = new L.Point(+circle.getAttribute('cx'), +circle.getAttribute('cy')),
        iR = ~~circle.getAttribute('r'),
        offset = new L.Point(0 + iR, 4 + iR);
    return c.subtract(offset);
}

export namespace Scale {
    export function scaleCircle(circle: SVGCircleElement, scaleFactor: number, asAttribute = false) {
        if (!asAttribute) {
            circle.style.transform = `scale(${scaleFactor})`;
            return;
        }
        initialCircles.add(circle);
        // const t = scaleFactor - 1,
        //     tx = -circle.getAttribute('cx') * t,
        //     ty = -circle.getAttribute('cy') * t;
        //circle.setAttribute('transform', `matrix(${scaleFactor}, 0, 0, ${scaleFactor}, ${tx}, ${ty})`);
        const oldR = circle.getAttribute('r');
        circle.setAttribute('data-r', oldR);
        circle.setAttribute('r', (+oldR * scaleFactor).toString());
    }
     
    const initialCircles = new Set<SVGCircleElement>();
    const initialTransfers = new Set<SVGPathElement|SVGLineElement>();
    export function scaleStation(nwPlatforms: nw.Platform[], station: nw.Station, scaleFactor: number, nwTransfers?: nw.Transfer[]) {
        const transferOuterStrokeWidth = parseFloat(document.getElementById('transfers-outer').style.strokeWidth),
            transferInnerStrokeWidth = parseFloat(document.getElementById('transfers-inner').style.strokeWidth)
        for (let p of station.platforms) {
            const circle = document.getElementById('p-' + p) as any;
            scaleCircle(circle, scaleFactor, true);
            if (nwTransfers === undefined || station.platforms.length < 2) continue;
            for (let i = 0; i < nwTransfers.length; ++i) {
                const tr = nwTransfers[i];
                if (tr.source === p || tr.target === p) {
                    const outer = document.getElementById('ot-' + i) as any;
                    const inner = document.getElementById('it-' + i) as any;
                    initialTransfers.add(outer);
                    initialTransfers.add(inner);
                    outer.style.strokeWidth = transferOuterStrokeWidth * scaleFactor + 'px';
                    inner.style.strokeWidth = transferInnerStrokeWidth * scaleFactor + 'px';
                }
            }
        }    
    }
    
    export function unscaleAll() {
        initialCircles.forEach(circle => circle.setAttribute('r', circle.getAttribute('data-r')));
        //initialCircles.forEach(circle => circle.removeAttribute('transform'));
        initialTransfers.forEach(tr => tr.style.strokeWidth = null);
        initialTransfers.clear();
        initialCircles.clear(); 
    }
}



export namespace SVGDataset {
    export function get(el: Element): any {
        // for webkit-based browsers
        if ('dataset' in el) {
            return el['dataset'];
        }
        // for the rest
        const attrs: Attr[] = el.attributes as any;
        const dataset = {};
        for (let { name } of attrs) {
            if (name.startsWith('data-')) {
                dataset[name.slice(5)] = el.getAttribute(name);
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
    //let defs; 
    
    export function makeUndirectedLinear(colors: string[]): SVGLinearGradientElement {
        const gradient = createSVGElement('linearGradient') as SVGLinearGradientElement;
        if ('innerHTML' in gradient) {
            gradient['innerHTML'] = `<stop style="stop-color:${colors[0]}" /><stop style="stop-color:${colors[1]}" />`;
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
        const coors = math.vectorToGradCoordinates(vector);
        gradient.setAttribute('x1', (1 - coors.x) * 50 + '%');
        gradient.setAttribute('y1', (1 - coors.y) * 50 + '%');
        gradient.setAttribute('x2', (1 + coors.x) * 50 + '%');
        gradient.setAttribute('y2', (1 + coors.y) * 50 + '%');
    }

    export function setOffset(gradient: Element, offset: number) {
        (gradient.firstChild as SVGStopElement).setAttribute('offset', offset.toString());
        (gradient.lastChild as SVGStopElement).setAttribute('offset', (1 - offset).toString());
    }
}

export namespace Animation {

    let animationsAllowed = true;
    let currentAnimation: Promise<boolean> = null;
    
    export function terminateAnimations() {
        if (currentAnimation === null) {
            return Promise.resolve(true);
        }
        animationsAllowed = false;
        return currentAnimation;
    }
    
    export function animateRoute(network: nw.Network, platforms: number[], edges: string[], speed = 1) {
        const pulsate = L.Browser.webkit && !L.Browser.mobile;
        currentAnimation = new Promise<boolean>((resolve, reject) => (function animateSpan(i: number) {
            if (!animationsAllowed) {
                return resolve(false);
            }
            const circle: SVGCircleElement = document.getElementById('p-' + platforms[i]) as any;
            circle.style.opacity = null;
            if (pulsate) {
                pulsateCircle(circle, i < edges.length ? 1.5 : 3, 200);
            }
            if (i === edges.length) {
                return resolve(true);
            }
            const outerOld: SVGPathElement | SVGLineElement = document.getElementById('o' + edges[i]) as any;
            if (outerOld === null) {
                return animateSpan(i + 1);
            }
            const innerOld: typeof outerOld = document.getElementById('i' + edges[i]) as any;
            const outer: typeof outerOld = outerOld.cloneNode(true) as any;
            const inner: typeof outer = innerOld === null ? null : innerOld.cloneNode(true) as any;
            document.getElementById('paths-outer').appendChild(outer);
            if (inner) {
                document.getElementById('paths-inner').appendChild(inner);
            }
            
            let length: number;
            if (outer instanceof SVGPathElement) {
                length = outer.getTotalLength();
            } else {
                const from = new L.Point(+outer.getAttribute('x1'), +outer.getAttribute('y1')),
                    to = new L.Point(+outer.getAttribute('x2'), +outer.getAttribute('y2'));
                length = from.distanceTo(to);
            }

            const idParts = edges[i].split('-');
            const edge: nw.Transfer | nw.Span = network[idParts[0] === 'p' ? 'spans' : 'transfers'][+idParts[1]];
            const initialOffset = edge.source === platforms[i] ? length : -length;
            const duration = length / speed;
            Shadows.applyDrop(outer);
            for (let path of (inner === null ? [outer] : [outer, inner])) {
                const pathStyle = path.style;
                pathStyle.transition = null;
                pathStyle.opacity = null;
                pathStyle.strokeDasharray = length + ' ' + length;
                pathStyle.strokeDashoffset = initialOffset.toString();
                path.getBoundingClientRect();
                pathStyle.transition = `stroke-dashoffset ${duration}ms linear`;
                pathStyle.strokeDashoffset = '0';
            }
            outer.addEventListener('transitionend', e => {
                outerOld.style.opacity = null;
                if (outer.id.charAt(1) !== 't') {
                    Shadows.applyDrop(outerOld);
                }
                outer.parentNode.removeChild(outer);
                if (inner) {
                    innerOld.style.opacity = null;
                    inner.parentNode.removeChild(inner);
                }
                animateSpan(i + 1);
            });
            //console.log(outer);
        })(0)).then(finished => {
            currentAnimation = null;
            animationsAllowed = true;
            return finished;
        });
        return currentAnimation;
    }

    export function pulsateCircle(circle: SVGCircleElement, scaleFactor: number, duration: number) {
        circle.getBoundingClientRect();
        circle.style.transition = `transform ${duration / 2}ms linear`;
        Scale.scaleCircle(circle, scaleFactor);
        circle.addEventListener('transitionend', function foo(e) {
            this.removeEventListener('transitionend', foo);
            this.style.transform = 'scale(1)';
            this.addEventListener('transitionend', function bar(e) {
                this.removeEventListener('transitionend', bar);
                this.style.transition = null;
                this.style.transform = null;
            });
        });
    }
}