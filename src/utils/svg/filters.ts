const GLOW_FILTER_ID = 'black-glow'

export function applyDrop(path: SVGPathElement | SVGLineElement) {
  // fixing disappearing lines
  const box = path.getBoundingClientRect()
  const style = getComputedStyle(path)
  const strokeWidth = Number.parseFloat(style.strokeWidth || path.style.strokeWidth || '0') * 2
  if (box.height >= strokeWidth && box.width >= strokeWidth) {
    path.style.filter = `url(#${GLOW_FILTER_ID})`
  }
}
