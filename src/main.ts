'use strict'

import { capitalize } from 'lodash'
import { getConfig } from './res'
import { updateDictionary, translate } from './i18n'
import MetroMap from './MetroMap'

L.Icon.Default.imagePath = 'http://cdn.leafletjs.com/leaflet/v0.7.7/images'

import './css/global.css'

if (L.Browser.ie) {
    alert('Does not work in IE (yet)')
}

const tokens = location.search.match(/city=(\w+)/)
const city = tokens ? tokens[1] : 'spb'

; (async () => {
    const config = await getConfig()
    const dictPromise = updateDictionary(config.url['dictionary'])
    for (const url of Object.keys(config.url)) {
        config.url[url] = config.url[url].replace(/\{city\}/g, city)
    }
    document.title = translate(`${city && city !== 'spb' ? capitalize(city) : 'St Petersburg'} metro plan proposal`)
    await dictPromise
    document.title = translate(document.title)
    new MetroMap(config)
})()
