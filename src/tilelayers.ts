import * as L from 'leaflet';

export const mapbox = new L.TileLayer('https://{s}.tiles.mapbox.com/v3/inker.mlo91c41/{z}/{x}/{y}.png', {
    minZoom: 9,
    //id: 'inker.mlo91c41',
    detectRetina: false,
    //reuseTiles: true,
    bounds: null,
    attribution: "Map data &copy; <a href=\"https://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://mapbox.com\">Mapbox</a>"
});

export const mapnik = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

export const osmFrance = L.tileLayer('http://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; Openstreetmap France | &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

export const openMapSurfer = new L.TileLayer('https://openmapsurfer.uni-hd.de/tiles/roads/x={x}&y={y}&z={z}', {
    minZoom: 9,
    detectRetina: true,
    //reuseTiles: true,
    attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data &copy; <a href="https://server.ts.openstreetmap.org/copyright">OpenStreetMap</a>'
});

export const hyddaBase = L.tileLayer('https://{s}.tile.openstreetmap.se/hydda/base/{z}/{x}/{y}.png', {
    minZoom: 9,
    detectRetina: true,
    attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="http://server.ts.openstreetmap.org/copyright">OpenStreetMap</a>'
});

export const esriGrey = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    minZoom: 9,
    detectRetina: true,
});

export const cartoDB = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
	//subdomains: 'abcd',
	maxZoom: 19
});

export const cartoDBNoLabels = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
	//subdomains: 'abcd',
	maxZoom: 19
});

export const wikimapia = L.tileLayer('http://i{hash}.wikimapia.org/?x={x}&y={y}&zoom={z}', {
	maxZoom: 19,
    hash: data => data.x % 4 + (data.y % 4) * 4
});