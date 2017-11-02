import { tryCall } from 'tryfunc'

export interface Config {
    containerId: string,
    center?: [number, number],
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
    cachelessFetch(url).then(data => data.json())

async function getColors() {
    const response = await cachelessFetch('res/colors.css')
    const text = await response.text()
    const re = /(--[\w-]+?):\s*?(\S.+?);/g
    const pairs: [string, string][] = []
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
        pairs.push([m[1], m[2]])
    }
    return new Map<string, string>(pairs)
}

function replaceStrokeColor(colors: Map<string, string>, rule: CSSStyleRule) {
    const { stroke } = rule.style
    if (!stroke) {
        return
    }
    const tokens = stroke.match(/^var\((.+?)\)$/)
    if (!tokens || !tokens[1]) {
        return
    }
    const color = colors.get(tokens[1])
    if (!color) {
        return
    }
    rule.style.stroke = color
}

export async function getLineRules() {
    const colorsPromise = getColors()
    const lineRules = new Map<string, CSSStyleDeclaration>()
    const link = document.getElementById('scheme') as HTMLLinkElement

    const cssRules = await tryCall(() => (link.sheet as CSSStyleSheet).cssRules, {
        interval: 100,
        numAttempts: 100,
    })
    const colors = await colorsPromise
    for (const rule of (cssRules as any)) {
        if (!(rule instanceof CSSStyleRule)) {
            continue
        }
        const selectors = rule.selectorText.split(',').map(t => t.trim())
        for (const selector of selectors) {
            const tokens = selector.match(/^.(M\d+|L|E)$/)
            if (tokens && tokens[1]) {
                replaceStrokeColor(colors, rule)
                lineRules.set(tokens[1], rule.style)
            }
        }
    }

    console.log(lineRules)
    return lineRules
}
