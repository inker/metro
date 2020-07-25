import { createSVGElement } from '.'

const GLOW_FILTER_ID = 'black-glow'

export function makeDrop(): SVGFilterElement {
  const filter = createSVGElement('filter')
  filter.id = 'shadow'
  filter.setAttribute('width', '200%')
  filter.setAttribute('height', '200%')
  filter.innerHTML = `
        <feOffset
            result="offOut"
            in="SourceAlpha"
            dx="0"
            dy="4"
        />
        <feColorMatrix
            result="matrixOut"
            in="offOut"
            type="matrix"
            values="
                0 0 0 0   0
                0 0 0 0   0
                0 0 0 0   0
                0 0 0 0.5 0
            "
        />
        <feGaussianBlur
            result="blurOut"
            in="matrixOut"
            stdDeviation="2"
        />
        <feBlend
            in="SourceGraphic"
            in2="blurOut"
            mode="normal"
        />
    `
  return filter
}

export function makeGlow(): SVGFilterElement {
  const filter = createSVGElement('filter')
  filter.id = GLOW_FILTER_ID
  filter.innerHTML = `
        <feColorMatrix
            type="matrix"
            values="
                0 0 0 0   0
                0 0 0 0   0
                0 0 0 0   0
                0 0 0 0.3 0
            "
        />
        <feGaussianBlur
            stdDeviation="2.5"
            result="coloredBlur"
        />
        <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
        </feMerge>
    `
  return filter
}

export function makeOpacity(): SVGFilterElement {
  const filter = createSVGElement('filter')
  filter.id = 'opacity'
  filter.innerHTML = `
        <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.5">
        </feComponentTransfer>
    `
  return filter
}

export function makeGray(): SVGFilterElement {
  const filter = createSVGElement('filter')
  filter.id = 'gray'
  filter.innerHTML = `
        <feColorMatrix
            type="matrix"
            values="
                0.2126 0.7152 0.0722 0 0
                0.2126 0.7152 0.0722 0 0
                0.2126 0.7152 0.0722 0 0
                0 0 0 1 0
            "
        />
    `
  return filter
}

export function appendAll(defs: SVGDefsElement) {
  defs.appendChild(makeDrop())
  defs.appendChild(makeGlow())
  defs.appendChild(makeOpacity())
  defs.appendChild(makeGray())
}

export function applyDrop(path: SVGPathElement | SVGLineElement) {
  // fixing disappearing lines
  const box = path.getBoundingClientRect()
  const style = getComputedStyle(path)
  const strokeWidth = Number.parseFloat(style.strokeWidth || path.style.strokeWidth || '0') * 2
  if (box.height >= strokeWidth && box.width >= strokeWidth) {
    path.style.filter = `url(#${GLOW_FILTER_ID})`
  }
}
