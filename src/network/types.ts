import { LatLng } from 'leaflet'
export { LatLng }

export type LatLngJSON = {
    lat: number,
    lng: number,
}

export type AltNamesJSON = {
    [lang: string]: string,
}

export type PlatformJSON = {
    name: string,
    altNames: AltNamesJSON,
    location: LatLngJSON,
}

export type TransferJSON = {
    source: number,
    target: number,
}

export type SpanJSON = {
    source: number,
    target: number,
    routes: number[],
}

export type LineJSON = {
    name: {
        [lang: string]: string,
    },
}

export type RouteJSON = {
    line: string,
    branch: string,
}

export type GraphJSON = {
    platforms: PlatformJSON[],
    transfers: TransferJSON[],
    lines: {
        [lineId: string]: LineJSON,
    },
    spans: SpanJSON[],
    routes: RouteJSON[],
}

export type AltNames = {
    [lang: string]: string,
}
