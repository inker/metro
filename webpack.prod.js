const base = require('./webpack.config')

module.exports = Object.assign({}, base, {
  output: Object.assign({}, base.output, {
    filename: '[name].[hash].js',    
  })
})

// module.exports = {
//   ...base,
//   output: {
//     ...base.output,
//     filename: '[name].[hash].js',
//   },
// }
