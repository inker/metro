/// <reference path="../typings/tsd.d.ts" />
export const userLanguage = (navigator.userLanguage || navigator.language).slice(0, 2).toLowerCase();

export function translate(text: string) {
    // function will be replaced when a different primary language other than English is detected
    return text;
}