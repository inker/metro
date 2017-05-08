import { LeafletMouseEvent } from 'leaflet'
import * as localForage from 'localforage'
import { throttle } from 'lodash-es'

import MetroMap from '../../MetroMap'
import { tr } from '../../i18n'
import Widget from '../base/Widget'
import { byId } from '../../util/dom'

import * as styles from './styles.css'


export default class MapEditor implements Widget {
    private metroMap: MetroMap
    private readonly button: HTMLButtonElement
    private _editMode: boolean
    private mapEditorStore = localForage.createInstance({ name: 'mapEditor' })
    private backupData = throttle(this.mapEditorStore.setItem, 1000)

    get editMode() {
        return this._editMode
    }

    set editMode(val: boolean) {
        const {
            button,
            metroMap: {
                mediator,
            },
        } = this
        if (val) {
            const dummyCircles = byId('dummy-circles')
            button.textContent = tr`Save map`
            button.onclick = e => this.saveMapClick()
            dummyCircles.onmousedown = dummyCircles.onclick = () => false
            mediator.publish(new Event('editmapstart'))
        } else {
            button.textContent = tr`Edit map`
            button.onclick = e => this.editMapClick()
            mediator.publish(new Event('editmapend'))
        }
        this._editMode = val
    }

    constructor(minZoom: number) {
        const btn = document.createElement('button')
        btn.textContent = 'Edit Map'
        btn.classList.add('leaflet-control')
        btn.classList.add(styles['edit-map-button'])
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

    private sendEvent(e: Event) {
        this.backupData('map', this.metroMap.getNetwork().toJSON())
        this.metroMap.mediator.publish(e)
    }

    private editMapClick() {
        this.editMode = true
        this.addMapListeners()
    }

    private saveMapClick() {
        this.sendEvent(new Event('mapsave'))
        this.editMode = false
    }

    private addMapListeners() {
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
                this.sendEvent(new CustomEvent(type === 'span' ? 'spanend' : 'transferend', { detail }))
                fromCircle = null
                type = undefined
            } else if (e.button === 0) {
                map.dragging.disable()
                movingCircle = e.target as SVGCircleElement
                this.sendEvent(new MouseEvent('platformmovestart', { relatedTarget: e.target }))
            } else if (e.button === 1) {
                this.sendEvent(new MouseEvent('spanstart', { relatedTarget: e.target }))
            }
        })
        map.on('mousemove', (e: LeafletMouseEvent) => {
            if (!movingCircle) {
                return
            }
            const { clientX, clientY } = e.originalEvent
            this.sendEvent(new MouseEvent('platformmove', {
                relatedTarget: movingCircle,
                clientX,
                clientY,
            }))
        }).on('mouseup', (e: LeafletMouseEvent) => {
            if (!movingCircle) {
                return
            }
            map.dragging.enable()
            this.sendEvent(new MouseEvent('platformmoveend', { relatedTarget: movingCircle }))
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
            this.sendEvent(new CustomEvent('platformadd', { detail: { clientX, clientY }}))
        })

        this.metroMap.subscribe('platformaddtolineclick', e => {
            this.sendEvent(new CustomEvent('platformadd', { detail: e }))
        })

    }
}
