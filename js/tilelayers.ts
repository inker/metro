/// <reference path="./../typings/tsd.d.ts" />
import L = require('leaflet');

const tileLayers = {
    Mapbox: (() => new L.TileLayer('https://{s}.tiles.mapbox.com/v3/inker.mlo91c41/{z}/{x}/{y}.png', {
        minZoom: 9,
        id: 'inker.mlo91c41',
        detectRetina: true,
        //reuseTiles: true,
        bounds: null,
        attribution: "Map data &copy; <a href=\"https://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://mapbox.com\">Mapbox</a>"
    }))(),

    OpenMapSurfer: (() => new L.TileLayer('http://openmapsurfer.uni-hd.de/tiles/roads/x={x}&y={y}&z={z}', {
        minZoom: 9,
        detectRetina: true,
        //reuseTiles: true,
        attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }))(),
    
    HyddaBase: L.tileLayer('http://{s}.tile.openstreetmap.se/hydda/base/{z}/{x}/{y}.png', {
        minZoom: 9,
        detectRetina: true,
        attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }),

    EsriGrey: L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        minZoom: 9,
        detectRetina: true,
    })
};


export = tileLayers;