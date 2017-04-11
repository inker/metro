import { downloadText } from 'download.js'
import { difference } from 'lodash'

import MetroMap from './MetroMap'

import { Config } from './res'
import { MapEditor, askRoutes, platformRenameDialog } from './ui'
import pool from './ObjectPool'
import { tr } from './i18n'

import {
    Platform,
    Span,
    Transfer,
} from './network'

import {
    svg,
    collections,
    mouseToLatLng,
    getPlatformNames,
    dom,
} from './util'

const {
    deleteFromArray,
    intersection,
    tryGetFromMap,
    tryGetKeyFromBiMap,
} = collections

const { gradients } = svg

export default class extends MetroMap {
    constructor(config: Config) {
        super(config)
    }

    protected async makeMap() {
        await super.makeMap()
        new MapEditor(this.config.detailedZoom).addTo(this)
    }

    protected addMapListeners() {
        super.addMapListeners()

        const relatedTargetToSpan = (rt: EventTarget) => {
            const path = rt as SVGPathElement
            return (pool.outerEdgeBindings.getKey(path) || pool.innerEdgeBindings.getKey(path)) as Span
        }

        const relatedTargetToPlatform = (rt: EventTarget) =>
            tryGetKeyFromBiMap(pool.dummyBindings, rt as SVGCircleElement)

        const { map, contextMenu } = this

        this.subscribe('platformrename', e => {
            const platform = relatedTargetToPlatform(e.relatedTarget)
            this.plate.show(svg.getElementOffset(e.relatedTarget as SVGCircleElement), getPlatformNames(platform))
            platformRenameDialog(platform)
        })
        this.subscribe('platformmovestart', e => {
            this.plate.disabled = true
        })
        this.subscribe('platformmove', e => {
            const platform = relatedTargetToPlatform(e.relatedTarget)
            platform.location = mouseToLatLng(map, e)
        })
        this.subscribe('platformmoveend', e => {
            const platform = relatedTargetToPlatform(e.relatedTarget)
            this.plate.disabled = false
            this.plate.show(svg.getElementOffset(e.relatedTarget as SVGCircleElement), getPlatformNames(platform))
        })
        this.subscribe('platformadd', e => {
            const { detail } = e
            const location = mouseToLatLng(map, detail)
            const newPlatform = new Platform(tr`New station`, location, {})
            this.network.platforms.push(newPlatform)
            if (detail.relatedTarget !== undefined) {
                const span = relatedTargetToSpan(detail.relatedTarget)
                const prop = span.source === newPlatform ? 'target' : 'source'
                const newSpan = new Span(newPlatform, span[prop], span.routes)
                span[prop] = newPlatform
                this.network.spans.push(newSpan)
            }
            this.overlay.extendBounds(location)
            this.resetNetwork(JSON.parse(this.network.toJSON()))
        })
        this.subscribe('platformdelete', e => {
            const platform = relatedTargetToPlatform(e.relatedTarget)
            this.network.deletePlatform(platform)
            this.redrawNetwork()
        })
        this.subscribe('spanroutechange', e => {
            if (e.relatedTarget === undefined) {
                return
            }
            const span = relatedTargetToSpan(e.relatedTarget)
            const routeSet = askRoutes(this.network, new Set(span.routes))
            span.routes = Array.from(routeSet)
            this.resetNetwork(JSON.parse(this.network.toJSON()))
        })
        this.subscribe('spaninvert', e => {
            if (e.relatedTarget === undefined) {
                return
            }
            const span = relatedTargetToSpan(e.relatedTarget)
            span.invert()
            this.resetNetwork(JSON.parse(this.network.toJSON()))
        })
        this.subscribe('spanend', e => {
            const source = tryGetKeyFromBiMap(pool.dummyBindings, e.detail.source)
            const target = tryGetKeyFromBiMap(pool.dummyBindings, e.detail.target)
            contextMenu.removeItem('spanend')

            const sourceRoutes = source.passingRoutes()
            const targetRoutes = target.passingRoutes()
            const sn = sourceRoutes.size
            const tn = targetRoutes.size

            const routeSet = sn > 0 && tn === 0 ? (sn === 1 ? sourceRoutes : askRoutes(this.network, sourceRoutes)) :
                tn > 0 && sn === 0 ? (tn === 1 ? targetRoutes : askRoutes(this.network, targetRoutes)) :
                    askRoutes(this.network, intersection(sourceRoutes, targetRoutes))

            this.network.spans.push(new Span(source, target, Array.from(routeSet)))
            this.resetNetwork(JSON.parse(this.network.toJSON()))
        })
        this.subscribe('spandelete', e => {
            if (e.relatedTarget === undefined) {
                return
            }
            const span = relatedTargetToSpan(e.relatedTarget)
            deleteFromArray(this.network.spans, span)
            this.resetNetwork(JSON.parse(this.network.toJSON()))
        })
        this.subscribe('transferend', e => {
            const source = tryGetKeyFromBiMap(pool.dummyBindings, e.detail.source)
            const target = tryGetKeyFromBiMap(pool.dummyBindings, e.detail.target)
            console.log(source, target)
            contextMenu.removeItem('transferend')
            this.network.transfers.push(new Transfer(source, target))
            this.resetNetwork(JSON.parse(this.network.toJSON()))
        })
        this.subscribe('transferdelete', e => {
            if (e.relatedTarget === undefined) {
                return
            }
            const path = e.relatedTarget as SVGPathElement | SVGLineElement
            const transfer = (pool.outerEdgeBindings.getKey(path) || pool.innerEdgeBindings.getKey(path)) as Transfer
            deleteFromArray(this.network.transfers, transfer)
            this.resetNetwork(JSON.parse(this.network.toJSON()))
        })
        this.subscribe('editmapstart', e => {
            if (map.getZoom() < this.config.detailedZoom) {
                map.setZoom(this.config.detailedZoom)
            }
            const pathTrigger = (target: EventTarget) => {
                const targetsParent = (target as SVGElement).parentElement
                if (!targetsParent) {
                    return false
                }
                const parentId = targetsParent.id
                return parentId === 'paths-outer' || parentId === 'paths-inner'
            }
            contextMenu.insertItem('platformaddclick', 'New station', target => !pathTrigger(target))


            const trigger = (target: EventTarget) => {
                const targetsParent = (target as SVGElement).parentElement
                if (!targetsParent) {
                    return false
                }
                return targetsParent.id === 'dummy-circles'
            }

            contextMenu.insertItem('platformrename', 'Rename station', trigger)
            contextMenu.insertItem('platformdelete', 'Delete station', trigger)
            contextMenu.insertItem('spanstart', 'Span from here', trigger)
            contextMenu.insertItem('transferstart', 'Transfer from here', trigger)

            contextMenu.insertItem('spanroutechange', 'Change route', pathTrigger)
            contextMenu.insertItem('spaninvert', 'Invert span', pathTrigger)
            contextMenu.insertItem('platformaddtolineclick', 'Add station to line', pathTrigger)
            contextMenu.insertItem('spandelete', 'Delete span', pathTrigger)
            contextMenu.insertItem('transferdelete', 'Delete transfer', target => {
                const targetsParent = (target as SVGElement).parentElement
                if (!targetsParent) {
                    return false
                }
                const parentId = targetsParent.id
                return parentId === 'transfers-outer' || parentId === 'transfers-inner'
            })
        })
        this.subscribe('editmapend', e => {
            contextMenu.removeItem('platformaddclick')
            contextMenu.removeItem('platformrename')
            contextMenu.removeItem('platformdelete')
            contextMenu.removeItem('spanstart')
            contextMenu.removeItem('transferstart')
            contextMenu.removeItem('platformaddtolineclick')
            contextMenu.removeItem('spanroutechange')
            contextMenu.removeItem('spandelete')
            contextMenu.removeItem('transferdelete')
        })
        this.subscribe('mapsave', e => {
            downloadText('graph.json', this.network.toJSON())
        })
    }

