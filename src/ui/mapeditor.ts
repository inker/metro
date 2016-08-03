/// <reference path="../../typings/tsd.d.ts" />
import MetroMap from '../metromap';
import { tr } from '../i18n';
import { Widget } from './base/widget';

export default class MapEditor implements Widget {
    private metroMap: MetroMap;
    private button: HTMLButtonElement;
    private _editMode: boolean;

    get editMode() { return this._editMode; }

    set editMode(val: boolean) {
        if (val) {
            this.button.textContent = tr`Save map`;
            this.button.onclick = e => this.saveMapClick();
            const dummyCircles = document.getElementById('dummy-circles');
            dummyCircles.onmousedown = dummyCircles.onclick = null;
            this.metroMap.publish(new Event("editmapstart"));
        } else {
            this.button.textContent = tr`Edit map`;
            this.button.onclick = e => this.editMapClick();
            this.metroMap.publish(new Event("editmapend"));
        }
        this._editMode = val;
    }

    constructor(minZoom: number) {
        const btn = document.createElement('button');
        btn.id = 'edit-map-button';
        btn.textContent = 'Edit Map';
        btn.classList.add('leaflet-control');
        btn.onclick = e => this.editMapClick();
        this.button = btn;
    }

    addTo(metroMap: MetroMap): this {
        const map = metroMap.getMap();
        if (map === undefined) {
            throw new Error('cannot add map editor to metro map: map is missing');
        }
        this.metroMap = metroMap;
        document.querySelector('.leaflet-right.leaflet-top').appendChild(this.button);
        this.editMode = false;
        // map.on('zoomend', e => {
        //     if (this.editMode) {
        //         this.addMapListeners();
        //     }
        // });
        return this;
    }

    private editMapClick() {
        this.editMode = true;
        this.addMapListeners();
    }

    private saveMapClick() {
        this.metroMap.publish(new Event('mapsave'));
        this.editMode = false;
    }

    private addMapListeners() {
        console.log('adding edit map listeners');
        const map = this.metroMap.getMap();
        const dummyCircles = document.getElementById('dummy-circles');
        const pathsOuter = document.getElementById('paths-outer');
        const pathsInner = document.getElementById('paths-inner');

        let movingCircle: SVGCircleElement;
        let type: string;
        let fromCircle: SVGCircleElement;
        dummyCircles.addEventListener('mousedown', e => {
            if (e.button !== 2 && fromCircle !== undefined) {
                const detail = {
                    source: fromCircle,
                    target: e.target as SVGCircleElement
                };
                console.log(detail);
                this.metroMap.publish(new CustomEvent(type === 'span' ? 'spanend' : 'transferend', { detail }));
                fromCircle = undefined;
                type = undefined;
            } else if (e.button === 0) {
                map.dragging.disable();
                movingCircle = e.target as SVGCircleElement;
                this.metroMap.publish(new MouseEvent('platformmovestart', { relatedTarget: e.target }));
            } else if (e.button === 1) {
                console.log('foo', e.target);
                this.metroMap.publish(new MouseEvent('spanstart', { relatedTarget: e.target }));
            }
        });
        map.on('mousemove', (e: L.LeafletMouseEvent) => {
            if (movingCircle === undefined) return;
            const { clientX, clientY } = e.originalEvent;
            const dict = { relatedTarget: movingCircle as EventTarget, clientX, clientY };
            this.metroMap.publish(new MouseEvent('platformmove', dict));
        }).on('mouseup', (e: L.LeafletMouseEvent) => {
            if (movingCircle === undefined) return;
            map.dragging.enable();
            const dict = { relatedTarget: movingCircle as EventTarget };
            this.metroMap.publish(new MouseEvent('platformmoveend', dict));
            // check if fell on path -> insert into the path
            movingCircle = undefined;
        });

        this.metroMap.subscribe('spanstart', (e: MouseEvent) => {
            type = 'span';
            fromCircle = e.relatedTarget as SVGCircleElement;
        });

        this.metroMap.subscribe('transferstart', (e: MouseEvent) => {
            type = 'transfer';
            fromCircle = e.relatedTarget as SVGCircleElement;
        });

        this.metroMap.subscribe('platformaddclick', (e: MouseEvent) => {
            const { clientX, clientY } = e;
            this.metroMap.publish(new CustomEvent('platformadd', { detail: { clientX, clientY }}));
        });

        this.metroMap.subscribe('platformaddtolineclick', (e: MouseEvent) => {
            this.metroMap.publish(new CustomEvent('platformadd', { detail: e }));
        });

    }
}