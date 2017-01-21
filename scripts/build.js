const fs = require('fs-extra')
const execAndPipe = require('./exec-and-pipe')

fs.remove('docs', err => {
  if (err) {
    throw err
  }
  execAndPipe('webpack --colors --watch')
  execAndPipe('static-server docs')
})
