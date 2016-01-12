import MetroMap from '../metro-map';
import * as util from '../util';
import * as lang from '../lang';

type Item = { icon?: string; disabled?: boolean; text: string };
export default class ContextMenu {
    private metroMap: MetroMap;
    private _items: Map<string, Item>;
    private _extraItems: Map<EventTarget, Map<string, Item>>;
    private table: HTMLTableElement;
    get items() {
        return this._items;
    }
    get extraItems() {
        return this._extraItems;
    }
    get state() {
        return this.table.style.display !== 'none';
    }
    set state(val: boolean) {
        this.table.style.display = val ? null : 'none';
    }

    constructor(metroMap: MetroMap, items: Map<string, Item>) {
        console.log('adding context menu');
        this.metroMap = metroMap;
        this._items = items;
        this._extraItems = new Map();
        const handler = this.listener.bind(this);
        metroMap.getMap().getPanes().mapPane.addEventListener('contextmenu', handler);
        metroMap.getOverlay().addEventListener('contextmenu', handler);
        const container = metroMap.getMap().getContainer();
        container.addEventListener('mousedown', evt => {
            if (evt.button !== 2) {
                this.state = false;
            }
        });
        this.table = document.createElement('table');
        this.table.id = 'contextmenu';
        document.body.appendChild(this.table);
    }

    private listener(event: MouseEvent) {
        console.log('target', event.target);
        event.preventDefault();
        console.log('bb', event.bubbles);
        this.state = true;
        this.table.innerHTML = '';
        const fillCell = (item: Item, eventName: string) => {
            const cell: HTMLTableDataCellElement = (this.table.insertRow() as any).insertCell(0);
            const [attr, val] = item.disabled ? ['disabled', ''] : ['data-event', eventName];
            cell.setAttribute(attr, val);
            cell.textContent = lang.translate(item.text);
        }
        this._items.forEach(fillCell);
        this._extraItems.forEach((map, target) => {
            if (target === event.target) {
                map.forEach(fillCell);
            }
            this._extraItems.delete(target);
        });
        // defined here so that the marker gets set here (TODO: fix later)
        this.table.onclick = e => {
            console.log(e);
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
        const scale = L.Browser.mobile ? 1.5 : 1;
        this.table.style.transform = `scale(${scale})`;
        const { width, height } = this.table.getBoundingClientRect();
        const { clientWidth, clientHeight } = document.documentElement;
        const { clientX, clientY } = event;
        const tx = clientX + width > clientWidth ? clientWidth - width : clientX,
            ty = clientY + height > clientHeight ? clientY - height : clientY
        this.table.style.transform = `matrix(${scale}, 0, 0, ${scale}, ${tx}, ${ty})`;

    }


}