/// <reference path="../typings/tsd.d.ts" />
import { WeakBiMap } from 'bim';
import * as nw from './network';

export default {
    platformBindings: new WeakMap<nw.Platform, SVGCircleElement>(),
    dummyBindings: new WeakBiMap<nw.Platform, SVGCircleElement>(),
    outerEdgeBindings: new WeakBiMap<nw.Edge<nw.Platform>, SVGPathElement|SVGLineElement>(),
    innerEdgeBindings: new WeakBiMap<nw.Edge<nw.Platform>, SVGPathElement|SVGLineElement>(),
    gradientBindings: new WeakMap<nw.Transfer, SVGGradientElement>()
};