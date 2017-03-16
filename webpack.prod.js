const { cloneDeep }= require('lodash')
const base = require('./webpack.config')

const module = cloneDeep(base.module)
module.rules.find(rule => rule.use === 'awesome-typescript-loader').options = {
  ignoreDiagnostics: [2403, 2300, 2451, 2307, 2345],
}

module.exports = Object.assign({}, base, {
  output: Object.assign({}, base.output, {
    filename: '[name].[hash].js',    
  }),
  module,
})

// module.exports = {
//   ...base,
//   output: {
//     ...base.output,
//     filename: '[name].[hash].js',
//   },
// }
