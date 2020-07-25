import MetroMap from '../../MetroMap'

interface Widget {
    addTo(metroMap: MetroMap): this,
}

export default Widget
