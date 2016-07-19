'use strict';

import { getConfig } from './res';
import { updateDictionary } from './i18n';
import { translate } from './i18n';
import MetroMap from './metromap';

L.Icon.Default.imagePath = 'http://cdn.leafletjs.com/leaflet/v0.7.7/images';

if (L.Browser.ie) {
    alert("Does not work in IE (yet)");
}

import polyfills from './polyfills';
polyfills();

getConfig().then(config => updateDictionary(config.url['dictionary']).then(() => {
    document.title = translate(document.title);
    new MetroMap(config);
}));

console.log('user: ' + navigator.userLanguage);
console.log('language: ' + navigator.language);
console.log('browser: ' + navigator.browserLanguage);
console.log('system: ' + navigator.systemLanguage);

/* TODO:
E-line have termini (larger circles?)
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