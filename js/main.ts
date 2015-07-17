import MetroMap = require('./metro-map');
//import MetroMap from './metro-map';

if (!('Promise' in window) || !('then' in Promise.prototype) || !('catch' in Promise.prototype)) {
    console.log('promises not present, using a polyfill');
    require('es6-promise').polyfill();
}

if (!('Set' in window) || !('add' in Set.prototype) || !('has' in Set.prototype)) {
    console.log('set not present, using a polyfill');
    require('es6-set/implement');
}

if (!('classList' in HTMLElement.prototype)) {
    console.log('classlist not present, using a polyfill');
    require('classlist-polyfill');
}

const mapbox = (() => new L.TileLayer('https://{s}.tiles.mapbox.com/v3/inker.mlo91c41/{z}/{x}/{y}.png', {
    minZoom: 9,
    id: 'inker.mlo91c41',
    //detectRetina: true,
    //reuseTiles: true,
    bounds: null,
    attribution: "Map data &copy; <a href=\"https://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://mapbox.com\">Mapbox</a>"
}))();

const openMapSurfer = (() => new L.TileLayer('http://openmapsurfer.uni-hd.de/tiles/roads/x={x}&y={y}&z={z}', {
    minZoom: 9,
    //reuseTiles: true,
    attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}))();

let metroMap = new MetroMap('map-container', 'json/graph.json', {
    'Mapbox': mapbox,
    'OpenMapSurfer': openMapSurfer
});

(() => {
    let titles = ['Plan metro Sankt-Peterburga', 'Pietarin metron hankesuunnitelma', 'St Petersburg metro plan proposal'];
    let i = 0;
    setInterval(() => document.title = titles[++i % titles.length], 3000);
})();

console.log('user: ' + navigator.userLanguage);
console.log('language: ' + navigator.language);
console.log('browser: ' + navigator.browserLanguage);
console.log('system: ' + navigator.systemLanguage);