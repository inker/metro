import { tryCall } from 'tryfunc'

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
    [option: string]: any,
}

const now = Date.now()

export const cachelessFetch = (url: string) =>
    fetch(`${url}?${now}`)

export const getJSON = (url: string) =>
    cachelessFetch(url).then(data => data.json()) as Promise<any>

export async function getLineRules() {
    const lineRules = new Map<string, CSSStyleDeclaration>()
    const link = document.getElementById('scheme') as HTMLLinkElement

    const cssRules = await tryCall(() => (link.sheet as CSSStyleSheet).cssRules, {
        interval: 100,
        numAttempts: 100,
    })
    for (const rule of (cssRules as any)) {
        if (!(rule instanceof CSSStyleRule)) {
            continue
        }
        const selectors = rule.selectorText.split(',').map(t => t.trim())
        for (const selector of selectors) {
            const tokens = selector.match(/^.(M\d+|L|E)$/)
            if (tokens && tokens[1]) {
                lineRules.set(tokens[1], rule.style)
            }
        }
    }

    console.log(lineRules)
    return lineRules
}
