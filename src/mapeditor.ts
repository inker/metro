import MetroMap from './metro-map';
import * as util from './util';
import * as svg from './svg';
import * as lang from './lang';

export default class MapEditor {
    private metroMap: MetroMap;

    private button: HTMLButtonElement;

    private _editMode: boolean;

    get editMode() {
        return this._editMode;
    }

    set editMode(val: boolean) {
        if (val) {
            this.button.textContent = lang.translate('Save map');;
            this.button.onclick = this.saveMapClick.bind(this);
            const dummyCircles = document.getElementById('dummy-circles');
            dummyCircles.onmousedown = dummyCircles.onclick = null;
            this.metroMap.contextMenu.items.delete('platformadd');
        } else {
            this.button.textContent = lang.translate('Edit map');
            this.button.onclick = this.editMapClick.bind(this);
        }
        this._editMode = val;
    }

    constructor(metroMap: MetroMap) {
        this.metroMap = metroMap;
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
    private editMapClick(event: MouseEvent) {
        this.editMode = true;
        const map = this.metroMap.getMap();
        if (map.getZoom() < 12) {
            map.setZoom(12);
        }
        this.addMapListeners();
    }

    private saveMapClick(event: MouseEvent) {
        const graph = this.metroMap.getGraph();
        const content = JSON.stringify(graph, (key, val) => key.startsWith('_') ? undefined : val);
        util.downloadAsFile('graph.json', content);
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
        const graph = this.metroMap.getGraph();
        const dummyCircles = document.getElementById('dummy-circles');

        const menu = this.metroMap.contextMenu;
        menu.items.set('platformadd', { text: 'New station' });

        dummyCircles.onmousedown = de => {
            if (de.button === 0) {
                const platform = svg.platformByCircle(de.target as any, graph);
                //const initialLocation = platform.location; // TODO: Ctrl+Z
                map.dragging.disable();
                map.on('mousemove', (le: L.LeafletMouseEvent) => {
                    platform.location = le.latlng;
                    plate.disabled = true;
                });
                map.once('mouseup', (le: L.LeafletMouseEvent) => {
                    map.off('mousemove').dragging.enable();
                    plate.disabled = false;
                    plate.show(svg.circleByDummy(le.originalEvent.target as any));
                });
            } else if (de.button === 1) {
                //
            } else {
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