import { identity } from 'lodash'
import { repeatUntil } from './index'
import { getOrMakeInMap } from './collections'

export async function tryGetElement(query: string, interval = 100, ttl = 100) {
    const rest = query.slice(1)
    const func = query[0] === '#' ? (() => document.getElementById(rest)) : () => document.querySelector(query)
    const el = await repeatUntil(func, identity, interval, ttl)
    return el as Element
}

export function removeAllChildren(el: Node) {
    let child: Node | null
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

interface StringToString {
    [attr: string]: string,
}

const oldAttrs = new WeakMap<Element, StringToString>()

type NewValFunc = (oldVal: string) => any
type NewValOrNewValFunc = string | NewValFunc
function newAttributeValue(el: Element, attr: string, newValOrFunc: NewValOrNewValFunc) {
    const oldVal = el.getAttribute(attr)
    if (oldVal === null) {
        if (typeof newValOrFunc === 'function') {
            throw new Error('cannot invoke on null')
        }
        el.setAttribute(attr, newValOrFunc)
        return
    }
    const o = getOrMakeInMap(oldAttrs, el, {})
    o[attr] = oldVal
    if (typeof newValOrFunc === 'string') {
        el.setAttribute(attr, newValOrFunc)
        return
    }
    const val = newValOrFunc(oldVal)
    el.setAttribute(attr, val)
}

export function newAttributeValues(el: Element, newValsFunc: (o: StringToString) => StringToString) {
    const { attributes } = el
    const o: StringToString = {}
    for (let i = 0, n = attributes.length; i < n; ++i) {
        const { name, value } = attributes[i]
        o[name] = value
    }
    const newVals = newValsFunc(o)
    for (const [attr, val] of Object.entries(newVals)) {
        newAttributeValue(el, attr, val)
    }
}

function restoreAttribute(el: Element, attr: string) {
    const o = oldAttrs.get(el)
    if (o === undefined) {
        return
    }
    const oldVal = o[attr]
    if (oldVal === undefined) {
        return
    }
    o[attr] = undefined as any
    el.setAttribute(attr, oldVal)
}

export function restoreAttributes(el: Element, ...attrs: string[]) {
    for (const attr of attrs) {
        restoreAttribute(el, attr)
    }
}
