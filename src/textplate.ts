import * as svg from './svg';
import * as util from './util';
import * as po from './plain-objects';
    
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
        (this._element as any).innerHTML = `<line id="pole" class="plate-pole"/>
            <g>
                <rect id="plate-box" class="plate-box" filter="url(#shadow)"/>
                <text id="plate-text" fill="black" class="plate-text"><tspan/><tspan/><tspan/></text>
            </g>`;
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
        pole.setAttribute('x1', c.x.toString());
        pole.setAttribute('y1', c.y.toString());
        pole.setAttribute('x2', poleEnd.x.toString());
        pole.setAttribute('y2', poleEnd.y.toString());
        const platform = svg.platformByCircle(circle, this.graph);
        const ru = platform.name;
        const fi = platform.altNames['fi'];
        const en = platform.altNames['en'];
    
        const names = !fi ? [ru] : util.getUserLanguage() === 'fi' ? [fi, ru] : [ru, fi];
        if (en) names.push(en);
    
        this.modifyBox(poleEnd, names);
    }

    private modifyBox(bottomRight: L.Point, lines: string[]): void {
        const rect: SVGRectElement = this._element['children'][1].children[0];
        const spacing = 12;
        const longest = lines.reduce((prev, cur) => prev.length < cur.length ? cur : prev);
        const rectSize = new L.Point(10 + longest.length * 6, 6 + spacing * lines.length);
        rect.setAttribute('width', rectSize.x.toString());
        rect.setAttribute('height', rectSize.y.toString());
        const rectTopLeft = bottomRight.subtract(rectSize);
        rect.setAttribute('x', rectTopLeft.x.toString());
        rect.setAttribute('y', rectTopLeft.y.toString());

        const text: SVGTextElement = this._element['children'][1].children[1];
        const textChildren: SVGElement[] = text['children'];
        for (var i = 0; i < lines.length; ++i) {
            const textTopLeft = bottomRight.subtract(new L.Point(3, rectSize.y - (i + 1) * spacing));
            const t = textChildren[i];
            t.setAttribute('x', textTopLeft.x.toString());
            t.setAttribute('y', textTopLeft.y.toString());
            t.textContent = lines[i];
        }
        while (i < textChildren.length) {
            textChildren[i++].textContent = null;
        }
        try {
            // sorry, firefox
            const bbox = (text as any as SVGTextElement).getBBox();
            rect.setAttribute('x', (bbox.x - 3).toString());
            //rect.setAttribute('y', bbox.y.toString());
            rect.setAttribute('width', (bbox.width + 6).toString());
            //rect.setAttribute('height', bbox.height.toString());
        } catch (err) {}
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
