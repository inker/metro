import { tileLayer, Browser } from 'leaflet'

const retina = Browser.retina && !Browser.mobile

export const mapbox = tileLayer(`https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}${retina ? '@2x' : ''}.png`, {
    id: 'inker.mlo91c41',
    // reuseTiles: true,
    detectRetina: retina,
    attribution: 'Map data &copy; <a href=\"https://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://mapbox.com\">Mapbox</a>',
})

export const mapbox2 = tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    id: 'inker/cj9cri11x6cqg2slbyi3o3niq',
    accessToken: 'pk.eyJ1IjoiaW5rZXIiLCJhIjoiajlpYVl1YyJ9.UpoLm3kdL8SCR6GeCRzyIQ',
    tileSize: 512,
    detectRetina: retina,
    attribution: 'Map data &copy; <a href=\"https://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://mapbox.com\">Mapbox</a>',
})

export const mapnik = tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
})

export const osmFrance = tileLayer('http://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
    attribution: '&copy; Openstreetmap France | &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
})

export const openMapSurfer = tileLayer('http://korona.geog.uni-heidelberg.de/tiles/roads/x={x}&y={y}&z={z}', {
    attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
})

export const hyddaBase = tileLayer('https://{s}.tile.openstreetmap.se/hydda/base/{z}/{x}/{y}.png', {
    attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank" rel="noopener">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="http://server.ts.openstreetmap.org/copyright">OpenStreetMap</a>',
})

export const esriGrey = tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
})

export const cartoDB = tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
	// subdomains: 'abcd',
})

export const cartoDBNoLabels = tileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
	// subdomains: 'abcd',
})

export const wikimapia = tileLayer('http://i{hash}.wikimapia.org/?x={x}&y={y}&zoom={z}', {
    // @ts-ignore
    hash: data => data.x % 4 + (data.y % 4) * 4,
})
