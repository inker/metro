export function intersection<T>(a: Set<T>, b: Set<T>) {
    const isn = new Set<T>()
    for (const item of a) {
        if (b.has(item)) {
            isn.add(item)
        }
    }
    return isn
}

interface IMap<K, V> {
    get: (key: K) => V | undefined,
    set: (key: K, val: V) => IMap<K, V>,
}

type NewValFunc<V> = () => V
type NewVal<V> = V | NewValFunc<V>
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
    getKey: (val: V) => K | undefined,
}
export function tryGetKeyFromBiMap<K, V>(map: IBiMap<K, V>, val: V): K {
    const key = map.getKey(val)
    if (key === undefined) {
        console.error('in map', map, ':', val, '->', key)
        throw new Error('key or val is undefined')
    }
    return key
}
