import pool from '../../ObjectPool'
import { byId } from '../dom'
import { tryGetFromMap } from '../collections'

import { Transfer } from '../../network'
import { attr, newAttributeValue, restoreAttribute } from '../dom'

const initialCircles = new Set<SVGCircleElement>()
const initialStadiums = new Set<SVGRectElement>()
const initialTransfers = new Set<SVGPathElement | SVGLineElement>()

export function scaleElement(el: SVGElement, scaleFactor: number, asAttribute = false) {
    if (el instanceof SVGCircleElement) {
        scaleCircle(el, scaleFactor, asAttribute)
    } else if (el instanceof SVGRectElement) {
        scaleStadium(el, scaleFactor, asAttribute)
    }
}

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
    newAttributeValue(circle, 'r', oldR => +oldR * scaleFactor)
}

export function scaleStadium(stadium: SVGRectElement, scaleFactor: number, asAttribute = false) {
    // TODO
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
    initialCircles.forEach(circle => restoreAttribute(circle, 'r'))
    // initialCircles.forEach(circle => circle.removeAttribute('transform'));
    initialTransfers.forEach(tr => tr.style.strokeWidth = null)
    initialTransfers.clear()
    initialCircles.clear()
    initialStadiums.clear()
}
