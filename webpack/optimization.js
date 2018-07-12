const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')

module.exports = env => ({
  runtimeChunk: true,
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      lodash: {
        test: /[\\/]lodash[\\/]/,
        chunks: 'initial',
        name: 'lodash',
        enforce: true,
        reuseExistingChunk: true,
      },
      // vendor: {
      vendors: {
        test: /node_modules/,
        chunks: 'initial',
        name: 'vendor',
        priority: -10000,
        enforce: true,
      },
    },
  },
  minimizer: env === 'dev' ? undefined : [
    new UglifyJsPlugin({
      uglifyOptions: {
        compress: {
          ecma: 6,
          warnings: true,
          dead_code: true,
          properties: true,
          unused: true,
          join_vars: true,
          drop_console: true,
        },
        mangle: {
          safari10: true,
        },
        output: {
          comments: false,
        },
      },
      // sourceMap: true, // retains sourcemaps for typescript
    }),
    new OptimizeCSSAssetsPlugin({})
  ],
})
