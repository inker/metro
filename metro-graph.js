'use strict';
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
//import L = require('leaflet');
//import * as geo from './geo';
var Elevation;
(function (Elevation) {
    Elevation[Elevation["underground"] = 0] = "underground";
    Elevation[Elevation["surface"] = 1] = "surface";
    Elevation[Elevation["overground"] = 2] = "overground";
})(Elevation || (Elevation = {}));
var Platform = (function () {
    function Platform(location, elevation, name, altName, oldName) {
        if (elevation === void 0) { elevation = 0 /* underground */; }
        if (name === void 0) { name = ''; }
        if (altName === void 0) { altName = ''; }
        if (oldName === void 0) { oldName = ''; }
        this._name = name;
        this._altName = altName;
        this._oldName = oldName;
        this.location = location;
        this.elevation = elevation;
        this._spans = [];
    }
    Object.defineProperty(Platform.prototype, "name", {
        get: function () {
            return this._name ? this._name : this._station.name;
        },
        set: function (name) {
            this._name = name;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Platform.prototype, "altName", {
        get: function () {
            return this._altName ? this._altName : this._station.altName;
        },
        set: function (name) {
            this._altName = name;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Platform.prototype, "oldName", {
        get: function () {
            return this._oldName ? this._oldName : this._station.oldName;
        },
        set: function (name) {
            this._oldName = name;
        },
        enumerable: true,
        configurable: true
    });
    Platform.prototype.passingRoutes = function () {
        var s = [];
        this._spans.forEach(function (span) { return span.routes.forEach(function (line) { return s.push(line); }); });
        return s;
    };
    Platform.prototype.passingLines = function () {
        var s = [];
        this._spans.forEach(function (span) {
            span.routes.forEach(function (route) { return s.push(route.line); });
        });
        return s;
    };
    Object.defineProperty(Platform.prototype, "spans", {
        get: function () {
            return this._spans;
        },
        enumerable: true,
        configurable: true
    });
    Platform.prototype.nextStop = function (span) {
        if (span.source == this)
            return span.target;
        else if (span.target == this)
            return span.source;
        else
            throw new Error("span doesn't belong to the platform");
    };
    Object.defineProperty(Platform.prototype, "station", {
        get: function () {
            return this._station;
        },
        set: function (station) {
            if (station.platforms.indexOf(this) == -1)
                station.platforms.push(this);
            this._station = station;
        },
        enumerable: true,
        configurable: true
    });
    return Platform;
})();
exports.Platform = Platform;
var Station = (function () {
    function Station(name, altName, platforms, oldName) {
        var _this = this;
        if (oldName === void 0) { oldName = ''; }
        this.name = name;
        this.altName = altName;
        this.platforms = platforms;
        this.oldName = oldName;
        platforms.forEach(function (platform) { return platform.station = _this; });
    }
    Object.defineProperty(Station.prototype, "location", {
        get: function () {
            let avg = new L.Point(0, 0);
            this.platforms.forEach(function (platform) {
                avg.y += platform.location.lat;
                avg.x += platform.location.lng;
            });
            const div = 1.0 / this.platforms.length;
            return new L.LatLng(avg.y * div, avg.x * div);
        },
        enumerable: true,
        configurable: true
    });
    return Station;
})();
exports.Station = Station;
var Edge = (function () {
    function Edge(source, target, bidirectional) {
        if (bidirectional === void 0) { bidirectional = true; }
        if (source == target)
            throw new Error("source & target cannot be the same platform (" + source.name + ', ' + source.location + ')');
        this.src = source;
        this.trg = target;
        this.bidirectional = bidirectional;
    }
    Object.defineProperty(Edge.prototype, "source", {
        get: function () {
            return this.src;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Edge.prototype, "target", {
        get: function () {
            return this.trg;
        },
        enumerable: true,
        configurable: true
    });
    Edge.prototype.other = function (platform) {
        if (this.src == platform)
            return this.trg;
        else if (this.trg == platform)
            return this.src;
        //console.log("span doesn't contain the specified platform");
        return null;
    };
    return Edge;
})();
var Span = (function (_super) {
    __extends(Span, _super);
    function Span(source, target, routes, bidirectional) {
        if (bidirectional === void 0) { bidirectional = true; }
        _super.call(this, source, target, bidirectional);
        source.spans.push(this);
        target.spans.push(this);
        this.routes = routes;
        this.bidirectional = bidirectional;
        routes = [];
    }
    Span.prototype.replacePlatform = function (old, replacement) {
        if (this.src == old)
            this.src = replacement;
        else if (this.trg == old)
            this.trg = replacement;
        else
            throw new Error("span doesn't contain the platform to replace");
        old.spans.slice(old.spans.indexOf(this), 1);
        replacement.spans.push(this);
    };
    Span.prototype.addPlatform = function (platform) {
        platform.spans.push(this);
        if (this.source)
            this.trg = platform;
        else if (!this.trg)
            this.trg = platform;
        else
            throw new Error("span cannot be triple-end");
    };
    return Span;
})(Edge);
exports.Span = Span;
var Transfer = (function (_super) {
    __extends(Transfer, _super);
    function Transfer(source, target, bidirectional) {
        if (bidirectional === void 0) { bidirectional = true; }
        _super.call(this, source, target, bidirectional);
    }
    Transfer.prototype.replacePlatform = function (old, replacement) {
        if (this.src == old)
            this.src = replacement;
        if (this.trg == old)
            this.trg = replacement;
        else
            throw new Error("span doesn't contain the platform to replace");
        //old.spans.delete(this);
        //replacement.spans.add(this);
    };
    Transfer.prototype.addPlatform = function (platform) {
        //platform.spans.add(this);
        if (this.source)
            this.trg = platform;
        else if (!this.trg)
            this.trg = platform;
        else
            throw new Error("span cannot be triple-end");
    };
    return Transfer;
})(Edge);
exports.Transfer = Transfer;
var Line = (function () {
    function Line(type, num, name) {
        if (name === void 0) { name = ''; }
        if (type.length != 1)
            throw new Error("type must be one letter");
        this.type = type;
        if (num && num.toString() != num.toPrecision())
            throw new Error('line number ' + num + ' cannot be fractional');
        this.num = num;
        this.name = name;
    }
    Object.defineProperty(Line.prototype, "id", {
        get: function () {
            return this.type + (this.num || '');
        },
        enumerable: true,
        configurable: true
    });
    return Line;
})();
exports.Line = Line;
var Route = (function () {
    function Route(line, branch) {
        if (branch === void 0) { branch = ''; }
        this.line = line;
        this.branch = branch;
    }
    Object.defineProperty(Route.prototype, "id", {
        get: function () {
            return this.line.id + this.branch;
        },
        enumerable: true,
        configurable: true
    });
    Route.prototype.isParentOf = function (route) {
        if (this.line != route.line)
            return false;
        var thisBranchSorted = this.branch.split('').sort().join(''), thatBranchSorted = route.branch.split('').sort().join('');
        if (thisBranchSorted == thatBranchSorted)
            return false;
        return thisBranchSorted.indexOf(thatBranchSorted) > -1;
    };
    return Route;
})();
exports.Route = Route;
var MetroGraph = (function () {
    function MetroGraph() {
        this.platforms = [];
        this.spans = [];
        this.stations = [];
        this.lines = [];
        this.transfers = [];
        this.routes = [];
    }
    MetroGraph.prototype.toJSON = function () {
        let self = this;
        let obj = {
            platforms: self.platforms.map(function (platform) { return ({
                name: platform.name,
                altName: platform.altName,
                oldName: platform.oldName,
                station: self.stations.indexOf(platform.station),
                location: {
                    lat: platform.location.lat,
                    lng: platform.location.lng
                },
                elevation: platform.elevation,
                spans: platform.spans.map(function (span) { return self.spans.indexOf(span); }),
                transfers: self.transfers.map(function (transfer) { return transfer.other(platform); }).filter(function (o) { return o !== null; }).map(function (other) { return self.platforms.indexOf(other); })
            }); }),
            transfers: self.transfers.map(function (transfer) { return ({
                source: self.platforms.indexOf(transfer.source),
                target: self.platforms.indexOf(transfer.target)
            }); }),
            stations: self.stations.map(function (station) { return ({
                name: station.name,
                altName: station.altName,
                oldName: station.oldName,
                location: {
                    lat: station.location.lat,
                    lng: station.location.lng
                },
                platforms: station.platforms.map(function (platform) { return self.platforms.indexOf(platform); })
            }); }),
            lines: {},
            spans: self.spans.map(function (span) { return ({
                source: self.platforms.indexOf(span.source),
                target: self.platforms.indexOf(span.target),
                routes: span.routes.map(function (route) { return self.routes.indexOf(route); })
            }); }),
            routes: self.routes.map(function (route) { return ({
                line: route.line.id,
                branch: route.branch
            }); })
        };
        //this.platforms.forEach(platform => {
        //    let plObj = {
        //        name: platform.name,
        //        altName: platform.altName,
        //        oldName: platform.oldName,
        //        station: self.stations.indexOf(platform.station),
        //        location: {
        //            lat: platform.location.lat,
        //            lng: platform.location.lng
        //        },
        //        elevation: platform.elevation,
        //        spans: platform.spans.map(span => self.spans.indexOf(span)),
        //        transfers: self.transfers.map(transfer => transfer.other(platform))
        //            .filter(o => o !== null)
        //            .map(other => self.platforms.indexOf(other))
        //    };
        //    //platform.spans.forEach(span => plObj.spans.push(self.spans.indexOf(span)));
        //    //for (let i = 0; i < this.transfers.length; ++i) {
        //    //    let other = this.transfers[i].other(platform);
        //    //    if (other) {
        //    //        plObj.transfers.push(self.platforms.indexOf(other));
        //    //    }
        //    //}
        //    obj.platforms.push(plObj);
        //});
        //this.transfers.forEach(transfer => obj.transfers.push({
        //    source: self.platforms.indexOf(transfer.source),
        //    target: self.platforms.indexOf(transfer.target)
        //}));
        //this.stations.forEach(station => {
        //    let stObj = {
        //        name: station.name,
        //        altName: station.altName,
        //        oldName: station.oldName,
        //        location: {
        //            lat: station.location.lat,
        //            lng: station.location.lng
        //        },
        //        platforms: station.platforms.map(platform => self.platforms.indexOf(platform))
        //    };
        //    //station.platforms.forEach(platform => stObj.platforms.push(self.platforms.indexOf(platform)));
        //    obj.stations.push(stObj);
        //});
        //this.spans.forEach(span => {
        //    let spObj = {
        //        source: self.platforms.indexOf(span.source),
        //        target: self.platforms.indexOf(span.target),
        //        routes: span.routes.map(route => self.routes.indexOf(route))
        //    };
        //    //span.routes.forEach(route => spObj.routes.push(self.routes.indexOf(route)));
        //    obj.spans.push(spObj);
        //});
        this.lines.forEach(function (line) { return obj.lines[line.id] = line.name; });
        //this.routes.forEach(route => obj.routes.push({
        //    line: route.line.id,
        //    branch: route.branch
        //}));
        return JSON.stringify(obj);
    };
    return MetroGraph;
})();
exports.MetroGraph = MetroGraph; //
//# sourceMappingURL=metro-graph.js.map