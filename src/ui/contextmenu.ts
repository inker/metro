/// <reference path="../../typings/tsd.d.ts" />
import * as L from 'leaflet';
import MetroMap from '../metromap';
import { DeferredWidget } from './widget';
import * as util from '../util';
import { getJSON } from '../res';
import { translate } from '../i18n';

// TODO: merge items & extra items, introduce item index

export type ContextMenuItem = {
    text: string,
    predicate?: (target: EventTarget) => boolean,
    event?: string,
    icon?: string, 
    disabled?: boolean;
}

export default class ContextMenu extends DeferredWidget {
    private metroMap: MetroMap;
    private items: ContextMenuItem[];
    private container: HTMLDivElement;

    constructor(url: string) {
        super();
        this._whenAvailable = getJSON(url).then(json => {
            console.log('adding context menu');

            this.items = json;
            //this._extraItems = new Map();
            
            this.container = document.createElement('div');
            this.container.id = 'contextmenu';
            this.container.addEventListener('contextmenu', e => {
                e.preventDefault();
                (e.target as HTMLElement).click();
            });

            console.log('context menu ready');
        });
    }

    addTo(metroMap: MetroMap) {
        this.metroMap = metroMap;
        const map = metroMap.getMap();
        if (map === undefined) {
            throw new Error('cannot add map editor to metro map: leaflet map is missing');
        }
        const { mapPane } = map.getPanes(),
            mapContainer = map.getContainer(),
            listener = e => this.handler(e),
            cancelListener = e => this.hide();
        this._whenAvailable.then(menu => {
            mapPane.addEventListener('contextmenu', listener, false);
            //objectsPane.addEventListener('contextmenu', listener, true); // 'true' prevents propagation
            mapContainer.addEventListener('mousedown', cancelListener);
            mapContainer.addEventListener('touchstart', cancelListener);
            if (!L.Browser.mobile) {
                map.on('movestart', cancelListener);
            }
            document.body.appendChild(this.container);   
        });
    }

    private handler(event: MouseEvent) {
        event.preventDefault();
        console.log('target', event.target, event.target['parentNode']);
        util.removeAllChildren(this.container);
        for (let item of this.items) {
            if (item.predicate !== undefined && !item.predicate(event.target)) {
                console.log(item.predicate(event.target));
                continue;
            }
            const cell = document.createElement('div');
            if (item.disabled) {
                cell.setAttribute('disabled', '');
            } else {
                cell.setAttribute('data-event', item.event);
            }
            cell.textContent = translate(item.text);
            this.container.appendChild(cell);            
        }

        // defined here so that the marker gets set here (TODO: fix later)
        this.container.onclick = e => {
            console.log(e);
            const cell = e.target as HTMLDivElement;
            const eventType = cell.getAttribute('data-event');
            if (eventType) {
                this.hide();
                const me = new MouseEvent(eventType, { clientX, clientY, relatedTarget: event.target });
                this.metroMap.receiveEvent(me)
            }
        };
        const { width, height } = this.container.getBoundingClientRect(),
            { clientWidth, clientHeight } = document.documentElement,
            { clientX, clientY } = event,
            tx = clientX + width > clientWidth ? clientWidth - width : clientX,
            ty = clientY + height > clientHeight ? clientY - height : clientY;
        this.container.style.transform = `translate(${tx}px, ${ty}px)`;
        this.show();
    }

    insertItem(item: ContextMenuItem, index?: number) {
        if (index === undefined || index < 0) {
            this.items.push(item);
        } else {
            this.items.splice(index, 0, item);
        }
    }

    removeItem(event: string, all = false) {
        if (all) {
            this.items = this.items.filter(item => item.event !== event);
            return;
        } 
        const index = this.items.findIndex(item => item.event === event);
        if (index === undefined || index < 0) return;
        this.items.splice(index, 1);
    }

    private show() {
        this.container.style.visibility = null;
        if (L.Browser.mobile) {
            this.metroMap.getMap().dragging.disable();
        }
    }
    
    private hide() {
        this.container.style.visibility = 'hidden';
        if (L.Browser.mobile) {
            this.metroMap.getMap().dragging.enable();
        }
    }
}