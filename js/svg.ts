import L = require('leaflet');
import svg = require('./svg');
import util = require('./util');
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

export function convertToStation(circle: HTMLElement, id: string, data: po.StationOrPlatform, borderWidth: number): void {
    circle.id = id;
    //circle.classList.add('station-circle');
    circle.style.strokeWidth = borderWidth + 'px';
    util.setSVGDataset(circle, {
        lat: data.location.lat,
        lng: data.location.lng,
        ru: data.name,
        fi: data.altName
    });
}

export function makeCubicBezier(controlPoints: L.Point[]): HTMLElement {
    if (controlPoints.length !== 4) {
        throw new Error('there should be 4 points');
    }
    let path = createSVGElement('path');
    let s = controlPoints.map(pt => pt.x + ',' + pt.y);
    s.unshift('M');
    s.splice(2, 0, 'C');
    //let d = controlPoints.reduce((prev, cp, i) => `${prev}${i === 1 ? ' C ' : ' '}${cp.x},${cp.y}`, 'M');
    path.setAttribute('d', s.join(' '));
    return path;
}

export function makeRingWithBorders(center: L.Point, radius: number, thickness: number, borderWidth: number): HTMLElement {
    let g = createSVGElement('g');
    g.classList.add('transfer');
    const halfBorder = borderWidth * 0.5;
    [thickness + halfBorder, thickness - halfBorder].forEach(t => {
        let ring = makeCircle(center, radius);
        ring.style.strokeWidth = t + 'px';
        g.appendChild(ring);
    });
    return g;
}

export function makeTransfer(start: L.Point, end: L.Point, thickness: number, borderWidth: number) {
    let g = createSVGElement('g');
    g.classList.add('transfer');
    const halfBorder = borderWidth * 0.5;
    [thickness + halfBorder, thickness - halfBorder].forEach(t => {
        let line = createSVGElement('line');
        line.setAttribute('x1', start.x.toString());
        line.setAttribute('y1', start.y.toString());
        line.setAttribute('x2', end.x.toString());
        line.setAttribute('y2', end.y.toString());
        line.style.strokeWidth = t + 'px';
        g.appendChild(line);
    });
    return g;
}

export function createSVGElement(tagName: string): HTMLElement {
    return <HTMLElement>document.createElementNS('http://www.w3.org/2000/svg', tagName);
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

function changePlateBox(bottomRight: L.Point, lines: string[]) {
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
    let i = 0;
    for (; i < lines.length; ++i) {
        const textTopLeft = bottomRight.subtract(new L.Point(3, rectSize.y - (i + 1) * spacing));
        let t = <HTMLElement>text.children[i];
        t.setAttribute('x', textTopLeft.x.toString());
        t.setAttribute('y', textTopLeft.y.toString());
        t.textContent = lines[i];
    }
    for (; i < text.children.length; ++i) {
        text.children[i].textContent = null;
    }
    
}

export function changePlate(circle: HTMLElement): HTMLElement {
    let plateGroup = document.getElementById('station-plate');
    let pole = <HTMLElement>plateGroup.children[0];
    const c = new L.Point(Number(circle.getAttribute('cx')), Number(circle.getAttribute('cy')));
    const r = Number(circle.getAttribute('r'));
    const iR = Math.trunc(r);
    const poleSize = new L.Point(4 + iR, 8 + iR);
    const poleBounds = new L.Bounds(c, c.subtract(poleSize));

    pole.setAttribute('x1', poleBounds.min.x.toString());
    pole.setAttribute('y1', poleBounds.min.y.toString());
    pole.setAttribute('x2', poleBounds.max.x.toString());
    pole.setAttribute('y2', poleBounds.max.y.toString());
    
    const dataset = util.getSVGDataset(circle);
    const ru: string = dataset['ru'];
    const fi: string = dataset['fi'];

    let names = !fi ? [ru] : (util.getUserLanguage() === 'fi') ? [fi, ru] : [ru, fi];
    if (ru in util.englishStationNames) {
        names.push(util.englishStationNames[ru]);
    }

    changePlateBox(poleBounds.min, names);
    return plateGroup;
}