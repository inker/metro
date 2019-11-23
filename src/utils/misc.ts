import { Point } from 'leaflet'
import {
    zip,
    uniq,
    identity,
} from 'lodash'

import { Platform } from '../network'
import getSecondLanguage from './lang/getSecondLanguage'

import { round as roundVector } from './math/vector'

const RESET_SELECTOR = [
    'paths-inner',
    'paths-outer',
    'transfers-inner',
    'transfers-outer',
    'station-circles',
].map(i => `#${i} > *`).join(', ')

export function getCity() {
    const tokens = location.search.match(/city=(\w+)/)
    return tokens ? tokens[1] : 'spb'
}

export function resetStyle() {
    const els = document.querySelectorAll(RESET_SELECTOR) as any as HTMLElement[]
    for (const { style } of els) {
        style.opacity = null
        style.filter = 'none'
    }
}

export function getPlatformNames(platform: Platform): string[] {
    const { name, altNames } = platform
    const second = getSecondLanguage()
    const names = [name]
    if (second && altNames[second]) {
        names.push(altNames[second])
    }
    if (altNames.en) {
        names.push(altNames.en)
    }
    return names
}

export function getPlatformNamesZipped(platforms: Platform[]) {
    const platformNames = platforms.map(getPlatformNames)
    return zip(...platformNames)
        .map(arr => uniq(arr).join(' / '))
        .filter(identity)
}

export function midPointsToEnds(pos: Point, midPts: Point[]) {
    const lens = midPts.map(midPt => pos.distanceTo(midPt))
    const midOfMidsWeighted = midPts[1]
        .subtract(midPts[0])
        .multiplyBy(lens[0] / (lens[0] + lens[1]))
        .add(midPts[0])
    const offset = pos.subtract(midOfMidsWeighted)
    return midPts.map(v => roundVector(v.add(offset), 2))
}
