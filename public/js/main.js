var MetroMap = require('./metro-map');
//import MetroMap from './metro-map';
const mapbox = (function () { return new L.TileLayer('https://{s}.tiles.mapbox.com/v3/inker.km1inchd/{z}/{x}/{y}.png', {
    minZoom: 9,
    id: 'inker.km1inchd',
    detectRetina: true,
    bounds: null,
    attribution: "Map data &copy; <a href=\"https://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://mapbox.com\">Mapbox</a>"
}); })();
const openMapSurfer = (function () { return new L.TileLayer('http://openmapsurfer.uni-hd.de/tiles/roads/x={x}&y={y}&z={z}', {
    minZoom: 0,
    maxZoom: 20,
    attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}); })();
console.log('hi!');
var metroMap = new MetroMap('map-container', function (zoom) { return (zoom < 15) ? mapbox : openMapSurfer; });
metroMap.getGraphAndFillMap();
//# sourceMappingURL=main.js.map