const base = require('./webpack.config')

module.exports = {
  ...base,
  output: {
    ...base.output,
    filename: '[name].[hash].js',
  },
}
