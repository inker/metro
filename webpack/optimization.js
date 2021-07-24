const TerserPlugin = require('terser-webpack-plugin')

module.exports = (isDev) => ({
  minimize: true,
  minimizer: isDev ? undefined : [
    new TerserPlugin(),
  ],

  runtimeChunk: 'single',
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      lodash: {
        test: /[/\\]lodash[/\\]/,
        chunks: 'initial',
        name: 'lodash',
        enforce: true,
        reuseExistingChunk: true,
      },
      leaflet: {
        test: /[/\\]leaflet[/\\]/,
        chunks: 'initial',
        name: 'leaflet',
        enforce: true,
        reuseExistingChunk: true,
      },
      defaultVendors: {
        test: /node_modules/,
        chunks: 'initial',
        name: 'vendor',
        priority: -10000,
        enforce: true,
      },
    },
  },
})
