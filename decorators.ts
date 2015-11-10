'use strict';
/// <reference path="./typings/tsd.d.ts" />

import "reflect-metadata";

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


export function MinZoomDisplayStations(value: number) {
    return target => Reflect['defineMetadata']('MinZoomDisplayStations', value, target);
}

export function MinZoomDisplayJunctions(value: number) {
    return target => Reflect['defineMetadata']('MinZoomDisplayJunctions', value, target);
}