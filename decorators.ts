export function TransferOverlapError(value: number) {
    return function (target: Function) {
        Reflect['defineMetadata']('TransferOverlapError', value, target);
    }
}

export function DistanceError(value: number) {
    return function (target: Function) {
        Reflect['defineMetadata']('DistanceError', value, target);
    }
}

export function SameJunctionError(value: number) {
    return function (target: Function) {
        Reflect['defineMetadata']('SameJunctionError', value, target);
    }
}