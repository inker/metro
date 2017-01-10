export default class {
    private eventListeners = new Map<string, EventListener[]>()

    constructor() {}

    subscribe(type: string, listener: EventListener) {
        for (const t of type.split(/\s+/)) {
            // console.log('adding event listener ' + t);
            const listenerArr = this.eventListeners.get(t)
            if (listenerArr === undefined) {
                this.eventListeners.set(t, [listener])
            } else {
                listenerArr.push(listener)
            }
        }
    }

    unsubscribe(type: string, listener: EventListener) {
        const listenerArr = this.eventListeners.get(type)
        if (listenerArr === undefined) {
            return
        }
        const pos = listenerArr.indexOf(listener)
        if (pos < 0) {
            return
        }
        listenerArr.splice(pos, 1)
    }

    publish(event: Event): boolean {
        console.log('event as seen from the dispatcher', event)
        const listenerArr = this.eventListeners.get(event.type)
        if (listenerArr === undefined || listenerArr.length === 0) {
            console.log('no event listeners registered for ' + event.type)
            return false
        }
        for (const handler of listenerArr) {
            handler(event)
        }
        return true
    }
}
