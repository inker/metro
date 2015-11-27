import * as L from 'leaflet';
import MetroMap from './metro-map';
import * as util from './util';

let lang = util.getUserLanguage();
if (lang !== 'ru' && lang !== 'fi') lang = 'en';

const options = {
    'fromclick': { icon: 'add location', ru: 'Otśuda', fi: 'Tältä', en: 'From here' },
    'toclick': { icon: 'directions', ru: 'Śuda', fi: 'Tänne', en: 'To here' },
    'clearroute': { icon: 'layers clear', ru: 'Očistiť maršrut', fi: 'Tyhjennä reitti', en: 'Clear route' },
    'showheatmap': { icon: 'blur on', disabled: true, ru: 'Pokazať teplokartu', fi: 'Näytä lämpökartta', en: 'Show heatmap' }
};


export default class ContextMenu {
    private metroMap: MetroMap;
    get state() {
        return document.getElementById('contextmenu') !== null;
    }
    set state(state: boolean) {
        if (state) return;
        const menuElement = document.getElementById('contextmenu');
        if (menuElement === null) return;
        document.body.removeChild(menuElement);
    }
    constructor(metroMap: MetroMap) {
        console.log('adding context menu');
        this.metroMap = metroMap;
        metroMap.getOverlay().addEventListener('contextmenu', event => {
            event.preventDefault();
            let table: HTMLTableElement;
            if (this.state) {
                table = document.getElementById('contextmenu') as any;
            } else {
                table = document.createElement('table');
                Object.keys(options).forEach((key, i) => {
                    let row: HTMLTableRowElement = table.insertRow(i) as any;
                    let cell = row.insertCell(0);
                    if (options[key].disabled) {
                        cell.setAttribute('disabled', "");
                    } else {
                        cell.setAttribute('data-event', key);
                        
                    }
                    const option = options[key];
                    cell.innerHTML = `${option[lang]}`;
                });

                table.id = 'contextmenu';
                table.style.position = 'absolute';
                document.body.appendChild(table);
                this.state = true;
            }
            // defined here so that the marker gets set here (TODO: fix later)
            table.onclick = e => {
                const cell: HTMLTableCellElement = e.target as any;
                const dict = {
                    clientX: event.clientX,
                    clientY: event.clientY
                };
                const eventType = cell.getAttribute('data-event');
                if (eventType) {
                    metroMap.dispatchEvent(new MouseEvent(eventType, dict));
                    this.state = false;
                }
            };
            
            const { width, height } = table.getBoundingClientRect();
            const { clientWidth, clientHeight } = document.documentElement;
            const { clientX, clientY } = event;
            table.style.top = `${clientY + height > clientHeight ? clientY - height : clientY}px`;
            table.style.left = `${clientX + width > clientWidth ? clientWidth - width : clientX}px`;
            return false;
        });
        metroMap.getOverlay().addEventListener('click', evt => {
            if (evt.button !== 2) {
                this.state = false;
            } 
        });
    }
    
}