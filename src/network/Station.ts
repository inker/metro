import { LatLng } from './types'

import { getPlatformNamesZipped } from '../util'
import getCenter from '../util/geo/getCenter'

import Platform from './Platform'

export default class {
    constructor(public platforms: Platform[]) {
        for (const platform of platforms) {
            (platform as any)._station = this
        }
    }

    getNames(): string[] {
        return getPlatformNamesZipped(this.platforms)
    }

    getCenter(): LatLng {
        return getCenter(this.platforms.map(p => p.location))
    }

    passingLines(): Set<string> {
        const lines = new Set<string>()
        for (const platform of this.platforms) {
            for (const span of platform.spans) {
                for (const route of span.routes) {
                    lines.add(route.line)
                }
            }
        }
        return lines
    }

}
