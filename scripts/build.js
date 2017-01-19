const fs = require('fs-extra')
const { exec } = require('child_process')

function execAndPipe(command) {
  const { stdout, stderr } = exec(command)
  stdout.pipe(process.stdout)
  stderr.pipe(process.stderr)
}

fs.removeSync('public')
fs.removeSync('index.html')
execAndPipe('webpack --colors --watch')
execAndPipe('static-server')
