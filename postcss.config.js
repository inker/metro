const presetEnv = require('postcss-preset-env')
const nested = require('postcss-nested')

module.exports = {
  'postcss-preset-env': {
    browsers: 'last 2 versions',
    features: {
      // 'nesting-rules': true,
      // 'custom-media-queries': true,
      // 'color-mod-function': true,
    },
  },
  plugins: [
    presetEnv(),
    nested(),
  ],
}
