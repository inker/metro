import MetroMap from './metro-map';
import * as util from './util';
import * as svg from './svg';

export default class MapEditor {
    private metroMap: MetroMap;
    private editMode = false;
    private button: HTMLButtonElement;
    constructor(metroMap: MetroMap) {
        this.metroMap = metroMap;
        this.button = document.createElement('button');
        this.button.id = 'edit-map-button';
        this.button.textContent = 'Edit Map';
        this.button.classList.add('leaflet-control');
        this.button.onclick = this.editMapClick.bind(this);
        document.querySelector('.leaflet-right.leaflet-top').appendChild(this.button);
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
        this.button.textContent = 'Save Map';
        this.button.onclick = this.saveMapClick.bind(this);
        this.editMode = true;
    }
    
    private saveMapClick(event: MouseEvent) {
        const graph = this.metroMap.getGraph();
        const content = JSON.stringify(graph, (key, val) => key.startsWith('_') ? undefined : val);
        util.downloadAsFile('graph.json', content);
        const dummyCircles = document.getElementById('dummy-circles');
        dummyCircles.onmousedown = dummyCircles.onclick = null;
        this.button.textContent = 'Edit Map';
        this.button.onclick = this.editMapClick.bind(this);
        this.editMode = false;
    }
    
    private addMapListeners() {
        // change station name (change -> model (platform))
        // drag station to new location (drag -> model (platform, spans) -> paths, )
        // create new station (create -> model)
        // drag line over the station to bind them
        const map = this.metroMap.getMap();
        const plate = this.metroMap.getPlate();
        const graph = this.metroMap.getGraph();
        const dummyCircles = document.getElementById('dummy-circles');

        dummyCircles.onmousedown = de => {
            if (de.button === 0) {
                const platform = svg.platformByCircle(de.target as any, graph);
                //const initialLocation = platform.location; // TODO: Ctrl+Z
                map.dragging.disable();
                map.on('mousemove', le => {
                    platform.location = (le as L.LeafletMouseEvent).latlng;
                    plate.disabled = true;
                });
                map.once('mouseup', le => {
                    map.off('mousemove').dragging.enable();
                    plate.disabled = false;
                    plate.show(svg.circleByDummy((le as L.LeafletMouseEvent).originalEvent.target as any));
                });
            } else if (de.button === 1) {
                const platform = svg.platformByCircle(de.target as any, graph);
                const ru = platform.name,
                    fi = platform.altNames['fi'],
                    en = platform.altNames['en'];
                plate.show(svg.circleByDummy(de.target as any));
                const names = en ? [ru, fi, en] : fi ? [ru, fi] : [ru];
                [platform.name, platform.altNames['fi'], platform.altNames['en']] = prompt('New name', names.join('|')).split('|');
            } else {
                // open context menu maybe?
            }
        };
    }
}