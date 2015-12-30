// <reference path="../typings/tsd.d.ts" />

export const dictionaryPromise = fetch('json/dictionary.json')
    .then(data => data.json());

export const lineRulesPromise = new Promise<CSSStyleSheet>(resolve => {
    const link: HTMLLinkElement = document.querySelector(`[href$="css/scheme.css"]`) as any;
    if (link.sheet && (link.sheet as CSSStyleSheet).cssRules) {
        console.log('already loaded');
        resolve(link.sheet as CSSStyleSheet);
    } else {
        console.log('waiting to load');
        link.onload = e => resolve(link.sheet as CSSStyleSheet);
    }
}).then(styleSheet => {
    const rules = styleSheet.cssRules,
        lineRules = {};
    for (let i = 0; i < rules.length; ++i) {
        const rule = rules[i];
        if (rule instanceof CSSStyleRule) {
            const selector = rule.selectorText;
            if (selector === '#paths-outer .E') {
                lineRules['E'] = rule.style.stroke;
            } else {
                const matches = selector.match(/\.(M\d+|L)/);
                if (matches) {
                    lineRules[matches[1]] = rule.style.stroke;
                }
            }
        }
    }
    return lineRules;
});