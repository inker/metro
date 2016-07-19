/// <reference path="../../typings/tsd.d.ts" />
import MetroMap from '../metromap';

export interface Widget {
    addTo(metroMap: MetroMap);   
}

export abstract class DeferredWidget implements Widget {
    protected _whenAvailable: Promise<void>;
    get whenAvailable() { return this._whenAvailable; }

    constructor() {}

    addTo(metroMap: MetroMap) {}
}