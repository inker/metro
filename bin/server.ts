'use strict';
/// <reference path="../typings/tsd.d.ts" />
import http = require('http');
import fs = require('fs');

import app from '../app';
import * as tr from '../metro-graph';
import Adapter from '../fetch-adapters/yadapter';

app.set('port', process.env.PORT || 3000);

const server = http.createServer(app);
server.listen(app.get('port'), async () => {
    console.info('Express server listening on port ' + server.address().port);
    console.info('server started');
    const adapter = new Adapter('https://maps.yandex.ru/export/usermaps/geSTNBuviAaKSWp8lkQE4G7Oha2K8cUr.kml');
    try {
        const graph = await adapter.parseFile();
        const json = graph.toJSON();
        fs.writeFile('./json/graph.json', json, 'utf8', err => {
            if (err) throw err;
            console.time('recreation takes');
            const mg = new tr.MetroGraph(json);
            console.timeEnd('recreation takes');
            return Promise.resolve();
        });
    } catch (err) {
        console.error(err);
    }
});


