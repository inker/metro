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
        const pole = svg.createSVGElement('line');
        pole.id = 'pole';
        pole.classList.add('plate-pole');
        pole.setAttribute('x1', '0');
        pole.setAttribute('y1', '0');
        pole.setAttribute('x2', '4');
        pole.setAttribute('y2', '8');
        this._element.appendChild(pole);
        const g = svg.createSVGElement('g');
        const rect = svg.createSVGElement('rect');
        rect.id = 'plate-box';
        rect.classList.add('plate-box');
        rect.setAttribute('x', '0');
        rect.setAttribute('y', '0');
        rect.setAttribute('filter', 'url(#shadow)');
        g.appendChild(rect);
        const text = svg.createSVGElement('text');
        text.id = 'plate-text';
        text.setAttribute('fill', 'black');
        text.classList.add('plate-text');
        text.setAttribute('x', '0');
        text.setAttribute('y', '0');
        const tspan = svg.createSVGElement('tspan');
        tspan.setAttribute('x', '3');
        tspan.setAttribute('dy', '12');
        text.appendChild(tspan);
        text.appendChild(tspan.cloneNode(true));
        text.appendChild(tspan.cloneNode(true));
        g.appendChild(text);
        this._element.appendChild(g);
        // (this._element as any).innerHTML = `<line id="pole" class="plate-pole"/>
        //     <g>
        //         <rect id="plate-box" class="plate-box" filter="url(#shadow)"/>
        //         <text id="plate-text" fill="black" class="plate-text"><tspan/><tspan/><tspan/></text>
        //     </g>`;
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
        const poleEnd = c.subtract(poleSize);

        const platform = svg.platformByCircle(circle, this.graph);
        const ru = platform.name;
        const fi = platform.altNames['fi'];
        const en = platform.altNames['en'];

        const names = !fi ? [ru] : lang.userLanguage === 'fi' ? [fi, ru] : [ru, fi];
        if (en) names.push(en);

        this.modifyBox(poleEnd, names);
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
            const obb = text.getBBox()
            rect.setAttribute('width', (obb.width + 6).toString());
            rect.setAttribute('height', (obb.height + y).toString());
            const tx = bottomRight.x - obb.width,
                ty = bottomRight.y - obb.height;
            this._element.setAttribute('transform', `translate(${tx}, ${ty})`);
            text.setAttribute('transform', `translate(${obb.width}, 0)`)
        };
        if (L.Browser.webkit) {
            adjustDimensions(3);
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
