import { Browser, Icon } from 'leaflet'
import { capitalize } from 'lodash'

import * as config from './mapconfig.json'

import './css/index.css'
import './css/map.css'

import 'core-js/fn/object/entries'

declare const System

Icon.Default.imagePath = 'http://cdn.leafletjs.com/leaflet/v0.7.7/images'

if (Browser.ie) {
    alert('Does not work in your browser (yet)')
    throw new Error('shitty browser')
}

const mapPromise = Browser.mobile ? System.import('./MetroMap') : System.import('./EditableMetroMap')

const tokens = location.search.match(/city=(\w+)/)
const city = tokens ? tokens[1] : 'spb'

for (const url of Object.keys(config.url)) {
    config.url[url] = config.url[url].replace(/\{city\}/g, city)
}
document.title = `${city && city !== 'spb' ? capitalize(city) : 'St Petersburg'} metro plan proposal`

mapPromise.then(map => {
    new map.default(config)
})