    protected redrawNetwork() {
        super.redrawNetwork()
        this.addBindings()
    }

    private addBindings() {
        const { platforms } = this.network
        const { platformBindings, dummyBindings } = pool
        for (const platform of platforms) {
            this.platformToModel(platform, [
                tryGetFromMap(platformBindings, platform),
                tryGetFromMap(dummyBindings, platform),
            ])
        }
    }

    private platformToModel(platform: Platform, circles: Element[]) {
        const cached = platform.location
        Object.defineProperty(platform, 'location', {
            get: () => platform['_location'],
            set: (location: L.LatLng) => {
                platform['_location'] = location
                const locForPos = this.map.getZoom() < this.config.detailedZoom
                    ? platform.station.getCenter()
                    : location
                const pos = this.overlay.latLngToOverlayPoint(locForPos)
                // const nw = this.bounds.getNorthWest();
                // const pos = this.map.latLngToContainerPoint(locForPos).subtract(this.map.latLngToContainerPoint(nw));
                for (const c of circles) {
                    c.setAttribute('cx', pos.x.toString())
                    c.setAttribute('cy', pos.y.toString())
                }
                this.whiskers.set(platform, this.makeWhiskers(platform))
                this.platformsOnSVG.set(platform, pos)
                const spansToChange = new Set<Span>(platform.spans)
                for (const span of platform.spans) {
                    const neighbor = span.other(platform)
                    this.whiskers.set(neighbor, this.makeWhiskers(neighbor))
                    neighbor.spans.forEach(si => spansToChange.add(si))
                }
                spansToChange.forEach(span => {
                    const controlPoints = [
                        tryGetFromMap(this.platformsOnSVG, span.source),
                        tryGetFromMap(tryGetFromMap(this.whiskers, span.source), span),
                        tryGetFromMap(tryGetFromMap(this.whiskers, span.target), span),
                        tryGetFromMap(this.platformsOnSVG, span.target),
                    ]
                    const outer = tryGetFromMap(pool.outerEdgeBindings, span)
                    const inner = pool.innerEdgeBindings.get(span)
                    svg.bezier.setPath(outer, controlPoints)
                    if (inner) {
                        svg.bezier.setPath(inner, controlPoints)
                    }
                })
                for (const tr of platform.transfers) {
                    tr[tr.source === platform ? 'source' : 'target'] = platform
                }
            },
        })
        platform['_location'] = cached
    }

