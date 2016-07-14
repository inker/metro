import * as res from './res';

export const userLanguage = navigator.language.slice(0, 2).toLowerCase();

type Dictionary = {
    [phrase: string]: {
        [language: string]: string
    }
}
let dictionary: Dictionary;

export const dictionaryPromise = res.dictionaryPromise.then(dict => dictionary = dict);

export function translate(text: string): string {
    return text in dictionary && userLanguage in dictionary[text] ? dictionary[text][userLanguage] : text;
}

function inflect(value: number, str: string) {
    return value === 0 ? '' : `${value} ${value > 1 && userLanguage === 'en' ? str + 's' : str}`;
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
    return `${inflect(hours, 'hour')} ${inflect(mins, 'min')}`;
}