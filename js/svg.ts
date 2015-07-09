import L = require('leaflet');
import svg = require('./svg');
import util = require('./util');
import Plain = require('./plain-objects')
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

export function convertToStation(circle: HTMLElement, id: string, s: Plain.StationOrPlatform, circleBorder: number): void {
    circle.id = id;
    circle.classList.add('station-circle');
    circle.style.strokeWidth = circleBorder.toString();
    util.setSVGDataset(circle, {
        lat: s.location.lat,
        lng: s.location.lng,
        ru: s.name,
        fi: s.altName
    });
    //circle.dataset['lat'] = s.location.lat.toString();
    //circle.dataset['lng'] = s.location.lng.toString();
    //circle.dataset['ru'] = s.name;
    //circle.dataset['fi'] = s.altName;
}

export function makeCubicBezier(controlPoints: L.Point[]): HTMLElement {
    if (controlPoints.length !== 4) {
        throw new Error('there should be 4 points');
    }
    let path = createSVGElement('path');
    let d = controlPoints.reduce((prev, cp, i) => `${prev}${i === 1 ? 'C' : ' '}${cp.x},${cp.y}`, 'M');
    path.setAttribute('d', d);
    return path;
}

export function createSVGElement(tagName: string): HTMLElement {
    return <HTMLElement>document.createElementNS('http://www.w3.org/2000/svg', tagName);
}

export function makePlate(circle: HTMLElement) {
    let plateGroup = svg.createSVGElement('g');

    let pole = svg.createSVGElement('line');
    let c = new L.Point(Number(circle.getAttribute('cx')), Number(circle.getAttribute('cy')));
    let r = Number(circle.getAttribute('r'));
    let poleSize = new L.Point(4, 8);
    let poleBounds = new L.Bounds(c, c.subtract(poleSize));

    pole.setAttribute('x1', poleBounds.min.x.toString());
    pole.setAttribute('y1', poleBounds.min.y.toString());
    pole.setAttribute('x2', poleBounds.max.x.toString());
    pole.setAttribute('y2', poleBounds.max.y.toString());
    pole.classList.add('plate-pole');

    let dataset = util.getSVGDataset(circle);
    const ru = dataset['ru'];
    const fi = dataset['fi'];

    const maxLen = fi ? Math.max(ru.length, fi.length) : ru.length;

    let rect = svg.createSVGElement('rect');
    const spacing = 12;
    let rectSize = new L.Point(10 + maxLen * 6, fi ? 18 + spacing : 18);
    rect.setAttribute('width', rectSize.x.toString());
    rect.setAttribute('height', rectSize.y.toString());
    let rectUpperLeft = poleBounds.min.subtract(rectSize);
    rect.setAttribute('x', rectUpperLeft.x.toString());
    rect.setAttribute('y', rectUpperLeft.y.toString());
    rect.classList.add('plate-box');

    let text = svg.createSVGElement('text');
    let t1 = svg.createSVGElement('tspan');
    //t1.classList.add('plate-text');
    let textUpperLeft = c.subtract(new L.Point(3, rectSize.y - 12)).subtract(poleBounds.getSize());
    t1.setAttribute('x', textUpperLeft.x.toString());
    t1.setAttribute('y', textUpperLeft.y.toString());
    let t2: HTMLElement = <any>t1.cloneNode();
    t2.setAttribute('y', (textUpperLeft.y + spacing).toString());
    if (util.getUserLanguage() === 'fi') {
        t1.textContent = fi;
        t2.textContent = ru;
    } else {
        t1.textContent = ru;
        t2.textContent = fi;
    }
    text.setAttribute('fill', 'black');
    text.appendChild(t1);
    text.appendChild(t2);
    //text.style.color = 'black';
    text.classList.add('plate-text');
    plateGroup.appendChild(rect);
    plateGroup.appendChild(pole);
    plateGroup.appendChild(text);
    plateGroup.id = 'plate';
    return plateGroup;
}