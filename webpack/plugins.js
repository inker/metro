const path = require('path')

const {
  DefinePlugin,
  HotModuleReplacementPlugin,
  optimize: {
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
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
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
  || Array.from(chunk.modulesIterable, moduleToFileNames).find((name) => name)
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

  env !== 'dev' && new MiniCssExtractPlugin({
    chunkFilename: '[id].[contenthash].css',
  }),

  new CopyWebpackPlugin([
    {
      from: 'res',
      to: 'res',
    },
  ]),

  env === 'analyze' && new BundleAnalyzerPlugin(),
].filter(item => item)
