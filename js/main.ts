import MetroMap = require('./metro-map');
import tileLayers = require('./tilelayers');
//import MetroMap from './metro-map';

require('./polyfills')();

let metroMap = new MetroMap('map-container', 'json/graph.json', tileLayers);

(() => {
    let titles = ['Plan metro Sankt-Peterburga', 'Pietarin metron hankesuunnitelma', 'St Petersburg metro plan proposal'];
    let i = 0;
    setInterval(() => document.title = titles[++i % titles.length], 3000);
})();

console.log('user: ' + navigator.userLanguage);
console.log('language: ' + navigator.language);
console.log('browser: ' + navigator.browserLanguage);
console.log('system: ' + navigator.systemLanguage);