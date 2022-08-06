import { Point } from 'leaflet'

export type SvgGContainer<PropName extends string> = {
  [P in PropName]: SVGGraphicsElement | null
}

export type SourceOrTarget = 'source' | 'target'

export type BySourceOrTarget<T> = {
  [P in SourceOrTarget]: T
}

export type Slots = BySourceOrTarget<number>
export type SlotPoints = BySourceOrTarget<Point>
