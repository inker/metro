import * as L from 'leaflet';
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
        if (L.Browser.mobile) {
            const dragging = this.metroMap.getMap().dragging;
            (val ? dragging.disable : dragging.enable)();
        }
    }

    constructor(metroMap: MetroMap, items: Map<string, Item>) {
        console.log('adding context menu');
        this.metroMap = metroMap;
        this._items = items;
        this._extraItems = new Map();
        
        const map = metroMap.getMap();
        const listener = this.handler.bind(this);
        //metroMap.getOverlay().addEventListener('contextmenu', listener);
        map.getPanes().mapPane.addEventListener('contextmenu', listener);
        
        const container = map.getContainer();
        const cancelListener = e => this.state = false;
        container.addEventListener('mousedown', cancelListener);
        container.addEventListener('touchstart', cancelListener);
        if (!L.Browser.mobile) {
            map.on('movestart', cancelListener);
        }
        this.table = document.createElement('table');
        this.table.id = 'contextmenu';
        this.table.addEventListener('contextmenu', e => {
            e.preventDefault();
            (e.target as HTMLElement).click();
        });
        document.body.appendChild(this.table);
    }

    private handler(event: MouseEvent) {
        console.log('target', event.target);
        event.preventDefault();
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
                console.log(event.target, target);
                map.forEach(fillCell);
            }
            this._extraItems.delete(target);
        });
        // defined here so that the marker gets set here (TODO: fix later)
        this.table.onclick = e => {
            console.log(e);
            const cell = e.target as HTMLTableCellElement;
            const eventType = cell.getAttribute('data-event');
            if (eventType) {
                this.state = false;
                const me = new MouseEvent(eventType, { clientX, clientY, relatedTarget: event.target });
                this.metroMap.dispatchEvent(me)
            }
        };
        const { width, height } = this.table.getBoundingClientRect();
        const { clientWidth, clientHeight } = document.documentElement;
        const { clientX, clientY } = event;
        const tx = clientX + width > clientWidth ? clientWidth - width : clientX,
            ty = clientY + height > clientHeight ? clientY - height : clientY
        this.table.style.transform = `translate(${tx}px, ${ty}px)`;
    }
}