const {
  DefinePlugin,
  optimize: {
    CommonsChunkPlugin,
    OccurrenceOrderPlugin,
  },
} = require('webpack')

const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

// const { CheckerPlugin } = require('awesome-typescript-loader')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

module.exports = env => [
  // new CheckerPlugin(),

  // new OccurrenceOrderPlugin(),

  new DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(env === 'dev' ? 'development' : 'production'),
    },
  }),

  new CommonsChunkPlugin({
    name: 'vendor',
    filename: 'vendor.js',
    minChunks: ({ context }) => context && context.includes('node_modules'),
  }),

  // new CommonsChunkPlugin({
  //   async: true,
  // }),

  new HtmlWebpackPlugin({
    filename: 'index.html',
    template: 'template.html',
    hash: true,
    minify: {
      removeComments: true,
      collapseWhitespace: true,
      removeRedundantAttributes: true,
      useShortDoctype: true,
      removeEmptyAttributes: true,
      removeStyleLinkTypeAttributes: true,
      keepClosingSlash: true,
      minifyJS: true,
      minifyCSS: true,
      minifyURLs: true,
    },
  }),

  new CopyWebpackPlugin([
    {
      from: '../res',
      to: 'res',
    },
  ]),

  env !== 'dev' && new UglifyJsPlugin({
    uglifyOptions: {
      compress: {
        warnings: false,
        dead_code: true,
        properties: true,
        unused: true,
        join_vars: true,
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

  env === 'analyze' && new BundleAnalyzerPlugin(),
].filter(item => item)
