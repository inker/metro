/// <reference path="../../typings/tsd.d.ts" />
import MetroMap from '../metromap';

abstract class Widget {
    protected _whenAvailable: Promise<this>;
    get whenAvailable() { return this._whenAvailable; }

    constructor() {}

    addTo(metroMap: MetroMap) {}
}

export default Widget;