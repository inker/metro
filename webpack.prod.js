const base = require('./webpack.config')

const TS_LOADER = 'awesome-typescript-loader'

const { output } = base
output.filename = '[name].[hash].js'

const mod = base.module
mod.rules.find(rule => rule.use === TS_LOADER).use = {
  loader: TS_LOADER,
  options: {
    ignoreDiagnostics: [2403, 2300, 2451, 2307, 2345],
  },
}

module.exports = Object.assign({}, base, {
  output,
  devtool: 'eval',
  module: mod,
})

// module.exports = {
//   ...base,
//   output: {
//     ...base.output,
//     filename: '[name].[hash].js',
//   },
// }
