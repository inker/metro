/// <reference path="../references.ts" />
interface GeoToTransportAdapter {
    //url: URL;

    parseFile(destPath: string, cb?: Function);
}

export default GeoToTransportAdapter;