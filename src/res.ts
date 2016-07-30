/// <reference path="../typings/tsd.d.ts" />

import { tryGet } from './util/utilities';

export type Config = {
    containerId: string,
    // center: number[],
    zoom: number,
    minZoom: number,
    maxZoom: number,
    detailedZoom: number,
    url: { [resource: string]: string }
}

export const getJSON = (url: string) => fetch(url).then(data => data.json());

export const getContent = (url: string) => fetch(url).then(data => data.text());

export const getConfig = () => fetch('res/mapconfig.json').then(data => data.json()) as Promise<Config>;

export function getStyleRulesAsText(): string {
    const styles = document.styleSheets;
    let text = '';
    for (let i = 0, len = styles.length; i < len; ++i) {
        const sheet = styles[i] as CSSStyleSheet;
        console.log(sheet.cssText);
        const rules = sheet.cssRules;
        // cross-origin style sheets don't have rules
        if (!rules) {
            console.log(sheet);
            continue;
        }
        for (let i = 0; i < rules.length; ++i) {
            text += rules[i].cssText;
        }
    }
    console.log('css text ready');
    return text;
}

export const getLineRules = () => new Promise<CSSStyleSheet>(resolve => {
    const link = document.getElementById('scheme') as HTMLLinkElement;
    const sheet = link.sheet as CSSStyleSheet;
    return tryGet(() => link.sheet as CSSStyleSheet, sheet => sheet !== null).then(resolve);
    // if (sheet && sheet.cssRules) {
    //     console.log('resolving immediately');
    //     resolve(sheet);
    // } else {
    //     console.log('resolving delayed');
    //     ;
    // }
}).then(styleSheet => {
    const lineRules = new Map<string, CSSStyleDeclaration>();
    for (let rule of (styleSheet.cssRules as any as CSSStyleRule[])) {
        if (!(rule instanceof CSSStyleRule)) continue;
        const tokens = rule.selectorText.match(/^.(M\d+|L|E)$/);
        if (tokens && tokens[1]) {
            lineRules.set(tokens[1], rule.style);
        } else if (rule.selectorText === '#paths-outer > .L') {
            lineRules.set('light-rail-path', rule.style);
        }
    }
    console.log(lineRules);
    return lineRules;
});