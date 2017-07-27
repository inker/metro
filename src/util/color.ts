import {
    mean,
    round,
    padStart,
    unzipWith,
} from 'lodash'

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

export function meanColor(colors: string[]): string {
    const colorCoordinates = colors.map(parseColor)
    const means = unzipWith(colorCoordinates, (...arrays) => mean(arrays))
    const strings = means.map(avg => padStart(round(avg).toString(16), 2, '0'))
    return `#${strings.join('')}`
}
