/// <reference path="../typings/tsd.d.ts" />
import * as nw from './network';

type PlatformHint = {
    [line: string]: string|string[];
};

type CrossPlatformHint =  {
    [platformName: string]: PlatformHint|PlatformHint[];
};

export type Hints = {
    crossPlatform: CrossPlatformHint;
    elevationSegments: any;
}
    
export function verify(network: nw.Network, hints: Hints) {
    function checkExistence(val: string) {
        if (network.platforms.find(el => el.name === val) === undefined) {
            throw new Error(`platform ${val} doesn't exist`);
        }
    }
    function checkPlatformHintObject(obj: PlatformHint) {
        for (let line of Object.keys(obj)) {
            const val = obj[line];
            if (typeof val === 'string') {
                checkExistence(val);
            } else {
                val.forEach(checkExistence);
            }
        }
    }
    return new Promise<Hints>((resolve, reject) => {
        const crossPlatform = hints.crossPlatform;
        Object.keys(crossPlatform).forEach(platformName => {
            if (network.platforms.find(el => el.name === platformName) === undefined) {
                reject(`platform ${platformName} doesn't exist`);
            }
            const obj = crossPlatform[platformName];
            if ('forEach' in obj) {
                (obj as PlatformHint[]).forEach(checkPlatformHintObject);
            } else {
                checkPlatformHintObject(obj as PlatformHint);
            }
        });
        resolve(hints);
    });
}

/**
 * null: doesn't contain
 * -1: is an object
 * >=0: is an array
 */
export function hintContainsLine(network: nw.Network, dirHints: CrossPlatformHint, platform: nw.Platform): number {
    const spans = platform.spans.map(i => network.spans[i]);
    const routes: nw.Route[] = [];
    spans.forEach(span => span.routes.forEach(i => routes.push(network.routes[i])));
    const lines = routes.map(r => r.line);
    const platformHints = dirHints[platform.name];
    if (platformHints) {
        if ('forEach' in platformHints) {
            for (let idx = 0, len: number = platformHints['length'] as any; idx < len; ++idx) {
                if (Object.keys(platformHints[idx]).some(key => lines.indexOf(key) > -1)) {
                    return idx;
                }
            }
        } else if (Object.keys(platformHints).some(key => lines.indexOf(key) > -1)) {
            return -1;
        }
    }
    return null;
}