    private transferToModel(transfer: Transfer, elements: Element[]) {
        const cached = [transfer.source, transfer.target]
        const { tagName } = elements[0];
        ['source', 'target'].forEach((prop, pi) => {
            Object.defineProperty(transfer, prop, {
                get: () => transfer['_' + prop],
                set: (platform: Platform) => {
                    transfer['_' + prop] = platform
                    const circle = tryGetFromMap(pool.platformBindings, platform)
                    const circleBorderWidth = parseFloat(getComputedStyle(circle).strokeWidth || '')
                    const r = +dom.attr(circle, 'r')
                    const circleTotalRadius = r / 2 + circleBorderWidth
                    const pos = tryGetFromMap(this.platformsOnSVG, platform)
                    if (tagName === 'line') {
                        const n = pi + 1
                        const other = transfer.other(platform)
                        for (const el of elements) {
                            el.setAttribute('x' + n, pos.x.toString())
                            el.setAttribute('y' + n, pos.y.toString())
                        }
                        const gradient = tryGetFromMap(pool.gradientBindings, transfer)
                        const otherPos = tryGetFromMap(this.platformsOnSVG, other)
                        const dir = prop === 'source' ? otherPos.subtract(pos) : pos.subtract(otherPos)
                        gradients.setDirection(gradient, dir)
                        const circlePortion = circleTotalRadius / pos.distanceTo(otherPos)
                        gradients.setOffset(gradient, circlePortion)
                    } else if (tagName === 'path') {
                        const transfers: Transfer[] = []
                        for (const t of this.network.transfers) {
                            if (transfer.isAdjacent(t)) {
                                transfers.push(t)
                                if (transfers.length === 3) {
                                    break
                                }
                            }
                        }

                        const circular = new Set<Platform>()
                        for (const tr of transfers) {
                            circular.add(tr.source).add(tr.target)
                        }

                        const circumpoints = Array.from(circular).map(i => this.platformsOnSVG.get(i))
                        circular.forEach(i => circumpoints.push(this.platformsOnSVG.get(i)))
                        const outerArcs = transfers.map(t => tryGetFromMap(pool.outerEdgeBindings, t))
                        const innerArcs = transfers.map(t => tryGetFromMap(pool.innerEdgeBindings, t))
                        for (let i = 0; i < 3; ++i) {
                            const tr = transfers[i]
                            const outer = outerArcs[i]
                            const inner = innerArcs[i]
                            const pos1 = tryGetFromMap(this.platformsOnSVG, tr.source)
                            const pos2 = tryGetFromMap(this.platformsOnSVG, tr.target)
                            const thirdPos = difference(circumpoints, [pos1, pos2])[0]
                            if (thirdPos) {
                                svg.arc.setPath(outer, pos1, pos2, thirdPos)
                                inner.setAttribute('d', dom.attr(outer, 'd'))
                            }
                            const gradient = tryGetFromMap(pool.gradientBindings, tr)
                            gradients.setDirection(gradient, pos2.subtract(pos1))
                            const circlePortion = circleTotalRadius / pos1.distanceTo(pos2)
                            gradients.setOffset(gradient, circlePortion)
                        }
                    } else {
                        throw new TypeError('wrong element type for transfer')
                    }
                },
            })
            transfer['_' + prop] = cached[pi]
        })
    }

}
