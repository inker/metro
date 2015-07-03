/// <reference path="./typings/tsd.d.ts" />
function findClosestObject(point, objects) {
    'use strict';
    let closestDistance = 1000000000;
    let closest = null;
    //let closest = objects.reduce((prev, cur) => {
    //    let tempDist = point.distanceTo(obj['location']);
    //    return (tempDist < dist) ?
    //});
    objects.forEach(function (obj) {
        let tempDist = point.distanceTo(obj.location);
        //let tempDist = getDistance(point, obj['location']);
        if (tempDist < closestDistance) {
            closest = obj;
            closestDistance = tempDist;
        }
    });
    return closest;
}
exports.findClosestObject = findClosestObject;
/** object must contain the 'location' field */
function findObjectsInRadius(point, objects, radius, sortArray) {
    'use strict';
    if (sortArray === void 0) { sortArray = false; }
    let arr = objects.filter(function (obj) { return point.distanceTo(obj.location) <= radius; });
    //objects.forEach(obj => {
    //    //if (getDistance(point, obj['location']) <= radius) {
    //    if (point.distanceTo(obj.location) <= radius) {
    //        arr.push(obj);
    //    }
    //});
    if (sortArray) {
        arr.sort(function (a, b) { return point.distanceTo(a.location) - point.distanceTo(b.location); });
    }
    return arr;
}
exports.findObjectsInRadius = findObjectsInRadius;
function getCenter(points) {
    'use strict';
    let cLat = 0, cLon = 0;
    for (var i = 0; i < points.length; ++i) {
        cLat += points[i].lat;
        cLon += points[i].lng;
    }
    return new L.LatLng(cLat / points.length, cLon / points.length);
}
exports.getCenter = getCenter;
//# sourceMappingURL=geo.js.map