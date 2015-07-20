import MetroMap = require('./metro-map');
import util = require('./util');
//import MetroMap from './metro-map';

require('./polyfills')();

let metroMap = new MetroMap('map-container', 'json/graph.json', require('./tilelayers'));

util.flashTitle([
    'Plan metro Sankt-Peterburga',
    'Pietarin metron hankesuunnitelma',
    'St Petersburg metro plan proposal'
], 3000);

console.log('user: ' + navigator.userLanguage);
console.log('language: ' + navigator.language);
console.log('browser: ' + navigator.browserLanguage);
console.log('system: ' + navigator.systemLanguage);

/* TODO:
1. FAQ with user with the following questions:
a. why is everything in latinica
b. why have some stations been renamed
c. why have new stations been embedded between old ones
d. st petersburg's climate not suited for overground railway (there are suburban trains... look at helsinki)
e. wtf is ingria, why are the stations dubbed in finnish
f. there's no money for it (whose fault is it?)
g. i do not agree with the network, where's the station near my home (propose your own)
h. malfunctioning in IE (get a normal browser ffs)
i. why junctions have single name
 *//**/