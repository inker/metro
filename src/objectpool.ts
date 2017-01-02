import { WeakBiMap } from 'bim'
import {
    Platform,
    Transfer,
    Edge,
} from './network'

const store = {
    platformBindings: new WeakMap<Platform, SVGCircleElement>(),
    dummyBindings: new WeakBiMap<Platform, SVGCircleElement>(),
    outerEdgeBindings: new WeakBiMap<Edge<Platform>, SVGPathElement|SVGLineElement>(),
    innerEdgeBindings: new WeakBiMap<Edge<Platform>, SVGPathElement|SVGLineElement>(),
    gradientBindings: new WeakMap<Transfer, SVGGradientElement>(),
}

export default Object.freeze(store)
