import MetroMap from '../metro-map';
import { once } from '../util';

type FAQData = { faq: { q: string, a: string }[] };

export default class FAQ {
    private button: HTMLButtonElement;
    private card: HTMLDivElement;
    private map: L.Map;
    constructor(map: MetroMap, faqDataUrl: string) {
        const promise: Promise<FAQData> = fetch(faqDataUrl)
            .catch(err => console.error(err))
            .then(data => data.json());
        this.map = map.getMap();
        const btn = document.createElement('button');
        btn.id = 'faq-button';
        btn.textContent = 'FAQ';
        btn.classList.add('leaflet-control');
        btn.onclick = this.showFAQ.bind(this);
        document.querySelector('.leaflet-right.leaflet-top').appendChild(btn);
        this.button = btn;
        this.card = document.createElement('div');
        this.card.id = 'faq-card';
        document.body.appendChild(this.card);
        if (L.Browser.mobile) {
            const closeSpan = document.createElement('div');
            closeSpan.classList.add('cross-ball');
            closeSpan.id = 'close-span';
            closeSpan.textContent = '❌';
            closeSpan.onclick = e => console.log('foo');
            this.card.appendChild(closeSpan);
        }
        
        const qa2html = qa => `<div><span class="question">${qa.q}</span><span class="answer">${qa.a}</span></div>`;
        promise.then(data => this.card.innerHTML += data.faq.map(qa2html).join(''));
    }

    showFAQ(event: MouseEvent) {
        const cardStyle = this.card.style;
        cardStyle.display = 'inline';
        cardStyle.transform = 'scale(0.1)';
        cardStyle.opacity = '0';
        this.card.getBoundingClientRect();
        cardStyle.transform = null;
        cardStyle.opacity = null;
        this.button.disabled = true;
        if (!L.Browser.mobile) {
            this.map.getContainer().classList.add('dimmed');
            this.map.once('mousedown', e => this.hideFAQ((e as L.LeafletMouseEvent).originalEvent));
            once(window, 'keydown', e => {
                if ((e as KeyboardEvent).keyCode !== 27) return;
                this.map.fireEvent('mousedown');
            });
        }
    }

    hideFAQ(event: MouseEvent) {
        console.log('hiding');
        this.card.getBoundingClientRect();
        this.card.style.transform = 'scale(0.1)';
        this.card.style.opacity = '0';
        if (!L.Browser.mobile) {
            this.map.getContainer().classList.remove('dimmed');
        }
        once(this.card, 'transitionend', e => this.card.style.display = null);
        this.button.disabled = false;
    }
}