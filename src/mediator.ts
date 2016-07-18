/// <reference path="../typings/tsd.d.ts" />

export default class Mediator {
    private eventListeners = new Map<string, EventListener[]>();
    
    constructor() {}

    addListener(type: string, listener: EventListener) {
        for (let t of type.split(/\s+/)) {
            const listenerArr = this.eventListeners.get(t);
            if (listenerArr === undefined) {
                this.eventListeners.set(t, [listener]);
            } else {
                listenerArr.push(listener);
            }    
        }
    }

    removeListener(type: string, listener: EventListener) {
        const listenerArr = this.eventListeners.get(type);
        if (listenerArr === undefined) return;
        const pos = listenerArr.indexOf(listener);
        if (pos < 0) return;
        listenerArr.splice(pos, 1);
    }

    receiveEvent(event: Event): boolean {
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