import { Browser } from 'leaflet'
import { capitalize } from 'lodash'

import './MetroMap' // mind this

import config from './mapconfig.json'

import './css/index.css'
import './css/leaflet.css'
import './css/map.css'

if (Browser.ie) {
    alert('Does not work in your browser (yet)')
    throw new Error('shitty browser')
}

const mapPromise = Browser.mobile
    ? import(/* webpackChunkName: "MetroMap" */ './MetroMap')
    : import(/* webpackChunkName: "EditableMetroMap" */ './EditableMetroMap')

const tokens = location.search.match(/city=(\w+)/)
const city = tokens ? tokens[1] : 'spb'

for (const key of Object.keys(config.url)) {
    config.url[key] = config.url[key].replace(/\{city\}/g, city)
}

mapPromise.then(module => {
    new module.default(config)
})

document.title = `${city && city !== 'spb' ? capitalize(city) : 'St Petersburg'} metro plan proposal`
const favicon = document.getElementById('favicon') as HTMLLinkElement
favicon.href = config.favicons[city]
