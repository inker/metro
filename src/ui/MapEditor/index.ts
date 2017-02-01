import MetroMap from '../../MetroMap'
import { tr } from '../../i18n'
import Widget from '../base/Widget'
import { byId } from '../../util'

import * as style from './style.css'

type LeafletMouseEvent = L.LeafletMouseEvent

export default class MapEditor implements Widget {
    private metroMap: MetroMap
    private readonly button: HTMLButtonElement
    private _editMode: boolean

    get editMode() {
        return this._editMode
    }

    set editMode(val: boolean) {
        if (val) {
            const dummyCircles = byId('dummy-circles')
            this.button.textContent = tr`Save map`
            this.button.onclick = e => this.saveMapClick()
            dummyCircles.onmousedown = dummyCircles.onclick = () => false
            this.metroMap.mediator.publish(new Event('editmapstart'))
        } else {
            this.button.textContent = tr`Edit map`
            this.button.onclick = e => this.editMapClick()
            this.metroMap.mediator.publish(new Event('editmapend'))
        }
        this._editMode = val
    }

    constructor(minZoom: number) {
        const btn = document.createElement('button')
        btn.textContent = 'Edit Map'
        btn.classList.add('leaflet-control')
        btn.classList.add(style['edit-map-button'])
        btn.onclick = e => this.editMapClick()
        this.button = btn
    }

    addTo(metroMap: MetroMap): this {
        const map = metroMap.getMap()
        if (map === undefined) {
            throw new Error('cannot add map editor to metro map: map is missing')
        }
        this.metroMap = metroMap
        const leafletTopRight = document.querySelector('.leaflet-right.leaflet-top')
        if (leafletTopRight) {
            leafletTopRight.appendChild(this.button)
            this.editMode = false
        } else {
            console.error('cannot append to .leaflet-right.leaflet-top')
        }
        // map.on('zoomend', e => {
        //     if (this.editMode) {
        //         this.addMapListeners();
        //     }
        // });
        return this
    }

    private editMapClick() {
        this.editMode = true
        this.addMapListeners()
    }

    private saveMapClick() {
        this.metroMap.mediator.publish(new Event('mapsave'))
        this.editMode = false
    }

    private addMapListeners() {
        console.log('adding edit map listeners')
        const map = this.metroMap.getMap()
        const dummyCircles = byId('dummy-circles')
        const pathsOuter = byId('paths-outer')
        const pathsInner = byId('paths-inner')

        let movingCircle: SVGCircleElement|null
        let type: string|undefined
        let fromCircle: SVGCircleElement|null
        const { mediator } = this.metroMap
        dummyCircles.addEventListener('mousedown', e => {
            if (e.button !== 2 && fromCircle) {
                const detail = {
                    source: fromCircle,
                    target: e.target as SVGCircleElement,
                }
                console.log(detail)
                mediator.publish(new CustomEvent(type === 'span' ? 'spanend' : 'transferend', { detail }))
                fromCircle = null
                type = undefined
            } else if (e.button === 0) {
                map.dragging.disable()
                movingCircle = e.target as SVGCircleElement
                mediator.publish(new MouseEvent('platformmovestart', { relatedTarget: e.target }))
            } else if (e.button === 1) {
                console.log('foo', e.target)
                mediator.publish(new MouseEvent('spanstart', { relatedTarget: e.target }))
            }
        })
        map.on('mousemove', (e: LeafletMouseEvent) => {
            if (!movingCircle) {
                return
            }
            const { clientX, clientY } = e.originalEvent
            const dict = { relatedTarget: movingCircle as EventTarget, clientX, clientY }
            mediator.publish(new MouseEvent('platformmove', dict))
        }).on('mouseup', (e: LeafletMouseEvent) => {
            if (!movingCircle) {
                return
            }
            map.dragging.enable()
            const dict = { relatedTarget: movingCircle as EventTarget }
            mediator.publish(new MouseEvent('platformmoveend', dict))
            // check if fell on path -> insert into the path
            movingCircle = null
        })

        this.metroMap.subscribe('spanstart', e => {
            type = 'span'
            fromCircle = e.relatedTarget as SVGCircleElement
        })

        this.metroMap.subscribe('transferstart', e => {
            type = 'transfer'
            fromCircle = e.relatedTarget as SVGCircleElement
        })

        this.metroMap.subscribe('platformaddclick', e => {
            const { clientX, clientY } = e
            mediator.publish(new CustomEvent('platformadd', { detail: { clientX, clientY }}))
        })

        this.metroMap.subscribe('platformaddtolineclick', e => {
            mediator.publish(new CustomEvent('platformadd', { detail: e }))
        })

    }
}
