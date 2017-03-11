import { Map, Browser } from 'leaflet'
import * as Hammer from 'hammerjs'

import Widget from '../base/Widget'
import MetroMap from '../../MetroMap'
import { transitionEnd, once } from '../../util/events'

import * as styles from './styles.css'

interface QA {
    q: string,
    a: string,
}

interface FAQData {
    faq: QA[],
}

export default class implements Widget {
    private readonly button: HTMLButtonElement
    private readonly card: HTMLDivElement
    private map: Map

    constructor(faqData: string[]) {
        const btn = document.createElement('button')
        btn.textContent = 'FAQ'
        btn.classList.add('leaflet-control')
        btn.classList.add(styles['faq-button'])
        btn.addEventListener('click', e => this.showFAQ())
        this.button = btn
        this.card = document.createElement('div')
        this.card.classList.add(styles['faq-card'])

        if (Browser.mobile) {
            new Hammer(this.card).on('swipeleft swiperight', e => this.hideFAQ())
        }

        const urlRe = /\[\[(.+?)\|(.*?)\]\]/g
        const replacement = '<a href=\"$1\" target=\"_blank\">$2</a>'
        const questionClass = styles.question
        const answerClass = styles.answer
        const qa2html = qa => `
            <div>
                <span class="${questionClass}">${qa.q}</span>
                <span class="${answerClass}">${qa.a}</span>
            </div>
        `
        this.card.innerHTML += faqData.map(qa2html).join('').replace(urlRe, replacement)
    }

    addTo(metroMap: MetroMap) {
        this.map = metroMap.getMap()
        const leafletTopRight = document.querySelector('.leaflet-right.leaflet-top')
        document.body.appendChild(this.card)
        if (!leafletTopRight) {
            throw new Error('cannot append to .leaflet-right.leaflet-top')
        }
        leafletTopRight.appendChild(this.button)
        return this
    }

    showFAQ() {
        const { card, map, button } = this
        const { style } = card
        style.display = 'inline'
        style.transform = 'scale(0.1)'
        style.opacity = '0'
        card.getBoundingClientRect()
        style.transform = null
        style.opacity = null
        button.disabled = true
        if (!Browser.mobile) {
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
        const { card, map, button } = this
        const { style } = card
        card.getBoundingClientRect()
        style.transform = 'scale(0.1)'
        style.opacity = '0'
        if (!Browser.mobile) {
            map.getContainer().classList.remove('dimmed')
        }
        transitionEnd(card).then(e => style.display = null)
        button.disabled = false
    }
}
