import * as Hammer from 'hammerjs'

import { DeferredWidget } from '../base/Widget'
import { once } from '../../util'

import './style.css'

type FAQData = { faq: { q: string, a: string }[] }

export default class extends DeferredWidget {
    private button: HTMLButtonElement
    private card: HTMLDivElement
    private map: L.Map

    constructor(faqDataUrl: string) {
        super()
        const promise: Promise<FAQData> = fetch(faqDataUrl).then(data => data.json()) as any

        const btn = document.createElement('button')
        btn.id = 'faq-button'
        btn.textContent = 'FAQ'
        btn.classList.add('leaflet-control')
        btn.addEventListener('click', e => this.showFAQ())
        this.button = btn
        this.card = document.createElement('div')
        this.card.id = 'faq-card'

        if (L.Browser.mobile) {
            new Hammer(this.card).on('swipeleft swiperight', e => this.hideFAQ())
        }

        const urlRe = /\[\[(.+?)\|(.*?)\]\]/g
        const replacement = '<a href=\"$1\" target=\"_blank\">$2</a>'
        const qa2html = qa => `<div><span class="question">${qa.q}</span><span class="answer">${qa.a}</span></div>`
        this._whenAvailable = promise.then(data => {
            this.card.innerHTML += data.faq.map(qa2html).join('').replace(urlRe, replacement)
        })
    }

    addTo(map: L.Map) {
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
        const cardStyle = this.card.style
        cardStyle.display = 'inline'
        cardStyle.transform = 'scale(0.1)'
        cardStyle.opacity = '0'
        this.card.getBoundingClientRect()
        cardStyle.transform = null
        cardStyle.opacity = null
        this.button.disabled = true
        if (!L.Browser.mobile) {
            this.map.getContainer().classList.add('dimmed')
            this.map.once('mousedown', e => this.hideFAQ())
            once(window, 'keydown', e => {
                if ((e as KeyboardEvent).keyCode !== 27) return
                this.map.fireEvent('mousedown')
            })
        }
    }

    hideFAQ() {
        console.log('hiding')
        this.card.getBoundingClientRect()
        this.card.style.transform = 'scale(0.1)'
        this.card.style.opacity = '0'
        if (!L.Browser.mobile) {
            this.map.getContainer().classList.remove('dimmed')
        }
        once(this.card, 'transitionend', e => this.card.style.display = null)
        this.button.disabled = false
    }
}
