// <reference path="../typings/tsd.d.ts" />

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
    const rules = styleSheet.cssRules,
        lineRules = {};
    for (let i = 0; i < rules.length; ++i) {
        const rule = rules[i];
        if (rule instanceof CSSStyleRule) {
            const matches = rule.selectorText.match(/\.(M\d+|L)/);
            if (matches && matches[1]) {
                lineRules[matches[1]] = rule.style.stroke;
            } else if (rule.selectorText === '#paths-outer .E') {
                lineRules['E'] = rule.style.stroke;
            }
        }
    }
    return lineRules;
}).catch(err => console.error(err));