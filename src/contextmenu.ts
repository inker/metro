import * as L from 'leaflet';
import MetroMap from './metro-map';
import * as util from './util';

let lang = util.getUserLanguage();
if (lang !== 'ru' && lang !== 'fi') lang = 'en';

type Item = { icon?: string; disabled?: boolean; lang: any };
export default class ContextMenu {
    private metroMap: MetroMap;
    private _items: Map<string, Item>;
    private _extraItems: Map<EventTarget, Map<string, Item>>;
    get items() {
        return this._items;
    }
    get extraItems() {
        return this._extraItems;
    }
    get state() {
        return document.getElementById('contextmenu') !== null;
    }
    set state(state: boolean) {
        if (state) return;
        const menuElement = document.getElementById('contextmenu');
        if (menuElement === null) return;
        document.body.removeChild(menuElement);
    }

    constructor(metroMap: MetroMap, items: Map<string, any>) {
        console.log('adding context menu');
        this.metroMap = metroMap;
        this._items = items;
        this._extraItems = new Map();
        const overlay = metroMap.getOverlay();
        overlay.addEventListener('contextmenu', this.addListener.bind(this), true);
        overlay.addEventListener('mousedown', evt => {
            if (evt.button !== 2) {
                this.state = false;
            }
        });
    }

    private addListener(event: MouseEvent) {
        console.log('target', event.target);
        event.preventDefault();
        console.log('bb', event.bubbles);
        let table: HTMLTableElement;
        if (this.state) {
            table = document.getElementById('contextmenu') as any;
        } else {
            table = document.createElement('table');
            table.id = 'contextmenu';
            table.style.position = 'absolute';
            document.body.appendChild(table);
            this.state = true;
        }
        (table as HTMLTableElement).innerHTML = '';
        function fillCell(item, eventName) {
            const cell: HTMLTableDataCellElement = (table as any).insertRow().insertCell(0);
            const [attrName, attrVal] = item.disabled ? ['disabled', ''] : ['data-event', eventName];
            cell.setAttribute(attrName, attrVal);
            cell.textContent = item.lang[lang];
        }
        this._items.forEach(fillCell);
        this._extraItems.forEach((map, target) => {
            if (target === event.target) {
                map.forEach(fillCell);
            }
            this._extraItems.delete(target);
        });
        // defined here so that the marker gets set here (TODO: fix later)
        table.onclick = e => {
            const cell: HTMLTableCellElement = e.target as any;
            const dict = {
                clientX: event.clientX,
                clientY: event.clientY,
                relatedTarget: event.target
            };
            const eventType = cell.getAttribute('data-event');
            if (eventType) {
                this.state = false;
                this.metroMap.dispatchEvent(new MouseEvent(eventType, dict))
            }
        };

        const { width, height } = table.getBoundingClientRect();
        const { clientWidth, clientHeight } = document.documentElement;
        const { clientX, clientY } = event;
        table.style.top = `${clientY + height > clientHeight ? clientY - height : clientY}px`;
        table.style.left = `${clientX + width > clientWidth ? clientWidth - width : clientX}px`;
        console.log('context menu!');
    }


}