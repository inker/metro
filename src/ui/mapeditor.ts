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
            }
            if (e.button === 0) {
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

    }

    // private foo() {
    //     console.log('adding');
    //     // change station name (change -> model (platform))
    //     // drag station to new location (drag -> model (platform, spans) -> paths, )
    //     // create new station (create -> model)
    //     // drag line over the station to bind them
    //     const map = this.metroMap.getMap();
    //     const dummyCircles = document.getElementById('dummy-circles');

    //     let moving = false;
    //     const mouseMoveHandler = (le: L.LeafletMouseEvent) => {
    //         if (!moving) return;
    //         const moveStartEvent = new MouseEvent('platformmovestart', {relatedTarget: le.target});
    //         if (moving === false) {
    //             moving = true;

    //             this.metroMap.receiveEvent(moveStartEvent);
    //         }
    //         const { clientX, clientY } = le.originalEvent;
    //         const moveEvent = new MouseEvent('platformmove', { relatedTarget: le.target, clientX, clientY });
    //         this.metroMap.receiveEvent(moveEvent);
    //     };
    //     map.on('mousemove', mouseMoveHandler)
    //         .once('mouseup', (le: L.LeafletMouseEvent) => {
    //             map.off('mousemove', mouseMoveHandler).dragging.enable();
    //             //const circle = le.originalEvent.target as SVGCircleElement;
    //             moving = false;
    //             const moveEndEvent = new MouseEvent('platformmoveend', {relatedTarget: circle as EventTarget});
    //             this.metroMap.receiveEvent(moveEndEvent);
    //         });


    //     let fromCircle: SVGCircleElement;

    //     this.metroMap.addListener('spanstart', (e: MouseEvent) => {
    //         fromCircle = e.relatedTarget as SVGCircleElement;
    //         console.log(fromCircle);
    //     });

    //     dummyCircles.onmousedown = de => {
    //         const circle = de.target as SVGCircleElement;
    //         if (de.button === 0) {
    //             if (fromCircle !== undefined) {
    //                 moving = false;
    //                 const detail = {
    //                     source: fromCircle,
    //                     target: circle
    //                 };
    //                 console.log(detail);
    //                 this.metroMap.receiveEvent(new CustomEvent('spanend', { detail }));
    //                 fromCircle = undefined;
    //                 return;
    //             }
    //             //const platform = util.platformByCircle(de.target as any, network);
    //             //const initialLocation = platform.location; // TODO: Ctrl+Z
    //             map.dragging.disable();


    //         } else if (de.button === 2) {

    //         }
    //     };

    //     dummyCircles.onmouseup = de => {
    //         moving = false;
    //     };

    //     document.getElementById('paths-outer').addEventListener('mousedown', e => {
    //         if (e.button !== 0) return;
    //         const span = e.target as SVGPathElement;

    //     });
    // }
}