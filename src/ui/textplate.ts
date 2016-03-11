import * as svg from '../svg';
import * as po from '../plain-objects';
import * as lang from '../lang';

export default class TextPlate {
    private _element: SVGGElement;
    private _disabled = false;
    private _editable = false;
    private graph: po.Graph;

    constructor(graph: po.Graph) {
        this.graph = graph;
        const g = svg.createSVGElement('g') as SVGGElement;
        g.id = 'station-plate';
        g.style.display = 'none';
        const foreign = svg.createSVGElement('foreignObject');
        foreign.setAttribute('x', '0');
        foreign.setAttribute('y', '0');
        foreign.setAttribute('width', '100%');
        foreign.setAttribute('height', '100%');
        const div = document.createElement('div');
        div.classList.add('plate-box');
        foreign.appendChild(div);
        g.appendChild(foreign);
        this._element = g;
        console.log((this._element as any).childNodes);
    }

    get element() {
        return this._element;
    }

    get disabled() {
        return this._disabled;
    }

    set disabled(val: boolean) {
        (val ? this.hide : getSelection().removeAllRanges)();
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
        if (this.disabled || this._element.style.display !== 'none') return;
        this.modify(circle);
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

        const ru = platform.name,
            { fi, en } = platform.altNames;

        const names = !fi ? [ru] : lang.userLanguage === 'fi' ? [fi, ru] : [ru, fi];
        if (en) names.push(en);

        this.modifyBox(c.subtract(poleSize), names);
    }

    private modifyBox(bottomRight: L.Point, lines: string[]): void {
        const foreign = this._element.firstChild as SVGForeignObjectElement;
        const div = foreign.firstChild as HTMLDivElement;

        div.innerHTML = lines.join('<br>');
        // foreign.setAttribute('width', width.toString());
        this._element.setAttribute('transform', `translate(${bottomRight.x}, ${bottomRight.y})`);
        this._element.style.display = null;
        let { width, height } = div.getBoundingClientRect();
        
        width = Math.round(width);
        foreign.setAttribute('transform', `translate(${-~~width}, ${-~~height})`);
        console.log(foreign.getBoundingClientRect());
        console.log(div.getBoundingClientRect());
    }
}