import MetroMap from './metro-map';
import { once } from './util';

type FAQData = {faq: { q: string, a: string }[]};

export default class FAQ {
	private button: HTMLButtonElement;
	private card: HTMLDivElement;
	private map: L.Map;
	constructor(map: MetroMap, faqDataUrl: string) {
		const promise: Promise<FAQData> = window['fetch'](faqDataUrl)
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
		const closeSpan = document.createElement('div');
		closeSpan.classList.add('cross-ball');
		closeSpan.textContent = '×';
		closeSpan.addEventListener('mousedown', e => this.map.fireEvent('mousedown'));

		this.card.appendChild(closeSpan);
		promise.then(data => {
			for (let qa of data.faq) {
				const qaEl = document.createElement('div');
				qaEl.innerHTML = `<span class="question">${qa.q}</span><span class="answer">${qa.a}</span>`;
				this.card.appendChild(qaEl);
			}
		});

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
		this.map.once('mousedown', e => this.hideFAQ((e as L.LeafletMouseEvent).originalEvent));
	}
	
	hideFAQ(event: MouseEvent) {
		this.card.getBoundingClientRect();
		this.card.style.transform = 'scale(0.1)';
		this.card.style.opacity = '0';
		once(this.card, 'transitionend', e => this.card.style.display = null);
		this.button.disabled = false;
	}
}