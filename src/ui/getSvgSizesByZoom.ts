import { memoize } from 'lodash'

const memoizeFunc = (...args) =>
    args.join(':')

function getSvgSizesByZoom(zoom: number, detailedZoom: number) {
    console.log('zoom', zoom)
    const coef = zoom > 9 ? zoom : zoom > 8 ? 9.5 : 9
    // const lineWidth = 2 ** (zoom / 4 - 1.75);
    const lineWidth = (coef - 7) * 0.5
    const lightLineWidth = lineWidth * 0.75
    const circleRadius = coef < detailedZoom ? lineWidth * 1.25 : lineWidth * 1.1
    const circleBorder = coef < detailedZoom ? circleRadius * 0.4 : circleRadius * 0.6
    const dummyCircleRadius = circleRadius * 2
    const transferWidth = lineWidth * 0.9
    const transferBorder = circleBorder * 1.4
    const fullCircleRadius = circleRadius + circleBorder / 2
    return {
        lineWidth,
        lightLineWidth,
        circleRadius,
        circleBorder,
        dummyCircleRadius,
        transferWidth,
        transferBorder,
        fullCircleRadius,
    }
}

export default memoize(getSvgSizesByZoom, memoizeFunc)
