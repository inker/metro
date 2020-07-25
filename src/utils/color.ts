import {
  mean,
  round,
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
    tokens = color.match(/[\da-f]{2}/gi)
  } else if (color.length === 4) {
    tokens = color.slice(1).split('').map(t => t + t)
  }
  if (!tokens) {
    throw new Error(`invalid css color: ${color}`)
  }
  return tokens.map(s => Number.parseInt(s, 16))
}

export function meanColor(colors: string[]): string {
  const colorCoordinates = colors.map(parseColor)
  const means = unzipWith(colorCoordinates, (...arrays) => mean(arrays))
  const strings = means.map(avg => round(avg).toString(16).padStart(2, '0'))
  return `#${strings.join('')}`
}
