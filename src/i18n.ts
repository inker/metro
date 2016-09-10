import { getJSON } from './res';

export const userLanguage = navigator.language.slice(0, 2).toLowerCase();

type Dictionary = {
    [phrase: string]: {
        [language: string]: string
    }
}
type LanguageDictionary = Map<string, string>;
let dictionary: LanguageDictionary = new Map<string, string>();
let regexDict = new RegExp(Object.keys(dictionary).join('|'), 'ig');

export function updateDictionary(url: string) {
    return getJSON(url).then((dict: Dictionary) => {
        const keys = Object.keys(dict);
        for (let key of keys) {
            const translations = dict[key];
            dictionary.set(key.toLowerCase(), userLanguage in translations ? translations[userLanguage] : key);
        }
        regexDict = new RegExp(keys.join('|'), 'ig');
    });
}

export function translate(text: string): string {
    const translation = dictionary.get(text.toLowerCase());
    if (translation === undefined) return text;
    if (text.toUpperCase() === text) return translation.toUpperCase();
    return translation;
    // const ucBitmap = text.split('').map(c => c !== c.toLowerCase());
    // return translation.split('').map((c, i) => ucBitmap[i] ? c.toUpperCase() : c).join('');
}

export function tr(strings: string[], ...values: string[]) {
    return strings.map(s => s.replace(regexDict, translate))
        .map((s, i) => s + (values[i] || ''))
        .join('');
}

function inflect(value: number, str: string) {
    return value === 0 ? '' : `${value}${value > 1 && userLanguage === 'en' ? str + 's' : str}`;
}

export function formatTime(time: number) {
    if (time < 60) {
        return Math.round(time) + ' seconds';
    }
    if (time < 3570) {
        const mins = Math.round(time / 60);
        return inflect(mins, 'min');
    }
    const hours = Math.floor(time / 3600);
    const mins = Math.floor((time - hours * 3600) / 60);
    return `${hours > 0 ? hours + tr`%hour%` : ''} ${inflect(mins, 'min')}`;
}