import { latLng } from 'leaflet'
import {
  // orderBy,
  pull,
} from 'lodash'

import Platform from './Platform'
import Station from './Station'
import Edge from './Edge'
import Span from './Span'
import Transfer from './Transfer'
import Route from './Route'

import {
  LatLngJSON,
  GraphJSON,
  SpanJSON,
} from './types'

export {
  Platform,
  Station,
  Edge,
  Span,
  Transfer,
  Route,
  GraphJSON,
}

const objectifyLatLng = (obj: LatLngJSON) =>
  latLng(obj.lat, obj.lng)

export default class {
  readonly platforms: Platform[]
  readonly stations: Station[]
  readonly lines: {}
  readonly transfers: Transfer[]
  readonly spans: Span[]
  readonly routes: Route[]
  constructor(json: GraphJSON, detailedE?: boolean) {
    console.time('restore')
    this.platforms = json.platforms
      .map(p => new Platform(p.name, objectifyLatLng(p.location), p.altNames, p.type as any))
    this.stations = []
    this.routes = json.routes
    this.lines = json.lines
    this.transfers = json.transfers
      .map(s => new Transfer(this.platforms[s.source], this.platforms[s.target], s.type))
    const spanRoutes = (s: SpanJSON) => s.routes.map(i => this.routes[i])

    if (detailedE) {
      this.spans = []
      for (const s of json.spans) {
        const pSource = this.platforms[s.source]
        const pTarget = this.platforms[s.target]
        const isE = s.routes.every(r => json.routes[r].line === 'E')
        if (!isE) {
          this.spans.push(new Span(pSource, pTarget, spanRoutes(s)))
          continue
        }
        const spans = s.routes.map(r => new Span(pSource, pTarget, [json.routes[r]]))
        this.spans.push(...spans)
      }
      // this.spans = orderBy(this.spans, a => a.source.passingLines().has('E') ? -1 : 0)
    } else {
      this.spans = json.spans.map(s => new Span(this.platforms[s.source], this.platforms[s.target], spanRoutes(s)))
    }

    const transferSet = new Set(this.transfers)
    const platformsCopy = new Set(this.platforms)
    while (transferSet.size > 0) {
      const firstTransfer = transferSet.values().next().value
      const pls = new Set([
        firstTransfer.source,
        firstTransfer.target,
      ])
      transferSet.delete(firstTransfer)
      for (const p of pls) {
        const forDeletion = new Set<Transfer>()
        for (const t of transferSet) {
          if (t.source === p) {
            pls.add(t.target)
            forDeletion.add(t)
          } else if (t.target === p) {
            pls.add(t.source)
            forDeletion.add(t)
          }
        }
        for (const transfer of forDeletion) {
          transferSet.delete(transfer)
        }
        platformsCopy.delete(p)
      }
      const station = new Station(Array.from(pls))
      this.stations.push(station)
    }
    for (const platform of platformsCopy) {
      this.stations.push(new Station([platform]))
    }
    console.timeEnd('restore')
  }

  toJSON(): string {
    const {
      platforms, transfers, lines, spans, routes,
    } = this
    return JSON.stringify({
      graphVersion: '1.1',
      platforms: platforms.map(p => ({
        name: p.name,
        altNames: p.altNames,
        location: p.location,
        type: p.type === 'normal' ? undefined : p.type,
      })),
      transfers: transfers.map(t => ({
        type: t.type,
        source: platforms.indexOf(t.source),
        target: platforms.indexOf(t.target),
      })),
      lines,
      spans: spans.map(s => ({
        source: platforms.indexOf(s.source),
        target: platforms.indexOf(s.target),
        routes: s.routes.map(r => routes.indexOf(r)),
      })),
      routes,
    }, (k, v) => k.startsWith('_') ? undefined : v, 2)
  }

  deletePlatform(platform: Platform) {
    console.log('removing platform', platform)
    const { transfers, spans, station } = platform
    for (const transfer of transfers) {
      pull(this.transfers, transfer)
    }
    transfers.length = 0
    if (spans.length === 1) {
      const span = spans[0]
      const neighbor = span.other(platform)
      pull(neighbor.spans, span)
      pull(this.spans, span)
    } else if (spans.length === 2) {
      const [first, second] = spans
      const end = second.other(platform)
      if (!end) {
        throw new Error('span does not have other end')
      }
      if (platform.passingRoutes().size === 2) {
        const otherPlatform = first.other(platform)
        pull(otherPlatform.spans, first)
        pull(this.spans, first)
      } else if (first.source === platform) {
        first.source = end
      } else {
        first.target = end
      }
      pull(end.spans, second)
      pull(this.spans, second)
    } else {
      for (const span of spans) {
        const neighbor = span.other(platform)
        pull(neighbor.spans, span)
        pull(this.spans, span)
      }
    }
    if (station.platforms.length === 1) {
      pull(this.stations, station)
    } else {
      pull(station.platforms, platform)
    }
    pull(this.platforms, platform)
  }
}
