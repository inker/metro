const { exec } = require('child_process')

module.exports = command => {
  const { stdout, stderr } = exec(command)
  stdout.pipe(process.stdout)
  stderr.pipe(process.stderr)  
}
