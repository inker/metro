import { Map as LeafletMap, Browser } from 'leaflet'

import { transitionEnd, once } from 'utils/events'

import styles from './styles.pcss'

interface QA {
    q: string,
    a: string,
}

const URL_RE = /\[\[(.+?)\|(.*?)]]/g
const REPLACEMENT = '<a href="$1" target="_blank" rel="noopener">$2</a>'

const qa2html = (qa: QA) => `
    <div>
        <span class="${styles.question}">${qa.q}</span>
        <span class="${styles.answer}">${qa.a}</span>
    </div>
`

export default class FAQ {
  private readonly button: HTMLButtonElement
  private readonly card: HTMLDivElement
  private map: LeafletMap

  constructor(faqData: QA[]) {
    const btn = document.createElement('button')
    btn.textContent = 'FAQ'
    btn.classList.add('leaflet-control')
    btn.classList.add(styles['faq-button'])
    btn.addEventListener('click', this.showFAQ)
    this.button = btn
    this.card = document.createElement('div')
    this.card.classList.add(styles['faq-card'])

    if (Browser.mobile) {
          import(/* webpackChunkName: "hammer" */ 'hammerjs').then(Hammer => {
            new Hammer.default(this.card).on('swipeleft swiperight', this.hideFAQ)
          })
    }

    this.card.innerHTML += faqData.map(qa2html).join('').replace(URL_RE, REPLACEMENT)
  }

  addTo(map: LeafletMap) {
    this.map = map
    const leafletTopRight = document.querySelector('.leaflet-right.leaflet-top')
    document.body.appendChild(this.card)
    if (!leafletTopRight) {
      throw new Error('cannot append to .leaflet-right.leaflet-top')
    }
    leafletTopRight.appendChild(this.button)
    return this
  }

  showFAQ = () => {
    const { card, map, button } = this
    const { style } = card
    style.display = 'inline'
    style.transform = 'scale(0.1)'
    style.opacity = '0'
    card.getBoundingClientRect()
    style.transform = 'none'
    style.opacity = ''
    button.disabled = true
    if (!Browser.mobile) {
      map.getContainer().classList.add('dimmed')
      map.once('mousedown', () => {
        this.hideFAQ()
      })
      once(window, 'keydown').then(e => {
        if (e.key !== 'Escape') {
          return
        }
        map.fireEvent('mousedown')
      })
    }
  }

  hideFAQ = () => {
    const { card, map, button } = this
    const { style } = card
    card.getBoundingClientRect()
    style.transform = 'scale(0.1)'
    style.opacity = '0'
    if (!Browser.mobile) {
      map.getContainer().classList.remove('dimmed')
    }
    transitionEnd(card).then(() => {
      style.display = 'initial'
    })
    button.disabled = false
  }
}
