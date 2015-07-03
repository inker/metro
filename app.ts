/// <reference path="./typings/tsd.d.ts" />
/// <reference path="./references.ts" />
'use strict';

import express = require('express');
import path = require('path');
//import logger = require('morgan');
import cookieParser = require('cookie-parser');
import bodyParser = require('body-parser');
import routes = require('./routes/router');
//import express from 'express';
//import * as path from 'path';
////import * as cookieParser from 'cookie-parser';
//import bodyParser from 'body-parser';
//import routes from './routes/router';

var app: express.Express = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes);
//app.use('/users', users);

module.exports = app;