import { WeakBiMap } from 'bim'
import { Platform, Transfer, Span } from './network'

const store = {
    platformBindings: new WeakMap<Platform, SVGCircleElement|SVGRectElement>(),
    dummyBindings: new WeakBiMap<Platform, SVGCircleElement|SVGRectElement>(),
    outerEdgeBindings: new WeakBiMap<Span|Transfer, SVGPathElement|SVGLineElement>(),
    innerEdgeBindings: new WeakBiMap<Span|Transfer, SVGPathElement|SVGLineElement>(),
    gradientBindings: new WeakMap<Transfer, SVGGradientElement>(),
}

export default Object.freeze(store)
