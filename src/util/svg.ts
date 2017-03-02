import { Point, point } from 'leaflet'

import { dot, det, getCircumcenter } from './math'
import { attr } from './index'

export function createSVGElement<K extends keyof ElementTagNameMap>(tagName: K): ElementTagNameMap[K] {
    return document.createElementNS('http://www.w3.org/2000/svg', tagName) as any
}

export function makeCircle(position: Point, radius: number): SVGCircleElement {
    const circle = createSVGElement('circle')
    circle.setAttribute('r', radius.toString())
    circle.setAttribute('cy', position.y.toString())
    circle.setAttribute('cx', position.x.toString())
    return circle
}

export function makeLine(start: Point, end: Point): SVGLineElement {
    const line = createSVGElement('line')
    line.setAttribute('x1', start.x.toString())
    line.setAttribute('y1', start.y.toString())
    line.setAttribute('x2', end.x.toString())
    line.setAttribute('y2', end.y.toString())
    return line
}

export function makeArc(start: Point, end: Point, third: Point): SVGPathElement {
    const path = createSVGElement('path')
    setCircularPath(path, start, end, third)
    return path
}

export function getBezierPathPoints(path: Element) {
    const points: Point[] = []
    const re = /\D([\d\.]+).*?,.*?([\d\.]+)/g
    const d = path.getAttribute('d')
    if (!d) {
        return null
    }
    let m: RegExpExecArray|null
    while ((m = re.exec(d)) !== null) {
        points.push(point(Number(m[1]), Number(m[2])))
    }
    return points
}

export function setBezierPath(el: Element, controlPoints: Point[]) {
    if (controlPoints.length !== 4) {
        throw new Error('there should be 4 points')
    }
    const s = ['M'].concat(controlPoints.map(pt => `${pt.x},${pt.y}`))
    s.splice(2, 0, 'C')
    el.setAttribute('d', s.join(' '))
}

export function getCircularPath(path: Element) {
    const points: number[] = []
    const re = /\D([\d\.]+)/g
    const d = path.getAttribute('d')
    if (!d) {
        return null
    }
    let m: RegExpExecArray|null
    while ((m = re.exec(d)) !== null) {
        points.push(Number(m[1]))
    }
    return points
}

export function setCircularPath(el: Element, start: Point, end: Point, third: Point) {
    const center = getCircumcenter([start, end, third])
    const startAngle = Math.atan2(start.y - center.y, start.x - center.x)
    const endAngle = Math.atan2(end.y - center.y, end.x - center.x)
    // const thirdAngle = Math.atan2(third.y - center.y, third.x - center.x);
    const diff = endAngle - startAngle
    let large = diff <= Math.PI || diff > -Math.PI ? 0 : 1
    const u = start.subtract(center)
    const v = end.subtract(center)
    let sweep = det(u, v) < 0 ? 0 : 1
    const codir = dot(third.subtract(start), third.subtract(end))
    if (codir < 0) {
        sweep = 1 - sweep
        large = 1 - large
    }
    const radius = center.distanceTo(start)
    const d = [
        'M', start.x, start.y,
        'A', radius, radius, 0, large, sweep, end.x, end.y,
    ].join(' ')
    el.setAttribute('d', d)
}

export function makeCubicBezier(controlPoints: Point[]): SVGPathElement {
    const path = createSVGElement('path')
    setBezierPath(path, controlPoints)
    return path
}

export function makeTransferArc(start: Point, end: Point, third: Point) {
    const outer = makeArc(start, end, third)
    const inner: typeof outer = outer.cloneNode(true) as any
    return [outer, inner]
}

export function makeTransferLine(start: Point, end: Point): SVGLineElement[] {
    // gradient disappearing fix (maybe use rectangle?)
    const tg = end.clone()
    if (start.x === end.x) {
        tg.x += 0.01
    } else if (start.y === end.y) {
        tg.y += 0.01
    }
    return [makeLine(start, tg), makeLine(start, tg)]
}

