import { identity } from 'lodash'
import { repeatUntil } from './index'

export function tryGetElement(query: string, interval = 100, ttl = 100): Promise<Element> {
    const rest = query.slice(1)
    const func = query[0] === '#' ? (() => document.getElementById(rest)) : () => document.querySelector(query)
    return repeatUntil(func, identity, interval, ttl)
}

export function removeAllChildren(el: Node) {
    let child: Node|null
    while (child = el.firstChild) {
        el.removeChild(child)
    }
}

export function byId(id: string) {
    const el = document.getElementById(id)
    if (!el) {
        throw new Error(`no element with id=${id} exists`)
    }
    return el
}

export function attr(el: Element, attributeName: string) {
    const attribute = el.getAttribute(attributeName)
    if (!attribute) {
        throw new Error(`no attribute ${attributeName} on element with id=${el.id} exists`)
    }
    return attribute
}

type NewValFunc = (oldVal: string) => any
type NewValOrNewValFunc = string | NewValFunc
export function newAttributeValue(el: Element, attr: string, newValOrFunc: NewValOrNewValFunc) {
    const oldVal = el.getAttribute(attr)
    if (oldVal === null) {
        return
    }
    el.setAttribute(`data-${attr}`, oldVal)
    const val = typeof newValOrFunc === 'string' ? newValOrFunc : newValOrFunc(oldVal)
    el.setAttribute(attr, val)
}

export function restoreAttribute(el: Element, attr: string) {
    const dataAttr = `data-${attr}`
    const oldVal = el.getAttribute(dataAttr)
    if (oldVal === null) {
        return
    }
    el.removeAttribute(dataAttr)
    el.setAttribute(attr, oldVal)
}
