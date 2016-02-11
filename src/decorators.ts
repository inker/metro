export function time(target: Object, key: string, descriptor: TypedPropertyDescriptor<any>) {
    const originalMethod: Function = descriptor.value;
    descriptor.value = function (...args: any[]) {
        console.time(key);
        originalMethod.apply(this, args);
        console.timeEnd(key);
    }
    return descriptor;
}