/// <reference path="../typings/tsd.d.ts" />;
export function time(target: Object, key: string, descriptor: TypedPropertyDescriptor<any>) {
    const originalMethod: Function = descriptor.value;
    descriptor.value = function (...args: any[]) {
        console.time(key);
        originalMethod.apply(this, args);
        console.timeEnd(key);
    }
    return descriptor;
}

export function MemoizeWithParameters(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<any>) {
    const { value } = descriptor;
    if (value === null) {
        throw new Error(`${propertyName} is not a method`);
    }
    const results = new Map<string, any>();

    descriptor.value = function (...args: any[]) {
        const serialized = JSON.stringify(args);
        const f = results.get(serialized);
        if (f !== undefined) {
            //console.log('already exists!');
            return f;
        }
        //console.log('calculating');
        const result = value.apply(this, args);
        results.set(serialized, result);
        return result;
    }
}