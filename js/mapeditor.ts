import MetroMap from './metro-map';
import * as util from '../util';
import * as svg from './svg';

export default class MapEditor {
    private metroMap: MetroMap;
    constructor(metroMap: MetroMap) {
        this.metroMap = metroMap;
        document.getElementById('edit-map-button').addEventListener('click', this.editMapClick.bind(this));
    }
    private editMapClick(event: MouseEvent) {
        // change station name (change -> model (platform))
        // drag station to new location (drag -> model (platform, spans) -> paths, )
        // create new station (create -> model)
        // drag line over the station to bind them
        const map = this.metroMap.getMap();
        const plate = this.metroMap.getPlate();
        const graph = this.metroMap.getGraph();
        const button: HTMLButtonElement = event.target as any;
        const textState = ['Edit Map', 'Save Map'];
        const dummyCircles = document.getElementById('dummy-circles');
        if (button.textContent === textState[0]) {
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
            button.textContent = textState[1];
        } else if (button.textContent === textState[1]) {
            const content = JSON.stringify(graph, (key, val) => key.startsWith('_') ? undefined : val);
            util.downloadAsFile('graph.json', content);
            dummyCircles.onmousedown = dummyCircles.onclick = null;
            button.textContent = textState[0];
        } else {
            throw new Error('Incorrect button text');
        }
        
    }
}