/// <reference path="../typings/tsd.d.ts" />

export const userLanguage = (navigator.userLanguage || navigator.language).slice(0, 2).toLowerCase();

export function translate(text: string) {
    // function will be replaced when a different primary language other than English is detected
    return text;
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