export function circleOffset(circle: SVGCircleElement): Point {
    const c = point(+attr(circle, 'cx'), +attr(circle, 'cy'))
    const iR = ~~attr(circle, 'r')
    const offset = point(0 + iR, 4 + iR)
    return c.subtract(offset)
}

export namespace Filters {
    const glowFilterId = 'black-glow'

    export function makeDrop(): SVGFilterElement {
        const filter = createSVGElement('filter')
        filter.id = 'shadow'
        filter.setAttribute('width', '200%')
        filter.setAttribute('height', '200%')
        filter.innerHTML = `
            <feOffset result="offOut" in="SourceAlpha" dx="0" dy="4" />
            <feColorMatrix result="matrixOut" in="offOut" type="matrix" values=
                "0 0 0 0   0
                0 0 0 0   0
                0 0 0 0   0
                0 0 0 0.5 0"/>
            <feGaussianBlur result="blurOut" in="matrixOut" stdDeviation="2" />

            <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
        `
        return filter
    }

    export function makeGlow(): SVGFilterElement {
        const filter = createSVGElement('filter')
        filter.id = glowFilterId
        filter.innerHTML = `<feColorMatrix type="matrix" values=
                "0 0 0 0   0
                0 0 0 0   0
                0 0 0 0   0
                0 0 0 0.3 0"/>
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>`
        return filter
    }

    export function makeOpacity(): SVGFilterElement {
        const filter = createSVGElement('filter')
        filter.id = 'opacity'
        filter.innerHTML = `<feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.5">
        </feComponentTransfer>`
        return filter
    }

    export function makeGray(): SVGFilterElement {
        const filter = createSVGElement('filter')
        filter.id = 'gray'
        filter.innerHTML = `<feColorMatrix type="matrix"
               values="0.2126 0.7152 0.0722 0 0
                       0.2126 0.7152 0.0722 0 0
                       0.2126 0.7152 0.0722 0 0
                       0 0 0 1 0"/>`
        return filter
    }

    export function appendAll(defs: SVGDefsElement) {
        defs.appendChild(makeDrop())
        defs.appendChild(makeGlow())
        defs.appendChild(makeOpacity())
        defs.appendChild(makeGray())
    }

    export function applyDrop(path: Element & SVGStylable) {
        // fixing disappearing lines
        const box = path.getBoundingClientRect()
        const style = getComputedStyle(path)
        const strokeWidth = parseFloat(style.strokeWidth || path.style.strokeWidth || '0') * 2
        if (box.height >= strokeWidth && box.width >= strokeWidth) {
            path.style.filter = `url(#${glowFilterId})`
        }
    }
}

export namespace Gradients {
    export function makeUndirectedLinear(colors: string[]): SVGLinearGradientElement {
        const gradient = createSVGElement('linearGradient')
        if ('innerHTML' in gradient) {
            gradient.innerHTML = `<stop style="stop-color:${colors[0]}" /><stop style="stop-color:${colors[1]}" />`
            return gradient
        } else {
            const from = createSVGElement('stop')
            from.style.stopColor = colors[0]
            const to = createSVGElement('stop')
            to.style.stopColor = colors[1]
            gradient.appendChild(from)
            gradient.appendChild(to)
        }
        return gradient
    }

    export function makeLinear(vector: Point, colors: string[], offset = 0): SVGLinearGradientElement {
        const gradient = makeUndirectedLinear(colors)
        setOffset(gradient, offset)
        setDirection(gradient, vector)
        return gradient
    }

    export function setDirection(gradient: Element, vector: Point) {
        const rotate = `rotate(${Math.atan2(vector.y, vector.x) * 180 / Math.PI}, 0.5, 0.5)`
        gradient.setAttribute('gradientTransform', rotate)
    }

    export function setOffset(gradient: Element, offset: number) {
        (gradient.firstChild as SVGStopElement).setAttribute('offset', offset.toString());
        (gradient.lastChild as SVGStopElement).setAttribute('offset', (1 - offset).toString())
    }
}
