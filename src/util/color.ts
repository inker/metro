function hexToArray(hex: string): number[] {
    const tokens = hex.match(/[0-9a-f]{1,2}/ig)
    return tokens ? tokens.map(s => parseInt(s, 16)) : []
}

function rgbToArray(rgb: string): number[] {
    const tokens = rgb.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i)
    return tokens ? tokens.slice(1).map(Number) : []
}

export function mean(rgb: string[]): string {
    const reduceFunc = (prev: number[], cur: string) =>
        (cur.startsWith('#') ? hexToArray : rgbToArray)(cur)
            .map((it, i) => prev[i] + it)
    const [r, g, b] = rgb.reduce(reduceFunc, [0, 0, 0]).map(i => Math.floor(i / rgb.length))
    return `rgb(${r}, ${g}, ${b})`
}
