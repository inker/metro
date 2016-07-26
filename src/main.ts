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