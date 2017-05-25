import * as _ from 'lodash'

function parseColor(color: string): number[] {
    let tokens = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i)
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
    const str = _(colors)
        .map(parseColor)
        .unzipWith((...arrays) => _.mean(arrays))
        .map(avg => _.round(avg))
        .map(num => num.toString(16))
        .map(hexVal => _.padStart(hexVal, 2, '0'))
        .join('')
    return `#${str}`
}
