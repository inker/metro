import { tryGet } from './util'

export interface Config {
    containerId: string,
    center?: number[],
    zoom: number,
    minZoom: number,
    maxZoom: number,
    detailedZoom: number,
    url: {
        [resource: string]: string,
    },
}

export const getJSON = (url: string) => fetch(url).then(data => data.json())

export const getContent = (url: string) => fetch(url).then(data => data.text())

export const getConfig = () => fetch('res/mapconfig.json').then(data => data.json()) as any as Promise<Config>

export function getStyleRulesAsText(): string {
    let text = ''
    for (const sheet of document.styleSheets as any as CSSStyleSheet[]) {
        console.log(sheet.cssText)
        const rules = sheet.cssRules
        // cross-origin style sheets don't have rules
        if (!rules) {
            console.log(sheet)
            continue
        }
        for (const rule of rules as any as CSSRule[]) {
            text += rule.cssText
        }
    }
    console.log('css text ready')
    return text
}

export async function getLineRules() {
    const link = document.getElementById('scheme') as HTMLLinkElement
    const styleSheet = await tryGet(() => link.sheet as CSSStyleSheet, sheet => sheet !== null)
    const lineRules = new Map<string, CSSStyleDeclaration>()
    for (const rule of (styleSheet.cssRules as any as CSSStyleRule[])) {
        if (!(rule instanceof CSSStyleRule)) {
            continue
        }
        const tokens = rule.selectorText.match(/^.(M\d+|L|E)$/)
        if (tokens && tokens[1]) {
            lineRules.set(tokens[1], rule.style)
        } else if (rule.selectorText === '#paths-outer > .L') {
            lineRules.set('light-rail-path', rule.style)
        }
    }
    console.log(lineRules)
    return lineRules
}
