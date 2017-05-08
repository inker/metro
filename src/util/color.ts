import {
    wrapperLodash,
    round,
    padStart,
    mean as lodashMean,
} from 'lodash-es'

function parseColor(color: string): number[] {
    let tokens: string[]|null = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i)
    if (tokens) {
        return tokens.slice(1).map(Number)
    }
    if (!color.startsWith('#')) {
        throw new Error(`invalid css color: ${color}`)
    }
    if (color.length === 7) {
        tokens = color.match(/[0-9a-f]{2}/ig)
    } else if (color.length === 4) {
        tokens = color.slice(1).split('').map(t => t + t)
    }
    if (!tokens) {
        throw new Error(`invalid css color: ${color}`)
    }
    return tokens.map(s => parseInt(s, 16))
}

export function mean(colors: string[]): string {
    const str = wrapperLodash(colors)
        .map(parseColor)
        .unzipWith((...arrays) => lodashMean(arrays))
        .map(avg => round(avg))
        .map(num => num.toString(16))
        .map(hexVal => padStart(hexVal, 2, '0'))
        .join('')
    return `#${str}`
}
