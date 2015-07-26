import L = require('leaflet');
import svg = require('./svg');
import util = require('../util');
import po = require('../plain-objects')
//import L from 'leaflet';
//import * as svg from './svg';
//import * as util from '../../util';

export function makeCircle(position: L.Point, radius: number): HTMLElement {
    let ci = createSVGElement('circle');
    ci.setAttribute('r', radius.toString());
    ci.setAttribute('cy', position.y.toString());
    ci.setAttribute('cx', position.x.toString());
    return ci;
}

//export function convertToStation(circle: HTMLElement, data: po.StationOrPlatform): void {
//    circle.id = id;
//    //circle.classList.add('station-circle');
//    util.setSVGDataset(circle, {
//        lat: data.location.lat,
//        lng: data.location.lng,
//        ru: data.name,
//        fi: data.altNames['fi']
//    });
//}

export function makeCubicBezier(controlPoints: L.Point[]): HTMLElement {
    if (controlPoints.length !== 4) {
        throw new Error('there should be 4 points');
    }
    let path = createSVGElement('path');
    let s = controlPoints.map(pt => pt.x + ',' + pt.y);
    s.unshift('M');
    s.splice(2, 0, 'C');
    path.setAttribute('d', s.join(' '));
    return path;
}

export function cutCubicBezier(controlPoints: L.Point[], fraction: number): L.Point[] {
    function red(cps: L.Point[]): L.Point[] {
        let pts = new Array<L.Point>(cps.length - 1);
        for (let i = 0; i < pts.length; ++i) {
            pts[0] = cps[i].add(cps[i + 1].subtract(cps[i]).multiplyBy(fraction));
        }
        return pts;
    }

    let newArr = new Array(controlPoints.length);
    let pts = controlPoints.slice(0, controlPoints.length);
    do {
        newArr.push(pts[0]);
        pts = red(pts);
    } while (pts.length > 0);
    return newArr;
}

export function makeTransferRing(center: L.Point, radius: number, thickness: number, borderWidth: number): HTMLElement[] {
    const classes = ['transfer-outer', 'transfer-inner'];
    const halfBorder = borderWidth * 0.5;
    return [thickness + halfBorder, thickness - halfBorder].map((t, index) => {
        let ring = makeCircle(center, radius);
        ring.style.strokeWidth = t + 'px';
        ring.classList.add(classes[index]);
        return ring;
    });
}

export function makeTransfer(start: L.Point, end: L.Point, thickness: number, borderWidth: number): HTMLElement[] {
    const classes = ['transfer-outer', 'transfer-inner'];
    const halfBorder = borderWidth * 0.5;
    return [thickness + halfBorder, thickness - halfBorder].map((t, index) => {
        let line = createSVGElement('line');
        line.setAttribute('x1', start.x.toString());
        line.setAttribute('y1', start.y.toString());
        line.setAttribute('x2', end.x.toString());
        line.setAttribute('y2', end.y.toString());
        line.style.strokeWidth = t + 'px';
        line.classList.add(classes[index]);
        return line;
    });
}

export function createSVGElement(tagName: string): HTMLElement {
    return <HTMLElement>document.createElementNS('http://www.w3.org/2000/svg', tagName);
}

export function showPlate(event: MouseEvent): void {
    const dummyCircle: SVGElement = <any>event.target;
    const dataset = util.getSVGDataset(dummyCircle);
    let circle = document.getElementById(dataset['platformId'] || dataset['stationId']);
    let g = svg.modifyPlate(circle);
    g.style.display = null;
}

function makeForeignDiv(topLeft: L.Point, text: string): SVGElement {
    let foreign = createSVGElement('foreignObject');
    //foreign.setAttribute('requiredExtensions', 'http://www.w3.org/1999/xhtml');
    foreign.setAttribute('x', topLeft.x.toString());
    foreign.setAttribute('y', topLeft.y.toString());
    foreign.setAttribute('width', '200');
    foreign.setAttribute('height', '50');
    //let div = <HTMLElement>document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
    let div = document.createElement('div');
    div.innerHTML = text;
    div.classList.add('plate-box');
    div.classList.add('plate-text');
    foreign.appendChild(div);
    return <any>foreign;
}

export function makeDropShadow() {
    let filter = createSVGElement('filter');
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

export function makePlate(): HTMLElement {
    let stationPlate = createSVGElement('g');
    stationPlate.id = 'station-plate';
    stationPlate.style.display = 'none';
    stationPlate.innerHTML = `<line id="pole" class="plate-pole"/>
            <g>
                <rect id="plate-box" class="plate-box" filter="url(#shadow)"/>
                <text id="plate-text" fill="black" class="plate-text"><tspan/><tspan/><tspan/></text>
            </g>`;
    return stationPlate;
}

/**
 * modifies & returns the modified plate
 */
export function modifyPlate(circle: HTMLElement): HTMLElement {
    let plateGroup = document.getElementById('station-plate');
    const c = new L.Point(Number(circle.getAttribute('cx')), Number(circle.getAttribute('cy')));
    const r = Number(circle.getAttribute('r'));
    const iR = Math.trunc(r);

    let pole = <HTMLElement>plateGroup.children[0];
    const poleSize = new L.Point(4 + iR, 8 + iR);
    const poleEnd = c.subtract(poleSize);
    pole.setAttribute('x1', c.x.toString());
    pole.setAttribute('y1', c.y.toString());
    pole.setAttribute('x2', poleEnd.x.toString());
    pole.setAttribute('y2', poleEnd.y.toString());

    const dataset = util.getSVGDataset(circle);
    const ru: string = dataset['ru'];
    const fi: string = dataset['fi'];
    const en: string = dataset['en'];

    let names = !fi ? [ru] : (util.getUserLanguage() === 'fi') ? [fi, ru] : [ru, fi];
    if (en) names.push(en);

    modifyPlateBox(poleEnd, names);
    return plateGroup;
}

function modifyPlateBox(bottomRight: L.Point, lines: string[]): void {
    let rect = document.getElementById('plate-box');
    const spacing = 12;
    const longest = lines.reduce((prev, cur) => prev.length < cur.length ? cur : prev);
    const rectSize = new L.Point(10 + longest.length * 6, 6 + spacing * lines.length);
    rect.setAttribute('width', rectSize.x.toString());
    rect.setAttribute('height', rectSize.y.toString());
    const rectTopLeft = bottomRight.subtract(rectSize);
    rect.setAttribute('x', rectTopLeft.x.toString());
    rect.setAttribute('y', rectTopLeft.y.toString());

    let text = document.getElementById('plate-text');
    for (var i = 0; i < lines.length; ++i) {
        const textTopLeft = bottomRight.subtract(new L.Point(3, rectSize.y - (i + 1) * spacing));
        let t = <HTMLElement>text.children[i];
        t.setAttribute('x', textTopLeft.x.toString());
        t.setAttribute('y', textTopLeft.y.toString());
        t.textContent = lines[i];
    }
    while (i < text.children.length) {
        text.children[i++].textContent = null;
    }

}