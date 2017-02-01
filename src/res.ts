import { tryGet, generateId } from './util'

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

const id = generateId()

export const cachelessFetch = (url: string) => fetch(`${url}?${id}`)

export const getJSON = (url: string) => cachelessFetch(url).then(data => data.json()) as Promise<any>

export const getConfig = () => cachelessFetch('res/mapconfig.json').then(data => data.json()) as any as Promise<Config>

export async function getLineRules() {
    const link = document.getElementById('scheme') as HTMLLinkElement
    const styleSheet = await tryGet(() => link.sheet as CSSStyleSheet, sheet => sheet !== null)
    const lineRules = new Map<string, CSSStyleDeclaration>()
    for (const rule of (styleSheet.cssRules as any)) {
        if (!(rule instanceof CSSStyleRule)) {
            continue
        }
        for (const selector of rule.selectorText.split(',').map(t => t.trim())) {
            const tokens = selector.match(/^.(M\d+|L|E)$/)
            if (tokens && tokens[1]) {
                lineRules.set(tokens[1], rule.style)
            } else if (selector === '#paths-outer > .L') {
                lineRules.set('light-rail-path', rule.style)
            }
        }
    }
    console.log(lineRules)
    return lineRules
}
