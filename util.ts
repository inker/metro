/// <reference path="./typings/tsd.d.ts" />

'use strict';

export function xml2json(xml) {
    try {
        if (xml.children.length <= 0) {
            return xml.textContent;
        }
        let obj = {};
        for (var i = 0; i < xml.children.length; ++i) {
            var item = xml.children.item(i);
            var nodeName = item.nodeName;
            if (typeof (obj[nodeName]) == "undefined") {
                obj[nodeName] = xml2json(item);
                continue;
            }
            if (typeof (obj[nodeName].push) == "undefined") {
                let old = obj[nodeName];

                obj[nodeName] = [];
                obj[nodeName].push(old);
            }
            obj[nodeName].push(xml2json(item));
        }
        return obj;
    } catch (e) {
        console.log(e.message);
    }
}

export function diffByOne(str1: string, str2: string): boolean {
    let diff = 0;
    if (str1 != '' && str2 != '' && str1.length == str2.length) {
        for (let i = 0, j = 0; i < str1.length && j < str2.length; ++i, ++j) {
            if (str1[i] != str2[j]) {
                ++diff;
                if (str1[i + 1] == str2[j]) {
                    ++i;
                } else if (str1[i] == str2[j + 1]) {
                    ++j;
                } else if (str1[i + 1] == str2[j + 1]) {
                    ++i; //
                    ++j;
                }
            }
        }
    }
    return diff == 1;
}

