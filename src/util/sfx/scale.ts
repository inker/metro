import pool from '../../ObjectPool'
import { byId } from '../dom'
import { tryGetFromMap } from '../collections'

import { Transfer } from '../../network'

const initialCircles = new Set<SVGCircleElement>()
const initialStadiums = new Set<SVGRectElement>()
const initialTransfers = new Set<SVGPathElement | SVGLineElement>()

export function scaleCircle(circle: SVGCircleElement, scaleFactor: number, asAttribute = false) {
    if (!asAttribute) {
        circle.style.transform = `scale(${scaleFactor})`
        return
    }
    initialCircles.add(circle)
    // const t = scaleFactor - 1,
    //     tx = -circle.getAttribute('cx') * t,
    //     ty = -circle.getAttribute('cy') * t;
    // circle.setAttribute('transform', `matrix(${scaleFactor}, 0, 0, ${scaleFactor}, ${tx}, ${ty})`);
    const oldR = circle.getAttribute('r')
    if (oldR) {
        circle.setAttribute('data-r', oldR)
        circle.setAttribute('r', (+oldR * scaleFactor).toString())
    }
}

export function scaleStadium(stadium: SVGRectElement, scaleFactor: number, asAttribute = false) {
    if (!asAttribute) {
        stadium.style.transform = `scale(${scaleFactor})`
        return
    }
    initialStadiums.add(stadium)
    // const t = scaleFactor - 1,
    //     tx = -circle.getAttribute('cx') * t,
    //     ty = -circle.getAttribute('cy') * t;
    // circle.setAttribute('transform', `matrix(${scaleFactor}, 0, 0, ${scaleFactor}, ${tx}, ${ty})`);
    const oldR = stadium.getAttribute('rx')
    const oldHeight = stadium.getAttribute('height')
    if (oldR) {
        const newR = +oldR * scaleFactor
        stadium.setAttribute('data-rx', oldR)
        stadium.setAttribute('rx', newR.toString())
        stadium.setAttribute('height', (newR * 2).toString())
    }
}

export function scaleTransfer(transfer: Transfer, scaleFactor: number) {
    const transferOuterStrokeWidth = parseFloat(byId('transfers-outer').style.strokeWidth || '')
    const transferInnerStrokeWidth = parseFloat(byId('transfers-inner').style.strokeWidth || '')
    const outer = tryGetFromMap(pool.outerEdgeBindings, transfer)
    const inner = tryGetFromMap(pool.innerEdgeBindings, transfer)
    initialTransfers.add(outer)
    initialTransfers.add(inner)
    outer.style.strokeWidth = transferOuterStrokeWidth * scaleFactor + 'px'
    inner.style.strokeWidth = transferInnerStrokeWidth * scaleFactor + 'px'
}

export function unscaleAll() {
    initialCircles.forEach(circle => {
        const initialRadius = circle.getAttribute('data-r')
        if (initialRadius !== null) {
            circle.setAttribute('r', initialRadius)
        }
    })
    initialStadiums.forEach(stadium => {
        const initialRadius = stadium.getAttribute('data-rx')
        if (initialRadius !== null) {
            stadium.setAttribute('rx', initialRadius)
            stadium.setAttribute('height', (+initialRadius * 2).toString())
        }
    })
    // initialCircles.forEach(circle => circle.removeAttribute('transform'));
    initialTransfers.forEach(tr => tr.style.strokeWidth = null)
    initialTransfers.clear()
    initialCircles.clear()
    initialStadiums.clear()
}
