import { Map as LeafletMap, Browser } from 'leaflet'
import { remove } from 'lodash'

import MetroMapEventMap from '../../util/MetroMapEventMap'
import { removeAllChildren } from '../../util/dom'

import styles from './styles.pcss'

type MetroMapEvent = keyof MetroMapEventMap

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

export default class ContextMenu {
    private map: LeafletMap
    private readonly items: ContextMenuItem<MetroMapEvent>[]
    private readonly container: HTMLDivElement

    constructor(items: ContextMenuItem<MetroMapEvent>[]) {
        this.items = items
        // this._extraItems = new Map();

        this.container = document.createElement('div')
        this.container.classList.add(styles.contextmenu)
        this.container.addEventListener('contextmenu', e => {
            e.preventDefault();
            (e.target as HTMLElement).click()
        })
    }

    addTo(map: LeafletMap) {
        this.onAdd(map)
        return this
    }

    onAdd(map: LeafletMap) {
        this.map = map
        if (map === undefined) {
            throw new Error('cannot add map editor to metro map: leaflet map is missing')
        }
        const mapContainer = map.getContainer()
        mapContainer.addEventListener('contextmenu', this.handler)
        // objectsPane.addEventListener('contextmenu', listener, true); // 'true' prevents propagation
        mapContainer.addEventListener('mousedown', this.hide)
        mapContainer.addEventListener('touchstart', this.hide)
        if (!Browser.mobile) {
            map.on('movestart', this.hide)
        }
        document.body.appendChild(this.container)
    }

    onRemove(map: LeafletMap) {
        // TODO
    }

    private handler = (event: MouseEvent) => {
        const { target } = event
        console.log('target', target, (target as Node).parentNode)
        const { className } = target as Element
        if (typeof className === 'string' && className.includes('leaflet-control')) {
            return
        }
        event.preventDefault()
        removeAllChildren(this.container)
        for (const item of this.items) {
            if (item.trigger && !item.trigger(target!)) {
                console.log(item.trigger(target!))
                continue
            }
            const cell = document.createElement('div')
            if (item.extra && item.extra.disabled) {
                cell.setAttribute('disabled', '')
            } else {
                cell.setAttribute('data-event', item.event)
            }
            cell.textContent = item.text
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
        event: MetroMapEvent,
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

    removeItem(event: MetroMapEvent, all = false) {
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

    private show = () => {
        this.container.style.visibility = null
        if (Browser.mobile) {
            this.map.dragging.disable()
        }
    }

    private hide = () => {
        this.container.style.visibility = 'hidden'
        if (Browser.mobile) {
            this.map.dragging.enable()
        }
    }
}
