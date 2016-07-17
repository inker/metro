/// <reference path="../typings/tsd.d.ts" />

export default class EventHandler implements EventTarget {
    private eventListeners = new Map<string, EventListener[]>();
    constructor() {}
    addEventListener(type: string, listener: EventListener) {
        for (let t of type.split(/\s+/)) {
            const listenerArr = this.eventListeners.get(t);
            if (listenerArr === undefined) {
                this.eventListeners.set(t, [listener]);
            } else {
                listenerArr.push(listener);
            }           
        }
    }

    removeEventListener(type: string, listener: EventListener) {
        const listenerArr = this.eventListeners.get(type);
        if (listenerArr === undefined) return;
        const pos = listenerArr.indexOf(listener);
        if (pos < 0) return;
        listenerArr.splice(pos, 1);
    }

    dispatchEvent(event: Event): boolean {
        console.log('event as seen from the dispatcher', event);
        for (let handler of this.eventListeners.get(event.type)) {
            handler(event);
        }
        return false;
    }

    protected addListenersFromObject(listenerObj: {[eventType: string]: EventListener}) {
        for (let key of Object.keys(listenerObj)) {
            this.eventListeners.set(key, [listenerObj[key]]);
        }        
    }
}