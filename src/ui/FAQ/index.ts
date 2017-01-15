import * as Hammer from 'hammerjs'

import { DeferredWidget } from '../base/Widget'
import {
    transitionEnd,
    once,
} from '../../util'

import * as style from './style.css'

interface QA {
    q: string,
    a: string,
}[]

interface FAQData {
    faq: QA[],
}

export default class extends DeferredWidget {
    private readonly button: HTMLButtonElement
    private readonly card: HTMLDivElement
    private map: L.Map

    constructor(faqDataUrl: string) {
        super()
        const promise: Promise<FAQData> = fetch(faqDataUrl).then(data => data.json()) as any

        const btn = document.createElement('button')
        btn.textContent = 'FAQ'
        btn.classList.add('leaflet-control')
        btn.classList.add(style['faq-button'])
        btn.addEventListener('click', e => this.showFAQ())
        this.button = btn
        this.card = document.createElement('div')
        this.card.classList.add(style['faq-card'])

        if (L.Browser.mobile) {
            new Hammer(this.card).on('swipeleft swiperight', e => this.hideFAQ())
        }

        const urlRe = /\[\[(.+?)\|(.*?)\]\]/g
        const replacement = '<a href=\"$1\" target=\"_blank\">$2</a>'
        const questionClass = style.question
        const answerClass = style.answer
        const qa2html = qa => `
            <div>
                <span class="${questionClass}">${qa.q}</span>
                <span class="${answerClass}">${qa.a}</span>
            </div>
        `
        this._whenAvailable = promise.then(data => {
            this.card.innerHTML += data.faq.map(qa2html).join('').replace(urlRe, replacement)
        })
    }

    addTo(map: L.Map) {
        this.map = map
        this.whenAvailable.then(faq => {
            const leafletTopRight = document.querySelector('.leaflet-right.leaflet-top')
            document.body.appendChild(this.card)
            if (!leafletTopRight) {
                console.error('cannot append to .leaflet-right.leaflet-top')
                return
            }
            leafletTopRight.appendChild(this.button)
        })
    }

    showFAQ() {
        const {
            card,
            map,
            button,
        } = this
        const { style } = this.card
        style.display = 'inline'
        style.transform = 'scale(0.1)'
        style.opacity = '0'
        card.getBoundingClientRect()
        style.transform = null
        style.opacity = null
        button.disabled = true
        if (!L.Browser.mobile) {
            map.getContainer().classList.add('dimmed')
            map.once('mousedown', e => this.hideFAQ())
            once(window, 'keydown').then(e => {
                if (e.keyCode !== 27) {
                    return
                }
                map.fireEvent('mousedown')
            })
        }
    }

    hideFAQ() {
        const {
            card,
            map,
            button,
        } = this
        card.getBoundingClientRect()
        card.style.transform = 'scale(0.1)'
        card.style.opacity = '0'
        if (!L.Browser.mobile) {
            map.getContainer().classList.remove('dimmed')
        }
        transitionEnd(card).then(e => card.style.display = null)
        button.disabled = false
    }
}
