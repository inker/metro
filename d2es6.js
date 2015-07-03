var fs = require('fs');
fs.readdir('./typings', function (err, files) {
    if (err) throw err;
    files.splice(files.indexOf('tsd.d.ts'), 1);
    files.forEach(function (file) {
        console.log(file);
        fs.readdir('./typings/' + file, function (err, innerFiles) {
            var filePath = './typings/' + file + '/' + innerFiles[0];
            fs.readFile(filePath, 'utf8', function (err, data) {
                if (err) throw err;
                data = data.replace(/import\s*(.*?)\s*=\s*require\s*\(["'](.*?)["']\)/g, function (match, v, name) {
                        var noDefault = ['events', 'stream', 'net', 'fs', 'http', 'https', 'child_process', 'globals', 'domain', 'crypto', 'cluster', 'dns', 'path', 'buffer', 'os', 'url', 'tty', 'dgram', 'util', 'tls', 'mime'];
                        return (noDefault.indexOf(name) > -1) ? 'import * as ' + v + ' from "' + name + '"' : 'import ' + v + ' from "' + name + '"';
                    })
                    .replace(/export\s*=\s*(.*?)/g, 'export default $1');
                fs.writeFile(filePath, data, 'utf8', function (err) {
                    if (err) throw err;
                    console.log('finished: ' + file);
                });
            });
        });
    });
});