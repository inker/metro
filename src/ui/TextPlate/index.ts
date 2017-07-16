import { Point } from 'leaflet'

import { svg } from '../../util'

import * as styles from './styles.css'

export default class TextPlate {
    readonly element = svg.createSVGElement('g')
    private _disabled = false
    private _editable = false

    constructor() {
        const { element } = this
        element.style.display = 'none'
        element.innerHTML = `
            <foreignObject
                x="0"
                y="0"
                width="100%"
                height="100%"
            >
                <div class=${styles['plate-box']} />
            </foreignObject>
        `
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
        const strVal = val ? 'true' : 'false'
        const text = (this.element.childNodes[1] as HTMLElement).children[1] as HTMLElement
        const textlings = text.children as any as HTMLElement[]
        for (const textling of textlings) {
            textling.contentEditable = strVal
        }
    }

    setFontSize(size: number) {
        const foreign = this.element.firstElementChild as SVGForeignObjectElement
        const div = foreign.firstElementChild as HTMLDivElement
        div.style.fontSize = `${size}px`
    }

    show(bottomRight: Point, names: string[]) {
        if (this.disabled || this.element.style.display !== 'none') {
            return
        }

        const foreign = this.element.firstElementChild as SVGForeignObjectElement
        const div = foreign.firstElementChild as HTMLDivElement

        div.innerHTML = names.join('<br>')
        this.element.setAttribute('transform', `translate(${bottomRight.x}, ${bottomRight.y})`)
        this.element.style.display = null
        const { width, height } = div.getBoundingClientRect()

        foreign.setAttribute('transform', `translate(${-width}, ${-height})`)
        // console.log(foreign.getBoundingClientRect())
        // console.log(div.getBoundingClientRect())
    }

    hide() {
        this.element.style.display = 'none'
    }
}
