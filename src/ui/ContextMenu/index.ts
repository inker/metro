import * as L from 'leaflet'
import { remove } from 'lodash'

import { MetroMapEventMap, dom } from '../../util'
import { translate } from '../../i18n'

import * as styles from './styles.css'

type EventName = keyof MetroMapEventMap

// TODO: merge items & extra items, introduce item index
interface Extra {
    icon?: string,
    disabled?: boolean,
}
interface ContextMenuItem<EventName> {
    text: string,
    event: EventName,
    trigger?: (target: EventTarget) => boolean,
    extra?: Extra,
}

export default class implements L.ILayer {
    private map: L.Map
    private readonly items: ContextMenuItem<EventName>[]
    private readonly container: HTMLDivElement

    constructor(items: ContextMenuItem<EventName>[]) {
        this.items = items
        // this._extraItems = new Map();

        this.container = document.createElement('div')
        this.container.classList.add(styles.contextmenu)
        this.container.addEventListener('contextmenu', e => {
            e.preventDefault();
            (e.target as HTMLElement).click()
        })
    }

    addTo(map: L.Map) {
        this.onAdd(map)
        return this
    }

    onAdd(map: L.Map) {
        this.map = map
        if (map === undefined) {
            throw new Error('cannot add map editor to metro map: leaflet map is missing')
        }
        const { mapPane } = map.getPanes()
        const mapContainer = map.getContainer()
        const listener = e => this.handler(e)
        const cancelListener = e => this.hide()
        mapPane.addEventListener('contextmenu', listener, false)
        // objectsPane.addEventListener('contextmenu', listener, true); // 'true' prevents propagation
        mapContainer.addEventListener('mousedown', cancelListener)
        mapContainer.addEventListener('touchstart', cancelListener)
        if (!L.Browser.mobile) {
            map.on('movestart', cancelListener)
        }
        document.body.appendChild(this.container)
    }

    onRemove(map: L.Map) {
        // TODO
    }

    private handler(event: MouseEvent) {
        event.preventDefault()
        const { target } = event as any as { target: Node }
        console.log('target', target, target.parentNode)
        dom.removeAllChildren(this.container)
        for (const item of this.items) {
            if (item.trigger && !item.trigger(target)) {
                console.log(item.trigger(target))
                continue
            }
            const cell = document.createElement('div')
            if (item.extra && item.extra.disabled) {
                cell.setAttribute('disabled', '')
            } else {
                cell.setAttribute('data-event', item.event)
            }
            cell.textContent = translate(item.text)
            this.container.appendChild(cell)
        }

        // defined here so that the marker gets set here (TODO: fix later)
        this.container.onclick = e => {
            const cell = e.target as HTMLDivElement
            const eventType = cell.getAttribute('data-event')
            if (eventType) {
                this.hide()
                this.map.fireEvent(eventType, { clientX, clientY, relatedTarget: event.target })
            }
        }
        const { width, height } = this.container.getBoundingClientRect()
        const { clientWidth, clientHeight } = document.documentElement
        const { clientX, clientY } = event
        const tx = clientX + width > clientWidth ? clientWidth - width : clientX
        const ty = clientY + height > clientHeight ? clientY - height : clientY
        this.container.style.transform = `translate(${tx}px, ${ty}px)`
        this.show()
    }

    insertItem(
        event: EventName,
        text: string,
        trigger?: (target: EventTarget) => boolean,
        extra?: Extra,
        index?: number,
    ) {
        const item = { event, text, trigger, extra }
        if (index === undefined || index < 0) {
            this.items.push(item)
        } else {
            this.items.splice(index, 0, item)
        }
    }

    removeItem(event: EventName, all = false) {
        if (all) {
            remove(this.items, item => item.event === event)
            return
        }
        const index = this.items.findIndex(item => item.event === event)
        if (index < 0) {
            return
        }
        this.items.splice(index, 1)
    }

    private show() {
        this.container.style.visibility = null
        if (L.Browser.mobile) {
            this.map.dragging.disable()
        }
    }

    private hide() {
        this.container.style.visibility = 'hidden'
        if (L.Browser.mobile) {
            this.map.dragging.enable()
        }
    }
}
