/// <reference path="../../typings/tsd.d.ts" />
var L = require('leaflet');
function getUserLanguage() {
    let userLanguage = (navigator.userLanguage || navigator.language).substr(0, 2).toLowerCase();
    return (['ru', 'fi'].indexOf(userLanguage) > -1) ? userLanguage : 'en';
}
exports.getUserLanguage = getUserLanguage;
function parseTransform(val) {
    const matches = val.match(/translate3d\((-?\d+)px,\s?(-?\d+)px,\s?(-?\d+)px\)/i);
    return (matches) ? new L.Point(Number(matches[1]), Number(matches[2])) : new L.Point(0, 0);
}
exports.parseTransform = parseTransform;
function findCircle(graph, station) {
    let platforms = [];
    station.platforms.forEach(function (platformNum) { return platforms.push(graph.platforms[platformNum]); });
    if (platforms.length === 3 && platforms.every(function (platform) { return platform.transfers.length === 2; })) {
        return platforms;
    }
    return null;
}
exports.findCircle = findCircle;
function getCircumcenter(positions) {
    if (positions.length != 3)
        throw new Error('must have 3 vertices');
    console.log(positions[1]);
    const b = positions[1].subtract(positions[0]);
    const c = positions[2].subtract(positions[0]);
    return new L.Point((c.y * (b.x * b.x + b.y * b.y) - b.y * (c.x * c.x + c.y * c.y)), (b.x * (c.x * c.x + c.y * c.y) - c.x * (b.x * b.x + b.y * b.y))).divideBy(2.0 * (b.x * c.y - b.y * c.x)).add(positions[0]);
}
exports.getCircumcenter = getCircumcenter;
function getSegmentLength(source, target) {
    const a = target.subtract(source);
    return Math.sqrt(a.x * a.x + a.y * a.y);
}
exports.getSegmentLength = getSegmentLength;
//# sourceMappingURL=util.js.map