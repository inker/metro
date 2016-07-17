/// <reference path="../typings/tsd.d.ts" />
import { Hints } from './hints';

export type Config = {
    containerId: string,
    center: number[],
    zoom: number,
    minZoom: number,
    maxZoom: number,
    detailedZoom: number
}

export const getDictionary = () => fetch('res/dictionary.json').then(data => data.json());

export const getConfig = () => fetch('res/mapconfig.json').then(data => data.json()) as Promise<Config>;

export const getGraph = () => fetch('res/graph.json').then(data => data.text());

export const getLineRules = () => new Promise<CSSStyleSheet>(resolve => {
    const link = document.querySelector(`[href$="css/scheme.css"]`) as HTMLLinkElement;
    const sheet = link.sheet as CSSStyleSheet;
    if (sheet && sheet.cssRules) {
        resolve(sheet);
    } else {
        link.onload = e => resolve(sheet);
    }
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

export const getHints = () => fetch('res/hints.json').then(data => data.json()) as Promise<Hints>;

export const getContextMenu = () => fetch('res/contextmenudata.json').then(data => data.json());