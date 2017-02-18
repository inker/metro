'use strict'

import { Browser, Icon } from 'leaflet'
import { capitalize } from 'lodash'
import unblur from 'unblur'

import { getJSON } from './res'
import { updateDictionary, translate } from './i18n'
import MetroMap from './MetroMap'

import 'leaflet-dist/leaflet.css'
import 'alertify-dist/css/alertify.css'
import 'alertify-dist/css/themes/default.css'
import './css/index.css'
import './css/map.css'

Icon.Default.imagePath = 'http://cdn.leafletjs.com/leaflet/v0.7.7/images'

if (Browser.ie) {
    alert('Does not work in IE (yet)')
}

if (!Browser.mobile && Browser.webkit3d) {
    unblur({
        skipWhen: () => document.querySelectorAll('[style*="transition"], [style*="scale"]').length > 0,
    })
}

const tokens = location.search.match(/city=(\w+)/)
const city = tokens ? tokens[1] : 'spb'

; (async () => {
    const config = await getJSON('res/mapconfig.json')
    const dictPromise = updateDictionary(config.url['dictionary'])
    for (const url of Object.keys(config.url)) {
        config.url[url] = config.url[url].replace(/\{city\}/g, city)
    }
    document.title = translate(`${city && city !== 'spb' ? capitalize(city) : 'St Petersburg'} metro plan proposal`)
    await dictPromise
    document.title = translate(document.title)
    new MetroMap(config)
})()
