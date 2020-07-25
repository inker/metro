import MetroMapEventMap from './MetroMapEventMap'

type EventName = keyof MetroMapEventMap
type MetroMapEventListener = (e: MetroMapEventMap[EventName]) => void

export default class {
    private eventListeners = new Map<EventName, MetroMapEventListener[]>()

    subscribe(type: EventName, listener: MetroMapEventListener) {
      // console.log('adding event listener ' + t);
      const listenerArr = this.eventListeners.get(type)
      if (listenerArr === undefined) {
        this.eventListeners.set(type, [listener])
      } else {
        listenerArr.push(listener)
      }
    }

    unsubscribe(type: EventName, listener: MetroMapEventListener) {
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

    publish = (event: MetroMapEventMap[EventName]): boolean => {
      console.log('event as seen from the dispatcher', event)
      const { type } = event
      const listenerArr = this.eventListeners.get(type as EventName)
      if (listenerArr === undefined || listenerArr.length === 0) {
        console.log('no event listeners registered for', type)
        return false
      }
      for (const handler of listenerArr) {
        handler(event)
      }
      return true
    }
}
