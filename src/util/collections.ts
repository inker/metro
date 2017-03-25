import { last } from 'lodash'

export function intersection<T>(a: Set<T>, b: Set<T>) {
    const isn = new Set<T>()
    a.forEach(item => {
        if (b.has(item)) {
            isn.add(item)
        }
    })
    return isn
}

export function deleteFromArray<T>(arr: T[], el: T) {
    const pos = arr.indexOf(el)
    if (pos < 0) {
        return
    }
    arr[pos] = last(arr)
    arr.pop()
}

interface IMap<K, V> {
    get: (key: K) => V|undefined,
    set: (key: K, val: V) => IMap<K, V>,
}

type NewVal<V> = V|(() => V)
export function getOrMakeInMap<K, V>(map: IMap<K, V>, key: K, newVal: NewVal<V>): V {
    let val = map.get(key)
    if (val === undefined) {
        val = typeof newVal === 'function' ? newVal() : newVal
        map.set(key, val)
    }
    return val
}

export function tryGetFromMap<K, V>(map: IMap<K, V>, key: K): V {
    const val = map.get(key)
    if (val === undefined) {
        console.error('in map', map, ':', key, '->', val)
        throw new Error('key or val is undefined')
    }
    return val
}

interface IBiMap<K, V> {
    getKey: (val: V) => K|undefined,
}
export function tryGetKeyFromBiMap<K, V>(map: IBiMap<K, V>, val: V): K {
    const key = map.getKey(val)
    if (key === undefined) {
        console.error('in map', map, ':', val, '->', key)
        throw new Error('key or val is undefined')
    }
    return key
}
