'use strict';
var express = require('express');
var path = require('path');
var Adapter = require('../fetch-adapters/yadapter');
//import { default as express } from 'express';
//import * as fs from 'fs';
//import * as path from 'path';
//import Adapter from '../fetch-adapters/yadapter';
//import * as tr from '../metro-graph';
var router = express.Router();
router.get('/updategraph', function (req, res, next) {
    const url = 'https://maps.yandex.ru/export/usermaps/geSTNBuviAaKSWp8lkQE4G7Oha2K8cUr.kml';
    let adapter = new Adapter(url);
    adapter.parseFile(function () { return res.send('probably parsed'); });
});
router.get('/metro', function (req, res, next) { return res.sendFile(path.resolve('./html/metro.html')); });
// get graph in json
router.get('/metrograph', function (req, res, next) { return res.sendFile(path.resolve('./json/graph.json')); });
/* GET home page. */
router.get('/', function (req, res, next) { return res.render('index', { title: 'Express' }); });
module.exports = router;
//# sourceMappingURL=router.js.map