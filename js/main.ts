import MetroMap = require('./metro-map');
import tileLayers = require('./tilelayers');
import util = require('./util');
//import MetroMap from './metro-map';

require('./polyfills')();

let metroMap = new MetroMap('map-container', 'json/graph.json', tileLayers);

util.flashingTitle([
    'Plan metro Sankt-Peterburga',
    'Pietarin metron hankesuunnitelma',
    'St Petersburg metro plan proposal'
], 3000);

console.log('user: ' + navigator.userLanguage);
console.log('language: ' + navigator.language);
console.log('browser: ' + navigator.browserLanguage);
console.log('system: ' + navigator.systemLanguage);