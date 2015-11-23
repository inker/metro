import MetroMap from './metro-map';
import * as util from './util';

let lang = util.getUserLanguage();
if (lang !== 'ru' && lang !== 'fi') lang = 'en';

const options = {
    'fromclick': { ru: 'Otśuda', fi: 'Tältä', en: 'From here' },
    'toclick': { ru: 'Śuda', fi: 'Tänne', en: 'To here' },
    'clearroute': { ru: 'Očistiť maršrut', fi: 'Tyhjennä reitti', en: 'Clear route' }
};


export default class ContextMenu {
    private metroMap: MetroMap;
    get state() {
        return document.getElementById('contextmenu') !== null;
    }
    set state(state: boolean) {
        if (state) return;
        document.body.removeChild(document.getElementById('contextmenu'));
    }
    constructor(metroMap: MetroMap) {
        this.metroMap = metroMap;
        metroMap.getOverlay().addEventListener('contextmenu', event => {
            event.preventDefault();
            const pos = new L.Point(event.clientX, event.clientY);
            let table: HTMLTableElement;
            if (this.state) {
                table = document.getElementById('contextmenu') as any;
            } else {
                table = document.createElement('table');
                Object.keys(options).forEach((key, i) => {
                    let row: HTMLTableRowElement = table.insertRow(i) as any;
                    let cell = row.insertCell(0);
                    cell.setAttribute('data-event', key);
                    cell.textContent = options[key][lang];
                });
                table.onclick = e => {
                    const cell: HTMLTableCellElement = e.target as any;
                    const dict = {
                        clientX: event.clientX,
                        clientY: event.clientY
                    };
                    metroMap.dispatchEvent(new MouseEvent(cell.getAttribute('data-event'), dict));
                    this.state = false;
                }
                
                table.id = 'contextmenu';
                table.style.position = 'absolute';
                document.body.appendChild(table);
                this.state = true;
            }
            table.style.left = pos.x + 'px';
            table.style.top = pos.y + 'px';
            return false;
        });
        metroMap.getOverlay().addEventListener('click', evt => {
            if (evt.button !== 2) {
                this.state = false;
            } 
        });
    }
    
}