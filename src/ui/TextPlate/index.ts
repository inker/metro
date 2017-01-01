import * as L from 'leaflet'

import { svg } from '../../util'

import './style.css'

export default class TextPlate {
    private _element: SVGGElement
    private _disabled = false
    private _editable = false

    constructor() {
        const div = document.createElement('div')
        div.classList.add('plate-box')
        const foreign = svg.createSVGElement('foreignObject') as SVGForeignObjectElement
        foreign.setAttribute('x', '0')
        foreign.setAttribute('y', '0')
        foreign.setAttribute('width', '100%')
        foreign.setAttribute('height', '100%')
        foreign.appendChild(div)
        const g = svg.createSVGElement('g') as SVGGElement
        g.id = 'station-plate'
        g.style.display = 'none'
        g.appendChild(foreign)
        this._element = g
    }

    get element() {
        return this._element
    }

    get disabled() {
        return this._disabled
    }

    set disabled(val: boolean) {
        val ? this.hide() : getSelection().removeAllRanges()
        this._disabled = val
    }

    get editable() {
        return this._editable
    }

    set editable(val: boolean) {
        const strVal = val ? 'true' : null
        const text = (this._element.childNodes[1] as HTMLElement).children[1] as HTMLElement
        const textlings = text.children
        for (let i = 0; i < textlings.length; ++i) {
            (textlings[i] as HTMLElement).contentEditable = strVal
        }
    }

    show(bottomRight: L.Point, names: string[]) {
        if (this.disabled || this._element.style.display !== 'none') return

        const foreign = this._element.firstChild as SVGForeignObjectElement
        const div = foreign.firstChild as HTMLDivElement

        div.innerHTML = names.join('<br>')
        this._element.setAttribute('transform', `translate(${bottomRight.x}, ${bottomRight.y})`)
        this._element.style.display = null
        const { width, height } = div.getBoundingClientRect()

        foreign.setAttribute('transform', `translate(${-width}, ${-height})`)
        console.log(foreign.getBoundingClientRect())
        console.log(div.getBoundingClientRect())
    }

    hide() {
        this._element.style.display = 'none'
    }
}