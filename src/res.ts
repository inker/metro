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