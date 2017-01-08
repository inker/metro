import MetroMap from '../../MetroMap'
import { tr } from '../../i18n'
import { Widget } from '../base/Widget'
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
            this.metroMap.publish(new Event('editmapstart'))
        } else {
            this.button.textContent = tr`Edit map`
            this.button.onclick = e => this.editMapClick()
            this.metroMap.publish(new Event('editmapend'))
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
        this.metroMap.publish(new Event('mapsave'))
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
        dummyCircles.addEventListener('mousedown', e => {
            if (e.button !== 2 && fromCircle) {
                const detail = {
                    source: fromCircle,
                    target: e.target as SVGCircleElement,
                }
                console.log(detail)
                this.metroMap.publish(new CustomEvent(type === 'span' ? 'spanend' : 'transferend', { detail }))
                fromCircle = null
                type = undefined
            } else if (e.button === 0) {
                map.dragging.disable()
                movingCircle = e.target as SVGCircleElement
                this.metroMap.publish(new MouseEvent('platformmovestart', { relatedTarget: e.target }))
            } else if (e.button === 1) {
                console.log('foo', e.target)
                this.metroMap.publish(new MouseEvent('spanstart', { relatedTarget: e.target }))
            }
        })
        map.on('mousemove', (e: LeafletMouseEvent) => {
            if (!movingCircle) {
                return
            }
            const { clientX, clientY } = e.originalEvent
            const dict = { relatedTarget: movingCircle as EventTarget, clientX, clientY }
            this.metroMap.publish(new MouseEvent('platformmove', dict))
        }).on('mouseup', (e: LeafletMouseEvent) => {
            if (!movingCircle) {
                return
            }
            map.dragging.enable()
            const dict = { relatedTarget: movingCircle as EventTarget }
            this.metroMap.publish(new MouseEvent('platformmoveend', dict))
            // check if fell on path -> insert into the path
            movingCircle = null
        })

        this.metroMap.subscribe('spanstart', (e: MouseEvent) => {
            type = 'span'
            fromCircle = e.relatedTarget as SVGCircleElement
        })

        this.metroMap.subscribe('transferstart', (e: MouseEvent) => {
            type = 'transfer'
            fromCircle = e.relatedTarget as SVGCircleElement
        })

        this.metroMap.subscribe('platformaddclick', (e: MouseEvent) => {
            const { clientX, clientY } = e
            this.metroMap.publish(new CustomEvent('platformadd', { detail: { clientX, clientY }}))
        })

        this.metroMap.subscribe('platformaddtolineclick', (e: MouseEvent) => {
            this.metroMap.publish(new CustomEvent('platformadd', { detail: e }))
        })

    }
}
