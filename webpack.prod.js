const { cloneDeep }= require('lodash')
const base = require('./webpack.config')

const output = cloneDeep(base.output)
output.filename = '[name].[hash].js'

const mod = cloneDeep(base.module)
mod.rules.find(rule => rule.use === 'awesome-typescript-loader').use = {
  loader: 'awesome-typescript-loader',
  options: {
    ignoreDiagnostics: [2403, 2300, 2451, 2307, 2345],
  },
}

module.exports = Object.assign({}, base, {
  output,
  module: mod,
})

// module.exports = {
//   ...base,
//   output: {
//     ...base.output,
//     filename: '[name].[hash].js',
//   },
// }
