const base = require('./webpack.config')

const TS_LOADER = 'awesome-typescript-loader'

const { output } = base
output.filename = '[name].[hash].js'

const mod = base.module
mod.rules.find(rule => rule.use === TS_LOADER).use = {
  loader: TS_LOADER,
  options: {
    ignoreDiagnostics: [2403, 2300, 2451, 2307, 2345, 2339, 2305], // 2305 is temporary
  },
}

base.plugins.push(new UglifyJsPlugin({
  compress: {
    screw_ie8: true,
    warnings: false,
    drop_debugger: false,
    dead_code: true,
    properties: true,
    unused: true,
    join_vars: true,
  },
  output: {
    comments: false,
  },
  sourceMap: true, // retains sourcemaps for typescript
}))

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
