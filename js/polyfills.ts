/// <reference path="./../typings/tsd.d.ts" />
function addPolyfills () {
    if (!('Promise' in window) || !('then' in Promise.prototype) || !('catch' in Promise.prototype)) {
        console.log('promises not present, using a polyfill');
        require('es6-promise').polyfill();
    }

    if (!('Set' in window) || !('add' in Set.prototype) || !('has' in Set.prototype)) {
        console.log('set not present, using a polyfill');
        require('es6-set/implement');
    }

    if (!('classList' in HTMLElement.prototype)) {
        console.log('classlist not present, using a polyfill');
        require('classlist-polyfill');
    }
    
    if (!('fetch' in window)) {
        console.log('fetch not present, using a polyfill');
    }
    
}

export = addPolyfills;