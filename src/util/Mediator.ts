import MetroMapEventMap from './MetroMapEventMap'

type MetroMapEventListener<K extends keyof MetroMapEventMap> = (e: MetroMapEventMap[K]) => void

export default class {
    private eventListeners = new Map<keyof MetroMapEventMap, MetroMapEventListener<keyof MetroMapEventMap>[]>()

    subscribe<K extends keyof MetroMapEventMap>(type: K, listener: MetroMapEventListener<K>) {
        // console.log('adding event listener ' + t);
        const listenerArr = this.eventListeners.get(type)
        if (listenerArr === undefined) {
            this.eventListeners.set(type, [listener as any])
        } else {
            listenerArr.push(listener as any)
        }
    }

    unsubscribe<K extends keyof MetroMapEventMap>(type: K, listener: MetroMapEventListener<K>) {
        const listenerArr = this.eventListeners.get(type)
        if (listenerArr === undefined) {
            return
        }
        const pos = listenerArr.indexOf(listener as any)
        if (pos < 0) {
            return
        }
        listenerArr.splice(pos, 1)
    }

    publish = <K extends keyof MetroMapEventMap, Ev extends MetroMapEventMap[K]>(event: Ev): boolean => {
        console.log('event as seen from the dispatcher', event)
        const { type } = event as any
        const listenerArr = this.eventListeners.get(type)
        if (listenerArr === undefined || listenerArr.length === 0) {
            console.log('no event listeners registered for', type)
            return false
        }
        for (const handler of listenerArr) {
            handler(event as any)
        }
        return true
    }
}
