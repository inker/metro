const path = require('path')

const {
  DefinePlugin,
  HotModuleReplacementPlugin,
  optimize: {
    CommonsChunkPlugin,
    OccurrenceOrderPlugin,
  },
  NamedChunksPlugin,
  NamedModulesPlugin,
  HashedModuleIdsPlugin,
} = require('webpack')

const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

// const { CheckerPlugin } = require('awesome-typescript-loader')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

const SEP_RE = new RegExp(`\\${path.sep}`, 'g')
const IS_REACT = /node_modules.+?(react|styled)/
const PAGES_RE = /pages[\/\\](.+?)(index)?\.[jt]sx?/

const moduleToFileNames = (module) => {
  if (!module.request || !module.optional) {
    return null
  }
  const relativePath = path.relative(module.context, module.request)
  const tokens = relativePath.match(PAGES_RE)
  return tokens && tokens[1].replace(SEP_RE, '.').slice(0, -1)
}

const chunkToName = (chunk) =>
  chunk.name
  || chunk.modules.map(moduleToFileNames).find((name) => name)
  || null

module.exports = env => [
  // new CheckerPlugin(),

  // new OccurrenceOrderPlugin(),

  new DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(env === 'dev' ? 'development' : 'production'),
    },
    __VERSION__: JSON.stringify(new Date().toUTCString()),
  }),

  env === 'dev' && new HotModuleReplacementPlugin(),

  new NamedChunksPlugin(chunkToName),

  // new (env === 'dev' ? NamedModulesPlugin : HashedModuleIdsPlugin)(),

  new CommonsChunkPlugin({
    name: 'app',
    children: true,
    minChunks: 2,
    async: 'commons',
  }),

  new CommonsChunkPlugin({
    name: 'vendor',
    // names: 'vendor',
    // chunks: 'app',
    minChunks: ({ context }) => context && context.includes('node_modules'),
    async: true,
  }),

  new CommonsChunkPlugin({
    name: 'runtime',
    minChunks: Infinity,
  }),

  new HtmlWebpackPlugin({
    filename: 'index.html',
    template: 'src/template.html',
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

  new ExtractTextPlugin('style.[contenthash].css'),

  new CopyWebpackPlugin([
    {
      from: 'res',
      to: 'res',
    },
  ]),

  env !== 'dev' && new UglifyJsPlugin({
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

  env === 'analyze' && new BundleAnalyzerPlugin(),
].filter(item => item)
