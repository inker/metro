const { remove } = require('fs-extra')
const { exec } = require('child_process')

function execAndPipe(command) {
  const { stdout, stderr } = exec(command)
  stdout.pipe(process.stdout)
  stderr.pipe(process.stderr)
}

remove('public', err => {
  if (err) {
    throw err
  }
  execAndPipe('webpack --colors --watch')
  execAndPipe('static-server')
})
