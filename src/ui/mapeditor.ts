/// <reference path="../../typings/tsd.d.ts" />
import MetroMap from '../metro-map';
import * as svg from '../svg';
import { translate as tr } from '../i18n';
import * as util from '../util';

export default class MapEditor {
    private metroMap: MetroMap;

    private minZoom: number;

    private button: HTMLButtonElement;

    private _editMode: boolean;

    get editMode() {
        return this._editMode;
    }

    set editMode(val: boolean) {
        if (val) {
            this.button.textContent = tr('Save map');;
            this.button.onclick = e => this.saveMapClick();
            const dummyCircles = document.getElementById('dummy-circles');
            dummyCircles.onmousedown = dummyCircles.onclick = null;
            this.metroMap.contextMenu.items.delete('platformadd');
        } else {
            this.button.textContent = tr('Edit map');
            this.button.onclick = e => this.editMapClick();
        }
        this._editMode = val;
    }

    constructor(metroMap: MetroMap, minZoom: number) {
        this.metroMap = metroMap;
        this.minZoom = minZoom;
        const btn = document.createElement('button');
        btn.id = 'edit-map-button';
        btn.textContent = 'Edit Map';
        btn.classList.add('leaflet-control');
        btn.onclick = this.editMapClick.bind(this);
        document.querySelector('.leaflet-right.leaflet-top').appendChild(btn);
        this.button = btn;
        this.editMode = false;
        this.metroMap.getMap().on('zoomend', e => {
            if (this.editMode) {
                this.addMapListeners();
            }
        });
    }
    private editMapClick() {
        this.editMode = true;
        const map = this.metroMap.getMap();
        if (map.getZoom() < this.minZoom) {
            map.setZoom(this.minZoom);
        }
        this.addMapListeners();
    }

    private saveMapClick() {
        util.downloadTextFile('graph.json', this.metroMap.getNetwork().toJSON());
        this.editMode = false;
    }

    private addMapListeners() {
        console.log('adding');
        // change station name (change -> model (platform))
        // drag station to new location (drag -> model (platform, spans) -> paths, )
        // create new station (create -> model)
        // drag line over the station to bind them
        const map = this.metroMap.getMap();
        const plate = this.metroMap.getPlate();
        const network = this.metroMap.getNetwork();
        const dummyCircles = document.getElementById('dummy-circles');

        const menu = this.metroMap.contextMenu;
        menu.items.set('platformadd', { text: 'New station' });

        dummyCircles.onmousedown = de => {
            if (de.button === 0) {
                const platform = util.platformByCircle(de.target as any, network);
                //const initialLocation = platform.location; // TODO: Ctrl+Z
                map.dragging.disable();
                map.on('mousemove', (le: L.LeafletMouseEvent) => {
                    platform.location = le.latlng;
                    plate.disabled = true;
                });
                map.once('mouseup', (le: L.LeafletMouseEvent) => {
                    map.off('mousemove').dragging.enable();
                    plate.disabled = false;
                    const circle = le.originalEvent.target as SVGCircleElement;
                    plate.show(svg.circleOffset(circle), util.getPlatformNames(platform));
                });
            } else if (de.button === 1) {
                //
            }
            
            dummyCircles.oncontextmenu = de => {
                 console.log('circle right-clicked');
                const el = de.target as HTMLElement;
                if (el.hasAttribute('cy')) {
                    // come up with a better solution
                    const item = new Map()
                        .set('platformrename', { text: "Rename station" })
                        .set('platformdelete', { text: "Delete station" });
                    menu.extraItems.set(el, item);
                }               
            }
        };
    }
}