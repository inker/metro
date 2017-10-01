import { Browser, Icon } from 'leaflet'
import { capitalize } from 'lodash'

import { getJSON, Config } from './res'

import 'leaflet-dist/leaflet.css'
import 'alertify-dist/css/alertify.css'
import 'alertify-dist/css/themes/default.css'
import './css/index.css'
import './css/map.css'

import 'core-js/fn/object/entries'

declare const System

Icon.Default.imagePath = 'http://cdn.leafletjs.com/leaflet/v0.7.7/images'

if (Browser.ie) {
    alert('Does not work in your browser (yet)')
    throw new Error('shitty browser')
}

const configPromise = getJSON('res/mapconfig.json') as Promise<Config>
const mapPromise = Browser.mobile ? System.import('./MetroMap') : System.import('./EditableMetroMap')

const tokens = location.search.match(/city=(\w+)/)
const city = tokens ? tokens[1] : 'spb'

;
(async () => {
    const config = await configPromise
    for (const url of Object.keys(config.url)) {
        config.url[url] = config.url[url].replace(/\{city\}/g, city)
    }
    document.title = `${city && city !== 'spb' ? capitalize(city) : 'St Petersburg'} metro plan proposal`

    const Map = await mapPromise
    new Map.default(config)
})()
