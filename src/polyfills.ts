/// <reference path="../typings/tsd.d.ts" />
export default function () {
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

    if (!Array.prototype.find) {
        Array.prototype.find = function(predicate) {
            if (this == null) {
                throw new TypeError('Array.prototype.find called on null or undefined');
            }
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }
            var list = Object(this);
            var length = list.length >>> 0;
            var thisArg = arguments[1];
            var value;

            for (var i = 0; i < length; i++) {
                value = list[i];
                if (predicate.call(thisArg, value, i, list)) {
                    return value;
                }
            }
            return undefined;
        };
    }

    if (!Array.prototype.includes) {
        Array.prototype.includes = function(searchElement /*, fromIndex*/ ) {
            'use strict';
            var O = Object(this);
            var len = parseInt(O.length, 10) || 0;
            if (len === 0) {
                return false;
            }
            var n = parseInt(arguments[1], 10) || 0;
            var k;
            if (n >= 0) {
                k = n;
            } else {
                k = len + n;
                if (k < 0) {
                    k = 0;
                }
            }
            var currentElement;
            while (k < len) {
                currentElement = O[k];
                if (searchElement === currentElement ||
                    (searchElement !== searchElement && currentElement !== currentElement)) { // NaN !== NaN
                    return true;
                }
                k++;
            }
            return false;
        };
    }
    
}