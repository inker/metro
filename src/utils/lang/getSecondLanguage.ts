import { getCity } from 'utils/misc'

interface CityLang {
    [city: string]: string | undefined,
}

const secondLanguageObj: CityLang = {
    spb: 'fi',
    qazan: 'tt',
    helsinki: 'se',
}

export default () => {
    const city = getCity()
    return secondLanguageObj[city]
}
