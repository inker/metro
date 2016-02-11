// <reference path="../typings/tsd.d.ts" />
import * as L from 'leaflet';
import * as lang from './lang';

export const dictionaryPromise = fetch('json/dictionary.json')
    .then(data => data.json())
    .then(dict => lang.dictionary = dict)
    .catch(err => console.error(err));

export const lineRulesPromise = new Promise<CSSStyleSheet>(resolve => {
    const link = document.querySelector(`[href$="css/scheme.css"]`) as HTMLLinkElement;
    const sheet = link.sheet as CSSStyleSheet;
    if (sheet && sheet.cssRules) {
        resolve(sheet);
    } else {
        link.onload = e => resolve(sheet);
    }
}).then(styleSheet => {
    const lineRules = new Map<string, string>();
    for (let rule of (styleSheet.cssRules as any as CSSStyleRule[])) {
        if (!(rule instanceof CSSStyleRule)) continue;
        const tokens = rule.selectorText.match(/\.(M\d+|L|E)/);
        if (tokens && tokens[1]) {
            lineRules.set(tokens[1], rule.style.stroke);
        }
    }
    return lineRules;
}).catch(err => console.error(err));

export const RedIcon = L.icon({
    iconUrl: 'http://harrywood.co.uk/maps/examples/leaflet/marker-icon-red.png',
    //iconRetinaUrl: 'my-icon@2x.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'http://cdn.leafletjs.com/leaflet/v0.7.7/images/marker-shadow.png',
    shadowRetinaUrl: 'marker-shadow-@2x.png',
    shadowSize: [41, 41],
    shadowAnchor: [12, 41]
});