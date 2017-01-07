const { remove } = require('fs-extra')
const { exec } = require('child_process')

remove('public', err => {
  if (err) {
    throw err
  }
  const { stdout, stderr } = exec('webpack --progress --colors --watch')
  stdout.pipe(process.stdout)
  stderr.pipe(process.stderr)

  exec('static-server')
})
