

'use strict';
import express = require('express');
import fs = require('fs');
import path = require('path');

import Adapter = require('../fetch-adapters/yadapter');
import tr = require('../metro-graph');

//import { default as express } from 'express';
//import * as fs from 'fs';
//import * as path from 'path';
//import Adapter from '../fetch-adapters/yadapter';
//import * as tr from '../metro-graph';


var router = express.Router();

router.get('/updategraph', (req, res, next) => {
    const url = 'https://maps.yandex.ru/export/usermaps/geSTNBuviAaKSWp8lkQE4G7Oha2K8cUr.kml';
    let adapter = new Adapter(url);
    adapter.parseFile('./json/graph.json', () => res.send('probably parsed'));
});

//router.get('/metro', (req, res, next) => res.sendFile(path.resolve('./html/metro.html')));

// get graph in json
//router.get('/metrograph', (req, res, next) => res.sendFile(path.resolve('./json/graph.json')));
/* GET home page. */
//router.get('/', (req, res, next) => res.render('index', {title: 'Express'}));

//export default router;
export = router;
