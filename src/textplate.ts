import * as svg from './svg';
import * as util from './util';
import * as po from './plain-objects';
import * as lang from './lang';

export default class TextPlate {
    private _element: SVGGElement;
    private _disabled = false;
    private _editable = false;
    private graph: po.Graph;

    constructor(graph: po.Graph) {
        this.graph = graph;
        this._element = svg.createSVGElement('g') as any;
        this._element.id = 'station-plate';
        this._element.style.display = 'none';
        const createElement = (tag: string, id: string, cls: string, attributes: {}): Element => {
            const el = svg.createSVGElement(tag);
            el.id = id;
            el.classList.add(cls);
            Object.keys(attributes).forEach(key => el.setAttribute(key, attributes[key]));
            return el;
        };
        const pole = createElement('line', 'pole', 'plate-pole', { 'x1': '0', 'y1': '0', 'x2': '4', 'y2': '8' });
        this._element.appendChild(pole);
        const g = svg.createSVGElement('g');
        const rect = createElement('rect', 'plate-box', 'plate-box', { 'x': '0', 'y': '0', 'filter': 'url(#shadow)' });
        g.appendChild(rect);
        const text = createElement('text', 'plate-text', 'plate-text', { 'fill': 'black', 'x': '0', 'y': '0' });
        const tspan = svg.createSVGElement('tspan');
        tspan.setAttribute('x', '3');
        tspan.setAttribute('dy', '12');
        text.appendChild(tspan);
        text.appendChild(tspan.cloneNode(true));
        text.appendChild(tspan.cloneNode(true));
        g.appendChild(text);
        this._element.appendChild(g);
        console.log((this._element as any).childNodes);
    }

    get element() {
        return this._element;
    }

    get disabled() {
        return this._disabled;
    }

    set disabled(val: boolean) {
        if (val) {
            this.hide();
        } else {
            getSelection().removeAllRanges();
        }
        this._disabled = val;
    }

    get editable() {
        return this._editable
    }

    set editable(val: boolean) {
        const strVal = val ? 'true' : null;
        const text = (this._element.childNodes[1] as HTMLElement).children[1] as HTMLElement;
        const textlings = text.children;
        for (let i = 0; i < textlings.length; ++i) {
            (textlings[i] as HTMLElement).contentEditable = strVal;
        }
    }

    show(circle: SVGCircleElement) {
        if (this.disabled) return;
        if (this._element.style.display === 'none') {
            this.modify(circle);
            this._element.style.display = null;
        }
    }

    hide() {
        this._element.style.display = 'none';
    }

    private modify(circle: SVGCircleElement) {
        const c = new L.Point(Number(circle.getAttribute('cx')), Number(circle.getAttribute('cy')));
        const r = Number(circle.getAttribute('r'));
        const iR = Math.trunc(r);

        const pole = this._element.firstElementChild;
        const poleSize = new L.Point(4 + iR, 8 + iR);

        const platform = svg.platformByCircle(circle, this.graph);
        const ru = platform.name;
        const fi = platform.altNames['fi'];
        const en = platform.altNames['en'];

        const names = !fi ? [ru] : lang.userLanguage === 'fi' ? [fi, ru] : [ru, fi];
        if (en) names.push(en);

        this.modifyBox(c.subtract(poleSize), names);
    }

    private modifyBox(bottomRight: L.Point, lines: string[]): void {
        const rect: SVGRectElement = this._element['childNodes'][1].childNodes[0] as any;
        const text: SVGTextElement = this._element['childNodes'][1].childNodes[1] as any;

        const textChildren: SVGElement[] = text['childNodes'] as any;
        for (var i = 0; i < lines.length; ++i) {
            const t = textChildren[i];

            t.textContent = lines[i];
        }
        while (i < textChildren.length) {
            textChildren[i++].textContent = null;
        }
        const adjustDimensions = (y: number) => {
            let {width, height} = text.getBBox();
            width = Math.round(width);
            rect.setAttribute('width', (width + 6).toString());
            rect.setAttribute('height', (height + y).toString());
            const tx = bottomRight.x - width,
                ty = bottomRight.y - height;
            this._element.setAttribute('transform', `translate(${tx}, ${ty})`);
            text.setAttribute('transform', `translate(${width}, 0)`)
        };
        if (L.Browser.webkit) {
            adjustDimensions(4);
        } else {
            setTimeout(adjustDimensions, 0, 0);
        }

    }
}

//function makeForeignDiv(topLeft: L.Point, text: string): SVGElement {
//    const foreign = createSVGElement('foreignObject');
//    //foreign.setAttribute('requiredExtensions', 'http://www.w3.org/1999/xhtml');
//    foreign.setAttribute('x', topLeft.x.toString());
//    foreign.setAttribute('y', topLeft.y.toString());
//    foreign.setAttribute('width', '200');
//    foreign.setAttribute('height', '50');
//    //let div = <HTMLElement>document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
//    const div = document.createElement('div');
//    div.innerHTML = text;
//    div.classList.add('plate-box');
//    div.classList.add('plate-text');
//    foreign.appendChild(div);
//    return <any>foreign;
//}
