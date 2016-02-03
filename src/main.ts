'use strict';

import * as res from './res';
import { flashTitle } from './util';
import * as L from 'leaflet';
import MetroMap from './metro-map';

if (L.Browser.ie) {
    alert("Does not work in IE (yet)");
}

import polyfills from './polyfills';
polyfills();

import tilelayers from './tilelayers';

res.dictionaryPromise.then(dict => {
    const metroMap = new MetroMap('map-container', 'json/graph.json', tilelayers);
    const englishTitle = 'St Petersburg metro plan proposal';
    const titles = dict[englishTitle];
    flashTitle(Object.keys(titles).map(key => titles[key]).concat([englishTitle]), 3000);
});

console.log('user: ' + navigator.userLanguage);
console.log('language: ' + navigator.language);
console.log('browser: ' + navigator.browserLanguage);
console.log('system: ' + navigator.systemLanguage);

/* TODO:
E-line have terminuses (larger circles?)
no pole, bigger
circles in 4+ platforms
resolve colorful transfers perfomance issue

*/
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